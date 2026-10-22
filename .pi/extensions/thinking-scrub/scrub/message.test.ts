import { describe, expect, it } from 'vitest';
import type { MessageEndEvent } from '@earendil-works/pi-coding-agent';
import { detectRuns } from './detect.ts';
import { scrubMessage } from './message.ts';

type AgentMessage = MessageEndEvent['message'];

// assistant メッセージの組み立ては関数の中で行う。

function usage() {
  return {
    input: 1,
    output: 1,
    cacheRead: 0,
    cacheWrite: 0,
    totalTokens: 2,
    cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0, total: 0 },
  };
}

function degenerate(): string {
  return `foo${'the *'.repeat(12)}bar`;
}

function assistantMessage(overrides: Record<string, unknown> = {}): AgentMessage {
  const base = {
    role: 'assistant',
    content: [{ type: 'thinking', thinking: degenerate(), thinkingSignature: 'reasoning_content' }],
    api: 'openai-completions',
    provider: 'opencode-go',
    model: 'deepseek-v4.1-flash',
    usage: usage(),
    stopReason: 'stop',
    timestamp: 123,
  };
  // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion -- テストの偽物を作る
  return { ...base, ...overrides } as unknown as AgentMessage;
}

describe('scrubMessage', () => {
  it('reasoning_content で退化した本文 → 差し替えが返り、区間を含まない', () => {
    const message = assistantMessage();
    const scrubbed = scrubMessage(message);
    expect(scrubbed).toBeDefined();
    if (scrubbed === undefined) {
      throw new Error('scrubbed must be defined');
    }
    if (scrubbed.message.role !== 'assistant') {
      throw new Error('message must be assistant');
    }
    const first = scrubbed.message.content.at(0);
    if (typeof first !== 'object' || first === null || !('thinking' in first)) {
      throw new Error('first block must be thinking');
    }
    expect(first.thinking).toBe('foo bar');
    if (typeof first.thinking !== 'string') {
      throw new Error('thinking must be a string');
    }
    expect(detectRuns(first.thinking)).toEqual([]);
  });

  it('thinkingSignature が reasoning → 対象になる', () => {
    const message = assistantMessage({
      content: [{ type: 'thinking', thinking: degenerate(), thinkingSignature: 'reasoning' }],
    });
    expect(scrubMessage(message)).toBeDefined();
  });

  it('thinkingSignature が reasoning_text → 対象になる', () => {
    const message = assistantMessage({
      content: [{ type: 'thinking', thinking: degenerate(), thinkingSignature: 'reasoning_text' }],
    });
    expect(scrubMessage(message)).toBeDefined();
  });

  it('thinkingSignature が無い → undefined', () => {
    const message = assistantMessage({
      content: [{ type: 'thinking', thinking: degenerate() }],
    });
    expect(scrubMessage(message)).toBeUndefined();
  });

  it('thinkingSignature が JSON 文字列 → undefined', () => {
    const message = assistantMessage({
      content: [
        {
          type: 'thinking',
          thinking: degenerate(),
          thinkingSignature: '{"reasoning_details":[]}',
        },
      ],
    });
    expect(scrubMessage(message)).toBeUndefined();
  });

  it('対象ブロックが無い配列 → undefined', () => {
    const message = assistantMessage({ content: [{ type: 'text', text: 'hi' }] });
    expect(scrubMessage(message)).toBeUndefined();
  });

  it('redacted が真 → undefined', () => {
    const message = assistantMessage({
      content: [
        {
          type: 'thinking',
          thinking: degenerate(),
          thinkingSignature: 'reasoning_content',
          redacted: true,
        },
      ],
    });
    expect(scrubMessage(message)).toBeUndefined();
  });

  it('role が assistant 以外 → undefined', () => {
    // assistant なら差し替わる本文 (happy test と同じ): role のおかげで undefined。
    const message = assistantMessage({ role: 'user' });
    expect(scrubMessage(message)).toBeUndefined();
  });

  it('content が配列でない assistant → undefined', () => {
    // Set は iterable だが配列でない: guard が無ければ thinking を拾って defined になる。
    const blocks = new Set([
      { type: 'thinking', thinking: degenerate(), thinkingSignature: 'reasoning_content' },
    ]);
    const message = assistantMessage({ content: blocks });
    expect(scrubMessage(message)).toBeUndefined();
  });

  it('2 ブロックのうち 1 つだけ退化 → その 1 つだけ書き換わる', () => {
    const fresh = 'normal thinking here';
    const message = assistantMessage({
      content: [
        { type: 'thinking', thinking: degenerate(), thinkingSignature: 'reasoning_content' },
        { type: 'thinking', thinking: fresh, thinkingSignature: 'reasoning_content' },
      ],
    });
    const scrubbed = scrubMessage(message);
    expect(scrubbed).toBeDefined();
    if (scrubbed === undefined) {
      throw new Error('scrubbed must be defined');
    }
    if (scrubbed.message.role !== 'assistant') {
      throw new Error('message must be assistant');
    }
    const content = scrubbed.message.content;
    expect(content).toHaveLength(2);
    const first = content.at(0);
    const second = content.at(1);
    if (typeof first !== 'object' || first === null || !('thinking' in first)) {
      throw new Error('first block must be thinking');
    }
    expect(first.thinking).toBe('foo bar');
    expect(second).toEqual({
      type: 'thinking',
      thinking: fresh,
      thinkingSignature: 'reasoning_content',
    });
  });

  it('差し替え後も thinkingSignature と usage と stopReason と timestamp が同じ値', () => {
    const message = assistantMessage();
    const scrubbed = scrubMessage(message);
    expect(scrubbed).toBeDefined();
    if (message.role !== 'assistant') {
      throw new Error('message must be assistant');
    }
    if (scrubbed === undefined) {
      throw new Error('scrubbed must be defined');
    }
    if (scrubbed.message.role !== 'assistant') {
      throw new Error('scrubbed message must be assistant');
    }
    const originalBlock = message.content.at(0);
    const nextBlock = scrubbed.message.content.at(0);
    if (
      typeof originalBlock !== 'object' ||
      originalBlock === null ||
      !('thinkingSignature' in originalBlock) ||
      typeof nextBlock !== 'object' ||
      nextBlock === null ||
      !('thinkingSignature' in nextBlock)
    ) {
      throw new Error('blocks must be thinking');
    }
    expect(nextBlock.thinkingSignature).toBe(originalBlock.thinkingSignature);
    expect(scrubbed.message.usage).toEqual(message.usage);
    expect(scrubbed.message.stopReason).toBe(message.stopReason);
    expect(scrubbed.message.timestamp).toBe(message.timestamp);
  });

  it('本文が 1 つの区間だけ → undefined', () => {
    const message = assistantMessage({
      content: [
        {
          type: 'thinking',
          thinking: 'the *'.repeat(12),
          thinkingSignature: 'reasoning_content',
        },
      ],
    });
    expect(scrubMessage(message)).toBeUndefined();
  });

  it('本文が区間と空白だけ → undefined', () => {
    const message = assistantMessage({
      content: [
        {
          type: 'thinking',
          thinking: `  ${'the *'.repeat(12)}  `,
          thinkingSignature: 'reasoning_content',
        },
      ],
    });
    expect(scrubMessage(message)).toBeUndefined();
  });

  it('2 ブロックのうち片方が全部区間 → 片方は元のまま、removed は畳んだ分だけ', () => {
    const fullRun = 'the *'.repeat(12);
    const twoRuns = `foo${'the *'.repeat(12)} hello ${'abcd'.repeat(15)}bar`;
    const message = assistantMessage({
      content: [
        { type: 'thinking', thinking: fullRun, thinkingSignature: 'reasoning_content' },
        { type: 'thinking', thinking: twoRuns, thinkingSignature: 'reasoning_content' },
      ],
    });
    const scrubbed = scrubMessage(message);
    expect(scrubbed).toBeDefined();
    if (scrubbed === undefined) {
      throw new Error('scrubbed must be defined');
    }
    expect(scrubbed.removed).toBe(2);
    if (scrubbed.message.role !== 'assistant') {
      throw new Error('message must be assistant');
    }
    const content = scrubbed.message.content;
    expect(content).toHaveLength(2);
    expect(content.at(0)).toEqual({
      type: 'thinking',
      thinking: fullRun,
      thinkingSignature: 'reasoning_content',
    });
    const second = content.at(1);
    if (typeof second !== 'object' || second === null || !('thinking' in second)) {
      throw new Error('second block must be thinking');
    }
    expect(second.thinking).toBe('foo hello bar');
  });

  it('chars は元の長さから畳んだ長さを引いた値', () => {
    const thinking = degenerate();
    const message = assistantMessage();
    const scrubbed = scrubMessage(message);
    expect(scrubbed).toBeDefined();
    if (scrubbed === undefined) {
      throw new Error('scrubbed must be defined');
    }
    if (scrubbed.message.role !== 'assistant') {
      throw new Error('message must be assistant');
    }
    const first = scrubbed.message.content.at(0);
    if (typeof first !== 'object' || first === null || !('thinking' in first)) {
      throw new Error('first block must be thinking');
    }
    if (typeof first.thinking !== 'string') {
      throw new Error('thinking must be a string');
    }
    expect(scrubbed.chars).toBe(thinking.length - first.thinking.length);
    expect(scrubbed.chars).toBe(59);
  });

  it('51 文字が 25 文字に畳まれる → chars は 26', () => {
    const thinking = `header-12345${'abcd'.repeat(7).slice(0, 27)}suffix-67890`;
    expect(thinking).toHaveLength(51);
    const message = assistantMessage({
      content: [{ type: 'thinking', thinking, thinkingSignature: 'reasoning_content' }],
    });
    const scrubbed = scrubMessage(message);
    expect(scrubbed).toBeDefined();
    if (scrubbed === undefined) {
      throw new Error('scrubbed must be defined');
    }
    if (scrubbed.message.role !== 'assistant') {
      throw new Error('message must be assistant');
    }
    const first = scrubbed.message.content.at(0);
    if (typeof first !== 'object' || first === null || !('thinking' in first)) {
      throw new Error('first block must be thinking');
    }
    expect(first.thinking).toHaveLength(25);
    expect(scrubbed.removed).toBe(1);
    expect(scrubbed.chars).toBe(26);
  });
});
