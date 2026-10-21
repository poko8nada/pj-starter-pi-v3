/**
 * consult の runtime — 走っているサブエージェントを 1 か所で持ち、完了をメインエージェントに届ける。
 *
 * サブエージェントを起こすのは `consult_run`（`tool/run.ts` の面）から。1 呼び出し = 1 体で、行き先の worktree と、続きを使うかをメインエージェントが指す。
 * 設定（モデル・ツール・isolated・paths・bash・続きの既定・上限・役割）は types.json が持ち、上書きの口は作らない。設定は呼び出しごとに読むので、変えたら次から効く。
 *
 * 起こしたらすぐ `started: <id>` を返し、メインエージェントは待たない。サブエージェントごとの完了で `pi.sendMessage` に本文を渡す。走っているサブエージェントの一覧と停止は、道具の `action` とスラッシュコマンドの両方から同じ `control` を呼ぶ。
 */

import { dirname } from 'node:path';
import { randomUUID } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import type { AgentToolResult, AgentToolUpdateCallback } from '@earendil-works/pi-coding-agent';
import type { Static } from 'typebox';
import { runOneSubagent, type SubagentJob } from '../run/subagent.ts';
import { findWorktree } from '../run/worktree.ts';
import {
  appendRun,
  isRunning,
  KEEP_DAYS,
  readRuns,
  runningRuns,
  type CheckRecord,
  type RunRecord,
} from '../run/log.ts';
import type { Place } from '../run/place.ts';
import { latest } from './subagents.ts';
import type { Delivery } from '../run/delivery.ts';
import {
  type PARAMETERS as RUN_PARAMETERS,
  USAGE as RUN_USAGE,
  parseRunRequest,
  type RunRequest,
} from './run.ts';
import { changedFiles, reasonOf, stateOf, worktreeGit } from '../run/run.ts';
import { parseEvents, usageFrom, type ConsultOptions } from '../sub/spec.ts';
import { loadTypes, resolveType } from '../policy/types.ts';
import { compose, reportBlock, result, usageLine, type SubagentReport } from './render.ts';
import { isSoundEnabled, setSoundEnabled, startSound } from './sound.ts';

/** 設定の場所。拡張の隣（`tool/` から 1 つ上）に置く */
const EXTENSION_DIR = dirname(dirname(fileURLToPath(import.meta.url)));

/** consult_subagents が使う ctx の面。cwd だけ見れば足りる（テストはこれをそのまま渡せる） */
export interface ConsultContext {
  readonly cwd: string;
}

/** コマンドが使う ctx の面。通知だけ見る */
export interface CommandContext {
  readonly ui: {
    notify(message: string, type?: 'info' | 'warning' | 'error'): void;
  };
}

/** consult_run の引数。params は consult_run の物 */
type RunExecuteArgs = [
  toolCallId: string,
  params: Static<typeof RUN_PARAMETERS>,
  signal: AbortSignal | undefined,
  onUpdate: AgentToolUpdateCallback<unknown> | undefined,
  ctx: ConsultContext,
];

/** 走っているサブエージェントを止める操作。道具の action とコマンドが同じ形を使う */
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

/** sendMessage の配送オプション。完了は次のターンでメインエージェントに届ける */
export interface ConsultSendOptions {
  readonly triggerTurn?: boolean;
  readonly deliverAs?: 'steer' | 'followUp' | 'nextTurn';
}

/** 完了の通知に要る pi の面。ここだけを使う */
export interface PiFace {
  sendMessage(message: ConsultMessage, options?: ConsultSendOptions): void;
}

/** バックグラウンドで走っているサブエージェント 1 体 */
export interface RunningSubagent {
  readonly id: string;
  readonly type: string;
  readonly task: string;
  readonly startedAt: number;
  readonly controller: AbortController;
  /** サブエージェントのプロセス。走っている間だけ入る（実行の記録に書く） */
  pid?: number;
}

/** サブエージェントの完了でメインエージェントに届ける本文と診断 */
export interface ConsultOutcome {
  readonly text: string;
  readonly details: Record<string, unknown>;
  /** 実行の記録に書く塊。走らせたサブエージェントだけが持つ（失敗の結果などは持たない） */
  readonly report?: SubagentReport;
}

/** サブエージェント 1 体を最後まで走らせる。テストではサブエージェントを起こさない差し替えを渡す */
export type ConsultRunner = (
  ctx: ConsultContext,
  options: ConsultOptions,
  job: SubagentJob,
) => Promise<ConsultOutcome>;

/** サブエージェント 1 体を一覧に出す 1 行。task は最初の行だけ */
function describeSubagent(subagent: RunningSubagent): string {
  const line = subagent.task.split('\n', 1)[0] ?? '';
  const task = line.length > 80 ? `${line.slice(0, 77)}...` : line;
  return `${subagent.id}  ${subagent.type}  ${task}`;
}

/**
 * 走っているサブエージェントの一覧と、1 体の停止。道具の action とスラッシュコマンドが呼ぶ 1 か所。
 *
 * 掴んでいるサブエージェント（このインスタンスが起こした物）は `abort()` で止める。掴んでいないサブエージェントは記録から
 * 引いて、生きている pid に `kill`（既定は SIGTERM）を送る。記録は書かない（終わりの行は、
 * そのサブエージェントを持っていた側の完了処理が書く。持っていた側が既に居なければ、行方不明として見える）。
 * 知らない id・終わったサブエージェント・死んだ pid・別の session のサブエージェントは、理由を返して止めない。
 */
// eslint-disable-next-line max-params -- plan の I/O（action, subagents, place, session, kill, check の 6 つ）
export function controlSubagent(
  action: ControlAction,
  subagents: ReadonlyMap<string, RunningSubagent>,
  place: Place,
  session: string,
  kill: (pid: number) => void = (pid) => {
    process.kill(pid, 'SIGTERM');
  },
  check?: CheckRecord,
): ControlOutcome {
  if (action.action === 'list') {
    const running = [...subagents.values()];
    return {
      text:
        running.length === 0
          ? 'consult_subagents: no subagent is running.'
          : running.map(describeSubagent).join('\n'),
      details: {
        action: 'list',
        running: running.map((subagent) => ({
          id: subagent.id,
          type: subagent.type,
          task: subagent.task,
        })),
      },
    };
  }
  const held = subagents.get(action.id);
  if (held !== undefined) {
    // 掴んでいるサブエージェントは abort だけ（kill は送らない）
    held.controller.abort();
    return {
      text: `consult_subagents: cancelled ${held.id} (${held.type})`,
      details: { action: 'cancel', id: held.id, cancelled: true },
    };
  }
  const own = latest(readRuns(place, { session })).find((run) => run.subagent === action.id);
  if (own === undefined) {
    const elsewhere = latest(readRuns(place)).find((run) => run.subagent === action.id);
    if (elsewhere !== undefined) {
      return {
        text: `consult_subagents: ${action.id} belongs to another session (it cannot be stopped here)`,
        details: { action: 'cancel', id: action.id, cancelled: false },
      };
    }
    return {
      text: `consult_subagents: no such subagent: ${action.id}`,
      details: { action: 'cancel', id: action.id, cancelled: false },
    };
  }
  if (own.ended !== undefined) {
    return {
      text: `consult_subagents: ${action.id} already finished (${own.state ?? 'done'})`,
      details: { action: 'cancel', id: action.id, cancelled: false },
    };
  }
  if (!isRunning(own, check)) {
    return {
      text: `consult_subagents: ${action.id} is not running (lost)`,
      details: { action: 'cancel', id: action.id, cancelled: false },
    };
  }
  kill(own.pid);
  return {
    text: `consult_subagents: cancelled ${own.subagent} (${own.role})`,
    details: { action: 'cancel', id: own.subagent, cancelled: true },
  };
}

/** サブエージェント 1 体の完了を、メインエージェントに届けるメッセージにする */
export function completionMessage(
  subagent: RunningSubagent,
  outcome: ConsultOutcome,
): { message: ConsultMessage; options: ConsultSendOptions } {
  return {
    message: {
      customType: 'consult',
      content: `consult ${subagent.id} (${subagent.type}) finished\n\n${outcome.text}`,
      display: true,
      details: { id: subagent.id, type: subagent.type, ...outcome.details },
    },
    options: { triggerTurn: true, deliverAs: 'followUp' },
  };
}

/** サブエージェント 1 体を走らせて、メインエージェントに届ける本文と診断にする */
async function consult(
  ctx: ConsultContext,
  options: ConsultOptions,
  job: SubagentJob,
): Promise<ConsultOutcome> {
  const { run, install } = await runOneSubagent(ctx, options, job);
  const events = parseEvents(run.stdout);
  const usage = usageFrom(events);
  const state = stateOf(run);
  const reason = reasonOf(run);
  const files = job.worktree === undefined ? [] : changedFiles(worktreeGit(job.worktree.path));
  const report: SubagentReport = {
    role: options.type,
    state,
    files,
    turns: usage.turns,
    turnsLimit: options.policy.limits.turns,
    spend: `${usage.cost.toFixed(4)} usd`,
    ...(job.id === undefined ? {} : { id: job.id }),
    ...(job.worktree === undefined ? {} : { worktree: job.worktree.id }),
    ...(reason === undefined ? {} : { reason }),
  };
  // 塊を先頭に置く。メインエージェントは本文の前に、どう終わったか・どこを触ったかを見る。
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
    report,
    details: {
      type: options.type,
      state,
      files,
      ...(install === undefined ? {} : { install }),
    },
  };
}

/** 走らせている consult の一式。道具とスラッシュコマンドが同じ subagents を見る */
interface RuntimeState {
  readonly pi: PiFace;
  readonly place: Place;
  readonly run: ConsultRunner;
  readonly subagents: Map<string, RunningSubagent>;
  /** 完了の届け先。reload で差し替わるので、直に pi を握らない */
  readonly delivery?: Delivery;
  readonly sessionNow: () => string;
  /** 生死の照合。テストが差し替える口（既定は token があれば `ps`、無ければ `pidAlive`） */
  readonly check?: CheckRecord;
  /** 番号の床。記録の最大で種を取り、同じ runtime で続けて起こす時も重ねない */
  number: { session: string; next: number };
}

/** バックグラウンドのサブエージェント 1 体分の起動材料 */
interface BackgroundJob {
  readonly ctx: ConsultContext;
  readonly options: ConsultOptions;
  readonly job: SubagentJob;
  readonly subagent: RunningSubagent;
  readonly session: string;
}

/** 失敗も本文にする。投げずにメッセージへ回す */
function failureOutcome(error: unknown): ConsultOutcome {
  const detail = error instanceof Error ? error.message : String(error);
  return { text: `(the consult could not run) ${detail}`, details: { error: detail } };
}

/** 完了をメインエージェントのメッセージにする */
function deliver(
  state: RuntimeState,
  subagent: RunningSubagent,
  outcome: ConsultOutcome,
  record: RunRecord,
): void {
  const built = completionMessage(subagent, outcome);
  if (state.delivery === undefined) {
    // delivery を組んでいない（テストの runtime など）。今まで通り直接渡す
    state.pi.sendMessage(built.message, built.options);
    return;
  }
  state.delivery.send(built.message, built.options, record);
}

/**
 * 走っているサブエージェントの記録を閉じる 1 行。
 *
 * 落ちたサブエージェントも閉じる（開いたままにすると、いつまでも「走っている」と見える）。届け先が無かったときの
 * 控え（`notice`）にもこの記録を使う。
 */
function closeRecord(
  job: BackgroundJob,
  place: Place,
  report: SubagentReport | undefined,
): RunRecord {
  const record: RunRecord = {
    session: job.session,
    subagent: job.subagent.id,
    role: job.options.type,
    pid: job.subagent.pid ?? 0,
    started: job.subagent.startedAt,
    ended: Date.now(),
    state: report?.state ?? 'error',
    files: report === undefined ? [] : [...report.files],
    turns: report?.turns ?? 0,
    spend: report?.spend ?? '',
    ...(report?.reason === undefined ? {} : { reason: report.reason }),
    ...(job.job.worktree === undefined ? {} : { worktree: job.job.worktree.id }),
  };
  appendRun(place, record);
  return record;
}

/** サブエージェントを起こし、完了でメッセージを送る。呼び出し側は待たない */
function runInBackground(state: RuntimeState, job: BackgroundJob): void {
  state
    .run(job.ctx, job.options, job.job)
    .then((outcome) => {
      const record = closeRecord(job, state.place, outcome.report);
      deliver(state, job.subagent, outcome, record);
    })
    .catch((error: unknown) => {
      const record = closeRecord(job, state.place, undefined);
      deliver(state, job.subagent, failureOutcome(error), record);
    })
    .finally(() => {
      state.subagents.delete(job.subagent.id);
      // 音は述語（記録の読み直し）が止める。ここでは止めない
    });
}

/** `consult-12` から 12 を取り出す。`consult-` の形でなければ undefined */
function numberOf(subagent: string): number | undefined {
  const found = /^consult-(\d+)$/.exec(subagent);
  return found === null ? undefined : Number(found[1]);
}

/** その session の記録にある最大の番号。`consult-` の形でない行は数えない */
function highestInRecord(place: Place, session: string): number {
  const used = readRuns(place, { session, days: KEEP_DAYS })
    .map((record) => numberOf(record.subagent))
    .filter((value): value is number => value !== undefined);
  return Math.max(0, ...used);
}

/**
 * 次に使うサブエージェントの番号。その session の記録の最大 + 1。
 *
 * 番号を拡張のメモリーだけで数えると reload のたびに 1 に戻り、名前で 1 行に畳む一覧
 *（`subagents.ts` の `latest`）が、走っている前のサブエージェントを新しいサブエージェントで上書きして見えなくする。
 * だから記録から数える。掃除と同じ幅で読み、長く走る session でも戻らないようにする。
 *
 * 記録に書かれるのはサブエージェントが起きた時なので、同じ runtime で続けて起こすと、2 体目が
 * 1 体目の行を見ない。だから決めた番号を覚えておき、次はその続きから振る。
 */
function nextSubagentId(state: RuntimeState, session: string): string {
  const floor =
    state.number.session === session ? state.number.next : highestInRecord(state.place, session);
  const next = floor + 1;
  state.number = { session, next };
  return `consult-${next}`;
}

/** サブエージェントを起こして、すぐ `started: <id>` を返す。完了はメッセージで届く */
function beginRun(
  state: RuntimeState,
  ctx: ConsultContext,
  request: RunRequest,
): AgentToolResult<Record<string, unknown>> {
  const policy = resolveType(loadTypes(EXTENSION_DIR), request.role);
  // 行き先を決める。隔離するロールは worktree が要る（暗黙に作らない）。
  const worktree =
    request.worktree === undefined ? undefined : findWorktree(ctx.cwd, request.worktree);
  if (request.worktree !== undefined && worktree === undefined) {
    throw new Error(`consult_run: no such worktree: ${request.worktree}. ${RUN_USAGE}`);
  }
  if (policy.isolated && worktree === undefined) {
    throw new Error(`consult_run: ${policy.name} writes, so it needs a worktree. ${RUN_USAGE}`);
  }
  const token = randomUUID();
  const options: ConsultOptions = { type: policy.name, task: request.task, policy, token };
  // 番号は記録から決める。reload でメモリーが消えても、戻らないように。
  const session = state.sessionNow();
  const subagent: RunningSubagent = {
    id: nextSubagentId(state, session),
    type: policy.name,
    task: request.task,
    startedAt: Date.now(),
    controller: new AbortController(),
  };
  const job: SubagentJob = {
    task: request.task,
    token,
    id: subagent.id,
    signal: subagent.controller.signal,
    ...(worktree === undefined ? {} : { worktree }),
    continueSession: request.continue ?? policy.continueByDefault,
    // 起きたら、まず「走っている」1 行を記録に足す。reload をまたいでも一覧に出るように
    onStarted: (pid) => {
      subagent.pid = pid;
      appendRun(state.place, {
        session,
        subagent: subagent.id,
        role: policy.name,
        pid,
        started: subagent.startedAt,
        token,
        ...(worktree === undefined ? {} : { worktree: worktree.id }),
      });
    },
  };
  state.subagents.set(subagent.id, subagent);
  if (state.subagents.size === 1) {
    // 記録を読み直す述語で鳴らす。reload をまたいでも、走っているサブエージェントが居なくなれば止まる
    const check = state.check;
    startSound(
      () => runningRuns(state.place, { session: state.sessionNow() }, check).length > 0,
    );
  }
  runInBackground(state, { ctx, options, job, subagent, session });
  const running = [...state.subagents.values()].map(describeSubagent).join('\n');
  return result(`started: ${subagent.id}\n\nrunning now:\n${running}`, {
    action: 'run',
    id: subagent.id,
    type: policy.name,
    ...(worktree === undefined ? {} : { worktree: worktree.id }),
  });
}

export interface ConsultRuntime {
  readonly subagents: ReadonlyMap<string, RunningSubagent>;
  run(...args: RunExecuteArgs): Promise<AgentToolResult<Record<string, unknown>>>;
  control(action: ControlAction, session: string): ControlOutcome;
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
 * 拡張の入口が 1 つだけ作る。道具とスラッシュコマンドは同じ subagents を共有する。
 * テストは `pi` と `run` を差し替えて、サブエージェントを起こさずに確かめられる。
 */
// eslint-disable-next-line max-params -- plan の I/O（pi, place, run, delivery, sessionNow, check の 6 つ）
export function createRuntime(
  pi: PiFace,
  place: Place,
  run: ConsultRunner = consult,
  delivery?: Delivery,
  sessionNow: () => string = () => '',
  check?: CheckRecord,
): ConsultRuntime {
  const state: RuntimeState = {
    pi,
    place,
    run,
    subagents: new Map(),
    number: { session: '', next: 0 },
    sessionNow,
    ...(check === undefined ? {} : { check }),
    ...(delivery === undefined ? {} : { delivery }),
  };
  return {
    subagents: state.subagents,
    run: async (...args: RunExecuteArgs) => {
      const [, params, , , ctx] = args;
      return beginRun(state, ctx, parseRunRequest(params));
    },
    control: (action, session) =>
      controlSubagent(action, state.subagents, state.place, session, undefined, check),
    commands: {
      status: async (_args, ctx) => {
        const outcome = controlSubagent(
          { action: 'list' },
          state.subagents,
          state.place,
          state.sessionNow(),
          undefined,
          check,
        );
        ctx.ui.notify(outcome.text, 'info');
      },
      cancel: async (args, ctx) => {
        const id = args.trim();
        if (id === '') {
          ctx.ui.notify(
            'consult_subagents: /consult-cancel needs an id. Usage: /consult-cancel <id>',
            'error',
          );
          return;
        }
        const outcome = controlSubagent(
          { action: 'cancel', id },
          state.subagents,
          state.place,
          state.sessionNow(),
          undefined,
          check,
        );
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
