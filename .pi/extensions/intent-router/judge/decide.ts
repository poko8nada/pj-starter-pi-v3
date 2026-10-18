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
  | { readonly kind: 'nudge'; readonly why: 'unrelated' | 'answerable'; readonly unrelated: number }
  | { readonly kind: 'wait'; readonly reason: string; readonly unrelated: number };

function verdictOf(answer: Answer): 'yes' | 'no' | undefined {
  if (answer.type !== 'choice') {
    return undefined;
  }
  if (answer.choice === 'yes' || answer.choice === 'no') {
    return answer.choice;
  }
  return undefined;
}

/** `related`がnoで合計が`stop.unrelated`に届いた、または`answerable`がyesなら促す。閾値を通った答えだけ数える */
export function decideJudge(
  answers: JudgeAnswers,
  settings: Settings,
  priorUnrelated: number,
): JudgeDecision {
  const threshold = settings.judge.threshold;
  const relatedPass = answers.related.confidence >= threshold;
  const answerablePass = answers.answerable.confidence >= threshold;
  const related = relatedPass ? verdictOf(answers.related) : undefined;
  const answerable = answerablePass ? verdictOf(answers.answerable) : undefined;
  if (related === undefined && answerable === undefined) {
    if (!relatedPass || !answerablePass) {
      return { kind: 'wait', reason: 'low confidence', unrelated: priorUnrelated };
    }
    return { kind: 'wait', reason: 'expected yes/no answers', unrelated: priorUnrelated };
  }
  if (answerable === 'yes') {
    const next = related === 'no' ? priorUnrelated + 1 : priorUnrelated;
    return { kind: 'nudge', why: 'answerable', unrelated: next };
  }
  if (related === 'no') {
    const next = priorUnrelated + 1;
    if (next >= settings.judge.stop.unrelated) {
      return { kind: 'nudge', why: 'unrelated', unrelated: next };
    }
    return { kind: 'wait', reason: 'unrelated count', unrelated: next };
  }
  if (!relatedPass || !answerablePass) {
    return { kind: 'wait', reason: 'low confidence', unrelated: priorUnrelated };
  }
  if (related === undefined || answerable === undefined) {
    return { kind: 'wait', reason: 'expected yes/no answers', unrelated: priorUnrelated };
  }
  return { kind: 'wait', reason: 'related', unrelated: priorUnrelated };
}

/** 判定を出す番か。助走・間隔・上限を見る。`reply`の往復だけ走る。道具の有無は見ない */
export function due(
  run: Run,
  settings: Settings,
  now: number,
): { readonly kind: 'due' } | { readonly kind: 'wait'; readonly reason: string } {
  if (run.kind !== 'armed') {
    return { kind: 'wait', reason: 'not armed' };
  }
  if (run.choice !== 'reply') {
    return { kind: 'wait', reason: 'not reply' };
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
