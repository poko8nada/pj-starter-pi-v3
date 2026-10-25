/**
 * 適用前の stale 判定。session・leaf・firstKept・新しい compaction を見る。
 */
import type { GuardInput, GuardResult } from './types.ts';

/** 準備の印が今も使えるかを見る。古ければ理由を返す */
export function guard(input: GuardInput): GuardResult {
  if (input.stamp.sessionId !== input.currentSessionId) {
    return { kind: 'stale', reason: 'session-changed' };
  }
  if (!input.branch.some((entry) => entry.id === input.stamp.leafId)) {
    return { kind: 'stale', reason: 'leaf-not-on-branch' };
  }
  if (!input.branch.some((entry) => entry.id === input.firstKeptEntryId)) {
    return { kind: 'stale', reason: 'first-kept-missing' };
  }
  if (input.latestCompactionId !== input.stamp.latestCompactionId) {
    return { kind: 'stale', reason: 'new-compaction' };
  }
  return { kind: 'ok' };
}
