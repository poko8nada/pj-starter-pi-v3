import { describe, expect, it } from 'vitest';
import { compare } from './compare.ts';
import type { PreparedCompaction } from './types.ts';

interface FileOpsInput {
  readonly read?: readonly string[];
  readonly written?: readonly string[];
  readonly edited?: readonly string[];
}

function fileOpsOf(input: FileOpsInput = {}): PreparedCompaction['fileOps'] {
  return {
    read: new Set(input.read ?? []),
    written: new Set(input.written ?? []),
    edited: new Set(input.edited ?? []),
  };
}

function messageOf(): PreparedCompaction['messagesToSummarize'][number] {
  return { role: 'user', content: [{ type: 'text', text: 'hi' }], timestamp: 1 };
}

function base(): PreparedCompaction {
  return {
    firstKeptEntryId: 'kept-1',
    messagesToSummarize: [messageOf()],
    turnPrefixMessages: [],
    isSplitTurn: false,
    tokensBefore: 100,
    previousSummary: 'prev',
    fileOps: fileOpsOf({ read: ['a.ts'] }),
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

  it('turnPrefix の数が違う → mismatch turnPrefixMessages', () => {
    expect(compare(base(), { ...base(), turnPrefixMessages: [messageOf()] })).toEqual({
      kind: 'mismatch',
      fields: ['turnPrefixMessages'],
    });
  });

  it('previousSummary が違う → mismatch previousSummary', () => {
    expect(compare(base(), { ...base(), previousSummary: 'other' })).toEqual({
      kind: 'mismatch',
      fields: ['previousSummary'],
    });
  });

  it('fileOps.read だけ違う → mismatch fileOps', () => {
    expect(compare(base(), { ...base(), fileOps: fileOpsOf({ read: ['b.ts'] }) })).toEqual({
      kind: 'mismatch',
      fields: ['fileOps'],
    });
  });

  it('fileOps.written だけ違う → mismatch fileOps', () => {
    expect(
      compare(base(), { ...base(), fileOps: fileOpsOf({ read: ['a.ts'], written: ['b.ts'] }) }),
    ).toEqual({ kind: 'mismatch', fields: ['fileOps'] });
  });

  it('fileOps.edited だけ違う → mismatch fileOps', () => {
    expect(
      compare(base(), { ...base(), fileOps: fileOpsOf({ read: ['a.ts'], edited: ['b.ts'] }) }),
    ).toEqual({ kind: 'mismatch', fields: ['fileOps'] });
  });
});
