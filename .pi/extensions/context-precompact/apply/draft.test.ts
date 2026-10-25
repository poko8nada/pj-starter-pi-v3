import { describe, expect, it } from 'vitest';
import type { CompactionResult } from '@earendil-works/pi-coding-agent';
import { readyFrom, summaryTokens } from './draft.ts';
import type { PreparedCompaction, PrepareStamp } from '../prepare/types.ts';
import { RESERVE_TOKENS } from '../settings/constants.ts';

function tokensOf(): { readonly before: number; readonly kept: number } {
  return { before: 1_000, kept: 400 };
}

function summaryOf(): string {
  return 'summary '.repeat(10);
}

function usage() {
  return {
    input: 1,
    output: 1,
    cacheRead: 0,
    cacheWrite: 0,
    totalTokens: 2,
    cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0, total: 0 },
  };
}

function preparedOf(): PreparedCompaction {
  return {
    firstKeptEntryId: 'kept-1',
    messagesToSummarize: [],
    turnPrefixMessages: [],
    isSplitTurn: false,
    tokensBefore: tokensOf().before,
    previousSummary: undefined,
    fileOps: { read: new Set(), written: new Set(), edited: new Set() },
    settings: { enabled: true, reserveTokens: RESERVE_TOKENS, keepRecentTokens: 2000 },
  };
}

function resultOf(summary: string): CompactionResult {
  return {
    summary,
    firstKeptEntryId: 'kept-1',
    tokensBefore: tokensOf().before,
    usage: usage(),
    details: { readFiles: [], modifiedFiles: [] },
  };
}

function stampOf(): PrepareStamp {
  return { sessionId: 's1', leafId: 'leaf', latestCompactionId: undefined };
}

describe('readyFrom', () => {
  it('result と prepared と前後の数 → draft が同じで、tokensAfter が kept と要約の和', () => {
    const tokens = tokensOf();
    const result = resultOf(summaryOf());
    const ready = readyFrom(result, preparedOf(), stampOf(), tokens);
    expect(ready.draft.summary).toBe(result.summary);
    expect(ready.draft.firstKeptEntryId).toBe(result.firstKeptEntryId);
    expect(ready.draft.details).toEqual(result.details);
    expect(ready.draft.usage).toEqual(result.usage);
    expect(ready.tokensBefore).toBe(tokens.before);
    expect(ready.tokensAfter).toBe(tokens.kept + summaryTokens(result.summary));
  });
});
