import { describe, expect, it } from 'vitest';
import type { MessageEndEvent } from '@earendil-works/pi-coding-agent';
import {
  DEGENERATE_PREFIX,
  DEGENERATE_REPEATS,
  DEGENERATE_SUFFIX,
  DEGENERATE_UNIT,
  assistantMessage,
  degenerate,
  degenerateExpected,
  piUsage,
  type PiAssistantMessage,
} from '../scrub.fixture.ts';
import { defaultSettings } from '../settings/schema.ts';
import { detectRuns } from './detect.ts';
import { isAssistantMessage, scrubMessage } from './message.ts';

type AgentMessage = MessageEndEvent['message'];
type UserMessage = Extract<AgentMessage, { role: 'user' }>;

function thinkingMessage(thinking: string, signature: string): PiAssistantMessage {
  return assistantMessage({
    content: [{ type: 'thinking', thinking, thinkingSignature: signature }],
  });
}

const tuning = defaultSettings();

describe('scrubMessage', () => {
  it('既定の設定と署名付きのループは差し替える', () => {
    const message: AgentMessage = assistantMessage();
    const scrubbed = scrubMessage(message, tuning);
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
    expect(first.thinking).toBe(degenerateExpected());
    if (typeof first.thinking !== 'string') {
      throw new Error('thinking must be a string');
    }
    expect(detectRuns(first.thinking, tuning.char)).toEqual([]);
  });

  it('thinkingSignature が reasoning と reasoning_text なら対象になる', () => {
    const reasoning = thinkingMessage(degenerate(), 'reasoning');
    expect(scrubMessage(reasoning, tuning)).toBeDefined();
    const reasoningText = thinkingMessage(degenerate(), 'reasoning_text');
    expect(scrubMessage(reasoningText, tuning)).toBeDefined();
  });

  it('char.minLength を 100 にした設定で退化は差し替えない', () => {
    const strict = { ...tuning, char: { ...tuning.char, minLength: 100 } };
    expect(degenerate().length).toBeLessThan(strict.char.minLength);
    const message = thinkingMessage(degenerate(), 'reasoning_content');
    expect(scrubMessage(message, strict)).toBeUndefined();
  });

  it('署名のないループは差し替えない', () => {
    const message = assistantMessage({
      content: [{ type: 'thinking', thinking: degenerate() }],
    });
    expect(scrubMessage(message, tuning)).toBeUndefined();
  });

  it('thinkingSignature が JSON 文字列なら undefined になる', () => {
    const signature = '{"reasoning_details":[]}';
    const message = assistantMessage({
      content: [
        {
          type: 'thinking',
          thinking: degenerate(),
          thinkingSignature: signature,
        },
      ],
    });
    expect(scrubMessage(message, tuning)).toBeUndefined();
  });

  it('対象ブロックがない配列なら undefined になる', () => {
    const text = 'hi';
    const message = assistantMessage({ content: [{ type: 'text', text }] });
    expect(scrubMessage(message, tuning)).toBeUndefined();
  });

  it('redacted が true なら undefined になる', () => {
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
    expect(scrubMessage(message, tuning)).toBeUndefined();
  });

  it('role が assistant 以外なら undefined になる', () => {
    // text の user メッセージである。role のため undefined になる。
    const user: UserMessage = {
      role: 'user',
      content: [{ type: 'text', text: degenerate() }],
      timestamp: 1,
    };
    expect(scrubMessage(user, tuning)).toBeUndefined();
  });

  it('2 ブロックのうち 1 つだけ退化すればその 1 つだけ書き換わる', () => {
    const fresh = 'normal thinking here';
    const message = assistantMessage({
      content: [
        { type: 'thinking', thinking: degenerate(), thinkingSignature: 'reasoning_content' },
        { type: 'thinking', thinking: fresh, thinkingSignature: 'reasoning_content' },
      ],
    });
    const scrubbed = scrubMessage(message, tuning);
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
    expect(first.thinking).toBe(degenerateExpected());
    expect(second).toEqual({
      type: 'thinking',
      thinking: fresh,
      thinkingSignature: 'reasoning_content',
    });
  });

  it('差し替え後も thinkingSignature と usage と stopReason と timestamp が同じ値になる', () => {
    const message: AgentMessage = assistantMessage();
    const scrubbed = scrubMessage(message, tuning);
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
    expect(scrubbed.message.usage).toEqual(piUsage());
    expect(scrubbed.message.stopReason).toBe(message.stopReason);
    expect(scrubbed.message.timestamp).toBe(message.timestamp);
  });

  it('本文が 1 つの区間だけなら undefined になる', () => {
    const fullRun = DEGENERATE_UNIT.repeat(DEGENERATE_REPEATS);
    const message = thinkingMessage(fullRun, 'reasoning_content');
    expect(scrubMessage(message, tuning)).toBeUndefined();
  });

  it('2 ブロックのうち片方が全部区間なら片方は元のままで removed はまとめた分だけになる', () => {
    const fullRun = DEGENERATE_UNIT.repeat(DEGENERATE_REPEATS);
    const middle = 'hello';
    const charBlock = 'abcd'.repeat(15);
    const twoRuns = `${DEGENERATE_PREFIX}${DEGENERATE_UNIT.repeat(DEGENERATE_REPEATS)} ${middle} ${charBlock}${DEGENERATE_SUFFIX}`;
    const expectedSecond = `${DEGENERATE_PREFIX} ${middle} ${DEGENERATE_SUFFIX}`;
    const message = assistantMessage({
      content: [
        { type: 'thinking', thinking: fullRun, thinkingSignature: 'reasoning_content' },
        { type: 'thinking', thinking: twoRuns, thinkingSignature: 'reasoning_content' },
      ],
    });
    const scrubbed = scrubMessage(message, tuning);
    expect(scrubbed).toBeDefined();
    if (scrubbed === undefined) {
      throw new Error('scrubbed must be defined');
    }
    expect(scrubbed.removed).toBe(2);
    expect(scrubbed.chars).toBe(twoRuns.length - expectedSecond.length);
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
    expect(second.thinking).toBe(expectedSecond);
  });
});

describe('isAssistantMessage', () => {
  it('content が配列でない assistant は false になる', () => {
    // Set は iterable だが配列でないため false になる。
    const blocks = new Set([
      { type: 'thinking', thinking: degenerate(), thinkingSignature: 'reasoning_content' },
    ]);
    expect(isAssistantMessage({ role: 'assistant', content: blocks })).toBe(false);
  });
});

describe('scrubMessage chars', () => {
  it('chars は元の長さからまとめた長さを引いた値になる', () => {
    const thinking = degenerate();
    const message: AgentMessage = assistantMessage();
    const scrubbed = scrubMessage(message, tuning);
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
  });
});
