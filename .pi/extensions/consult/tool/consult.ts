/**
 * consult —子 pi を type の policy で走らせ、結果のテキストを返す道具。
 *
 * 呼び出し側が選べるのは type の名前だけ。モデル・ツール・環境・上限・役割は type が持つ（`types.json`。git 管理外）。上書きの口は作らない。設定は呼び出しごとに読むので、変えたら次の consult から効く。モデルが使えなければ、type の候補を順に試し、最後は親と同じ設定で走る。
 *
 * 費用がかかるので、呼ぶ前に必ず確認を出す。
 */

import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import type {
  AgentToolResult,
  AgentToolUpdateCallback,
  ExtensionContext,
} from '@earendil-works/pi-coding-agent';
import { Type } from 'typebox';
import type { Static } from 'typebox';
import {
  commitWorktree,
  createWorktree,
  gitEnv,
  installDependencies,
  isGitRepo,
  readPayloads,
  removeWorktree,
  runForInputs,
  runPi,
  runWithFallback,
  worktreeGit,
  type CommitOutcome,
  type InstallOutcome,
  type RunResult,
  type Worktree,
} from '../run/run.ts';
import {
  buildPiArgs,
  isBlank,
  joinPrompt,
  needsIsolation,
  parseEvents,
  type ConsultOptions,
} from '../child/spec.ts';
import { loadTypes, resolveType } from '../policy/types.ts';
import { compose, playSound, refLabel, result, usageLine } from './render.ts';

/** 設定の場所。拡張の隣（`tool/` から 1 つ上）に置く */
const EXTENSION_DIR = dirname(dirname(fileURLToPath(import.meta.url)));

/** 道具のパラメータ。type で走り方を選び、input で文脈を渡す */
export const PARAMETERS = Type.Object({
  type: Type.String({
    description: 'How the child runs (research / review / trial / code). Set in types.json',
  }),
  task: Type.String({ description: 'What the child should do' }),
  input: Type.Optional(
    Type.Array(
      Type.String({
        description:
          "Path to a file whose contents are prepended to the child's prompt. Fails the call if it cannot be read",
      }),
      { description: 'One child per path. Without it, one child with no payload' },
    ),
  ),
});

type Params = Static<typeof PARAMETERS>;

/**
 * pi が渡す引数。位置で渡される 5 つを 1 つのタプルにまとめる。本体では params と ctx と signal しか使わないので、間に 2 つ挟まる形を避けられる。
 */
type ExecuteArgs = [
  toolCallId: string,
  params: Params,
  signal: AbortSignal | undefined,
  onUpdate: AgentToolUpdateCallback<unknown> | undefined,
  ctx: ExtensionContext,
];

interface Prepared {
  readonly cwd: string;
  readonly worktree?: Worktree;
}

/**
 * 実行場所を用意する。payload は読み終わっている前提。隔離するかは type の `environment` が決める（ツールから推測しない）。
 */
function prepare(ctx: ExtensionContext, options: ConsultOptions): Prepared {
  const base = ctx.cwd;
  if (!needsIsolation(options.policy)) {
    return { cwd: base };
  }
  if (!isGitRepo(base)) {
    // git 管理外では worktree を作れない。隔離できないまま実ツリーで書かせない。
    throw new Error(
      'this type needs isolation but the directory is not a git repository. Use a type whose environment is "tree", or run inside a repository',
    );
  }
  const worktree = createWorktree(base);
  return { cwd: worktree.dir, worktree };
}

/** 子 1 体分の仕事。work は書き込む type のときだけ入る */
interface ChildResult {
  readonly run: RunResult;
  readonly install?: InstallOutcome;
  readonly work?: CommitOutcome;
}

/** 子 1 体分の走らせ方 */
interface ChildJob {
  readonly payload: string | undefined;
  readonly index: number;
  readonly signal: AbortSignal | undefined;
}

/**
 * 子 1 体分を走らせる。
 *
 * worktree の用意から後片付けまでを 1 つにまとめる。中断でも例外でも片付ける。
 */
async function runOneChild(
  ctx: ExtensionContext,
  options: ConsultOptions,
  job: ChildJob,
): Promise<ChildResult> {
  const { payload, index, signal } = job;
  // 子ごとに用意する。隔離する type なら、子ごとに別の worktree になる。
  const prepared = prepare(ctx, options);
  try {
    // 依存を入れる。無いと子もフックも何も確かめられない。
    const install =
      prepared.worktree === undefined ? undefined : installDependencies(prepared.worktree);
    if (install?.kind === 'failed') {
      // 環境の失敗。setup の誤り（設定）とは区別して、この子の状態にする。
      throw new Error(`could not install dependencies (${install.command}): ${install.error}`);
    }
    // 候補を順に試す。試行ごとに models を 1 つにした policy を渡す（空なら親と同じ）。
    const run = await runWithFallback(options.policy.models, (model) =>
      runPi({
        piArgs: buildPiArgs({
          ...options,
          task: joinPrompt(payload, options.task),
          policy: { ...options.policy, models: model === undefined ? [] : [model] },
        }),
        cwd: prepared.cwd,
        signal,
        env: gitEnv(),
        limits: options.policy.limits,
      }),
    );
    // 書き込む type は、子が残した変更をコミットして ref にする。親は取り込まない。
    const work =
      prepared.worktree === undefined
        ? undefined
        : commitWorktree(refLabel(options.type, index), worktreeGit(prepared.worktree));
    return {
      run,
      ...(install === undefined ? {} : { install }),
      ...(work === undefined ? {} : { work }),
    };
  } finally {
    // 中断でも例外でも、必ず片付ける。ブランチはリポジトリ側に残る。
    if (prepared.worktree !== undefined) {
      removeWorktree(prepared.worktree);
    }
  }
}

/** 子を走らせて、道具の戻り値にする。入力ごとに 1 体 */
async function consult(
  ctx: ExtensionContext,
  options: ConsultOptions,
  inputs: readonly string[],
  signal: AbortSignal | undefined,
): Promise<AgentToolResult<Record<string, unknown>>> {
  // 入力を先に全部読む。setup の誤りはここで落ちる（子を 1 体も起動しない）。入力が無ければ、payload 無しで 1 体。
  const payloads: (string | undefined)[] =
    inputs.length === 0 ? [undefined] : readPayloads(inputs, ctx.cwd);
  const labels: string[] = inputs.length === 0 ? ['(no input)'] : [...inputs];

  playSound();
  const results = await runForInputs(payloads, (payload, index) => {
    // 「無言で、文脈なしの子を走らせない」（001 の規則）。中身が無い入力は子を起こさない。
    // 投げればこの入力だけが {ok: false, error} になり、他の入力はそのまま走る（runForInputs は allSettled）。
    if (payload !== undefined && isBlank(payload)) {
      throw new Error('空の入力');
    }
    return runOneChild(ctx, options, { payload, index, signal });
  });
  playSound();

  const lines: string[] = [];
  const details: Record<string, unknown>[] = [];
  for (const [index, entry] of results.entries()) {
    const label = labels[index] ?? '(no input)';
    lines.push(`## input: ${label}`, '');
    if (!entry.ok) {
      lines.push(`(the child could not run) ${entry.error}`, '');
      details.push({ input: label, error: entry.error });
      continue;
    }
    const { run, install, work } = entry.value;
    const events = parseEvents(run.stdout);
    lines.push(compose(events, run));
    if (work !== undefined) {
      if (work.kind === 'committed') {
        lines.push('', `ref: ${work.ref}`, work.stat);
      } else if (work.kind === 'no-change') {
        lines.push('', 'ref: (the child changed nothing)');
      } else {
        lines.push('', `ref: (not created) the commit was rejected: ${work.error}`);
      }
    }
    // 診断は本文と混ぜないが、呼び出し側が読める場所に 1 行だけ置く。`details` は agent には渡らないので、モデルをここに出さないと見えない。
    lines.push('', `[consult] ${usageLine(events)}`);
    lines.push('');
    details.push({
      input: label,
      usage: usageLine(events),
      stopped: run.stopped,
      aborted: run.aborted,
      ...(install === undefined ? {} : { install }),
      ...(work === undefined ? {} : { work }),
    });
  }

  return result(lines.join('\n').trimEnd(), { type: options.type, inputs: details });
}

export async function execute(...args: ExecuteArgs) {
  const [, params, signal, , ctx] = args;
  // 設定は呼び出しごとに読む。変えたら次の consult から効く。
  const policy = resolveType(loadTypes(EXTENSION_DIR), params.type);
  const options: ConsultOptions = { type: policy.name, task: params.task, policy };

  return consult(ctx, options, params.input ?? [], signal);
}
