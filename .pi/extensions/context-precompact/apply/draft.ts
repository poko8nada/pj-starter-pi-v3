/**
 * 要約結果から境界の下書きと概算トークンを作る。純粋計算。
 */
import {
  estimateTokens,
  type CompactionEntryDraft,
  type CompactionResult,
} from '@earendil-works/pi-coding-agent';
import type { PreparedCompaction, PrepareStamp } from '../prepare/types.ts';

export interface ReadyCompaction {
  readonly draft: CompactionEntryDraft;
  readonly result: CompactionResult;
  readonly prepared: PreparedCompaction;
  readonly stamp: PrepareStamp;
  readonly tokensBefore: number;
  readonly tokensAfter: number;
}

/** 結果と準備から適用可能な形を作る。`tokensAfter` は概算 */
export function readyFrom(
  result: CompactionResult,
  prepared: PreparedCompaction,
  stamp: PrepareStamp,
  tokensBefore: number,
): ReadyCompaction {
  let oldTokens = 0;
  for (const message of prepared.messagesToSummarize) {
    oldTokens += estimateTokens(message);
  }
  for (const message of prepared.turnPrefixMessages) {
    oldTokens += estimateTokens(message);
  }
  const summaryTokens = Math.ceil(result.summary.length / 4);
  const tokensAfter = Math.max(0, tokensBefore - oldTokens + summaryTokens);
  return {
    draft: {
      type: 'compaction',
      summary: result.summary,
      firstKeptEntryId: result.firstKeptEntryId,
      details: result.details,
      usage: result.usage,
    },
    result,
    prepared,
    stamp,
    tokensBefore,
    tokensAfter,
  };
}
