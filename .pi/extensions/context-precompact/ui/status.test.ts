import { describe, expect, it } from 'vitest';
import { brokenText, chatText, failureText, noticeText, statusLine, statusText } from './status.ts';
import { formatCount } from './count.ts';

const REASON = 'reason';

function pairOf() {
  return { before: 1_000, after: 500 } as const;
}

describe('chatText', () => {
  it('preparing → preparing…', () => {
    expect(chatText({ kind: 'preparing' })).toBe('precompact: preparing…');
  });

  it('ready → ready X → Y', () => {
    const pair = pairOf();
    expect(chatText({ kind: 'ready', ...pair })).toBe(
      `precompact: ready (${formatCount(pair.before)} → ${formatCount(pair.after)})`,
    );
  });

  it('applied → applied X → Y', () => {
    const pair = pairOf();
    expect(chatText({ kind: 'applied', ...pair })).toBe(
      `precompact: applied (${formatCount(pair.before)} → ${formatCount(pair.after)})`,
    );
  });
});

describe('statusText', () => {
  it('failed → failed だけ。理由は入れない', () => {
    expect(statusText({ kind: 'failed', reason: REASON })).not.toContain(REASON);
  });

  it('idle / discarded → undefined', () => {
    expect(statusText({ kind: 'idle' })).toBeUndefined();
    expect(statusText({ kind: 'discarded' })).toBeUndefined();
  });
});

describe('statusLine', () => {
  it('idle / preparing / discarded → kind の名前', () => {
    expect(statusLine({ kind: 'idle' })).toBe('idle');
    expect(statusLine({ kind: 'preparing' })).toBe('preparing');
    expect(statusLine({ kind: 'discarded' })).toBe('discarded');
  });

  it('ready / applied → X → Y', () => {
    const pair = pairOf();
    expect(statusLine({ kind: 'ready', ...pair })).toBe(
      `ready (${formatCount(pair.before)} → ${formatCount(pair.after)})`,
    );
    expect(statusLine({ kind: 'applied', ...pair })).toBe(
      `applied (${formatCount(pair.before)} → ${formatCount(pair.after)})`,
    );
  });

  it('failed → 理由を入れる', () => {
    expect(statusLine({ kind: 'failed', reason: REASON })).toBe(`failed (${REASON})`);
  });
});

describe('noticeText', () => {
  it('on / off / nothing / running → それぞれの文面', () => {
    expect(noticeText('on')).toBe('precompact: on');
    expect(noticeText('off')).toBe('precompact: off');
    expect(noticeText('nothing')).toBe('precompact: nothing to prepare');
    expect(noticeText('running')).toBe('precompact: running');
  });
});

describe('failureText', () => {
  it('失敗の理由と、既定のコンパクションに任せることを入れる', () => {
    const text = failureText(REASON);
    expect(text).toContain(REASON);
    expect(text).toContain('default compaction');
  });
});

describe('brokenText', () => {
  it('設定が壊れている理由を入れる', () => {
    expect(brokenText(REASON)).toContain(REASON);
  });
});
