import { describe, expect, it } from 'vitest';
import { parseCommand, statusLines } from './precompact.ts';
import type { Settings } from '../settings/schema.ts';
import { statusLine, type StatusState } from '../ui/status.ts';
import { formatCount } from '../ui/count.ts';

const SETTINGS: Settings = {
  enabled: true,
  keepRecentTokens: 20_000,
  thresholdRatio: 0.8,
};

const REASON = 'reason';

function pairOf() {
  return { before: 1_000, after: 500 } as const;
}

function lastAppliedOf(): number {
  return 20_000;
}

function statuses(): readonly StatusState[] {
  const pair = pairOf();
  return [
    { kind: 'idle' },
    { kind: 'preparing' },
    { kind: 'ready', ...pair },
    { kind: 'applied', ...pair },
    { kind: 'failed', reason: REASON },
    { kind: 'discarded' },
  ];
}

function statusOf(status: StatusState): string | undefined {
  return statusLines({
    settings: SETTINGS,
    prepared: false,
    running: false,
    lastAppliedTokens: undefined,
    status,
  }).at(-1);
}

describe('parseCommand', () => {
  it('空 → status、status / on / off / now → それぞれ', () => {
    expect(parseCommand('')).toEqual({ kind: 'status' });
    expect(parseCommand('status')).toEqual({ kind: 'status' });
    expect(parseCommand('on')).toEqual({ kind: 'on' });
    expect(parseCommand('off')).toEqual({ kind: 'off' });
    expect(parseCommand('now')).toEqual({ kind: 'now' });
  });

  it('foo → usage', () => {
    expect(parseCommand('foo')).toEqual({ kind: 'usage' });
  });
});

describe('statusLines', () => {
  it('最後の行は status と statusLine の文面', () => {
    for (const status of statuses()) {
      expect(statusOf(status)).toBe(`status: ${statusLine(status)}`);
    }
  });

  it('lastAppliedTokens → 桁区切りの値', () => {
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
