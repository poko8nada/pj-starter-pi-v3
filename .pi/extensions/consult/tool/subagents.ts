/**
 * consult_subagents — サブエージェントの一覧と、止める手。
 *
 * 一覧は記録（`run/log.ts` の日ごとのファイル）から作る。サブエージェントはメインエージェントのプロセスに従属しないので、
 * reload でメインエージェントが差し替わっても、同じ session のサブエージェントは出る。
 *
 * 出るのは**いまのセッションのサブエージェント**だけ（session で絞る）。別のセッションのサブエージェントの報告はこのセッションには
 * 来ないので、待たせない。行方不明（終わりの行が無く pid も死んでいるサブエージェント）は `lost` と出す。
 *
 * 止められるのは**いまのセッションが走らせているサブエージェント**だけ。記録には pid があるが、止めるのに要る
 * `AbortController` はこのプロセスの物しか無い。前のセッションのサブエージェントは、理由を返して止めない。
 */

import type { AgentToolResult, AgentToolUpdateCallback } from '@earendil-works/pi-coding-agent';
import { Type } from 'typebox';
import type { Static } from 'typebox';
import { isRunning, readRuns, type CheckRecord, type RunRecord } from '../run/log.ts';
import type { Place } from '../run/place.ts';
import type { ControlAction, ControlOutcome } from './consult.ts';

/**
 * この道具が runtime に求める面。
 *
 * 置き場と、いまのセッション id と、止める手（`control`）だけ。狭くしておくと、テストが本物の
 * runtime を組み立てずに偽物を渡せる。
 */
export interface SubagentsHost {
  readonly place: Place;
  readonly sessionNow: () => string;
  control(action: ControlAction, session: string): ControlOutcome;
}

export const PARAMETERS = Type.Object({
  action: Type.Optional(
    Type.String({ description: 'list (default) to show the subagents, cancel to stop one' }),
  ),
  id: Type.Optional(Type.String({ description: 'The subagent to stop (only for action=cancel)' })),
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

export type SubagentsArgs = ExecuteArgs;

/** 知らない action や引数不足のときに添える使い方 */
export const USAGE = 'consult_subagents: action is list (default) or cancel. cancel needs id';

/** 道具の戻り値。details は必須なので、必ず埋める */
function result(
  text: string,
  details: Record<string, unknown> = {},
): AgentToolResult<Record<string, unknown>> {
  return { content: [{ type: 'text', text }], details };
}

/** 経過を人が読める形にする。走っているサブエージェントは今まで、終わったサブエージェントは終わりまで */
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
 * サブエージェントごとに 1 行に畳む。
 *
 * 同じ subagent に `ended` の行が 1 つでもあればそれを返す（終わり）。無ければ開始行を返す。
 * 行の並びに依らない（逆順でも終わりを採る）。
 */
export function latest(records: readonly RunRecord[]): RunRecord[] {
  const groups = new Map<string, RunRecord[]>();
  for (const record of records) {
    const list = groups.get(record.subagent);
    if (list !== undefined) {
      list.push(record);
    } else {
      groups.set(record.subagent, [record]);
    }
  }
  const out: RunRecord[] = [];
  for (const list of groups.values()) {
    const ended = list.filter((record) => record.ended !== undefined);
    if (ended.length > 0) {
      const pick = ended.toSorted((a, b) => (a.ended ?? 0) - (b.ended ?? 0)).at(-1);
      if (pick !== undefined) {
        out.push(pick);
      }
      continue;
    }
    const last = list.at(-1);
    if (last !== undefined) {
      out.push(last);
    }
  }
  return out;
}

/**
 * 1 体を 1 行にする。走っているかどうかは、ここで 1 回だけ決める。
 *
 * 走っておらず終わりの行も無いサブエージェントは `lost`（メインエージェントごと落ちた、または記録を書く側が消えたサブエージェント）。
 * `done` と偽らない。
 */
export function rowOf(record: RunRecord, running: boolean, now: number): string {
  const state = running ? `running (pid ${record.pid})` : stateOf(record);
  const parts = [
    record.subagent,
    record.role,
    record.worktree === undefined ? 'base' : `worktree ${record.worktree}`,
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

/** 走っていないサブエージェントの状態。終わりの行が無ければ行方不明 */
function stateOf(record: RunRecord): string {
  return record.ended === undefined ? 'lost' : (record.state ?? 'done');
}

/**
 * 記録をそのまま行にする。
 *
 * 走っているかは `check`（既定は token があれば `ps`、無ければ `pidAlive`）で決める。記録を絞るのは呼び手の仕事（一覧は session で絞る）。
 */
export function rowsOf(
  records: readonly RunRecord[],
  check: CheckRecord | undefined,
  now: number,
): string[] {
  return records.map((record) => rowOf(record, isRunning(record, check), now));
}

/** 一覧の本文。記録が無ければそう言う */
export function listText(records: readonly RunRecord[], now: number, check?: CheckRecord): string {
  if (records.length === 0) {
    return 'no subagents in this project yet';
  }
  return rowsOf(records, check, now).join('\n');
}

export function createSubagentsTool(host: SubagentsHost) {
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
        throw new Error(`consult_subagents: cancel needs id. ${USAGE}`);
      }
      const outcome = host.control({ action: 'cancel', id }, session);
      return result(outcome.text, { action, id, outcome: outcome.details });
    }

    throw new Error(`consult_subagents: action is list or cancel. ${USAGE}`);
  };
}
