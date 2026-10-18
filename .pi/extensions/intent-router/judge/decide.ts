/**
 * `turn_end` の判定。2 問（`related` / `answerable`）で効いていないかを見る。純関数だけを置く。
 */

import type { Answer } from '../ask/ask.ts';
import type { Settings } from '../settings/schema.ts';
import type { Run } from '../state/run.ts';

export interface JudgeAnswers {
  readonly related: Answer;
  readonly answerable: Answer;
}

export type JudgeDecision =
  | { readonly kind: 'nudge'; readonly streak: number }
  | { readonly kind: 'wait'; readonly streak: number; readonly reason: string };

function verdictOf(answer: Answer): 'yes' | 'no' | undefined {
  if (answer.type !== 'choice') {
    return undefined;
  }
  if (answer.choice === 'yes' || answer.choice === 'no') {
    return answer.choice;
  }
  return undefined;
}

/** 両方が閾値以上で、どちらかが「効いていない」なら unhelpful */
export function decideJudge(answers: JudgeAnswers, settings: Settings): JudgeDecision {
  const threshold = settings.judge.threshold;
  if (answers.related.confidence < threshold || answers.answerable.confidence < threshold) {
    return { kind: 'wait', streak: 0, reason: 'low confidence' };
  }
  const related = verdictOf(answers.related);
  const answerable = verdictOf(answers.answerable);
  if (related === undefined || answerable === undefined) {
    return { kind: 'wait', streak: 0, reason: 'expected yes/no answers' };
  }
  if (related === 'no' || answerable === 'no') {
    return { kind: 'nudge', streak: 1 };
  }
  return { kind: 'wait', streak: 0, reason: 'helpful' };
}

/** 判定を出す番か。助走・間隔・上限を見る。道具の有無は見ない */
export function due(
  run: Run,
  settings: Settings,
  now: number,
): { readonly kind: 'due' } | { readonly kind: 'wait'; readonly reason: string } {
  if (run.kind !== 'armed') {
    return { kind: 'wait', reason: 'not armed' };
  }
  if (run.judgements >= settings.judge.maxJudgements) {
    return { kind: 'wait', reason: 'judgement budget reached' };
  }
  const nextTurns = run.turns + 1;
  if (nextTurns < settings.judge.minTurns) {
    return { kind: 'wait', reason: 'warming up' };
  }
  if (nextTurns % settings.judge.everyNTurns !== 0) {
    return { kind: 'wait', reason: 'interval' };
  }
  if (run.lastJudgedAt !== null && now - run.lastJudgedAt < 0) {
    return { kind: 'wait', reason: 'too soon' };
  }
  if (run.nudges >= settings.judge.stop.maxNudges && settings.judge.stop.maxNudges > 0) {
    return { kind: 'wait', reason: 'already nudged' };
  }
  return { kind: 'due' };
}

export function nudgeText(settings: Settings, _choice: 'reply' | 'approve'): string {
  return settings.judge.stop.nudge;
}
