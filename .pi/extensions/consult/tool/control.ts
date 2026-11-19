/** consult のサブエージェントの一覧と停止。道具の action とスラッシュコマンドが同じ 1 か所を呼ぶ */

import { isRunning, readRuns, type CheckRecord } from '../run/log.ts';
import type { Place } from '../run/place.ts';
import { latest } from './subagents.ts';

/** 走っているサブエージェントを止める操作。道具の action とコマンドが同じ形を使う */
export type ControlAction =
  | { readonly action: 'list' }
  | { readonly action: 'cancel'; readonly id: string };

/** 一覧や停止の結果。本文と、テストと呼び出し側が読める診断 */
export interface ControlOutcome {
  readonly text: string;
  readonly details: Record<string, unknown>;
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

/** サブエージェント 1 体を一覧に出す 1 行。task は最初の行だけ */
export function describeSubagent(subagent: RunningSubagent): string {
  const line = subagent.task.split('\n', 1)[0] ?? '';
  const task = line.length > 80 ? `${line.slice(0, 77)}...` : line;
  return `${subagent.id}  ${subagent.type}  ${task}`;
}

/**
 * 走っているサブエージェントの一覧と、1 体の停止。道具の action とスラッシュコマンドが呼ぶ 1 か所。
 *
 * 掴んでいるサブエージェント（このインスタンスが起こしたもの）は `abort()` で止める。掴んでいないサブエージェントは記録から
 * 引いて、まだ走っている（同じ subagent に終わりの行がなく、startToken の照合が通る）ものにだけ `kill`（既定は SIGTERM）を送る.
 * 記録は書かない（終わりの行は、そのサブエージェントを持っていた側の完了処理が書く。持っていた側が既に居なければ、行方不明として見える）。
 * 知らない id・終わったサブエージェント・照合の通らないもの・別の session のサブエージェントは、理由を返して止めない。
 */
export function controlSubagent(input: {
  readonly action: ControlAction;
  readonly subagents: ReadonlyMap<string, RunningSubagent>;
  readonly place: Place;
  readonly session: string;
  readonly now: Date;
  readonly kill?: (pid: number) => void;
  readonly check?: CheckRecord;
}): ControlOutcome {
  const {
    action,
    subagents,
    place,
    session,
    now,
    kill = (pid) => {
      process.kill(pid, 'SIGTERM');
    },
    check,
  } = input;
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
  const sessionRuns = readRuns(place, { session, at: now });
  const own = latest(sessionRuns).find((run) => run.subagent === action.id);
  if (own === undefined) {
    const allRuns = readRuns(place, { at: now });
    const elsewhere = latest(allRuns).find((run) => run.subagent === action.id);
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
