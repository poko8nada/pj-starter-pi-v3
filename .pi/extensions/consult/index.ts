/**
 * consult —子 pi を type の policy で走らせ、結果のテキストを返す道具。
 *
 * 呼び出し側が選べるのは type の名前だけ。モデル・ツール・環境・上限・役割は type が持つ（`types.json`。git 管理外）。上書きの口は作らない。設定は呼び出しごとに読むので、変えたら次の consult から効く。モデルが使えなければ、type の候補を順に試し、最後は親と同じ設定で走る。
 *
 * 費用がかかるので、呼ぶ前に必ず確認を出す。
 */

import { spawn } from 'node:child_process';
import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import type {
  AgentToolResult,
  AgentToolUpdateCallback,
  ExtensionAPI,
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
} from './run.ts';
import {
  buildPiArgs,
  errorFrom,
  finalTextFrom,
  joinPrompt,
  modelFrom,
  needsIsolation,
  parseEvents,
  usageFrom,
  type ConsultOptions,
} from './spec.ts';
import { loadTypes, resolveType } from './types.ts';

/** 設定の場所。拡張の隣に置く */
const EXTENSION_DIR = dirname(fileURLToPath(import.meta.url));

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

/** 開始と終了に鳴らす音。ユーザーへの合図で、エージェントの関心ではない */
const SOUND_FILE = '/System/Library/Sounds/Tink.aiff';

/** 鳴らない環境（afplay の無い OS、音の無い CI）でも走行は続ける */
function playSound(): void {
  try {
    spawn('afplay', [SOUND_FILE], { stdio: 'ignore', detached: true }).unref();
  } catch {
    // 音は補助。失敗しても本来の仕事を止めない。
  }
}

/** 道具の戻り値。details は必須なので、必ず埋める */
function result(
  text: string,
  details: Record<string, unknown> = {},
): AgentToolResult<Record<string, unknown>> {
  return { content: [{ type: 'text', text }], details };
}

/** 消費量を 1 行にする。診断で、結果の本文とは混ぜない */
function usageLine(events: unknown[]): string {
  const usage = usageFrom(events);
  const cost = usage.cost > 0 ? `, $${usage.cost.toFixed(4)}` : '';
  return `${modelFrom(events) ?? '(model unknown)'} / ${usage.turns} turns / in ${usage.input} out ${usage.output}${cost}`;
}

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

/** 結果を 1 つのテキストにする。止まった理由も本文に含める */
function compose(events: unknown[], run: RunResult): string {
  const lines: string[] = [];
  if (run.aborted) {
    lines.push('consult was cancelled.', '');
  }
  if (run.stopped !== undefined) {
    lines.push(`consult stopped early: ${run.stopped}`, '');
  }
  const text = finalTextFrom(events);
  if (text !== '') {
    lines.push(text);
  } else if (run.code !== 0) {
    lines.push(errorFrom(events) || run.stderr.trim() || '(the child produced no text)');
  } else {
    lines.push('(the child produced no text)');
  }
  return lines.join('\n');
}

/** 子 1 体分の仕事。work は書き込む type のときだけ入る */
interface ChildResult {
  readonly run: RunResult;
  readonly install?: InstallOutcome;
  readonly work?: CommitOutcome;
}

function pad2(value: number): string {
  return String(value).padStart(2, '0');
}

/**
 * ブランチ名の後半。同じ秒に複数の子が終わっても衝突しないように、番号を付ける。親はこの名前で取り込むかどうかを決める。
 */
function refLabel(type: string, index: number): string {
  const now = new Date();
  const date = `${now.getFullYear()}${pad2(now.getMonth() + 1)}${pad2(now.getDate())}`;
  const time = `${pad2(now.getHours())}${pad2(now.getMinutes())}${pad2(now.getSeconds())}`;
  return `${type}-${date}-${time}-${index}`;
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
  const results = await runForInputs(payloads, (payload, index) =>
    runOneChild(ctx, options, { payload, index, signal }),
  );
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

export default function (pi: ExtensionAPI) {
  pi.registerTool({
    name: 'consult',
    label: 'Consult',
    description:
      "Run a child pi with the policy of a type (model, tools, environment, limits, role) and return its final text. The caller picks only the type. It does not see this conversation. If the first model cannot run, the other candidates of the type are tried, and finally the parent's own settings. One child per input; the results are listed per input.",
    promptSnippet:
      'Run a child pi with a type (research / review / trial / code) and get its text back',
    promptGuidelines: [
      'Use consult when a question is better answered without this conversation in view: reviewing your own work, getting a second opinion, or applying a role you were not given.',
      'The types and their limits live in .pi/extensions/consult/types.json. The caller cannot override them; to change the policy, edit that file.',
    ],
    parameters: PARAMETERS,

    async execute(...args: ExecuteArgs) {
      const [, params, signal, , ctx] = args;
      // 設定は呼び出しごとに読む。変えたら次の consult から効く。
      const policy = resolveType(loadTypes(EXTENSION_DIR), params.type);
      const options: ConsultOptions = { type: policy.name, task: params.task, policy };

      return consult(ctx, options, params.input ?? [], signal);
    },
  });
}
