import { describe, expect, it } from 'vitest';
import { estimateTokens, type CompactionResult } from '@earendil-works/pi-coding-agent';
import { readyFrom, summaryTokens } from './draft.ts';
import type { PreparedCompaction, PrepareStamp } from '../prepare/types.ts';
import { RESERVE_TOKENS } from '../settings/constants.ts';

const TOKENS_BEFORE = 1_000;
const BELOW_OLD_TOKENS = 1;

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
    messagesToSummarize: [
      { role: 'user', content: [{ type: 'text', text: 'hello world' }], timestamp: 1 },
    ],
    turnPrefixMessages: [
      {
        role: 'assistant',
        content: [{ type: 'text', text: 'prefix' }],
        api: 'openai-completions',
        provider: 'test',
        model: 'm',
        usage: usage(),
        stopReason: 'stop',
        timestamp: 2,
      },
    ],
    isSplitTurn: true,
    tokensBefore: TOKENS_BEFORE,
    previousSummary: undefined,
    fileOps: { read: new Set(), written: new Set(), edited: new Set() },
    settings: { enabled: true, reserveTokens: RESERVE_TOKENS, keepRecentTokens: 2000 },
  };
}

function resultOf(summary: string): CompactionResult {
  return {
    summary,
    firstKeptEntryId: 'kept-1',
    tokensBefore: TOKENS_BEFORE,
    usage: usage(),
    details: { readFiles: ['a.ts'], modifiedFiles: [] },
  };
}

function stampOf(): PrepareStamp {
  return { sessionId: 's1', leafId: 'leaf', latestCompactionId: undefined };
}

function oldTokensOf(prepared: PreparedCompaction): number {
  let total = 0;
  for (const message of prepared.messagesToSummarize) {
    total += estimateTokens(message);
  }
  for (const message of prepared.turnPrefixMessages) {
    total += estimateTokens(message);
  }
  return total;
}

describe('readyFrom', () => {
  it('result と prepared → draft の summary、firstKept、details、usage が同じ', () => {
    const prepared = preparedOf();
    const result = resultOf('summary text');
    const ready = readyFrom(result, prepared, stampOf(), TOKENS_BEFORE);
    expect(ready.draft.summary).toBe(result.summary);
    expect(ready.draft.firstKeptEntryId).toBe(result.firstKeptEntryId);
    expect(ready.draft.details).toEqual(result.details);
    expect(ready.draft.usage).toEqual(result.usage);
  });

  it('tokensAfter は tokensBefore - old + summaryTokens', () => {
    const prepared = preparedOf();
    const result = resultOf('z'.repeat(80));
    const ready = readyFrom(result, prepared, stampOf(), TOKENS_BEFORE);
    expect(ready.tokensAfter).toBe(
      TOKENS_BEFORE - oldTokensOf(prepared) + summaryTokens(result.summary),
    );
  });

  it('oldTokens が tokensBefore を超える → tokensAfter が 0', () => {
    const ready = readyFrom(resultOf('short'), preparedOf(), stampOf(), BELOW_OLD_TOKENS);
    expect(ready.tokensAfter).toBe(0);
  });
});
