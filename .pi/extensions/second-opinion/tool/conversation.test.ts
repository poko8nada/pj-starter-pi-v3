import { describe, expect, it } from 'vitest';
import { messagesFrom, windowFrom, type AgentMessage } from './conversation.ts';

// `AgentMessage` の literal を fixture にする。渡すのは本物の pi の文脈ではなく、ここで組んだ物だけ。

const USAGE = {
  input: 0,
  output: 0,
  cacheRead: 0,
  cacheWrite: 0,
  totalTokens: 0,
  cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0, total: 0 },
};

/** owner の発言1件 */
function owner(text: string): AgentMessage {
  return { role: 'user', content: text, timestamp: 1 };
}

/** assistant の本文の部品 */
type AssistantContent = Extract<AgentMessage, { role: 'assistant' }>['content'];

/** agent の発言1件。部品はテキスト・考える分・道具の呼び出し */
function agent(parts: AssistantContent): AgentMessage {
  return {
    role: 'assistant',
    content: parts,
    api: 'test',
    provider: 'test',
    model: 'test',
    usage: USAGE,
    stopReason: 'stop',
    timestamp: 1,
  };
}

/** テキストだけの agent */
function say(text: string): AgentMessage {
  return agent([{ type: 'text', text }]);
}

/** 道具の引数の形 */
type ToolArguments = Extract<AssistantContent[number], { type: 'toolCall' }>['arguments'];

/** 道具の呼び出しだけの agent */
function call(id: string, name: string, args: ToolArguments): AgentMessage {
  return agent([{ type: 'toolCall', id, name, arguments: args }]);
}

/** 道具の結果1件 */
function result(toolCallId: string, toolName: string, text: string): AgentMessage {
  return {
    role: 'toolResult',
    toolCallId,
    toolName,
    content: [{ type: 'text', text }],
    isError: false,
    timestamp: 1,
  };
}

describe('windowFrom: 直近 N 件', () => {
  it('直近 N 件だけを残し、落とした件数を返す', () => {
    const messages = [owner('one'), say('two'), owner('three'), say('four'), owner('five')];
    const window = windowFrom(messages, 2, 'opinion');
    expect(window.text).toBe('agent: four\nowner: five');
    expect(window.dropped).toBe(3);
  });

  it('N が件数より多い → 全部残し、落としたのは 0', () => {
    const window = windowFrom([owner('only')], 20, 'opinion');
    expect(window.text).toBe('owner: only');
    expect(window.dropped).toBe(0);
  });
});

describe('windowFrom: 道具', () => {
  it('引数と結果を、道具名つきで出す', () => {
    const messages = [
      call('1', 'read', { path: 'cycles/011/plan/x.md' }),
      result('1', 'read', 'the plan'),
      call('2', 'bash', { command: 'git status' }),
      result('2', 'bash', 'clean'),
      call('3', 'web_search', { queries: ['second opinion'] }),
      call('4', 'fetch_content', { urls: ['https://example.com'] }),
    ];
    const window = windowFrom(messages, 20, 'opinion');
    expect(window.text).toContain('agent: [tool: read] path=cycles/011/plan/x.md');
    expect(window.text).toContain('agent: [tool: read] result: the plan');
    expect(window.text).toContain('agent: [tool: bash] command=git status');
    expect(window.text).toContain('queries=');
    expect(window.text).toContain('urls=');
  });

  it('自分の道具の呼び出しと結果は入れない', () => {
    const messages = [
      owner('is this consistent?'),
      call('9', 'opinion', { focus: 'check' }),
      result('9', 'opinion', 'Consistent: yes'),
      say('thanks'),
    ];
    const window = windowFrom(messages, 20, 'opinion');
    expect(window.text).toBe('owner: is this consistent?\nagent: thanks');
  });

  it('呼び出し id で結び付く自分の道具の結果も入れない', () => {
    const messages = [call('9', 'opinion', { focus: 'check' }), result('9', 'other', 'leaked')];
    const window = windowFrom(messages, 20, 'opinion');
    expect(window.text).toBe('');
  });

  it('窓外に落ちた自分の道具の呼び出しに対応する結果も入れない', () => {
    const messages = [call('9', 'opinion', { focus: 'check' }), result('9', 'other', 'leaked')];
    const window = windowFrom(messages, 1, 'opinion');
    expect(window.text).toBe('');
    expect(window.dropped).toBe(1);
  });
});

describe('windowFrom: 打切り', () => {
  it('長い発言は切る', () => {
    const window = windowFrom([say(`x${'あ'.repeat(4000)}`)], 20, 'opinion');
    expect(window.text).toContain('…(truncated)');
    expect(window.text).not.toContain('あ'.repeat(4000));
  });

  it('ちょうど上限の発言は切らない', () => {
    const text = 'a'.repeat(4000);
    const window = windowFrom([say(text)], 20, 'opinion');
    expect(window.text).toBe(`agent: ${text}`);
  });

  it('長い道具の結果は 2000 字で切る', () => {
    const window = windowFrom([result('1', 'read', 'b'.repeat(2001))], 20, 'opinion');
    expect(window.text).toContain('…(truncated)');
    expect(window.text.length).toBeLessThan('agent: [tool: read] result: '.length + 2001 + 20);
  });
});

describe('windowFrom: 空と不正', () => {
  it('会話が空 → 空の窓', () => {
    expect(windowFrom([], 20, 'opinion')).toEqual({ text: '', dropped: 0 });
  });

  it('N が 0 以下 → 投げる', () => {
    expect(() => windowFrom([owner('hi')], 0, 'opinion')).toThrow(/positive integer/);
    expect(() => windowFrom([owner('hi')], -3, 'opinion')).toThrow(/positive integer/);
  });
});

describe('windowFrom: 出さない物', () => {
  it('system と custom は会話ではないので出さない', () => {
    const system: AgentMessage = { role: 'system', content: 'you are pi', timestamp: 1 };
    const custom =
      // oxlint-disable-next-line typescript/no-unsafe-type-assertion -- 型に無い役割の除外を試すための、意図的な不正形
      { role: 'custom', content: 'nudge' } as unknown as AgentMessage;
    const window = windowFrom([system, custom, owner('hi')], 20, 'opinion');
    expect(window.text).toBe('owner: hi');
  });

  it('考える分（thinking）は出さない', () => {
    const thinking = agent([{ type: 'thinking', thinking: 'hmm' }]);
    const window = windowFrom([thinking, say('done')], 20, 'opinion');
    expect(window.text).toBe('agent: done');
  });
});

describe('messagesFrom: セッションの entry から会話を取り出す', () => {
  it('type: "message" の entry だけを、順番どおりに取り出す', () => {
    const entries = [
      { type: 'model_change', model: 'x' },
      { type: 'message', message: owner('hi') },
      { type: 'compaction', summary: '...' },
      { type: 'message', message: say('done') },
    ];
    expect(messagesFrom(entries)).toEqual([owner('hi'), say('done')]);
  });

  it('message が無い entry と、形の違う entry は飛ばす', () => {
    const entries = [{ type: 'message' }, { type: 'message', message: 'not an object' }, null, 7];
    expect(messagesFrom(entries)).toEqual([]);
  });

  it('entry が無ければ空', () => {
    expect(messagesFrom([])).toEqual([]);
  });
});
