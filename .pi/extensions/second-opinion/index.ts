/**
 * second-opinion 拡張の入口。道具 `second_opinion` とコマンド `/second_opinion` の登録だけを行う。
 *
 * 会話は pi のセッション（`ctx.sessionManager.buildContextEntries()`）から取る。イベントで貯めない。
 * 道具もコマンドも、その場で子を1体走らせ、子の本文を返す（打ち切られれば注を添えて）・会話へ出す（コマンド）。
 */

import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import type {
  AgentToolResult,
  ExtensionAPI,
  ExtensionContext,
} from '@earendil-works/pi-coding-agent';
import { Type } from 'typebox';
import type { Static } from 'typebox';
import { opinionTask } from './tool/answer.ts';
import {
  buildPiArgs,
  finalTextFrom,
  parseEvents,
  usageFrom,
  type ConsultOptions,
} from './child/spec.ts';
import { messagesFrom, windowFrom, type AgentMessage } from './tool/conversation.ts';
import { loadTypes, resolveType } from './policy/types.ts';
import { appendRun } from './run/log.ts';
import { opinionRoot } from './run/root.ts';
import { gitEnv, reasonOf, runPi, runWithFallback, stateOf, type RunResult } from './run/run.ts';

/** 道具とコマンドの名前 */
export const TOOL_NAME = 'second_opinion';

/** 窓の既定の件数 */
export const DEFAULT_MESSAGES = 8;

/** 道具の引数（typebox） */
export const PARAMETERS = Type.Object({
  focus: Type.Optional(
    Type.String({
      description: 'What to ask about. Without it, holes in the proposal',
    }),
  ),
  messages: Type.Optional(
    Type.Number({ description: 'How many recent messages to judge (default 8)' }),
  ),
});

type Params = Static<typeof PARAMETERS>;

/** ツールの実行依頼。欠けた分は既定（質問は既定の質問、件数は 20）が効く */
export interface OpinionRequest {
  readonly focus?: string;
  readonly messages?: number;
}

/** 子を走らせるのに要る面。テストが本物の pi の文脈を組み立てずに済むよう、狭くしておく */
export interface PiPort {
  readonly cwd: string;
  readonly env: NodeJS.ProcessEnv;
  /** 会話の材料。pi のセッションから取る（`ctx.sessionManager`） */
  readonly messages: () => readonly AgentMessage[];
}

/** この拡張の置き場。`types.json` を読むのに使う */
function extensionDir(): string {
  return dirname(fileURLToPath(import.meta.url));
}

/** 道具の引数を依頼にする。空の `focus` は指定なしとみなす */
export function toRequest(params: Params): OpinionRequest {
  const focus =
    typeof params.focus === 'string' && params.focus.trim() !== '' ? params.focus : undefined;
  const messages = typeof params.messages === 'number' ? params.messages : undefined;
  return {
    ...(focus === undefined ? {} : { focus }),
    ...(messages === undefined ? {} : { messages }),
  };
}

/** コマンドの引数を読む。先頭が数字なら件数、残りが質問 */
export function parseCommandArgs(args: string): OpinionRequest {
  const trimmed = args.trim();
  if (trimmed === '') {
    return {};
  }
  const match = trimmed.match(/^(\d+)([\s\S]*)$/);
  if (match === null) {
    return { focus: trimmed };
  }
  const rest = (match[2] ?? '').trim();
  const messages = Number(match[1]);
  if (rest === '') {
    return { messages };
  }
  return { messages, focus: rest };
}

/** モデルを1つに絞った役割にする。空なら親と同じ設定で走る */
function withModel(
  policy: ConsultOptions['policy'],
  model: string | undefined,
): ConsultOptions['policy'] {
  if (model === undefined) {
    return { ...policy, models: [] };
  }
  return { ...policy, models: [model] };
}

export interface Body {
  readonly text: string;
  /** 打ち切りの理由。done なら無い */
  readonly cut?: string;
}

/**
 * 走り終えた子から本文を取る。本文があれば打ち切られていても返し、理由を `cut` に入れる。
 * 本文が無ければ、終わり切らない限り投げる（黙って空を返さない）。
 *
 * 純粋な判定だけを抜き出した物で、子を実際に走らせずに「どう終わったか」を試せる。
 */
export function bodyOf(run: RunResult): Body {
  const text = finalTextFrom(parseEvents(run.stdout));
  if (text === '') {
    if (stateOf(run) !== 'done') {
      throw new Error(
        `second-opinion: the child did not finish (${reasonOf(run) ?? `exit ${run.code}`})`,
      );
    }
    return { text };
  }
  if (stateOf(run) === 'done') {
    return { text };
  }
  return { text, cut: reasonOf(run) ?? `exit ${run.code}` };
}

/** 本文に打ち切りの注を添える。`cut` が無ければそのまま */
export function formatBody(body: Body): string {
  if (body.cut === undefined) {
    return body.text;
  }
  return `${body.text}\n\n(打ち切られました: ${body.cut})`;
}

/**
 * 子を1体走らせ、その本文をそのまま返す。
 *
 * `types.json` は呼び出しごとに読む。終わり方は `bodyOf` が見る。
 */
export async function runOpinion(port: PiPort, request: OpinionRequest): Promise<string> {
  const window = windowFrom(port.messages(), request.messages ?? DEFAULT_MESSAGES, TOOL_NAME);
  const task = opinionTask(window, request.focus);
  const policy = resolveType(loadTypes(extensionDir()), 'opinion');
  const env = {
    ...gitEnv(port.env),
    CONSULT_POLICY: JSON.stringify({ paths: policy.paths, bash: policy.bash }),
    CONSULT_TURNS: String(policy.limits.turns),
  };
  const root = opinionRoot(port.cwd, port.env);
  const child = 'second-opinion-1';
  const started = Date.now();
  let pid = 0;
  const run = await runWithFallback(policy.models, (model) =>
    runPi({
      piArgs: buildPiArgs({ type: 'opinion', task, policy: withModel(policy, model) }),
      stdin: task,
      cwd: port.cwd,
      env,
      limits: policy.limits,
      onStarted: (startedPid) => {
        pid = startedPid;
        appendRun(root, { child, role: 'opinion', pid: startedPid, started });
      },
      onDone: (done) => {
        const reason = reasonOf(done);
        const usage = usageFrom(parseEvents(done.stdout));
        appendRun(root, {
          child,
          role: 'opinion',
          pid: done.pid ?? pid,
          started,
          ended: Date.now(),
          state: stateOf(done),
          ...(reason === undefined ? {} : { reason }),
          turns: usage.turns,
          spend: `${usage.cost.toFixed(4)} usd`,
        });
      },
    }),
  );
  return formatBody(bodyOf(run));
}

/** 道具の戻り値。details は必須なので、必ず埋める */
function result(text: string): AgentToolResult<Record<string, unknown>> {
  return { content: [{ type: 'text', text }], details: {} };
}

/** pi が渡す引数。位置で渡される 5 つを 1 つのタプルにまとめる */
type ExecuteArgs = [
  toolCallId: string,
  params: Params,
  signal: AbortSignal | undefined,
  onUpdate: unknown,
  /** 使うのは cwd と sessionManager */
  ctx: Pick<ExtensionContext, 'cwd' | 'sessionManager'>,
];

/** 道具の ctx から、子を走らせるのに要る面を組む。会話は pi のセッションから取る */
function portOf(ctx: Pick<ExtensionContext, 'cwd' | 'sessionManager'>): PiPort {
  return {
    cwd: ctx.cwd,
    env: process.env,
    messages: () => messagesFrom(ctx.sessionManager.buildContextEntries()),
  };
}

export default function (pi: ExtensionAPI) {
  pi.registerTool({
    name: TOOL_NAME,
    label: 'Second opinion',
    description:
      'Point out holes in the recent proposal or opinion with another model. Returns the child text, with a cut-off note appended when the child did not finish cleanly.',
    promptSnippet: 'Point out holes in the recent proposal or opinion with another model',
    promptGuidelines: [
      'Use second_opinion when a proposal or opinion needs another eye: a second model reads the recent messages and points out holes.',
      'Pass focus to ask about one thing, messages to change how many recent messages are judged (default 8).',
    ],
    parameters: PARAMETERS,
    execute: (...args: ExecuteArgs) =>
      runOpinion(portOf(args[4]), toRequest(args[1])).then((body) => result(body)),
  });

  registerCommand(pi);
}

/** 人が使う口。`/second_opinion` を登録する */
function registerCommand(pi: ExtensionAPI): void {
  pi.registerCommand(TOOL_NAME, {
    description:
      'Judge the recent conversation with another model (usage: /second_opinion [messages] [question])',
    handler: async (args, ctx) => {
      ctx.ui.setWorkingVisible(true);
      ctx.ui.setWorkingMessage('second-opinion: consulting… (実行中の入力は終了後に処理されます)');
      try {
        const body = await runOpinion(portOf(ctx), parseCommandArgs(args));
        pi.sendMessage({ customType: 'second-opinion-answer', content: body, display: true });
      } finally {
        ctx.ui.setWorkingMessage();
      }
    },
  });
}
