/**
 * 要約の実行。開始時刻を測り、成功は経過付き、失敗は理由付きで返す。
 */
import type { CompactionResult } from '@earendil-works/pi-coding-agent';
import type { PreparedCompaction } from '../prepare/types.ts';
import type { SummaryPorts } from './ports.ts';

export type SummaryOutcome =
  | { readonly kind: 'done'; readonly result: CompactionResult; readonly latencyMs: number }
  | { readonly kind: 'failed'; readonly reason: string };

/** 準備を要約し、経過時間か失敗理由を返す。abort 済みは呼ばずに失敗 */
export async function summarize(
  ports: SummaryPorts,
  prepared: PreparedCompaction,
  signal: AbortSignal,
  now: () => number,
): Promise<SummaryOutcome> {
  if (signal.aborted) {
    return { kind: 'failed', reason: 'aborted' };
  }
  const started = now();
  try {
    const result = await ports.compact({ preparation: prepared, signal });
    return { kind: 'done', result, latencyMs: now() - started };
  } catch (error) {
    if (signal.aborted) {
      return { kind: 'failed', reason: 'aborted' };
    }
    const reason = error instanceof Error ? error.message : String(error);
    return { kind: 'failed', reason };
  }
}
