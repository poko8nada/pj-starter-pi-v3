/**
 * consult の runtime — 走っている子を 1 か所で持ち、完了を親に届ける。
 *
 * 子を起こすのは `consult_run`（`tool/run.ts` の面）から。1 呼び出し = 1 体で、行き先の worktree と、続きを使うかを親が指す。
 * 設定（モデル・ツール・readOnly・続きの既定・上限・役割）は types.json が持ち、上書きの口は作らない。設定は呼び出しごとに読むので、変えたら次から効く。
 *
 * 起こしたらすぐ `started: <id>` を返し、親は待たない。子ごとの完了で `pi.sendMessage` に本文を渡す。走っている子の一覧と停止は、道具の `action` とスラッシュコマンドの両方から同じ `control` を呼ぶ。
 */

import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { AgentToolResult, AgentToolUpdateCallback } from '@earendil-works/pi-coding-agent';
import { Type } from 'typebox';
import type { Static } from 'typebox';
import { runOneChild, type ChildJob } from '../run/child.ts';
import { findWorktree } from '../run/worktree.ts';
import {
  type PARAMETERS as RUN_PARAMETERS,
  USAGE as RUN_USAGE,
  parseRunRequest,
  type RunRequest,
} from './run.ts';
import { changedFiles, reasonOf, stateOf, worktreeGit } from '../run/run.ts';
import { parseEvents, usageFrom, type ConsultOptions } from '../child/spec.ts';
import { loadTypes, resolveType } from '../policy/types.ts';
import { compose, reportBlock, result, usageLine, type ChildReport } from './render.ts';
import { isSoundEnabled, setSoundEnabled, startSound, stopSound } from './sound.ts';

/** 設定の場所。拡張の隣（`tool/` から 1 つ上）に置く */
const EXTENSION_DIR = dirname(dirname(fileURLToPath(import.meta.url)));

/** consult_new が使う ctx の面。cwd だけ見れば足りる（テストはこれをそのまま渡せる） */
export interface ConsultContext {
  readonly cwd: string;
}

/** コマンドが使う ctx の面。通知だけ見る */
export interface CommandContext {
  readonly ui: {
    notify(message: string, type?: 'info' | 'warning' | 'error'): void;
  };
}

/** 道具のパラメータ。子を起こすのは consult_run。ここは一覧と停止だけ（step 6 で consult_children へ移る） */
export const PARAMETERS = Type.Object({
  action: Type.Optional(
    Type.String({ description: 'list to show the running children, cancel to stop one' }),
  ),
  id: Type.Optional(Type.String({ description: 'The child to stop (only for action=cancel)' })),
});

/** consult_run の引数。params は consult_run の物 */
type RunExecuteArgs = [
  toolCallId: string,
  params: Static<typeof RUN_PARAMETERS>,
  signal: AbortSignal | undefined,
  onUpdate: AgentToolUpdateCallback<unknown> | undefined,
  ctx: ConsultContext,
];

type Params = Static<typeof PARAMETERS>;

/**
 * pi が渡す引数。位置で渡される 5 つを 1 つのタプルにまとめる。本体では params と ctx しか使わないので、間に 3 つ挟まる形を避けられる。
 */
type ExecuteArgs = [
  toolCallId: string,
  params: Params,
  signal: AbortSignal | undefined,
  onUpdate: AgentToolUpdateCallback<unknown> | undefined,
  ctx: ConsultContext,
];

/** 知らない action や引数不足のときに添える使い方 */
export const USAGE =
  'consult_new: action is list or cancel. cancel needs id (children are started with consult_run)';

/** 道具が受ける操作 */
export type ConsultAction =
  | { readonly action: 'list' }
  | { readonly action: 'cancel'; readonly id: string };

/** 走っている子を止める操作。道具の action とコマンドが同じ形を使う */
export type ControlAction =
  | { readonly action: 'list' }
  | { readonly action: 'cancel'; readonly id: string };

/** 一覧や停止の結果。本文と、テストと呼び出し側が読める診断 */
export interface ControlOutcome {
  readonly text: string;
  readonly details: Record<string, unknown>;
}

/** pi の sendMessage に渡す本文。テストの偽 API もこの形で受け取る */
export interface ConsultMessage {
  readonly customType: string;
  readonly content: string;
  readonly display: boolean;
  readonly details: Record<string, unknown>;
}

/** sendMessage の配送オプション。完了は次のターンで親に届ける */
export interface ConsultSendOptions {
  readonly triggerTurn?: boolean;
  readonly deliverAs?: 'steer' | 'followUp' | 'nextTurn';
}

/** 完了の通知に要る pi の面。ここだけを使う */
export interface PiFace {
  sendMessage(message: ConsultMessage, options?: ConsultSendOptions): void;
}

/** バックグラウンドで走っている子 1 体 */
export interface RunningChild {
  readonly id: string;
  readonly type: string;
  readonly task: string;
  readonly startedAt: number;
  readonly controller: AbortController;
}

/** 子の完了で親に届ける本文と診断 */
export interface ConsultOutcome {
  readonly text: string;
  readonly details: Record<string, unknown>;
}

/** 子 1 体を最後まで走らせる。テストでは子を起こさない差し替えを渡す */
export type ConsultRunner = (
  ctx: ConsultContext,
  options: ConsultOptions,
  job: ChildJob,
) => Promise<ConsultOutcome>;

/** 引数を検証して操作にする。知らない形は使い方つきで投げる */
export function parseConsultAction(raw: unknown): ControlAction {
  if (typeof raw !== 'object' || raw === null) {
    throw new Error(`consult_new: the arguments are not an object. ${USAGE}`);
  }
  const { action, id } = raw as { action?: unknown; id?: unknown };
  const verb = action === undefined ? 'list' : action;
  if (verb === 'start') {
    // 子を起こすのは consult_run。ここは一覧と停止だけの面になる（一覧と停止も consult_children へ移る途中）。
    throw new Error(
      `consult_new: start moved to consult_run (role, task, worktree, continue). ${USAGE}`,
    );
  }
  if (verb === 'list') {
    if (id !== undefined) {
      throw new Error(`consult_new: list takes no other argument. ${USAGE}`);
    }
    return { action: 'list' };
  }
  if (verb === 'cancel') {
    if (typeof id !== 'string' || id.trim() === '') {
      throw new Error(`consult_new: cancel needs a non-empty id. ${USAGE}`);
    }
    return { action: 'cancel', id };
  }
  throw new Error(`consult_new: unknown action: ${JSON.stringify(verb)}. ${USAGE}`);
}

/** 子 1 体を一覧に出す 1 行。task は最初の行だけ */
function describeChild(child: RunningChild): string {
  const line = child.task.split('\n', 1)[0] ?? '';
  const task = line.length > 80 ? `${line.slice(0, 77)}...` : line;
  return `${child.id}  ${child.type}  ${task}`;
}

/**
 * 走っている子の一覧と、1 体の停止。道具の action とスラッシュコマンドが呼ぶ 1 か所。
 * 知らない id は理由を返し、止めない。
 */
export function control(
  action: ControlAction,
  children: ReadonlyMap<string, RunningChild>,
): ControlOutcome {
  if (action.action === 'list') {
    const running = [...children.values()];
    return {
      text:
        running.length === 0
          ? 'consult_new: no child is running.'
          : running.map(describeChild).join('\n'),
      details: {
        action: 'list',
        running: running.map((child) => ({ id: child.id, type: child.type, task: child.task })),
      },
    };
  }
  const child = children.get(action.id);
  if (child === undefined) {
    return {
      text: `consult_new: no such child: ${action.id}`,
      details: { action: 'cancel', id: action.id, cancelled: false },
    };
  }
  child.controller.abort();
  return {
    text: `consult_new: cancelled ${child.id} (${child.type})`,
    details: { action: 'cancel', id: child.id, cancelled: true },
  };
}

/** 子 1 体の完了を、親に届けるメッセージにする */
export function completionMessage(
  child: RunningChild,
  outcome: ConsultOutcome,
): { message: ConsultMessage; options: ConsultSendOptions } {
  return {
    message: {
      customType: 'consult',
      content: `consult ${child.id} (${child.type}) finished\n\n${outcome.text}`,
      display: true,
      details: { id: child.id, type: child.type, ...outcome.details },
    },
    options: { triggerTurn: true, deliverAs: 'followUp' },
  };
}

/** 子 1 体を走らせて、親に届ける本文と診断にする */
async function consult(
  ctx: ConsultContext,
  options: ConsultOptions,
  job: ChildJob,
): Promise<ConsultOutcome> {
  const { run, install } = await runOneChild(ctx, options, job);
  const events = parseEvents(run.stdout);
  const usage = usageFrom(events);
  const state = stateOf(run);
  const reason = reasonOf(run);
  const files = job.worktree === undefined ? [] : changedFiles(worktreeGit(job.worktree.path));
  const report: ChildReport = {
    role: options.type,
    state,
    files,
    turns: usage.turns,
    turnsLimit: options.policy.limits.turns,
    spend: `${usage.cost.toFixed(4)} usd`,
    ...(job.worktree === undefined ? {} : { worktree: job.worktree.id }),
    ...(reason === undefined ? {} : { reason }),
  };
  // 塊を先頭に置く。親は本文の前に、どう終わったか・どこを触ったかを見る。
  const lines = [
    reportBlock(report),
    '',
    '---',
    '',
    compose(events, run),
    '',
    `[consult] ${usageLine(events)}`,
  ];
  return {
    text: lines.join('\n').trimEnd(),
    details: {
      type: options.type,
      state,
      files,
      ...(install === undefined ? {} : { install }),
    },
  };
}

/** 走らせている consult の一式。道具とスラッシュコマンドが同じ children を見る */
interface RuntimeState {
  readonly pi: PiFace;
  readonly run: ConsultRunner;
  readonly children: Map<string, RunningChild>;
  counter: number;
}

/** バックグラウンドの子 1 体分の起動材料 */
interface BackgroundJob {
  readonly ctx: ConsultContext;
  readonly options: ConsultOptions;
  readonly job: ChildJob;
  readonly child: RunningChild;
}

/** 失敗も本文にする。投げずにメッセージへ回す */
function failureOutcome(error: unknown): ConsultOutcome {
  const detail = error instanceof Error ? error.message : String(error);
  return { text: `(the consult could not run) ${detail}`, details: { error: detail } };
}

/** 完了を親のメッセージにする */
function deliver(pi: PiFace, child: RunningChild, outcome: ConsultOutcome): void {
  const built = completionMessage(child, outcome);
  pi.sendMessage(built.message, built.options);
}

/** 子を起こし、完了でメッセージを送る。呼び出し側は待たない */
function runInBackground(state: RuntimeState, job: BackgroundJob): void {
  state
    .run(job.ctx, job.options, job.job)
    .then((outcome) => {
      deliver(state.pi, job.child, outcome);
    })
    .catch((error: unknown) => {
      deliver(state.pi, job.child, failureOutcome(error));
    })
    .finally(() => {
      state.children.delete(job.child.id);
      if (state.children.size === 0) {
        stopSound();
      }
    });
}

/** 子を起こして、すぐ `started: <id>` を返す。完了はメッセージで届く */
function beginRun(
  state: RuntimeState,
  ctx: ConsultContext,
  request: RunRequest,
): AgentToolResult<Record<string, unknown>> {
  const policy = resolveType(loadTypes(EXTENSION_DIR), request.role);
  // 行き先を決める。書き込むロールは worktree が要る（暗黙に作らない）。
  const worktree =
    request.worktree === undefined ? undefined : findWorktree(ctx.cwd, request.worktree);
  if (request.worktree !== undefined && worktree === undefined) {
    throw new Error(`consult_run: no such worktree: ${request.worktree}. ${RUN_USAGE}`);
  }
  if (!policy.readOnly && worktree === undefined) {
    throw new Error(`consult_run: ${policy.name} writes, so it needs a worktree. ${RUN_USAGE}`);
  }
  const options: ConsultOptions = { type: policy.name, task: request.task, policy };
  state.counter += 1;
  const child: RunningChild = {
    id: `consult-${state.counter}`,
    type: policy.name,
    task: request.task,
    startedAt: Date.now(),
    controller: new AbortController(),
  };
  const job: ChildJob = {
    task: request.task,
    signal: child.controller.signal,
    ...(worktree === undefined ? {} : { worktree }),
    continueSession: request.continue ?? policy.continueByDefault,
  };
  state.children.set(child.id, child);
  if (state.children.size === 1) {
    startSound();
  }
  runInBackground(state, { ctx, options, job, child });
  const running = [...state.children.values()].map(describeChild).join('\n');
  return result(`started: ${child.id}\n\nrunning now:\n${running}`, {
    action: 'run',
    id: child.id,
    type: policy.name,
    ...(worktree === undefined ? {} : { worktree: worktree.id }),
  });
}

async function executeAction(
  state: RuntimeState,
  args: ExecuteArgs,
): Promise<AgentToolResult<Record<string, unknown>>> {
  const [, params] = args;
  const action = parseConsultAction(params);
  const outcome = control(action, state.children);
  return result(outcome.text, outcome.details);
}

export interface ConsultRuntime {
  readonly children: ReadonlyMap<string, RunningChild>;
  run(...args: RunExecuteArgs): Promise<AgentToolResult<Record<string, unknown>>>;
  execute(...args: ExecuteArgs): Promise<AgentToolResult<Record<string, unknown>>>;
  control(action: ControlAction): ControlOutcome;
  commands: {
    status(args: string, ctx: CommandContext): Promise<void>;
    cancel(args: string, ctx: CommandContext): Promise<void>;
    sound(args: string, ctx: CommandContext): Promise<void>;
  };
}

/** `/consult-sound` に出す 1 行。いま音が鳴るかと、切り替え方を示す */
function soundStatus(): string {
  return `consult sound is ${isSoundEnabled() ? 'on' : 'off'}. /consult-sound on|off`;
}

/**
 * 拡張の入口が 1 つだけ作る。道具とスラッシュコマンドは同じ children を共有する。
 * テストは `pi` と `run` を差し替えて、子を起こさずに確かめられる。
 */
export function createRuntime(pi: PiFace, run: ConsultRunner = consult): ConsultRuntime {
  const state: RuntimeState = { pi, run, children: new Map(), counter: 0 };
  return {
    children: state.children,
    run: async (...args: RunExecuteArgs) => {
      const [, params, , , ctx] = args;
      return beginRun(state, ctx, parseRunRequest(params));
    },
    execute: (...args) => executeAction(state, args),
    control: (action) => control(action, state.children),
    commands: {
      status: async (_args, ctx) => {
        const outcome = control({ action: 'list' }, state.children);
        ctx.ui.notify(outcome.text, 'info');
      },
      cancel: async (args, ctx) => {
        const id = args.trim();
        if (id === '') {
          ctx.ui.notify(
            'consult_new: /consult-cancel needs an id. Usage: /consult-cancel <id>',
            'error',
          );
          return;
        }
        const outcome = control({ action: 'cancel', id }, state.children);
        ctx.ui.notify(outcome.text, outcome.details.cancelled === true ? 'info' : 'error');
      },
      sound: async (args, ctx) => {
        const verb = args.trim().toLowerCase();
        if (verb !== '' && verb !== 'on' && verb !== 'off') {
          ctx.ui.notify('consult sound: usage /consult-sound on|off', 'error');
          return;
        }
        if (verb !== '') {
          setSoundEnabled(verb === 'on');
        }
        ctx.ui.notify(soundStatus(), 'info');
      },
    },
  };
}
