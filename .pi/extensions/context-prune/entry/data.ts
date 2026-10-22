/**
 * パスの記録。custom エントリに積み、文脈には入れない。カードと差し込みが読む。
 */

import type { SessionEntry } from '@earendil-works/pi-coding-agent';

export interface Usage {
  readonly input: number;
  readonly output: number;
  readonly cost: number;
}

export const CUSTOM_TYPE = 'context-prune';

export interface Drop {
  readonly id: string;
  readonly chars: number;
}

export interface PrunePass {
  readonly at: number;
  readonly tokensBefore: number;
  /** 落とした結果の見積もり。tokensBefore から引くと、落とした後の値になる */
  readonly droppedTokens: number;
  readonly summary: string;
  readonly dropped: readonly Drop[];
  readonly droppedChars: number;
  readonly kept: number;
  readonly latencyMs: number;
  readonly usage: Usage | undefined;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isUsage(value: unknown): value is Usage {
  return (
    isRecord(value) &&
    typeof value['input'] === 'number' &&
    typeof value['output'] === 'number' &&
    typeof value['cost'] === 'number'
  );
}

function isDrop(value: unknown): value is Drop {
  if (!isRecord(value) || typeof value['id'] !== 'string') {
    return false;
  }
  const chars: unknown = value['chars'];
  if (typeof chars !== 'number' || !Number.isFinite(chars)) {
    return false;
  }
  return chars >= 0;
}

/** パスの形かどうか。壊れていれば偽 */
export function isPrunePass(value: unknown): value is PrunePass {
  if (!isRecord(value)) {
    return false;
  }
  if (typeof value['at'] !== 'number' || typeof value['tokensBefore'] !== 'number') {
    return false;
  }
  if (
    typeof value['droppedTokens'] !== 'number' ||
    !Number.isFinite(value['droppedTokens']) ||
    value['droppedTokens'] < 0
  ) {
    return false;
  }
  if (typeof value['summary'] !== 'string') {
    return false;
  }
  if (!Array.isArray(value['dropped']) || !value['dropped'].every(isDrop)) {
    return false;
  }
  if (typeof value['droppedChars'] !== 'number' || typeof value['kept'] !== 'number') {
    return false;
  }
  if (typeof value['latencyMs'] !== 'number') {
    return false;
  }
  if (value['usage'] !== undefined && !isUsage(value['usage'])) {
    return false;
  }
  return true;
}

/** custom エントリの中から context-prune のパスをエントリの順に集める */
export function passesOf(entries: readonly SessionEntry[]): readonly PrunePass[] {
  const passes: PrunePass[] = [];
  for (const entry of entries) {
    if (entry.type !== 'custom' || entry.customType !== CUSTOM_TYPE) {
      continue;
    }
    if (isPrunePass(entry.data)) {
      passes.push(entry.data);
    }
  }
  return passes;
}
