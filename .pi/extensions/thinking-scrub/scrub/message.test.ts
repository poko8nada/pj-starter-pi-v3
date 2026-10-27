import { describe, expect, it } from 'vitest';
import type { MessageEndEvent } from '@earendil-works/pi-coding-agent';
import { piUsage, type PiAssistantMessage } from '../../../../test/pi.fixture.ts';
import {
  DEGENERATE_PREFIX,
  DEGENERATE_REPEATS,
  DEGENERATE_SUFFIX,
  DEGENERATE_UNIT,
  assistantMessage,
  degenerate,
  degenerateExpected,
} from '../scrub.fixture.ts';
import { defaultSettings } from '../settings/schema.ts';
import { detectRuns } from './detect.ts';
import { scrubMessage } from './message.ts';

type AgentMessage = MessageEndEvent['message'];

function thinkingMessage(thinking: string, signature: string): PiAssistantMessage {
  return assistantMessage({
    content: [{ type: 'thinking', thinking, thinkingSignature: signature }],
  });
}

describe('scrubMessage', () => {
  it('既定の設定と署名付きのループ → 差し替える', () => {
    const tuning = defaultSettings();
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

  it('thinkingSignature が reasoning / reasoning_text → 対象になる', () => {
    const tuning = defaultSettings();
    const reasoning = thinkingMessage(degenerate(), 'reasoning');
    expect(scrubMessage(reasoning, tuning)).toBeDefined();
    const reasoningText = thinkingMessage(degenerate(), 'reasoning_text');
    expect(scrubMessage(reasoningText, tuning)).toBeDefined();
  });

  it('char.minLength を 100 にした設定で、66 文字の退化 → 差し替えない', () => {
    const tuning = defaultSettings();
    expect(degenerate().length).toBe(66);
    const strict = { ...tuning, char: { ...tuning.char, minLength: 100 } };
    const message = thinkingMessage(degenerate(), 'reasoning_content');
    expect(scrubMessage(message, strict)).toBeUndefined();
  });

  it('署名の無いループ → 差し替えない', () => {
    const tuning = defaultSettings();
    const message = assistantMessage({
      content: [{ type: 'thinking', thinking: degenerate() }],
    });
    expect(scrubMessage(message, tuning)).toBeUndefined();
  });

  it('thinkingSignature が JSON 文字列 → undefined', () => {
    const tuning = defaultSettings();
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

  it('対象ブロックが無い配列 → undefined', () => {
    const tuning = defaultSettings();
    const text = 'hi';
    const message = assistantMessage({ content: [{ type: 'text', text }] });
    expect(scrubMessage(message, tuning)).toBeUndefined();
  });

  it('redacted が真 → undefined', () => {
    const tuning = defaultSettings();
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

  it('role が assistant 以外 → undefined', () => {
    const tuning = defaultSettings();
    // assistant なら差し替わる本文 (happy test と同じ): role のおかげで undefined。
    const message = assistantMessage({ role: 'user' });
    expect(scrubMessage(message, tuning)).toBeUndefined();
  });

  it('content が配列でない assistant → undefined', () => {
    const tuning = defaultSettings();
    // Set は iterable だが配列でない: guard が無ければ thinking を拾って defined になる。
    const blocks = new Set([
      { type: 'thinking', thinking: degenerate(), thinkingSignature: 'reasoning_content' },
    ]);
    const message = assistantMessage({ content: blocks });
    expect(scrubMessage(message, tuning)).toBeUndefined();
  });

  it('2 ブロックのうち 1 つだけ退化 → その 1 つだけ書き換わる', () => {
    const tuning = defaultSettings();
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

  it('差し替え後も thinkingSignature と usage と stopReason と timestamp が同じ値', () => {
    const tuning = defaultSettings();
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

  it('本文が 1 つの区間だけ → undefined', () => {
    const tuning = defaultSettings();
    const fullRun = DEGENERATE_UNIT.repeat(DEGENERATE_REPEATS);
    const message = thinkingMessage(fullRun, 'reasoning_content');
    expect(scrubMessage(message, tuning)).toBeUndefined();
  });

  it('2 ブロックのうち片方が全部区間 → 片方は元のまま、removed は畳んだ分だけ', () => {
    const tuning = defaultSettings();
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

describe('scrubMessage chars', () => {
  it('chars は元の長さから畳んだ長さを引いた値', () => {
    const tuning = defaultSettings();
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
