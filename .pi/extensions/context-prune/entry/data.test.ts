import { describe, expect, it } from 'vitest';
import type { SessionEntry } from '@earendil-works/pi-coding-agent';
import { CUSTOM_TYPE, isPrunePass, passesOf } from './data.ts';

let seq = 0;

function customEntry(customType: string, data: unknown): SessionEntry {
  seq += 1;
  const entry: SessionEntry = {
    type: 'custom',
    id: `e${seq}`,
    parentId: seq > 1 ? `e${seq - 1}` : null,
    timestamp: new Date(seq).toISOString(),
    customType,
    data,
  };
  return entry;
}

function goodPass(): Record<string, unknown> {
  return {
    at: 1000,
    tokensBefore: 60000,
    summary: '要約',
    dropped: [{ id: 'e1', chars: 10 }],
    droppedChars: 10,
    kept: 1,
    latencyMs: 1200,
    usage: undefined,
  };
}

describe('passesOf', () => {
  it('正しい形の custom エントリ 2 件 → 2 件、順はエントリの順', () => {
    const first = customEntry(CUSTOM_TYPE, { ...goodPass(), summary: '一つ目' });
    const second = customEntry(CUSTOM_TYPE, { ...goodPass(), summary: '二つ目' });
    const passes = passesOf([first, second]);
    expect(passes).toHaveLength(2);
    expect(passes[0]?.summary).toBe('一つ目');
    expect(passes[1]?.summary).toBe('二つ目');
  });

  it('customType が違う、type が message → 0 件', () => {
    const other = customEntry('other-type', goodPass());
    const message: SessionEntry = {
      type: 'message',
      id: 'm1',
      parentId: null,
      timestamp: new Date(1).toISOString(),
      message: { role: 'user', content: [{ type: 'text', text: '質問' }], timestamp: 1 },
    };
    expect(passesOf([other, message])).toHaveLength(0);
  });

  it('data が欠けている → 0 件', () => {
    const entry: SessionEntry = {
      type: 'custom',
      id: 'e-missing',
      parentId: null,
      timestamp: new Date(1).toISOString(),
      customType: CUSTOM_TYPE,
    };
    expect(passesOf([entry])).toHaveLength(0);
    expect(isPrunePass(undefined)).toBe(false);
  });

  it('tokensBefore が文字列 → 0 件', () => {
    expect(
      passesOf([customEntry(CUSTOM_TYPE, { ...goodPass(), tokensBefore: '60000' })]),
    ).toHaveLength(0);
  });

  it('dropped が配列でない → 0 件', () => {
    expect(passesOf([customEntry(CUSTOM_TYPE, { ...goodPass(), dropped: 'e1' })])).toHaveLength(0);
  });

  it('chars が負 → 0 件', () => {
    expect(
      passesOf([customEntry(CUSTOM_TYPE, { ...goodPass(), dropped: [{ id: 'e1', chars: -1 }] })]),
    ).toHaveLength(0);
  });

  it('正しいパスと壊れたパスが混ざる → 正しいものだけ', () => {
    const good = customEntry(CUSTOM_TYPE, goodPass());
    const bad = customEntry(CUSTOM_TYPE, { ...goodPass(), tokensBefore: 'x' });
    const passes = passesOf([good, bad]);
    expect(passes).toHaveLength(1);
    expect(passes[0]?.summary).toBe('要約');
  });
});
