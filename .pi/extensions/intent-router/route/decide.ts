/**
 * `before_agent_start` の判定と文面。純関数だけを置く。3 択（reply / approve / other）。
 */

import type { Answer } from '../ask/ask.ts';
import type { Choice } from '../ask/questions.ts';
import type { Settings } from '../settings/schema.ts';

export type RouteDecision =
  | { readonly kind: 'act'; readonly choice: 'reply' | 'approve'; readonly confidence: number }
  | { readonly kind: 'idle'; readonly choice: Choice; readonly confidence: number }
  | { readonly kind: 'skip'; readonly reason: string };

function toChoice(choice: string): Choice | undefined {
  if (choice === 'reply' || choice === 'approve' || choice === 'other') {
    return choice;
  }
  return undefined;
}

/** 閾値は選択肢ごと。`reply` 0.8、`approve` 0.8、`other` は idle。閾値は `>=` */
export function decideRoute(answer: Answer, settings: Settings): RouteDecision {
  if (answer.type !== 'choice') {
    return { kind: 'skip', reason: 'expected a choice answer' };
  }
  const choice = toChoice(answer.choice);
  if (choice === undefined) {
    return { kind: 'skip', reason: `unknown choice: ${answer.choice}` };
  }
  if (choice === 'other') {
    return { kind: 'idle', choice, confidence: answer.confidence };
  }
  const threshold = settings.route.thresholds[choice];
  if (answer.confidence >= threshold) {
    return { kind: 'act', choice, confidence: answer.confidence };
  }
  return { kind: 'idle', choice, confidence: answer.confidence };
}

/** `{prompt}` を抜粋で埋める。抜粋は改行を 1 つの空白に潰して 40 字まで */
export function guideText(settings: Settings, choice: 'reply' | 'approve', prompt: string): string {
  const excerpt = prompt.replace(/\s*\r?\n\s*/g, ' ').slice(0, 40);
  return settings.route.guides[choice].split('{prompt}').join(excerpt);
}
