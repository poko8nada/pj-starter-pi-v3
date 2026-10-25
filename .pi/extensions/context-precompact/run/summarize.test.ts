import { describe, expect, it } from 'vitest';
import type { CompactionResult } from '@earendil-works/pi-coding-agent';
import { summarize } from './summarize.ts';
import type { SummaryPorts } from './ports.ts';
import type { PreparedCompaction } from '../prepare/types.ts';

function preparedOf(): PreparedCompaction {
  return {
    firstKeptEntryId: 'kept-1',
    messagesToSummarize: [],
    turnPrefixMessages: [],
    isSplitTurn: false,
    tokensBefore: 100,
    previousSummary: undefined,
    fileOps: { read: new Set(), written: new Set(), edited: new Set() },
    settings: { enabled: true, reserveTokens: 16_384, keepRecentTokens: 2000 },
  };
}

function resultOf(): CompactionResult {
  return {
    summary: 'まとめ',
    firstKeptEntryId: 'kept-1',
    tokensBefore: 100,
    usage: undefined,
    details: undefined,
  };
}

describe('summarize', () => {
  it('fake port が結果を返す → done で latency が経過', async () => {
    const expected = resultOf();
    const ports: SummaryPorts = {
      compact: async () => expected,
    };
    let clock = 1000;
    const outcome = await summarize(ports, preparedOf(), AbortSignal.timeout(1000), () => {
      const current = clock;
      clock += 50;
      return current;
    });
    expect(outcome.kind).toBe('done');
    if (outcome.kind !== 'done') {
      throw new Error('must be done');
    }
    expect(outcome.result).toEqual(expected);
    expect(outcome.latencyMs).toBe(50);
  });

  it('fake port が throw → failed', async () => {
    const ports: SummaryPorts = {
      compact: async () => {
        throw new Error('boom');
      },
    };
    const outcome = await summarize(ports, preparedOf(), AbortSignal.timeout(1000), () => 1);
    expect(outcome).toEqual({ kind: 'failed', reason: 'boom' });
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
    const outcome = await summarize(ports, preparedOf(), controller.signal, () => 1);
    expect(outcome).toEqual({ kind: 'failed', reason: 'aborted' });
    expect(called).toBe(false);
  });
});
