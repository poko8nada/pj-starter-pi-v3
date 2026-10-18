/**
 * `turn_end` の判定。純関数だけを置く。
 */

import type { Answer } from '../ask/ask.ts';
import type { Label } from '../ask/questions.ts';
import type { Settings, Thresholds } from '../settings/schema.ts';
import type { Run } from '../state/run.ts';

export type JudgeDecision =
  | { readonly kind: 'fire'; readonly score: number; readonly confidence: number }
  | { readonly kind: 'hold'; readonly score: number; readonly confidence: number }
  | { readonly kind: 'skip'; readonly reason: string };

/** score と confidence の**両方**が閾値以上（`>=`）で fire。score の答えでなければ skip */
export function decideJudge(answer: Answer, thresholds: Thresholds): JudgeDecision {
  if (answer.type !== 'score') {
    return { kind: 'skip', reason: 'expected a score answer' };
  }
  if (answer.score >= thresholds.judgeScore && answer.confidence >= thresholds.judgeConfidence) {
    return { kind: 'fire', score: answer.score, confidence: answer.confidence };
  }
  return { kind: 'hold', score: answer.score, confidence: answer.confidence };
}

/** 判定を出す番か。助走・間隔・間隔の連続・上限・撃ち数を見る。道具の有無は見ない */
export function due(
  run: Run,
  settings: Settings,
  now: number,
): { readonly kind: 'due' } | { readonly kind: 'wait'; readonly reason: string } {
  if (run.kind !== 'armed') {
    return { kind: 'wait', reason: 'not armed' };
  }
  if (run.fires >= settings.judge.maxFires) {
    return { kind: 'wait', reason: 'already fired' };
  }
  if (run.judgements >= settings.budget.maxJudgementsPerPrompt) {
    return { kind: 'wait', reason: 'judgement budget reached' };
  }
  if (run.turns < settings.judge.minTurns) {
    return { kind: 'wait', reason: 'warming up' };
  }
  if (run.turns % settings.judge.everyNTurns !== 0) {
    return { kind: 'wait', reason: 'interval' };
  }
  if (run.lastJudgedAt !== null && now - run.lastJudgedAt < settings.budget.minIntervalMs) {
    return { kind: 'wait', reason: 'too soon' };
  }
  return { kind: 'due' };
}

export function stopMessage(template: string, label: Label): string {
  return template.split('{label}').join(label);
}
