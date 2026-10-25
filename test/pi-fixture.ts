/**
 * pi の `usage` と assistant メッセージの工場。
 * `slim-context-prune` もこれを読む。
 *
 * 値と文字列を組み立てるだけで、プロセスも FS も開かない。
 * テストの外から読まれても、何も起きずに止まらない。
 */
import type { MessageEndEvent } from '@earendil-works/pi-coding-agent';
import { degenerate } from './scrub-fixture.ts';

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

/** assistant メッセージを作る。既定は退化した thinking 1 件 */
export function assistantMessage(overrides: Record<string, unknown> = {}): PiAssistantMessage {
  const base = {
    role: 'assistant',
    content: [{ type: 'thinking', thinking: degenerate(), thinkingSignature: 'reasoning_content' }],
    api: 'openai-completions',
    provider: 'opencode-go',
    model: 'deepseek-v4.1-flash',
    usage: piUsage(),
    stopReason: 'stop',
    timestamp: 123,
  };
  // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion -- テストの偽物を作る
  return { ...base, ...overrides } as unknown as PiAssistantMessage;
}
