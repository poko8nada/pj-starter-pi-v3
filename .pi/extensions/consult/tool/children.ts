/**
 * consult_children — 子の一覧と、止める手。
 *
 * 一覧は記録（`run/log.ts` の日ごとのファイル）から作る。子は親のプロセスに従属しないので、
 * reload で親が差し替わっても、同じ session の子は出る。
 *
 * 出るのは**いまのセッションの子**だけ（session で絞る）。別のセッションの子の報告はこのセッションには
 * 来ないので、待たせない。行方不明（終わりの行が無く pid も死んでいる子）は `lost` と出す。
 *
 * 止められるのは**いまのセッションが走らせている子**だけ。記録には pid があるが、止めるのに要る
 * `AbortController` はこのプロセスの物しか無い。前のセッションの子は、理由を返して止めない。
 */

import type { AgentToolResult, AgentToolUpdateCallback } from '@earendil-works/pi-coding-agent';
import { Type } from 'typebox';
import type { Static } from 'typebox';
import { isRunning, pidAlive, readRuns, type RunRecord } from '../run/log.ts';
import type { Place } from '../run/place.ts';
import type { ControlAction, ControlOutcome } from './consult.ts';

/**
 * この道具が runtime に求める面。
 *
 * 置き場と、いまのセッション id と、止める手（`control`）だけ。狭くしておくと、テストが本物の
 * runtime を組み立てずに偽物を渡せる。
 */
export interface ChildrenHost {
  readonly place: Place;
  readonly sessionNow: () => string;
  control(action: ControlAction, session: string): ControlOutcome;
}

export const PARAMETERS = Type.Object({
  action: Type.Optional(
    Type.String({ description: 'list (default) to show the children, cancel to stop one' }),
  ),
  id: Type.Optional(Type.String({ description: 'The child to stop (only for action=cancel)' })),
});

type Params = Static<typeof PARAMETERS>;

/** pi が渡す引数。位置で渡される 5 つを 1 つのタプルにまとめる */
type ExecuteArgs = [
  toolCallId: string,
  params: Params,
  signal: AbortSignal | undefined,
  onUpdate: AgentToolUpdateCallback<unknown> | undefined,
  /** 使うのは cwd だけ。テストが本物の pi の文脈を組み立てずに済むよう、狭くしておく */
  ctx: { readonly cwd: string },
];

export type ChildrenArgs = ExecuteArgs;

/** 知らない action や引数不足のときに添える使い方 */
export const USAGE = 'consult_children: action is list (default) or cancel. cancel needs id';

/** 道具の戻り値。details は必須なので、必ず埋める */
function result(
  text: string,
  details: Record<string, unknown> = {},
): AgentToolResult<Record<string, unknown>> {
  return { content: [{ type: 'text', text }], details };
}

/** 経過を人が読める形にする。走っている子は今まで、終わった子は終わりまで */
export function elapsed(record: RunRecord, now: number): string {
  const end = record.ended ?? now;
  const seconds = Math.max(0, Math.round((end - record.started) / 1000));
  if (seconds < 60) {
    return `${seconds}s`;
  }
  const minutes = Math.floor(seconds / 60);
  return `${minutes}m${String(seconds % 60).padStart(2, '0')}s`;
}

/**
 * 子ごとに最後の行を取る。
 *
 * 記録は追記なので、1 体につき「走っている」行と「終わった」行が並ぶ。一覧は子ごとに 1 行なので、
 * 後ろの行（新しい方）が勝つ。並びは最初に現れた順（始まった順）のまま。
 */
export function latest(records: readonly RunRecord[]): RunRecord[] {
  const byChild = new Map<string, RunRecord>();
  for (const record of records) {
    byChild.set(record.child, record);
  }
  return [...byChild.values()];
}

/**
 * 1 体を 1 行にする。走っているかどうかは、ここで 1 回だけ決める。
 *
 * 走っておらず終わりの行も無い子は `lost`（親ごと落ちた、または記録を書く側が消えた子）。
 * `done` と偽らない。
 */
export function rowOf(record: RunRecord, running: boolean, now: number): string {
  const state = running ? `running (pid ${record.pid})` : stateOf(record);
  const parts = [
    record.child,
    record.role,
    record.worktree === undefined ? 'parent' : `worktree ${record.worktree}`,
    state,
    elapsed(record, now),
    record.turns === undefined ? '(turns unknown)' : `${record.turns} turns`,
    record.spend ?? '(spend unknown)',
  ];
  if (!running && record.reason !== undefined) {
    parts.push(`reason: ${record.reason}`);
  }
  return parts.join('  ');
}

/** 走っていない子の状態。終わりの行が無ければ行方不明 */
function stateOf(record: RunRecord): string {
  return record.ended === undefined ? 'lost' : (record.state ?? 'done');
}

/**
 * 記録をそのまま行にする。
 *
 * 走っているかは `alive`（既定 `pidAlive`）で決める。記録を絞るのは呼び手の仕事（一覧は session で絞る）。
 */
export function rowsOf(
  records: readonly RunRecord[],
  alive: (pid: number) => boolean,
  now: number,
): string[] {
  return records.map((record) => rowOf(record, isRunning(record, alive), now));
}

/** 一覧の本文。記録が無ければそう言う */
export function listText(records: readonly RunRecord[], now: number): string {
  if (records.length === 0) {
    return 'no children in this project yet';
  }
  return rowsOf(records, pidAlive, now).join('\n');
}

export function createChildrenTool(host: ChildrenHost) {
  return async function execute(...args: ExecuteArgs) {
    const [, params, , , _ctx] = args;
    const action = params.action ?? 'list';
    const session = host.sessionNow();

    if (action === 'list') {
      const records = latest(readRuns(host.place, { session }));
      return result(listText(records, Date.now()), { action, count: records.length });
    }

    if (action === 'cancel') {
      const id = params.id;
      if (typeof id !== 'string' || id.trim() === '') {
        throw new Error(`consult_children: cancel needs id. ${USAGE}`);
      }
      const outcome = host.control({ action: 'cancel', id }, session);
      return result(outcome.text, { action, id, outcome: outcome.details });
    }

    throw new Error(`consult_children: action is list or cancel. ${USAGE}`);
  };
}
