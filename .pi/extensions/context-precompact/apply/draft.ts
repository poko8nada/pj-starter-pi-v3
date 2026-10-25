/**
 * 要約結果から境界の下書きと概算トークンを作る。純粋計算。
 *
 * 後ろは、残るメッセージの推定と要約の推定の和にする。実測から別の物差しを引かない。
 */
import type { CompactionEntryDraft, CompactionResult } from '@earendil-works/pi-coding-agent';
import type { PreparedCompaction, PrepareStamp } from '../prepare/types.ts';

export interface ReadyCompaction {
  readonly draft: CompactionEntryDraft;
  readonly result: CompactionResult;
  readonly prepared: PreparedCompaction;
  readonly stamp: PrepareStamp;
  readonly tokensBefore: number;
  readonly tokensAfter: number;
}

export interface ReadyTokens {
  readonly before: number;
  readonly kept: number;
}

/** 要約の文字数からトークンを見積もる */
export function summaryTokens(summary: string): number {
  return Math.ceil(summary.length / 4);
}

/** 結果と準備から適用可能な形を作る。`tokensAfter` は概算 */
export function readyFrom(
  result: CompactionResult,
  prepared: PreparedCompaction,
  stamp: PrepareStamp,
  tokens: ReadyTokens,
): ReadyCompaction {
  const tokensAfter = Math.max(0, tokens.kept) + summaryTokens(result.summary);
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
    tokensBefore: tokens.before,
    tokensAfter,
  };
}
