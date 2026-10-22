import { describe, expect, it } from 'vitest';
import type { EntryMessage } from './collect.ts';
import { messageText, summaryPrompt } from './summarize.ts';

type AssistantContent = Extract<EntryMessage, { readonly role: 'assistant' }>['content'];

function assistantMessage(content: AssistantContent): EntryMessage {
  return {
    role: 'assistant',
    content,
    api: 'openai-completions',
    provider: 'test',
    model: 'test-model',
    usage: {
      input: 1,
      output: 1,
      cacheRead: 0,
      cacheWrite: 0,
      totalTokens: 2,
      cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0, total: 0 },
    },
    stopReason: 'stop',
    timestamp: 1,
  };
}

describe('summaryPrompt', () => {
  it('summaryPrompt(2000) → 2000 と見出しを含む 1 つの文字列', () => {
    const prompt = summaryPrompt(2000);
    expect(typeof prompt).toBe('string');
    expect(prompt).toContain('2000');
    expect(prompt).toContain('Goal');
    expect(prompt).toContain('Progress');
    expect(prompt).toContain('Decisions');
    expect(prompt).toContain('Next steps');
  });
});

describe('messageText', () => {
  it('text 2 つと toolCall が混ざる → text だけを連結した文字列', () => {
    const message = assistantMessage([
      { type: 'text', text: 'hello ' },
      { type: 'toolCall', id: 'c1', name: 'read', arguments: { path: 'a.txt' } },
      { type: 'text', text: 'world' },
    ]);
    expect(messageText(message)).toBe('hello world');
  });

  it('text ブロックが無い → 空文字', () => {
    const message = assistantMessage([
      { type: 'toolCall', id: 'c1', name: 'read', arguments: { path: 'a.txt' } },
    ]);
    expect(messageText(message)).toBe('');
  });
});
