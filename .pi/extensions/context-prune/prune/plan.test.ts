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
  it('有効・tokens 1000・枠 2000・ratio 0.5・候補 1 → run', () => {
    expect(gate(input({}))).toEqual({ kind: 'run' });
  });

  it('無効 → disabled', () => {
    expect(gate(input({ enabled: false }))).toEqual({ kind: 'idle', reason: 'disabled' });
  });

  it('候補 0 → empty', () => {
    expect(gate(input({ candidates: 0 }))).toEqual({ kind: 'idle', reason: 'empty' });
  });

  it('tokens / 枠 がちょうど ratio → run、ratio 未満 → below-ratio', () => {
    expect(gate(input({ tokens: 1000, lastTokens: 0 }))).toEqual({ kind: 'run' });
    expect(gate(input({ tokens: 999, lastTokens: 0 }))).toEqual({
      kind: 'idle',
      reason: 'below-ratio',
    });
  });

  it('lastTokens が undefined → run（初回）', () => {
    expect(gate(input({ lastTokens: undefined }))).toEqual({ kind: 'run' });
  });

  it('割合未満 + lastTokens 未定義 → below-ratio（初回でも走らない）', () => {
    expect(gate(input({ tokens: 100, lastTokens: undefined }))).toEqual({
      kind: 'idle',
      reason: 'below-ratio',
    });
  });

  it('割合以上 + lastTokens 未定義 → run', () => {
    expect(gate(input({ tokens: 1500, lastTokens: undefined }))).toEqual({ kind: 'run' });
  });

  it('前回から枠の 1 割が増えていなければ cooling、増えていれば run', () => {
    expect(gate(input({ lastTokens: 1000, tokens: 1100 }))).toEqual({
      kind: 'idle',
      reason: 'cooling',
    });
    expect(gate(input({ lastTokens: 1000, tokens: 1200 }))).toEqual({ kind: 'run' });
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
