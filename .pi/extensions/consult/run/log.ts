/**
 * consult の実行記録。
 *
 * 1 回の子の起動を 1 行の JSON として `<root>/<unit-id>/log.jsonl` に足す。親のセッションが reload で
 * 差し替わっても、新しいインスタンスはこれを読めば前の子を思い出せる（子は親のプロセスに従属しない）。
 *
 * unit を持たない子（読むだけのロールで worktree を省いた物）は `_parent` に置く。unit が無い子にも
 * 記録の置き場が要るため。
 *
 * 追記は 1 行単位。途中で落ちても、その前の行は残る。読む側は壊れた行を飛ばす。
 */

import { appendFileSync, mkdirSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import type { ChildState } from './run.ts';

/** unit を持たない子の置き場の名前 */
export const PARENT_UNIT = '_parent';

/** 子 1 体の 1 回の記録。終わりの欄は、走っている間は無い */
export interface RunRecord {
  /** 親が振った id（`consult-1` など） */
  readonly child: string;
  readonly role: string;
  /** worktree の id。親の木で走った子（読むだけ）には無い */
  readonly worktree?: string;
  readonly pid: number;
  /** 始まった時刻（ms） */
  readonly started: number;
  /** 終わった時刻（ms）。走っている間は無い */
  readonly ended?: number;
  readonly state?: ChildState;
  readonly reason?: string;
  readonly files?: readonly string[];
  readonly turns?: number;
  readonly spend?: string;
  /** 届け先のセッションが無かったときの、完了の知らせ。次に起動したセッションが読む */
  readonly notice?: string;
}

/** 記録を置く unit の名前。worktree が無ければ親の木を指す固定の名前 */
export function unitOf(worktree: string | undefined): string {
  return worktree ?? PARENT_UNIT;
}

/** 記録のファイル。unit のディレクトリごとに 1 つ */
export function logPath(root: string, unit: string): string {
  return join(root, unit, 'log.jsonl');
}

/** 1 行足す。unit のディレクトリが無ければ作る */
export function appendRun(root: string, record: RunRecord): void {
  const file = logPath(root, unitOf(record.worktree));
  mkdirSync(join(root, unitOf(record.worktree)), { recursive: true });
  appendFileSync(file, `${JSON.stringify(record)}\n`);
}

/**
 * 生存確認。
 *
 * シグナル 0 は「送らずに送れるかだけ見る」。投げなければ生きている。権限が無い場合も投げるので、
 * 別のユーザーのプロセスは「死んでいる」と見える（自分の子しか見ないので、これで足りる）。
 */
export function pidAlive(pid: number): boolean {
  if (!Number.isInteger(pid) || pid <= 0) {
    return false;
  }
  try {
    process.kill(pid, 0);
    return true;
  } catch {
    return false;
  }
}

/**
 * 1 行を記録にする。壊れた行（JSON でない・形が違う）は undefined。
 *
 * 型を書いた枠に 1 回だけ入れてから見る（`any` を各所に持ち回らない）。
 */
export function parseRun(line: string): RunRecord | undefined {
  const text = line.trim();
  if (text === '') {
    return undefined;
  }
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    return undefined;
  }
  const fields = asFields(parsed);
  const { child, role, pid, started } = fields;
  if (typeof child !== 'string' || typeof role !== 'string' || typeof pid !== 'number') {
    return undefined;
  }
  if (typeof started !== 'number') {
    return undefined;
  }
  return {
    child,
    role,
    pid,
    started,
    ...(typeof fields.worktree === 'string' ? { worktree: fields.worktree } : {}),
    ...(typeof fields.ended === 'number' ? { ended: fields.ended } : {}),
    ...(isState(fields.state) ? { state: fields.state } : {}),
    ...(typeof fields.reason === 'string' ? { reason: fields.reason } : {}),
    ...(isPaths(fields.files) ? { files: fields.files } : {}),
    ...(typeof fields.turns === 'number' ? { turns: fields.turns } : {}),
    ...(typeof fields.spend === 'string' ? { spend: fields.spend } : {}),
    ...(typeof fields.notice === 'string' ? { notice: fields.notice } : {}),
  };
}

/** 素の object を、欄だけを持つ枠として見る（`child/spec.ts` の `asEvent` と同じ形） */
function asFields(raw: unknown): Record<string, unknown> {
  return typeof raw === 'object' && raw !== null ? { ...raw } : {};
}

/** 終わり方の 4 つのどれかか */
function isState(value: unknown): value is ChildState {
  return value === 'done' || value === 'turn-limit' || value === 'error' || value === 'aborted';
}

/** パスの配列か */
function isPaths(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((path) => typeof path === 'string');
}

/** root にある全部の unit の記録を、始まった順に返す */
export function readRuns(root: string): RunRecord[] {
  let units: string[];
  try {
    units = readdirSync(root);
  } catch {
    return [];
  }
  const records: RunRecord[] = [];
  for (const unit of units) {
    let text: string;
    try {
      text = readFileSync(logPath(root, unit), 'utf8');
    } catch {
      continue;
    }
    for (const line of text.split('\n')) {
      const record = parseRun(line);
      if (record !== undefined) {
        records.push(record);
      }
    }
  }
  return records.toSorted((left, right) => left.started - right.started);
}
