/**
 * `before_agent_start` の判定と文面。純関数だけを置く。
 */

import type { Answer } from '../ask/ask.ts';
import type { Label } from '../ask/questions.ts';
import type { Thresholds } from '../settings/schema.ts';

export type RouteDecision =
  | { readonly kind: 'act'; readonly label: Label; readonly confidence: number }
  | { readonly kind: 'idle'; readonly label: Label; readonly confidence: number }
  | { readonly kind: 'skip'; readonly reason: string };

function toLabel(choice: string): Label | undefined {
  if (choice === 'question') {
    return 'question';
  }
  if (choice === 'design') {
    return 'design';
  }
  if (choice === 'verify') {
    return 'verify';
  }
  if (choice === 'permission') {
    return 'permission';
  }
  if (choice === 'chat') {
    return 'chat';
  }
  if (choice === 'unknown') {
    return 'unknown';
  }
  return undefined;
}

/** 閾値は `>=`。actOn に無いラベルは idle */
export function decideRoute(
  answer: Answer,
  thresholds: Thresholds,
  actOn: readonly Label[],
  idleOn: readonly Label[],
): RouteDecision {
  if (answer.type !== 'choice') {
    return { kind: 'skip', reason: 'expected a choice answer' };
  }
  const label = toLabel(answer.choice);
  if (label === undefined) {
    return { kind: 'skip', reason: `unknown label: ${answer.choice}` };
  }
  if (actOn.includes(label)) {
    if (answer.confidence >= thresholds.routeConfidence) {
      return { kind: 'act', label, confidence: answer.confidence };
    }
    return { kind: 'idle', label, confidence: answer.confidence };
  }
  if (idleOn.includes(label)) {
    return { kind: 'idle', label, confidence: answer.confidence };
  }
  return { kind: 'skip', reason: `unknown label: ${answer.choice}` };
}

/** `{prompt}` と `{label}` を埋める。抜粋は改行を潰して 40 字まで */
export function guideMessage(template: string, label: Label, prompt: string): string {
  const excerpt = prompt.replace(/\s*\r?\n\s*/g, ' ').slice(0, 40);
  return template.split('{label}').join(label).split('{prompt}').join(excerpt);
}
