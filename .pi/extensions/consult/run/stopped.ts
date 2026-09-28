/**
 * 止まった子の記録を、worktree の外（親ディレクトリ）に置く。
 *
 * worktree を消しても記録が残るようにするため、また子に書かせないため。子はターンやトークンの上限で止まるので、
 * 記録を整える余裕はない。置き場は worktree の親で、`wt` の中ではない。
 */
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import type { Worktree } from './run.ts';

export interface StoppedRecord {
  /** 落ちた検査の出力 */
  readonly reason: string;
  /** 子が変えたファイル */
  readonly files: readonly string[];
  /** 何回目で止まったか */
  readonly attempts: number;
  /** 止まった時刻（ISO） */
  readonly stoppedAt: string;
}

const FILE = 'stopped.json';

export function stoppedPath(worktree: Worktree): string {
  return join(worktree.parent, FILE);
}

export function writeStopped(worktree: Worktree, record: StoppedRecord): void {
  writeFileSync(stoppedPath(worktree), `${JSON.stringify(record, null, 2)}\n`, 'utf8');
}

/** 読み取れた分だけを組み立てて返す。形が違えば undefined（壊れた記録で親を止めない） */
export function readStopped(worktree: Worktree): StoppedRecord | undefined {
  const path = stoppedPath(worktree);
  if (!existsSync(path)) {
    return undefined;
  }
  let parsed: unknown;
  try {
    parsed = JSON.parse(readFileSync(path, 'utf8'));
  } catch {
    // 途中で切れた記録。親を止めない
    return undefined;
  }
  if (typeof parsed !== 'object' || parsed === null) {
    return undefined;
  }
  if (!('reason' in parsed) || !('files' in parsed)) {
    return undefined;
  }
  if (!('attempts' in parsed) || !('stoppedAt' in parsed)) {
    return undefined;
  }
  const { reason, files, attempts, stoppedAt } = parsed;
  if (typeof reason !== 'string' || typeof attempts !== 'number' || typeof stoppedAt !== 'string') {
    return undefined;
  }
  if (!Array.isArray(files)) {
    return undefined;
  }
  const paths = files.filter((entry): entry is string => typeof entry === 'string');
  if (paths.length !== files.length) {
    return undefined;
  }
  return { reason, files: paths, attempts, stoppedAt };
}
