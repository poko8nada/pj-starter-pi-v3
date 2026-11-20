/**
 * context-precompact のテストが使う準備の前提である。
 *
 * 要約の使用量と準備とモデルの偽物を作る。同じものを作らない。
 * 実行しても外へ出ない。ファイルだけ読まれても何も走らない。
 */
import type { CompactionResult, ExtensionContext } from '@earendil-works/pi-coding-agent';
import type { PreparedCompaction } from '../prepare/types.ts';
import type { RegistryPort } from '../run/ports.ts';
import { RESERVE_TOKENS } from '../settings/constants.ts';

/** 要約の使用量を作る。 */
export function llmUsage(): NonNullable<CompactionResult['usage']> {
  return {
    input: 1,
    output: 1,
    cacheRead: 0,
    cacheWrite: 0,
    totalTokens: 2,
    cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0, total: 0 },
  };
}

/** 準備を作る。既定と違う値だけ `overrides` で渡す。 */
export function preparedCompaction(
  overrides: Partial<PreparedCompaction> = {},
): PreparedCompaction {
  return {
    firstKeptEntryId: 'kept-1',
    messagesToSummarize: [],
    turnPrefixMessages: [],
    isSplitTurn: false,
    tokensBefore: 100,
    previousSummary: undefined,
    fileOps: { read: new Set(), written: new Set(), edited: new Set() },
    settings: { enabled: true, reserveTokens: RESERVE_TOKENS, keepRecentTokens: 2000 },
    ...overrides,
  };
}

/** モデルの偽物を作る。 */
export function modelFake(contextWindow = 200_000): ExtensionContext['model'] {
  const model = { provider: 'test', id: 'm1', maxTokens: 8000, contextWindow };
  // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion, typescript/no-unsafe-type-assertion -- 使うモデルの偽物
  return model as unknown as ExtensionContext['model'];
}

/** 認証の偽物を作る。 */
export function registryFake(
  auth: Awaited<ReturnType<ExtensionContext['modelRegistry']['getApiKeyAndHeaders']>> = {
    ok: true,
    apiKey: 'k',
    headers: {},
    env: {},
  },
): RegistryPort {
  const registry = { getApiKeyAndHeaders: async () => auth };
  return registry;
}
