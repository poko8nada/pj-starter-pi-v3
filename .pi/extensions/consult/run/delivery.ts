/**
 * consult の delivery — 完了の報告を記録から読み、渡したら印を書く。
 *
 * 完了は必ず記録の 1 行（`notice` に本文）になる。セッションは記録を読み直し、
 * 印の無い完了を `pi.sendMessage` で渡して、その走行に印の行を足す。
 * 目録（`delivered.json`）は、直す前に書かれた `notice` 行のための水位としてだけ読む。
 * 新しい印は記録の行にする。
 *
 * 目録の形は `{ <session>: { ended: <配達済みの終わりの時刻（ms）> } }`。無い・壊れている
 * ときは空として扱い、未読を全部返す側に倒れる（失うより 2 回渡す方を選ぶ）。
 */

import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import {
  appendRun,
  deliveredKeys,
  isWaiting,
  readRuns,
  type ReadScope,
  type RunRecord,
} from './log.ts';
import type { Place } from './place.ts';

/** 配達済みの印。session ごとに、最後に渡した通知の終わりの時刻を持つ（古い行のため） */
export interface Cursor {
  readonly ended: number;
}

/** 目録のファイル。置き場の直下（日に割らない） */
export const CURSOR_FILE = 'delivered.json';

/** 目録の中身。session id から欄を引く */
type CursorIndex = Record<string, Cursor>;

/** 素の object を、欄だけを持つ枠として見る（`log.ts` の `asFields` と同じ形） */
function asFields(raw: unknown): Record<string, unknown> {
  return typeof raw === 'object' && raw !== null ? { ...raw } : {};
}

/**
 * 目録を読む。無い・壊れている（JSON でない・形が違う）ときは空。
 *
 * 空を返すと「未読が全部ある」側に倒れる（配達は失うより 2 回渡す方を選ぶ）。
 */
function readIndex(place: Place): CursorIndex {
  let text: string;
  try {
    text = readFileSync(join(place.dir, CURSOR_FILE), 'utf8');
  } catch {
    return {};
  }
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    return {};
  }
  const index: CursorIndex = {};
  for (const [session, value] of Object.entries(asFields(parsed))) {
    const ended = asFields(value).ended;
    if (typeof ended === 'number') {
      index[session] = { ended };
    }
  }
  return index;
}

/** 目録を書く。置き場が無ければ作る */
function writeIndex(place: Place, index: CursorIndex): void {
  mkdirSync(place.dir, { recursive: true });
  writeFileSync(join(place.dir, CURSOR_FILE), JSON.stringify(index));
}

/** その session が最後に渡した時刻。欄が無ければ undefined（未読は全部） */
export function readCursor(place: Place, session: string): Cursor | undefined {
  return readIndex(place)[session];
}

/**
 * 古い欄を消す。`ended` が `at` から `keepDays` 日より前の session の欄を落とす。
 *
 * 残す側（ちょうど `keepDays` 日前）は消さない。目録に欄が残っていても、記録が窓の外に行けば
 * 未読にはならないので、これは置き場を小さく保つ掃除でしかない。
 */
export function pruneCursors(place: Place, at: Date, keepDays: number): void {
  const index = readIndex(place);
  const threshold = at.getTime() - keepDays * 24 * 60 * 60 * 1000;
  let changed = false;
  for (const [session, cursor] of Object.entries(index)) {
    if (cursor.ended < threshold) {
      delete index[session];
      changed = true;
    }
  }
  if (changed) {
    writeIndex(place, index);
  }
}

/**
 * まだ渡していない完了の行を、古い順に返す。
 *
 * 印の無い `notice` 付きの終わりの行だけ。古い目録の `ended` 以下は渡し済みとみなす
 * （直す前に書かれた `notice` 行のため）。新しい印は記録の行（`delivered`）で見る。
 */
export function pendingReports(
  place: Place,
  scope: ReadScope & { readonly session: string },
): RunRecord[] {
  const cursor = readCursor(place, scope.session);
  const records = readRuns(place, scope);
  const delivered = deliveredKeys(records);
  return records.filter((record) => {
    if (!isWaiting(record, delivered)) {
      return false;
    }
    if (cursor !== undefined && (record.ended ?? Number.POSITIVE_INFINITY) <= cursor.ended) {
      return false;
    }
    return true;
  });
}

/**
 * 渡した印を、記録に 1 行足す。
 *
 * 同じ走行（`session` と `subagent` と `started`）の印として読めるよう、走行を指す 3 つを
 * 写し、`delivered` に時刻を入れる。`at` を渡せばその日の file に書き、その時刻を印にする。
 */
export function appendDelivered(place: Place, record: RunRecord, at?: Date): void {
  const now = at ?? new Date();
  appendRun(
    place,
    {
      session: record.session,
      subagent: record.subagent,
      role: record.role,
      pid: record.pid,
      started: record.started,
      delivered: now.getTime(),
    },
    now,
  );
}
