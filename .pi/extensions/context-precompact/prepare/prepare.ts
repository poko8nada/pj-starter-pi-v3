/**
 * 準備の入口。設定の有効と Pi の有効を見て、下ごしらえと切れ目の印を作る。
 */
import { RESERVE_TOKENS } from '../settings/constants.ts';
import { prepareFromProjection } from './copied.ts';
import type { Prepared, PrepareInput } from './types.ts';
import type { FileOperations } from '@earendil-works/pi-coding-agent';

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/** `prepare` の本体。無効・下ごしらえ無しなら `undefined` */
export function prepare(input: PrepareInput): Prepared | undefined {
  if (!input.settings.enabled || !input.piEnabled) {
    return undefined;
  }
  const compaction = prepareFromProjection({
    projectedEntries: input.projectedEntries,
    pathEntries: input.branch,
    settings: {
      enabled: true,
      reserveTokens: RESERVE_TOKENS,
      keepRecentTokens: input.settings.keepRecentTokens,
    },
    tokensBefore: input.tokensBefore,
  });
  if (compaction === undefined) {
    return undefined;
  }
  let latestCompactionId: string | undefined;
  const hookRead: string[] = [];
  const hookEdited: string[] = [];
  for (let i = input.branch.length - 1; i >= 0; i--) {
    const entry = input.branch[i];
    if (entry !== undefined && entry.type === 'compaction') {
      latestCompactionId = entry.id;
      if (entry.fromHook === true && isRecord(entry.details)) {
        collectHookFiles(entry.details['readFiles'], hookRead);
        collectHookFiles(entry.details['modifiedFiles'], hookEdited);
      }
      break;
    }
  }
  const leaf = input.branch[input.branch.length - 1];
  if (leaf === undefined) {
    return undefined;
  }
  const merged =
    hookRead.length === 0 && hookEdited.length === 0
      ? compaction
      : {
          ...compaction,
          fileOps: mergeHookFileOps(compaction.fileOps, hookRead, hookEdited),
        };
  return {
    compaction: merged,
    stamp: { sessionId: input.sessionId, leafId: leaf.id, latestCompactionId },
  };
}

/** 配列の中の文字列だけを集める。配列でなければ何もしない */
function collectHookFiles(value: unknown, out: string[]): void {
  if (!Array.isArray(value)) {
    return;
  }
  for (const item of value) {
    if (typeof item === 'string') {
      out.push(item);
    }
  }
}

/** 前回の `fromHook` の一覧を今の `fileOps` に足した新しい物を作る */
function mergeHookFileOps(
  base: FileOperations,
  readFiles: readonly string[],
  modifiedFiles: readonly string[],
): FileOperations {
  return {
    read: new Set([...base.read, ...readFiles]),
    written: new Set(base.written),
    edited: new Set([...base.edited, ...modifiedFiles]),
  };
}
