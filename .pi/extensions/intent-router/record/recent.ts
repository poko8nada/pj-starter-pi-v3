/**
 * 判定と差し込みの記録。1 つのファイル（`logs/recent.json`）に直近だけ持つ。
 *
 * 記録するのは ask した時だけ。聞く前にやめた場合（`/` 始まり・道具0件・
 * 助走・間隔・上限・`latest` 空）は行を作らない（作る側の責任）。
 */

import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname } from 'node:path';
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
  readonly verdicts: { readonly useful: Verdict; readonly new: Verdict } | null;
  readonly streak: number | null;
  readonly nudge: string | null;
  readonly fired: boolean;
}

function readAll(file: string): IntentRecord[] {
  let text: string;
  try {
    text = readFileSync(file, 'utf8');
  } catch (error) {
    if (
      typeof error === 'object' &&
      error !== null &&
      'code' in error &&
      (error as { code?: unknown }).code === 'ENOENT'
    ) {
      return [];
    }
    throw error;
  }
  if (text.trim() === '') {
    return [];
  }
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    return [];
  }
  if (!Array.isArray(parsed)) {
    return [];
  }
  return parsed.filter(
    (item): item is IntentRecord => typeof item === 'object' && item !== null && 'at' in item,
  );
}

function writeAll(file: string, records: readonly IntentRecord[]): void {
  mkdirSync(dirname(file), { recursive: true });
  writeFileSync(file, `${JSON.stringify([...records])}\n`, 'utf8');
}

/** 直近 `limit` 件だけを 1 ファイルに持つ。書き込みは上書き、読むのは `tail` から */
export function createRecent(
  limit: number,
  file: string,
): {
  readonly add: (record: IntentRecord) => void;
  readonly tail: (count: number) => readonly IntentRecord[];
} {
  const take = Math.max(1, Math.floor(limit));
  return {
    add: (record: IntentRecord): void => {
      const kept = [...readAll(file), record];
      writeAll(file, kept.length > take ? kept.slice(kept.length - take) : kept);
    },
    tail: (count: number): readonly IntentRecord[] => {
      const all = readAll(file);
      const n = Math.max(0, Math.floor(count));
      return n >= all.length ? all : all.slice(all.length - n);
    },
  };
}
