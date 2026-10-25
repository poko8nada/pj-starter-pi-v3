/**
 * pi の `usage` の工場。
 * `context-prune` と `thinking-scrub` のテストが読む共有の品。
 * 機能のフィクスチャに依存しない（`scrub.fixture.ts` がここを読む向き）。
 *
 * 値と文字列を組み立てるだけで、プロセスも FS も開かない。
 * テストの外から読まれても、何も起きずに止まらない。
 */
import type { MessageEndEvent } from '@earendil-works/pi-coding-agent';

export type PiAssistantMessage = MessageEndEvent['message'];

/** pi の `usage` を作る */
export function piUsage() {
  return {
    input: 1,
    output: 1,
    cacheRead: 0,
    cacheWrite: 0,
    totalTokens: 2,
    cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0, total: 0 },
  };
}
