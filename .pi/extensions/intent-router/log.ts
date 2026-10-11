/**
 * 判定と差し込みの記録。1行1件の JSONL を日ごとに置く。
 *
 * 記録するのは ask した時だけ。聞く前にやめた場合（off・`/` 始まり・道具0件・
 * 助走・間隔・上限）は行を作らない（作る側の責任）。
 */

import { mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import type { Label } from './questions.ts';
import type { Thresholds } from './settings.ts';
import type { Usage } from './state.ts';

export type OutcomeView =
  | {
      readonly kind: 'answered';
      readonly provider: string;
      readonly model: string;
      readonly stopReason: 'stop';
      readonly usage: Usage;
      readonly latencyMs: number;
    }
  | {
      readonly kind: 'failed';
      readonly reason: string;
      readonly tried: readonly string[];
      readonly latencyMs: number;
    };

export type LogRecord =
  | {
      readonly at: string;
      readonly hook: 'route';
      readonly owner_prompt: string;
      readonly label: Label | null;
      readonly confidence: number | null;
      readonly probabilities: Readonly<Record<string, number>>;
      readonly thresholds: Thresholds;
      readonly decision: 'act' | 'idle' | 'skip';
      readonly shadow: boolean;
      readonly guide: 'fired' | 'would' | 'none';
      readonly text: string | null;
      readonly truncated: boolean;
      readonly outcome: OutcomeView;
    }
  | {
      readonly at: string;
      readonly hook: 'judge';
      readonly owner_prompt: string;
      readonly label: Label;
      readonly score: number | null;
      readonly confidence: number | null;
      readonly thresholds: Thresholds;
      readonly decision: 'fire' | 'hold';
      readonly shadow: boolean;
      readonly stop: 'fired' | 'would' | 'none';
      readonly text: string | null;
      readonly truncated: boolean;
      readonly turn_index: number;
      readonly outcome: OutcomeView;
    }
  | { readonly at: string; readonly hook: 'command'; readonly enabled: boolean };

function pad(value: number): string {
  return String(value).padStart(2, '0');
}

function dayOf(at: Date): string {
  return `${at.getFullYear()}-${pad(at.getMonth() + 1)}-${pad(at.getDate())}`;
}

export function logPath(dir: string, at: Date): string {
  return join(dir, `${dayOf(at)}.jsonl`);
}

export function append(record: LogRecord, dir: string): void {
  mkdirSync(dir, { recursive: true });
  const file = logPath(dir, new Date(record.at));
  let before = '';
  try {
    before = readFileSync(file, 'utf8');
  } catch {
    before = '';
  }
  const prefix = before === '' || before.endsWith('\n') ? '' : '\n';
  writeFileSync(file, `${before}${prefix}${JSON.stringify(record)}\n`, 'utf8');
}

const DAY_FILE = /^(\d{4})-(\d{2})-(\d{2})\.jsonl$/;

/** 消した数を返す。`YYYY-MM-DD.jsonl` 以外の名前は触らない */
export function prune(dir: string, keepDays: number, at: Date): number {
  let names: string[];
  try {
    names = readdirSync(dir);
  } catch {
    return 0;
  }
  const atDay = new Date(at.getFullYear(), at.getMonth(), at.getDate()).getTime();
  let removed = 0;
  for (const name of names) {
    const match = DAY_FILE.exec(name);
    if (match === null) {
      continue;
    }
    const year = Number(match[1]);
    const month = Number(match[2]);
    const day = Number(match[3]);
    const fileDay = new Date(year, month - 1, day).getTime();
    const diffDays = Math.round((atDay - fileDay) / 86400000);
    if (diffDays > keepDays) {
      rmSync(join(dir, name));
      removed += 1;
    }
  }
  return removed;
}
