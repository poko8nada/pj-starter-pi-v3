/**
 * 生成中の thinking を止めるガードである。純粋関数だけを置く。
 *
 * `observe` は末尾のウィンドウだけを見て、文の周期があれば止める。
 * `takeFollowUp` は止めた後のフォローアップを 1 回だけ取り出す。
 */

import type { Tuning } from '../settings/schema.ts';
import { detectUnitRuns, splitUnits } from '../scrub/units.ts';

export interface Guard {
  readonly aborts: number;
  readonly scanned: number;
  readonly pending: boolean;
}

export type GuardStep =
  | { readonly kind: 'idle'; readonly guard: Guard }
  | { readonly kind: 'stop'; readonly guard: Guard };

/** 何も見ていないガードである。 */
export function emptyGuard(): Guard {
  return { aborts: 0, scanned: 0, pending: false };
}

/** 新しい user の合図で論理的なランをやり直す。 */
export function resetOnUser(): Guard {
  return emptyGuard();
}

/** 止めた後のフォローアップを 1 回だけ取り出す。 */
export function takeFollowUp(guard: Guard): Guard | undefined {
  if (!guard.pending) {
    return undefined;
  }
  return { ...guard, pending: false };
}

export const FOLLOWUP_TEXT =
  'Your thinking was repeating the same sentences, so this turn was stopped. Do not continue that repetition.\n\nNext: name the next concrete step in one sentence, then do it. If you are blocked, say what is blocking you in one sentence.';

/** thinking を見て、止めるかそのまま通すかを決める。 */
export function observe(
  guard: Guard,
  thinking: string,
  tuning: Tuning,
  enabled: () => boolean,
): GuardStep {
  const live = tuning.live;
  const sentence = tuning.sentence;
  let effective = guard.scanned;
  if (thinking.length < effective) {
    effective = 0;
  }
  if (thinking.length < live.minThinking) {
    return { kind: 'idle', guard: { ...guard, scanned: effective } };
  }
  if (guard.aborts >= live.maxAborts) {
    return { kind: 'idle', guard: { ...guard, scanned: thinking.length } };
  }
  if (thinking.length - effective < live.scanEvery) {
    return { kind: 'idle', guard: { ...guard, scanned: effective } };
  }
  if (!enabled()) {
    return { kind: 'idle', guard: { ...guard, scanned: thinking.length } };
  }
  const tailText = thinking.slice(-live.tail);
  const units = splitUnits(tailText);
  const runs = detectUnitRuns(units, sentence);
  if (runs.length === 0) {
    return { kind: 'idle', guard: { ...guard, scanned: thinking.length } };
  }
  return {
    kind: 'stop',
    guard: { aborts: guard.aborts + 1, scanned: thinking.length, pending: true },
  };
}
