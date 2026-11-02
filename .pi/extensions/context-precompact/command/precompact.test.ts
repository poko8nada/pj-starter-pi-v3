import { describe, expect, it } from 'vitest';
import { parseCommand, statusLines } from './precompact.ts';
import type { Settings } from '../settings/schema.ts';
import { formatCount } from '../ui/count.ts';

const SETTINGS: Settings = {
  enabled: true,
  keepRecentTokens: 20_000,
  thresholdRatio: 0.8,
};

function lastAppliedOf(): number {
  return 20_000;
}

describe('parseCommand', () => {
  it('空文字と status、on、off、now を渡すとそれぞれの種類になる', () => {
    expect(parseCommand('')).toEqual({ kind: 'status' });
    expect(parseCommand('status')).toEqual({ kind: 'status' });
    expect(parseCommand('on')).toEqual({ kind: 'on' });
    expect(parseCommand('off')).toEqual({ kind: 'off' });
    expect(parseCommand('now')).toEqual({ kind: 'now' });
  });

  it('foo を渡すと usage になる', () => {
    expect(parseCommand('foo')).toEqual({ kind: 'usage' });
  });
});

describe('statusLines', () => {
  it('lastAppliedTokens を渡すと桁区切りの値になる', () => {
    const value = lastAppliedOf();
    const lines = statusLines({
      settings: SETTINGS,
      prepared: false,
      running: false,
      lastAppliedTokens: value,
      status: { kind: 'idle' },
    });
    expect(lines[3]).toBe(`lastApplied: ${formatCount(value)}`);
  });
});
