import { describe, expect, it } from 'vitest';
import { compare } from './compare.ts';
import type { PreparedCompaction } from './types.ts';

function fileOpsOf(read: readonly string[] = []): PreparedCompaction['fileOps'] {
  return { read: new Set(read), written: new Set(), edited: new Set() };
}

function base(): PreparedCompaction {
  return {
    firstKeptEntryId: 'kept-1',
    messagesToSummarize: [{ role: 'user', content: [{ type: 'text', text: 'hi' }], timestamp: 1 }],
    turnPrefixMessages: [],
    isSplitTurn: false,
    tokensBefore: 100,
    previousSummary: 'prev',
    fileOps: fileOpsOf(['a.ts']),
    settings: { enabled: true, reserveTokens: 16_384, keepRecentTokens: 2000 },
  };
}

describe('compare', () => {
  it('5 項目が同じ → match', () => {
    expect(compare(base(), base())).toEqual({ kind: 'match' });
  });

  it('firstKeptEntryId が違う → mismatch firstKeptEntryId', () => {
    expect(compare(base(), { ...base(), firstKeptEntryId: 'kept-2' })).toEqual({
      kind: 'mismatch',
      fields: ['firstKeptEntryId'],
    });
  });

  it('メッセージ数が違う → mismatch messagesToSummarize', () => {
    expect(compare(base(), { ...base(), messagesToSummarize: [] })).toEqual({
      kind: 'mismatch',
      fields: ['messagesToSummarize'],
    });
  });

  it('previousSummary が違う → mismatch previousSummary', () => {
    expect(compare(base(), { ...base(), previousSummary: 'other' })).toEqual({
      kind: 'mismatch',
      fields: ['previousSummary'],
    });
  });

  it('fileOps.read だけ違う → mismatch fileOps', () => {
    expect(compare(base(), { ...base(), fileOps: fileOpsOf(['b.ts']) })).toEqual({
      kind: 'mismatch',
      fields: ['fileOps'],
    });
  });
});
