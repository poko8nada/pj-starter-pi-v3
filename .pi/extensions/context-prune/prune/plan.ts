/**
 * 発動の判定。割合を超えたら裏で走らせ、枠の 1 割が増えるまで休む。
 */

export type Gate =
  | { readonly kind: 'run' }
  | {
      readonly kind: 'idle';
      readonly reason: 'disabled' | 'below-ratio' | 'cooling' | 'running' | 'unknown' | 'empty';
    };

export interface GateInput {
  readonly enabled: boolean;
  readonly tokens: number | null;
  readonly contextWindow: number;
  readonly ratio: number;
  readonly rearmRatio: number;
  readonly lastTokens: number | undefined;
  readonly running: boolean;
  readonly candidates: number;
}

/** 走らせるか休むかを決める。無効・不明・走行中・候補無しを先に断る */
export function gate(input: GateInput): Gate {
  if (!input.enabled) {
    return { kind: 'idle', reason: 'disabled' };
  }
  if (input.tokens === null) {
    return { kind: 'idle', reason: 'unknown' };
  }
  if (input.running) {
    return { kind: 'idle', reason: 'running' };
  }
  const tokens: number = input.tokens;
  if (tokens / input.contextWindow < input.ratio) {
    return { kind: 'idle', reason: 'below-ratio' };
  }
  if (input.candidates === 0) {
    return { kind: 'idle', reason: 'empty' };
  }
  if (input.lastTokens === undefined) {
    return { kind: 'run' };
  }
  if (tokens - input.lastTokens < input.contextWindow * input.rearmRatio) {
    return { kind: 'idle', reason: 'cooling' };
  }
  return { kind: 'run' };
}
