import { describe, expect, it } from 'vitest';
import { brokenText, chatText, failureText, statusLine, statusText } from './status.ts';
import { formatCount } from './count.ts';

function pairOf() {
  return { before: 1_000, after: 500 } as const;
}

function reasonOf(): string {
  return 'reason';
}

describe('chatText', () => {
  it('ready に前後の数 → 桁区切りの 2 値が文面に並ぶ', () => {
    const pair = pairOf();
    const text = chatText({ kind: 'ready', ...pair });
    expect(text).toContain(formatCount(pair.before));
    expect(text).toContain(formatCount(pair.after));
  });

  it('applied に前後の数 → 桁区切りの 2 値が文面に並ぶ', () => {
    const pair = pairOf();
    const text = chatText({ kind: 'applied', ...pair });
    expect(text).toContain(formatCount(pair.before));
    expect(text).toContain(formatCount(pair.after));
  });
});

describe('statusText', () => {
  it('failed に理由 → 文面はあり、理由は入らない', () => {
    const reason = reasonOf();
    const footer = statusText({ kind: 'failed', reason });
    expect(footer).toBeDefined();
    expect(footer).not.toContain(reason);
  });

  it('idle / discarded → undefined', () => {
    expect(statusText({ kind: 'idle' })).toBeUndefined();
    expect(statusText({ kind: 'discarded' })).toBeUndefined();
  });
});

describe('statusLine', () => {
  it('ready / applied に前後の数 → 桁区切りの 2 値が入る', () => {
    const pair = pairOf();
    for (const kind of ['ready', 'applied'] as const) {
      const line = statusLine({ kind, ...pair });
      expect(line).toContain(formatCount(pair.before));
      expect(line).toContain(formatCount(pair.after));
    }
  });

  it('failed に理由 → 理由が入る', () => {
    const reason = reasonOf();
    expect(statusLine({ kind: 'failed', reason })).toContain(reason);
  });
});

describe('failureText', () => {
  it('失敗の理由 → 理由が入る', () => {
    const reason = reasonOf();
    expect(failureText(reason)).toContain(reason);
  });
});

describe('brokenText', () => {
  it('設定が壊れている理由 → 理由が入る', () => {
    const reason = reasonOf();
    expect(brokenText(reason)).toContain(reason);
  });
});
