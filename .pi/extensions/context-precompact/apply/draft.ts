/**
 * 要約結果から境界の下書きと概算トークンを作る。副作用なしで計算する。
 *
 * 適用後の数は、残るメッセージの推定と要約の推定の合計にする。実測値から別の基準を差し引かない。
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

/** 要約の文字数からトークンを見積もる。 */
export function summaryTokens(summary: string): number {
  return Math.ceil(summary.length / 4);
}

/** 結果と準備から適用できる形を作る。`tokensAfter` は概算値である。 */
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
