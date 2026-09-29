/**
 * consult_new —子 pi を type の policy でバックグラウンドで走らせ、完了したら結果をメッセージで親に渡す道具。
 *
 * 呼び出し側が選べるのは type の名前だけ。モデル・ツール・環境・上限・役割は type が持つ（`types.json`。git 管理外）。上書きの口は作らない。設定は呼び出しごとに読むので、変えたら次の consult_new から効く。モデルが使えなければ、type の候補を順に試し、最後は親と同じ設定で走る。
 *
 * 起こしたらすぐ `started: <id>` を返し、親は待たない。子ごとの完了で `pi.sendMessage` に本文を渡す。走っている子の一覧と停止は、道具の `action` とスラッシュコマンドの両方から同じ `control` を呼ぶ。
 *
 * 費用がかかるので、呼ぶ前に必ず確認を出す。
 */

import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { AgentToolResult, AgentToolUpdateCallback } from '@earendil-works/pi-coding-agent';
import { Type } from 'typebox';
import type { Static } from 'typebox';
import { readPayloads, runForInputs } from '../run/run.ts';
import { runOneChild } from '../run/child.ts';
import { isBlank, parseEvents, type ConsultOptions } from '../child/spec.ts';
import { loadTypes, resolveType } from '../policy/types.ts';
import { compose, result, usageLine } from './render.ts';
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

/** 道具のパラメータ。action で走らせ方を選び、start のときだけ type と task を渡す */
export const PARAMETERS = Type.Object({
  action: Type.Optional(
    Type.String({
      description:
        'start (default) to run a child, list to show the running ones, cancel to stop one',
    }),
  ),
  type: Type.Optional(
    Type.String({
      description: 'How the child runs (research / review / trial / code). Set in types.json',
    }),
  ),
  task: Type.Optional(Type.String({ description: 'What the child should do' })),
  input: Type.Optional(
    Type.Array(
      Type.String({
        description:
          "Path to a file whose contents are prepended to the child's prompt. Fails the call if it cannot be read",
      }),
      { description: 'One child per path. Without it, one child with no payload' },
    ),
  ),
  id: Type.Optional(Type.String({ description: 'The child to stop (only for action=cancel)' })),
});

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
  'consult_new: action is start (default), list, or cancel. start needs type and task; cancel needs id';

interface StartAction {
  readonly action: 'start';
  readonly type: string;
  readonly task: string;
  readonly input: readonly string[];
}

/** 道具が受ける操作 */
export type ConsultAction =
  | StartAction
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

/** 子に渡す前に読んだ入力。setup の誤り（読めないパス）は子を起こす前に落とす */
export interface Consultation {
  readonly payloads: (string | undefined)[];
  readonly labels: string[];
}

/** consult_new を最後まで走らせる。テストでは子を起こさない差し替えを渡す */
export type ConsultRunner = (
  ctx: ConsultContext,
  options: ConsultOptions,
  consultation: Consultation,
  signal: AbortSignal,
) => Promise<ConsultOutcome>;

function asInputArray(value: unknown): string[] {
  if (value === undefined) {
    return [];
  }
  if (!Array.isArray(value)) {
    throw new Error(`consult_new: input must be an array of paths. ${USAGE}`);
  }
  const inputs: string[] = [];
  for (const item of value) {
    if (typeof item !== 'string') {
      throw new Error(`consult_new: input must be an array of paths. ${USAGE}`);
    }
    inputs.push(item);
  }
  return inputs;
}

/** 引数を検証して操作にする。知らない形は使い方つきで投げる */
export function parseConsultAction(raw: unknown): ConsultAction {
  if (typeof raw !== 'object' || raw === null) {
    throw new Error(`consult_new: the arguments are not an object. ${USAGE}`);
  }
  const { action, type, task, input, id } = raw as {
    action?: unknown;
    type?: unknown;
    task?: unknown;
    input?: unknown;
    id?: unknown;
  };
  const verb = action === undefined ? 'start' : action;
  if (verb === 'start') {
    if (
      typeof type !== 'string' ||
      type.trim() === '' ||
      typeof task !== 'string' ||
      task.trim() === ''
    ) {
      throw new Error(`consult_new: start needs a non-empty type and task. ${USAGE}`);
    }
    if (id !== undefined) {
      throw new Error(`consult_new: start does not take id. ${USAGE}`);
    }
    return { action: 'start', type, task, input: asInputArray(input) };
  }
  if (verb === 'list') {
    if (type !== undefined || task !== undefined || input !== undefined || id !== undefined) {
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

/** 入力を先に全部読む。1 つでも読めなければ投げる（子を 1 体も起動しない） */
function prepareConsultation(inputs: readonly string[], cwd: string): Consultation {
  if (inputs.length === 0) {
    return { payloads: [undefined], labels: ['(no input)'] };
  }
  return { payloads: readPayloads(inputs, cwd), labels: [...inputs] };
}

/** 子を走らせて、親に届ける本文と診断にする。入力ごとに 1 体 */
async function consult(
  ctx: ConsultContext,
  options: ConsultOptions,
  consultation: Consultation,
  signal: AbortSignal,
): Promise<ConsultOutcome> {
  const { payloads, labels } = consultation;
  const results = await runForInputs(payloads, (payload, index) => {
    // 「無言で、文脈なしの子を走らせない」（001 の規則）。中身が無い入力は子を起こさない。
    // 投げればこの入力だけが {ok: false, error} になり、他の入力はそのまま走る（runForInputs は allSettled）。
    if (payload !== undefined && isBlank(payload)) {
      throw new Error('空の入力');
    }
    return runOneChild(ctx, options, { payload, index, signal });
  });

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
    const { run, install } = entry.value;
    const events = parseEvents(run.stdout);
    // 打ち切られたときは、何回走ったかと、続きを走らせたかを打ち切りの行の隣に出す。
    lines.push(compose(events, run));
    // 診断は本文と混ぜないが、呼び出し側が読める場所に 1 行だけ置く。`details` は agent には渡らないので、モデルをここに出さないと見えない。
    lines.push('', `[consult] ${usageLine(events)}`);
    lines.push('');
    details.push({
      input: label,
      usage: usageLine(events),
      stopped: run.stopped,
      aborted: run.aborted,
      ...(install === undefined ? {} : { install }),
    });
  }

  return { text: lines.join('\n').trimEnd(), details: { type: options.type, inputs: details } };
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
  readonly consultation: Consultation;
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
    .run(job.ctx, job.options, job.consultation, job.child.controller.signal)
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
function begin(
  state: RuntimeState,
  ctx: ConsultContext,
  action: StartAction,
): AgentToolResult<Record<string, unknown>> {
  const policy = resolveType(loadTypes(EXTENSION_DIR), action.type);
  const options: ConsultOptions = { type: policy.name, task: action.task, policy };
  // 読めない入力はここで落とす。子を 1 体も起こさずに返せる（親は setup の誤りをすぐ見る）。
  const consultation = prepareConsultation(action.input, ctx.cwd);
  state.counter += 1;
  const child: RunningChild = {
    id: `consult-${state.counter}`,
    type: policy.name,
    task: action.task,
    startedAt: Date.now(),
    controller: new AbortController(),
  };
  state.children.set(child.id, child);
  if (state.children.size === 1) {
    startSound();
  }
  runInBackground(state, { ctx, options, consultation, child });
  const running = [...state.children.values()].map(describeChild).join('\n');
  return result(`started: ${child.id}\n\nrunning now:\n${running}`, {
    action: 'start',
    id: child.id,
    type: policy.name,
  });
}

async function executeAction(
  state: RuntimeState,
  args: ExecuteArgs,
): Promise<AgentToolResult<Record<string, unknown>>> {
  const [, params, , , ctx] = args;
  const action = parseConsultAction(params);
  if (action.action === 'start') {
    return begin(state, ctx, action);
  }
  const outcome = control(action, state.children);
  return result(outcome.text, outcome.details);
}

export interface ConsultRuntime {
  readonly children: ReadonlyMap<string, RunningChild>;
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
