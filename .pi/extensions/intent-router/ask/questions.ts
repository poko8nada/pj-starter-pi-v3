/**
 * intent-router の問い。頭は 1 問（`expect`）、途中は 2 問（`related` / `answerable`）。
 */

import type { Question } from '../settings/schema.ts';

export type { Choice, Verdict } from '../settings/schema.ts';

export const ROUTE_QUESTION = 'expect' as const;
export const JUDGE_QUESTIONS = { related: 'related', answerable: 'answerable' } as const;

export function choicesOf<K extends string>(question: Question<K>): readonly K[] {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion -- criteria のキーが K であることは呼び出し側が保証する
  return Object.keys(question.criteria) as K[];
}
