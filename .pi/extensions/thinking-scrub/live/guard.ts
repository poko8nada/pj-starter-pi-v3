/**
 * 生成中の thinking を止める番人。純関数だけを置く。
 *
 * `observe` は末尾の窓だけを見て、文の周期があれば止める。
 * `takeFollowUp` は止めた見本を 1 回だけ渡す。
 */

import type { LiveTuning, SentenceTuning } from '../settings/schema.ts';
import { detectUnitRuns, sampleOf, splitUnits } from '../scrub/units.ts';

export interface Guard {
  readonly aborts: number;
  readonly scanned: number;
  readonly pending: string | null;
}

export type GuardStep =
  | { readonly kind: 'idle'; readonly guard: Guard }
  | { readonly kind: 'stop'; readonly guard: Guard; readonly sample: string };

/** 何も見ていない番人 */
export function emptyGuard(): Guard {
  return { aborts: 0, scanned: 0, pending: null };
}

/** 新しい user の合図で論理 run をやり直す */
export function resetOnUser(guard: Guard): Guard {
  void guard;
  return emptyGuard();
}

/** 止めた見本を 1 回だけ取り出す */
export function takeFollowUp(
  guard: Guard,
): { readonly guard: Guard; readonly sample: string } | undefined {
  if (guard.pending === null) {
    return undefined;
  }
  return { guard: { ...guard, pending: null }, sample: guard.pending };
}

/** フォローアップの文。見本は `sampleChars` で切る */
export function followUpText(sample: string, sampleChars: number): string {
  const cut = sample.length > sampleChars ? sample.slice(0, sampleChars) : sample;
  return `Your thinking is repeating the same sentences. Do not repeat them. Continue the task without repeating the loop.\n\nRepeating sample:\n${cut}`;
}

/** thinking を見て、止めるか素通りするか決める */
export function observe(
  guard: Guard,
  thinking: string,
  live: LiveTuning,
  sentence: SentenceTuning,
): GuardStep {
  let effective = guard.scanned;
  if (thinking.length < effective) {
    effective = 0;
  }
  if (thinking.length < live.minThinking) {
    return { kind: 'idle', guard: { ...guard, scanned: effective } };
  }
  if (guard.aborts >= live.maxAborts) {
    return { kind: 'idle', guard: { ...guard, scanned: effective } };
  }
  if (thinking.length - effective < live.scanEvery) {
    return { kind: 'idle', guard: { ...guard, scanned: effective } };
  }
  const tailText = thinking.slice(-live.tail);
  const units = splitUnits(tailText);
  const runs = detectUnitRuns(units, sentence);
  if (runs.length === 0) {
    return { kind: 'idle', guard: { ...guard, scanned: thinking.length } };
  }
  const first = runs[0];
  if (first === undefined) {
    return { kind: 'idle', guard: { ...guard, scanned: thinking.length } };
  }
  const sample = sampleOf(units, first, live.sampleChars);
  return {
    kind: 'stop',
    guard: { aborts: guard.aborts + 1, scanned: thinking.length, pending: sample },
    sample,
  };
}
