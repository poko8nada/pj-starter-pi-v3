/**
 * consult — 1 回だけ子 pi を走らせて、結果のテキストを返す道具。
 *
 * ロールを渡して用途を変える。文脈を渡さなければ、まっさらな視点になる。
 *
 * 安全側の既定:
 *   - ツールは読み取り専用。書けるツールを許したときだけ worktree に入る。
 *   - プロジェクトの設定・拡張は子に読ませない。
 *   - 出力 30k トークン / 30 ターンで走行中に打ち切る（外から変えられない）。
 *
 * 費用がかかるので、呼ぶ前に必ず確認を出す。
 */

import { spawn } from 'node:child_process';
import type {
  AgentToolResult,
  AgentToolUpdateCallback,
  ExtensionAPI,
  ExtensionContext,
} from '@earendil-works/pi-coding-agent';
import { Type } from 'typebox';
import type { Static } from 'typebox';
import {
  createWorktree,
  isGitRepo,
  readPayload,
  removeWorktree,
  runPi,
  type RunResult,
  type Worktree,
} from './run.ts';
import {
  buildPiArgs,
  errorFrom,
  finalTextFrom,
  includesWritingTool,
  modelFrom,
  parseEvents,
  READ_ONLY_TOOLS,
  usageFrom,
  type ConsultOptions,
} from './spec.ts';

/**
 * 道具のパラメータ。ロールで用途を変え、input で文脈を渡す。
 */
const PARAMETERS = Type.Object({
  task: Type.String({ description: 'What the child should do' }),
  role: Type.Optional(
    Type.String({ description: 'Appended to the system prompt. Write the role, not a file path' }),
  ),
  input: Type.Optional(
    Type.String({ description: 'Path to a file for the child to read on stdin. It must exist' }),
  ),
  tools: Type.Optional(
    Type.String({ description: `Tools the child may use (default ${READ_ONLY_TOOLS})` }),
  ),
});

type Params = Static<typeof PARAMETERS>;

/**
 * pi が渡す引数。位置で渡される 5 つを 1 つのタプルにまとめる。
 * 本体では params と ctx と signal しか使わないので、間に 2 つ挟まる形を避けられる。
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
  readonly payload?: string;
}

/**
 * 実行場所と payload を用意する。
 * worktree が要るかはツール指定で決まる（書けるツールを許したときだけ隔離する）。
 */
function prepare(ctx: ExtensionContext, options: ConsultOptions): Prepared {
  const base = ctx.cwd;
  // 読めない input は例外にする。無言で空の子を走らせると、文脈なしの答えが返る。
  const payload = options.input === undefined ? undefined : readPayload(options.input, base);
  const needsIsolation = options.worktree && includesWritingTool(options.tools);

  if (!needsIsolation) {
    return { cwd: base, payload };
  }
  if (!isGitRepo(base)) {
    // git 管理外では worktree を作れない。書けるツールを許したまま実ツリーで走らせない。
    throw new Error(
      'a writing tool was allowed but this is not a git repository, so the work cannot be isolated. Use read-only tools, or run inside a repository',
    );
  }
  const worktree = createWorktree(base);
  return { cwd: worktree.dir, worktree, payload };
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

/** 子を走らせて、道具の戻り値にする */
async function consult(
  ctx: ExtensionContext,
  options: ConsultOptions,
  signal: AbortSignal | undefined,
): Promise<AgentToolResult<Record<string, unknown>>> {
  // prepare の失敗はそのまま投げる。道具の失敗は例外で伝える。
  const prepared = prepare(ctx, options);
  playSound();
  try {
    const run = await runPi({
      piArgs: buildPiArgs(options),
      cwd: prepared.cwd,
      payload: prepared.payload,
      signal,
      env: process.env,
    });
    playSound();

    const events = parseEvents(run.stdout);
    return result(compose(events, run), {
      usage: usageLine(events),
      stopped: run.stopped,
      aborted: run.aborted,
    });
  } finally {
    // 中断でも例外でも、必ず片付ける。
    if (prepared.worktree !== undefined) {
      removeWorktree(prepared.worktree);
    }
  }
}

export default function (pi: ExtensionAPI) {
  pi.registerTool({
    name: 'consult',
    label: 'Consult',
    description:
      'Run pi once in a child process and return its final text. Give it a role to specialise it, and an input file to give it context. It does not see this conversation.',
    promptSnippet:
      'Run a child pi with a role and optional context, and get its text back (bounded to 30k output tokens and 30 turns)',
    promptGuidelines: [
      'Use consult when a question is better answered without this conversation in view: reviewing your own work, getting a second opinion, or applying a role you were not given.',
    ],
    parameters: PARAMETERS,

    async execute(...args: ExecuteArgs) {
      const [, params, signal, , ctx] = args;
      const tools = params.tools ?? READ_ONLY_TOOLS;
      const options: ConsultOptions = {
        task: params.task,
        role: params.role,
        input: params.input,
        tools,
        worktree: includesWritingTool(tools),
      };

      return consult(ctx, options, signal);
    },
  });
}
