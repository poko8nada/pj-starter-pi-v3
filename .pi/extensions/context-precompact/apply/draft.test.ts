import { describe, expect, it } from 'vitest';
import { estimateTokens, type CompactionResult } from '@earendil-works/pi-coding-agent';
import { readyFrom } from './draft.ts';
import type { PreparedCompaction, PrepareStamp } from '../prepare/types.ts';

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
    tokensBefore: 1000,
    previousSummary: undefined,
    fileOps: { read: new Set(), written: new Set(), edited: new Set() },
    settings: { enabled: true, reserveTokens: 16_384, keepRecentTokens: 2000 },
  };
}

function resultOf(summary: string): CompactionResult {
  return {
    summary,
    firstKeptEntryId: 'kept-1',
    tokensBefore: 1000,
    usage: usage(),
    details: { readFiles: ['a.ts'], modifiedFiles: [] },
  };
}

function stampOf(): PrepareStamp {
  return { sessionId: 's1', leafId: 'leaf', latestCompactionId: undefined };
}

describe('readyFrom', () => {
  it('result と prepared → draft の summary、firstKept、details、usage が同じ', () => {
    const prepared = preparedOf();
    const result = resultOf('x'.repeat(100));
    const ready = readyFrom(result, prepared, stampOf(), 1000);
    expect(ready.draft.summary).toBe(result.summary);
    expect(ready.draft.firstKeptEntryId).toBe(result.firstKeptEntryId);
    expect(ready.draft.details).toEqual(result.details);
    expect(ready.draft.usage).toEqual(result.usage);
  });

  it('tokensBefore、estimate 合計、summary 文字数 → tokensAfter が一致する', () => {
    const prepared = preparedOf();
    const result = resultOf('z'.repeat(80));
    const tokensBefore = 1000;
    const ready = readyFrom(result, prepared, stampOf(), tokensBefore);
    let oldTokens = 0;
    for (const message of prepared.messagesToSummarize) {
      oldTokens += estimateTokens(message);
    }
    for (const message of prepared.turnPrefixMessages) {
      oldTokens += estimateTokens(message);
    }
    const expected = tokensBefore - oldTokens + Math.ceil(result.summary.length / 4);
    expect(ready.tokensAfter).toBe(expected);
  });

  it('oldTokens が tokensBefore を超える → tokensAfter が 0', () => {
    const prepared = preparedOf();
    const result = resultOf('short');
    const ready = readyFrom(result, prepared, stampOf(), 1);
    expect(ready.tokensAfter).toBe(0);
  });
});
