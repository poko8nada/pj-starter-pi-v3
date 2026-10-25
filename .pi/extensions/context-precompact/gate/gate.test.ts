import { describe, expect, it } from 'vitest';
import { LEAD_RATIO, REARM_RATIO } from '../settings/constants.ts';
import { gate, type GateInput } from './gate.ts';

const CONTEXT_WINDOW = 200_000;
const SMALL_CONTEXT_WINDOW = 20_000;
const THRESHOLD_RATIO = 0.8;
const KEEP_RECENT_TOKENS = 20_000;

function makeInput(overrides: Partial<GateInput> = {}): GateInput {
  return {
    enabled: true,
    piEnabled: true,
    tokens: Math.floor(THRESHOLD_RATIO * CONTEXT_WINDOW),
    contextWindow: CONTEXT_WINDOW,
    thresholdRatio: THRESHOLD_RATIO,
    keepRecentTokens: KEEP_RECENT_TOKENS,
    running: false,
    prepared: false,
    lastAppliedTokens: undefined,
    ...overrides,
  };
}

describe('gate', () => {
  it('比率が threshold、prepared でない → start', () => {
    expect(gate(makeInput())).toEqual({ kind: 'start' });
  });

  it('比率が threshold、prepared → apply', () => {
    expect(gate(makeInput({ prepared: true }))).toEqual({ kind: 'apply' });
  });

  it('比率が threshold - LEAD/2、prepared → wait prepared-below-threshold', () => {
    const tokens = Math.floor((THRESHOLD_RATIO - LEAD_RATIO / 2) * CONTEXT_WINDOW);
    expect(gate(makeInput({ tokens, prepared: true }))).toEqual({
      kind: 'wait',
      reason: 'prepared-below-threshold',
    });
  });

  it('比率が threshold - LEAD 未満 → wait below-lead', () => {
    const tokens = Math.floor((THRESHOLD_RATIO - LEAD_RATIO) * CONTEXT_WINDOW) - 1;
    expect(gate(makeInput({ tokens }))).toEqual({ kind: 'wait', reason: 'below-lead' });
  });

  it('enabled が false → skip disabled', () => {
    expect(gate(makeInput({ enabled: false }))).toEqual({ kind: 'skip', reason: 'disabled' });
  });

  it('piEnabled が false → skip disabled', () => {
    expect(gate(makeInput({ piEnabled: false }))).toEqual({ kind: 'skip', reason: 'disabled' });
  });

  it('tokens が null → skip unknown', () => {
    expect(gate(makeInput({ tokens: null }))).toEqual({ kind: 'skip', reason: 'unknown' });
  });

  it('contextWindow が 0 で tokens が非 null → skip unknown', () => {
    expect(gate(makeInput({ contextWindow: 0, tokens: THRESHOLD_RATIO * CONTEXT_WINDOW }))).toEqual(
      {
        kind: 'skip',
        reason: 'unknown',
      },
    );
  });

  it('running が true → skip running', () => {
    expect(gate(makeInput({ running: true }))).toEqual({ kind: 'skip', reason: 'running' });
  });

  it('古い領域が MIN_OLD_RATIO 未満 → wait old-region-too-small', () => {
    const tokens = Math.floor(THRESHOLD_RATIO * SMALL_CONTEXT_WINDOW);
    expect(
      gate(
        makeInput({
          contextWindow: SMALL_CONTEXT_WINDOW,
          tokens,
          keepRecentTokens: KEEP_RECENT_TOKENS,
        }),
      ),
    ).toEqual({ kind: 'wait', reason: 'old-region-too-small' });
  });

  it('lastAppliedTokens から REARM 未満 → wait cooling', () => {
    const tokens = Math.floor(THRESHOLD_RATIO * CONTEXT_WINDOW);
    const lastAppliedTokens = tokens - Math.floor(REARM_RATIO * CONTEXT_WINDOW) + 1;
    expect(gate(makeInput({ tokens, lastAppliedTokens }))).toEqual({
      kind: 'wait',
      reason: 'cooling',
    });
  });

  it('lastAppliedTokens から REARM 以上 → start', () => {
    const tokens = Math.floor(THRESHOLD_RATIO * CONTEXT_WINDOW);
    const lastAppliedTokens = tokens - Math.floor(REARM_RATIO * CONTEXT_WINDOW);
    expect(gate(makeInput({ tokens, lastAppliedTokens }))).toEqual({ kind: 'start' });
  });
});
