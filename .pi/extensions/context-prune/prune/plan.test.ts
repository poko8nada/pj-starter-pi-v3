import { describe, expect, it } from 'vitest';
import { gate, type GateInput } from './plan.ts';

function input(overrides: Partial<GateInput>): GateInput {
  return {
    enabled: true,
    tokens: 1000,
    contextWindow: 2000,
    ratio: 0.5,
    rearmRatio: 0.1,
    lastTokens: undefined,
    running: false,
    candidates: 1,
    ...overrides,
  };
}

describe('gate', () => {
  it('有効・割合以上・候補あり → run', () => {
    expect(gate(input({}))).toEqual({ kind: 'run' });
  });

  it('無効 → disabled', () => {
    expect(gate(input({ enabled: false }))).toEqual({ kind: 'idle', reason: 'disabled' });
  });

  it('候補 0 → empty', () => {
    expect(gate(input({ candidates: 0 }))).toEqual({ kind: 'idle', reason: 'empty' });
  });

  it('tokens / 枠がちょうど ratio → run、未満 → below-ratio', () => {
    const atRatio = 1000;
    const belowRatio = 999;
    const contextWindow = 2000;
    const ratio = 0.5;
    expect(gate(input({ tokens: atRatio, contextWindow, ratio, lastTokens: 0 }))).toEqual({
      kind: 'run',
    });
    expect(gate(input({ tokens: belowRatio, contextWindow, ratio, lastTokens: 0 }))).toEqual({
      kind: 'idle',
      reason: 'below-ratio',
    });
  });

  it('lastTokens が無い → 初回として run', () => {
    expect(gate(input({ lastTokens: undefined }))).toEqual({ kind: 'run' });
  });

  it('割合未満で lastTokens も無い → below-ratio', () => {
    const tokens = 100;
    expect(gate(input({ tokens, lastTokens: undefined }))).toEqual({
      kind: 'idle',
      reason: 'below-ratio',
    });
  });

  it('前回から枠の 1 割が増えていなければ cooling、増えていれば run', () => {
    const lastTokens = 1000;
    const coolingTokens = 1100;
    const runTokens = 1200;
    expect(gate(input({ lastTokens, tokens: coolingTokens }))).toEqual({
      kind: 'idle',
      reason: 'cooling',
    });
    expect(gate(input({ lastTokens, tokens: runTokens }))).toEqual({ kind: 'run' });
  });

  it('tokens が null → unknown', () => {
    expect(gate(input({ tokens: null }))).toEqual({ kind: 'idle', reason: 'unknown' });
  });

  it('走っている → running', () => {
    expect(gate(input({ running: true, lastTokens: 1000, tokens: 1200 }))).toEqual({
      kind: 'idle',
      reason: 'running',
    });
  });

  it('無効と走行中が同時 → disabled', () => {
    expect(gate(input({ enabled: false, running: true }))).toEqual({
      kind: 'idle',
      reason: 'disabled',
    });
  });
});
