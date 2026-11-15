import { describe, expect, it } from 'vitest';
import type { CompactionResult } from '@earendil-works/pi-coding-agent';
import { readyFrom, summaryTokens } from './draft.ts';
import type { PrepareStamp } from '../prepare/types.ts';
import { llmUsage, preparedCompaction } from '../test/prepared.fixture.ts';

function tokensOf(): { readonly before: number; readonly kept: number } {
  return { before: 1_000, kept: 400 };
}

function summaryOf(): string {
  return 'summary '.repeat(10);
}

function resultOf(summary: string): CompactionResult {
  return {
    summary,
    firstKeptEntryId: 'kept-1',
    tokensBefore: tokensOf().before,
    usage: llmUsage(),
    details: { readFiles: [], modifiedFiles: [] },
  };
}

function stampOf(): PrepareStamp {
  return { sessionId: 's1', leafId: 'leaf', latestCompactionId: undefined };
}

describe('readyFrom', () => {
  it('result と prepared と前後のトークン数から draft を作ると tokensAfter が kept と要約の合計になる', () => {
    const tokens = tokensOf();
    const result = resultOf(summaryOf());
    const ready = readyFrom(
      result,
      preparedCompaction({ tokensBefore: tokens.before }),
      stampOf(),
      tokens,
    );
    expect(ready.draft.summary).toBe(result.summary);
    expect(ready.draft.firstKeptEntryId).toBe(result.firstKeptEntryId);
    expect(ready.draft.details).toEqual(result.details);
    expect(ready.draft.usage).toEqual(result.usage);
    expect(ready.tokensBefore).toBe(tokens.before);
    expect(ready.tokensAfter).toBe(tokens.kept + summaryTokens(result.summary));
  });
});
