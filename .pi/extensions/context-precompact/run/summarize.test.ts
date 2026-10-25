import { describe, expect, it } from 'vitest';
import type { CompactionResult } from '@earendil-works/pi-coding-agent';
import { summarize } from './summarize.ts';
import type { SummaryPorts } from './ports.ts';
import type { PreparedCompaction } from '../prepare/types.ts';
import { RESERVE_TOKENS } from '../settings/constants.ts';

const FAILURE = 'boom';

function preparedOf(): PreparedCompaction {
  return {
    firstKeptEntryId: 'kept-1',
    messagesToSummarize: [],
    turnPrefixMessages: [],
    isSplitTurn: false,
    tokensBefore: 100,
    previousSummary: undefined,
    fileOps: { read: new Set(), written: new Set(), edited: new Set() },
    settings: { enabled: true, reserveTokens: RESERVE_TOKENS, keepRecentTokens: 2000 },
  };
}

function resultOf(): CompactionResult {
  return {
    summary: 'summary',
    firstKeptEntryId: 'kept-1',
    tokensBefore: 100,
    usage: undefined,
    details: undefined,
  };
}

describe('summarize', () => {
  it('fake port が結果を返す → done で結果をそのまま返す', async () => {
    const expected = resultOf();
    const ports: SummaryPorts = { compact: async () => expected };
    const outcome = await summarize(ports, preparedOf(), new AbortController().signal, Date.now);
    if (outcome.kind !== 'done') {
      throw new Error('must be done');
    }
    expect(outcome.result).toEqual(expected);
  });

  it('fake port が throw → failed', async () => {
    const ports: SummaryPorts = {
      compact: async () => {
        throw new Error(FAILURE);
      },
    };
    const outcome = await summarize(ports, preparedOf(), new AbortController().signal, Date.now);
    expect(outcome).toEqual({ kind: 'failed', reason: FAILURE });
  });

  it('signal が abort 済み → failed aborted', async () => {
    let called = false;
    const ports: SummaryPorts = {
      compact: async () => {
        called = true;
        return resultOf();
      },
    };
    const controller = new AbortController();
    controller.abort();
    const outcome = await summarize(ports, preparedOf(), controller.signal, Date.now);
    expect(outcome).toEqual({ kind: 'failed', reason: 'aborted' });
    expect(called).toBe(false);
  });
});
