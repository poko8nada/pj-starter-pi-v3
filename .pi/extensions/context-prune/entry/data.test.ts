import { describe, expect, it } from 'vitest';
import type { SessionEntry } from '@earendil-works/pi-coding-agent';
import { CUSTOM_TYPE, passesOf } from './data.ts';
import { customPassEntry, prunePass } from '../prune.fixture.ts';

function customEntry(data: unknown, id = 'e-custom', customType = CUSTOM_TYPE): SessionEntry {
  return {
    type: 'custom',
    id,
    parentId: null,
    timestamp: new Date(1).toISOString(),
    customType,
    data,
  };
}

function userMessage(id = 'm1'): SessionEntry {
  return {
    type: 'message',
    id,
    parentId: null,
    timestamp: new Date(1).toISOString(),
    message: { role: 'user', content: [{ type: 'text', text: '質問' }], timestamp: 1 },
  };
}

const brokenNumbers = [
  { tokensBefore: '60000' },
  { droppedTokens: -1 },
  { droppedTokens: Number.POSITIVE_INFINITY },
] as const;

describe('passesOf', () => {
  it('正しい custom 2 件 → 2 件、順はエントリの順', () => {
    const firstSummary = '一つ目';
    const secondSummary = '二つ目';
    const entries = [
      customPassEntry(prunePass({ summary: firstSummary }), 'e1'),
      customPassEntry(prunePass({ summary: secondSummary }), 'e2'),
    ];
    const passes = passesOf(entries);
    expect(passes).toHaveLength(entries.length);
    expect(passes[0]?.summary).toBe(firstSummary);
    expect(passes[1]?.summary).toBe(secondSummary);
  });

  it('customType が違う / type が message → 0 件', () => {
    const entries = [customEntry(prunePass(), 'e-other', 'other-type'), userMessage()];
    expect(passesOf(entries)).toHaveLength(0);
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
  });

  for (const patch of brokenNumbers) {
    it(`壊れた数値 ${Object.keys(patch)[0]}=${String(Object.values(patch)[0])} → 0 件`, () => {
      const data = { ...prunePass(), ...patch };
      expect(passesOf([customEntry(data)])).toHaveLength(0);
    });
  }

  it('dropped が配列でない → 0 件', () => {
    const patch = { dropped: 'e1' };
    const data = { ...prunePass(), ...patch };
    expect(passesOf([customEntry(data)])).toHaveLength(0);
  });

  it('droppedTokens を持たない古い記録 → 0 件', () => {
    const data = { ...prunePass() } as Record<string, unknown>;
    delete data['droppedTokens'];
    expect(passesOf([customEntry(data)])).toHaveLength(0);
  });

  it('正しい記録と壊れた記録が混ざる → 正しい物だけを残す', () => {
    const firstSummary = '一つ目';
    const secondSummary = '三つ目';
    const entries = [
      customPassEntry(prunePass({ summary: firstSummary }), 'e1'),
      customEntry({ ...prunePass(), tokensBefore: 'x' }, 'e-bad'),
      customPassEntry(prunePass({ summary: secondSummary }), 'e3'),
    ];
    const passes = passesOf(entries);
    expect(passes).toHaveLength(2);
    expect(passes[0]?.summary).toBe(firstSummary);
    expect(passes[1]?.summary).toBe(secondSummary);
  });
});
