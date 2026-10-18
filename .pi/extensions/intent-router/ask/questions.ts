/**
 * intent-router の問い。頭は 1 問（`expect`）、途中は 2 問（`useful` / `new`）。
 *
 * 旧ラベル（`Label`）は段階移行のため残す。新しい判定は `Choice` を使う。
 */

import type { Choice, Question } from '../settings/schema.ts';

export type { Choice, Verdict } from '../settings/schema.ts';

export const ROUTE_QUESTION = 'expect' as const;
export const JUDGE_QUESTIONS = { useful: 'useful', new: 'new' } as const;

export function choicesOf<K extends string>(question: Question<K>): readonly K[] {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion -- criteria のキーが K であることは呼び出し側が保証する
  return Object.keys(question.criteria) as K[];
}

// 旧来のラベルと問い。ask の旧道と既存テストの移行が終わるまで残す。
export type Label = 'question' | 'design' | 'verify' | 'permission' | 'chat' | 'unknown';

export const LABELS: readonly Label[] = [
  'question',
  'design',
  'verify',
  'permission',
  'chat',
  'unknown',
];

export const CHOICES: readonly Choice[] = ['reply', 'approve', 'other'];

/** pi の classifier が受ける choice の質問の形（`ClassifierContext.questions` の1件） */
export interface ClassifierChoiceQuestion {
  readonly type: 'choice';
  readonly instructions: string;
  readonly criteria: Record<string, string>;
}

/** pi の classifier が受ける score の質問の形（旧道。ask が内部に写しを持つ） */
export interface ClassifierScoreQuestion {
  readonly type: 'score';
  readonly instructions: string;
  readonly criteria: string[];
}

export const JUDGE_QUESTION: ClassifierScoreQuestion = {
  type: 'score',
  instructions:
    'How ready is the investigation to answer the owner question? Rate the investigation state.',
  criteria: [
    '0: almost nothing has been investigated yet; answering now would be a guess',
    '1: partly investigated; key evidence is still missing',
    '2: enough has been investigated to answer; stop investigating and answer from what is known',
  ],
};
