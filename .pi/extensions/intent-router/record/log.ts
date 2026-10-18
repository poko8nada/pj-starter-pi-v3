/**
 * 判定と差し込みの記録。日ごとの 1 ファイル（`logs/<YYYY-MM-DD>.jsonl`）に足していく。
 *
 * 記録するのは ask した時だけ。聞く前にやめた場合（`/` 始まり・道具0件・
 * 助走・間隔・上限・`read` 空）は行を作らない（作る側の責任）。
 *
 * 日付は `record.at` の JST（UTC+9）の暦日から取る。機械の時計の地域にはよらない。
 */

import { appendFileSync, mkdirSync, readdirSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import type { Choice, Verdict } from '../ask/questions.ts';

export interface IntentRecord {
  readonly at: string;
  readonly hook: 'route' | 'judge';
  readonly owner_now: string;
  readonly agent_prev: string | null;
  readonly choice: Choice | null;
  readonly confidence: number | null;
  readonly threshold: number | null;
  readonly guide: string | null;
  readonly verdicts: { readonly related: Verdict; readonly answerable: Verdict } | null;
  readonly unrelated: number | null;
  readonly nudge: string | null;
  readonly fired: boolean;
  /** 渡した state を JSON にしたときの字数（切った後） */
  readonly state_chars: number;
  /** 渡す前に切ったかどうか */
  readonly truncated: boolean;
}

function pad(value: number): string {
  return String(value).padStart(2, '0');
}

/** JST の暦日を取り出す。`getFullYear` 系は機械の地域によるので使わない */
function jstParts(at: Date): {
  readonly year: number;
  readonly month: number;
  readonly day: number;
} {
  const jst = new Date(at.getTime() + 9 * 60 * 60 * 1000);
  return {
    year: jst.getUTCFullYear(),
    month: jst.getUTCMonth() + 1,
    day: jst.getUTCDate(),
  };
}

/** `logs/<YYYY-MM-DD>.jsonl`。日付は `at` の JST の暦日 */
export function logPath(dir: string, at: Date): string {
  const parts = jstParts(at);
  return join(dir, `${parts.year}-${pad(parts.month)}-${pad(parts.day)}.jsonl`);
}

/** その日のファイルの末尾に 1 行足す。切り詰めない。ディレクトリが無ければ作る */
export function append(record: IntentRecord, dir: string): void {
  mkdirSync(dir, { recursive: true });
  const file = logPath(dir, new Date(record.at));
  appendFileSync(file, `${JSON.stringify(record)}\n`, 'utf8');
}

const DAY_FILE = /^(\d{4})-(\d{2})-(\d{2})\.jsonl$/;

/** JST の暦日を 1 日の始まり（UTC の時刻）に直す */
function jstDayStart(at: Date): number {
  const parts = jstParts(at);
  return Date.UTC(parts.year, parts.month - 1, parts.day);
}

/** `YYYY-MM-DD.jsonl` の名前だけを見て、`keepDays` より古い日付のファイルを消す。消した数を返す */
export function prune(dir: string, keepDays: number, at: Date): number {
  let names: string[];
  try {
    names = readdirSync(dir);
  } catch {
    return 0;
  }
  const atDay = jstDayStart(at);
  let removed = 0;
  for (const name of names) {
    const match = DAY_FILE.exec(name);
    if (match === null) {
      continue;
    }
    const year = Number(match[1]);
    const month = Number(match[2]);
    const day = Number(match[3]);
    const fileDay = Date.UTC(year, month - 1, day);
    const diffDays = Math.round((atDay - fileDay) / 86400000);
    if (diffDays > keepDays) {
      rmSync(join(dir, name));
      removed += 1;
    }
  }
  return removed;
}
