/**
 * 準備を始めるか適用するか待つかを判定する。副作用なしで計算する。
 */
import { LEAD_RATIO, MIN_OLD_RATIO, REARM_RATIO } from '../settings/constants.ts';

export interface GateInput {
  readonly enabled: boolean;
  readonly piEnabled: boolean;
  readonly tokens: number | null;
  readonly contextWindow: number;
  readonly thresholdRatio: number;
  readonly keepRecentTokens: number;
  readonly running: boolean;
  readonly prepared: boolean;
  readonly lastAppliedTokens: number | undefined;
}

export type GateDecision =
  | { readonly kind: 'skip'; readonly reason: 'disabled' | 'unknown' | 'running' }
  | {
      readonly kind: 'wait';
      readonly reason:
        | 'below-lead'
        | 'old-region-too-small'
        | 'cooling'
        | 'prepared-below-threshold';
    }
  | { readonly kind: 'start' }
  | { readonly kind: 'apply' };

/** 入力の割合と状態から、開始するか適用するか待つか見送るかを決める。 */
export function gate(input: GateInput): GateDecision {
  if (!input.enabled || !input.piEnabled) {
    return { kind: 'skip', reason: 'disabled' };
  }
  if (input.tokens === null || input.contextWindow <= 0) {
    return { kind: 'skip', reason: 'unknown' };
  }
  if (input.running) {
    return { kind: 'skip', reason: 'running' };
  }
  const ratio = input.tokens / input.contextWindow;
  if (input.prepared) {
    if (ratio >= input.thresholdRatio) {
      return { kind: 'apply' };
    }
    return { kind: 'wait', reason: 'prepared-below-threshold' };
  }
  if (
    input.lastAppliedTokens !== undefined &&
    input.tokens < input.lastAppliedTokens + REARM_RATIO * input.contextWindow
  ) {
    return { kind: 'wait', reason: 'cooling' };
  }
  if (ratio < input.thresholdRatio - LEAD_RATIO) {
    return { kind: 'wait', reason: 'below-lead' };
  }
  if (
    input.thresholdRatio * input.contextWindow - input.keepRecentTokens <
    MIN_OLD_RATIO * input.contextWindow
  ) {
    return { kind: 'wait', reason: 'old-region-too-small' };
  }
  return { kind: 'start' };
}
