import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import type {
  AgentSettledEvent,
  BeforeAgentStartEvent,
  MessageEndEvent,
  MessageUpdateEvent,
} from '@earendil-works/pi-coding-agent';
import { tempDir } from '../../../test/temp-dir.ts';
import { createScrubWiring, registerScrub, type PiPort } from './index.ts';
import { MAX_ABORTS, MIN_THINKING, SCAN_EVERY } from './live/guard.ts';
import { readSettings } from './settings/read.ts';

const HERE = dirname(fileURLToPath(import.meta.url));

type AgentMessage = MessageEndEvent['message'];

// PiPort は on と registerCommand と sendMessage を記録する偽物で渡す。

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

function loopSentence(index: number): string {
  return `scrub loop ${index} continues the same reasoning about the task and its details.`;
}

function thinkingWithRun(length: number): string {
  const pattern = [loopSentence(0), loopSentence(1), loopSentence(2)];
  const cycle = pattern.join(' ');
  let text = '';
  while (text.length < length) {
    text += (text.length === 0 ? '' : ' ') + cycle;
  }
  return text.slice(0, length);
}

function assistantThinking(thinking: string, signature?: string): AgentMessage {
  const block: Record<string, unknown> =
    signature === undefined
      ? { type: 'thinking', thinking }
      : { type: 'thinking', thinking, thinkingSignature: signature };
  return assistantMessage({ content: [block] });
}

function fakePi(): {
  readonly events: string[];
  readonly handlers: Map<string, (event: unknown, ctx?: unknown) => unknown>;
  readonly commands: Map<string, (args: string, ctx: unknown) => unknown>;
  readonly sent: { readonly message: unknown; readonly options: unknown }[];
  readonly pi: PiPort;
} {
  const events: string[] = [];
  const handlers = new Map<string, (event: unknown, ctx?: unknown) => unknown>();
  const commands = new Map<string, (args: string, ctx: unknown) => unknown>();
  const sent: { readonly message: unknown; readonly options: unknown }[] = [];
  const pi = {
    on: (event: string, handler: (event: unknown, ctx?: unknown) => unknown) => {
      events.push(event);
      handlers.set(event, handler);
      return () => undefined;
    },
    registerCommand: (
      name: string,
      options: { readonly handler: (args: string, ctx: unknown) => unknown },
    ) => {
      commands.set(name, options.handler);
    },
    sendMessage: (message: unknown, options?: unknown) => {
      sent.push({ message, options });
    },
  };
  // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion -- 偽物は使う口だけ持つ
  return { events, handlers, commands, sent, pi: pi as unknown as PiPort };
}

function fakeCmdCtx(): {
  readonly notified: string[];
  readonly levels: (string | undefined)[];
  readonly aborts: () => number;
  readonly ctx: {
    readonly ui: {
      readonly notify: (message: string, level?: 'info' | 'warning' | 'error') => void;
    };
    readonly abort: () => void;
  };
} {
  const notified: string[] = [];
  const levels: (string | undefined)[] = [];
  let aborted = 0;
  return {
    notified,
    levels,
    aborts: () => aborted,
    ctx: {
      ui: {
        notify: (message: string, level?: 'info' | 'warning' | 'error') => {
          notified.push(message);
          levels.push(level);
        },
      },
      abort: () => {
        aborted += 1;
      },
    },
  };
}

function messageEnd(message: AgentMessage): MessageEndEvent {
  return { type: 'message_end', message };
}

function messageUpdate(message: AgentMessage): MessageUpdateEvent {
  return {
    type: 'message_update',
    message,
    assistantMessageEvent: { type: 'thinking_delta', contentIndex: 0, delta: '', partial: message },
    // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion -- 偽物の event を作る
  } as unknown as MessageUpdateEvent;
}

function agentSettled(aborted: boolean): AgentSettledEvent {
  return { type: 'agent_settled', aborted };
}

function beforeUser(): BeforeAgentStartEvent {
  return {
    type: 'before_agent_start',
    messageType: 'user',
    prompt: 'do the task',
    systemPrompt: '',
    systemPromptOptions: {},
    // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion -- 偽物の event を作る
  } as unknown as BeforeAgentStartEvent;
}

function beforeCustom(): BeforeAgentStartEvent {
  return {
    type: 'before_agent_start',
    messageType: 'custom',
    message: {
      role: 'custom',
      customType: 'thinking-scrub',
      content: 'follow up',
      display: true,
      timestamp: 1,
    },
    systemPrompt: '',
    systemPromptOptions: {},
    // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion -- 偽物の event を作る
  } as unknown as BeforeAgentStartEvent;
}

function tallyThinking(): string {
  return `header-12345${'abcd'.repeat(7).slice(0, 27)}suffix-67890`;
}

function tallyMessage(): AgentMessage {
  return assistantMessage({
    content: [
      { type: 'thinking', thinking: tallyThinking(), thinkingSignature: 'reasoning_content' },
    ],
  });
}

describe('registerScrub', () => {
  it("on が 5 件の順序で、registerCommand('thinking-scrub') が 1 回", () => {
    const fake = fakePi();
    registerScrub(fake.pi, { settingsDir: tempDir(), now: () => 1, followUp: () => undefined });
    expect(fake.events).toEqual([
      'message_update',
      'message_end',
      'agent_settled',
      'agent_end',
      'before_agent_start',
    ]);
    expect([...fake.commands.keys()]).toEqual(['thinking-scrub']);
  });
});

describe('onMessageEnd', () => {
  it('退化した thinking を持つ assistant を handler に渡す → { message } が返り、thinking から区間が消えている', () => {
    const wiring = createScrubWiring({
      settingsDir: tempDir(),
      now: () => 7,
      followUp: () => undefined,
    });
    const result = wiring.onMessageEnd(messageEnd(assistantMessage()));
    expect(result).toBeDefined();
    if (result === undefined) {
      throw new Error('result must be defined');
    }
    if (result.message === undefined) {
      throw new Error('message must be defined');
    }
    if (result.message.role !== 'assistant') {
      throw new Error('message must be assistant');
    }
    const first = result.message.content.at(0);
    if (typeof first !== 'object' || first === null || !('thinking' in first)) {
      throw new Error('first block must be thinking');
    }
    expect(first.thinking).toBe('foo bar');
  });

  it('退化の無い assistant → undefined', () => {
    const wiring = createScrubWiring({
      settingsDir: tempDir(),
      now: () => 7,
      followUp: () => undefined,
    });
    const message = assistantMessage({
      content: [
        {
          type: 'thinking',
          thinking: 'normal thinking here',
          thinkingSignature: 'reasoning_content',
        },
      ],
    });
    expect(wiring.onMessageEnd(messageEnd(message))).toBeUndefined();
  });

  it('role が assistant 以外、対象でない署名の assistant → どちらも undefined', () => {
    const wiring = createScrubWiring({
      settingsDir: tempDir(),
      now: () => 7,
      followUp: () => undefined,
    });
    const user: AgentMessage = {
      role: 'user',
      content: [{ type: 'text', text: degenerate() }],
      timestamp: 1,
    };
    expect(wiring.onMessageEnd(messageEnd(user))).toBeUndefined();
    const other = assistantMessage({
      content: [{ type: 'thinking', thinking: degenerate(), thinkingSignature: 'other' }],
    });
    expect(wiring.onMessageEnd(messageEnd(other))).toBeUndefined();
  });

  it('設定が enabled: false → undefined', () => {
    const dir = tempDir();
    writeFileSync(join(dir, 'settings.json'), JSON.stringify({ enabled: false }));
    const wiring = createScrubWiring({ settingsDir: dir, now: () => 7, followUp: () => undefined });
    expect(wiring.onMessageEnd(messageEnd(assistantMessage()))).toBeUndefined();
    expect(wiring.getStatus().removed).toBe(0);
  });

  it('設定が壊れている → 既定で差し替えが返り、状態の failures は増えない', () => {
    const dir = tempDir();
    writeFileSync(join(dir, 'settings.json'), '{');
    const wiring = createScrubWiring({ settingsDir: dir, now: () => 7, followUp: () => undefined });
    const result = wiring.onMessageEnd(messageEnd(assistantMessage()));
    expect(result).toBeDefined();
    expect(wiring.getStatus().failures).toBe(0);
    expect(wiring.getStatus().removed).toBe(1);
  });

  it('2 回畳む → 状態の removed が 2 回分の合計', () => {
    const wiring = createScrubWiring({
      settingsDir: tempDir(),
      now: () => 7,
      followUp: () => undefined,
    });
    expect(wiring.onMessageEnd(messageEnd(assistantMessage()))).toBeDefined();
    expect(wiring.onMessageEnd(messageEnd(assistantMessage()))).toBeDefined();
    expect(wiring.getStatus().removed).toBe(2);
    expect(wiring.getStatus().lastAt).toBe(7);
  });
});

describe('onMessageUpdate', () => {
  it(`${MIN_THINKING} 文字の run → abort が 1 回`, () => {
    const wiring = createScrubWiring({
      settingsDir: tempDir(),
      now: () => 7,
      followUp: () => undefined,
    });
    const thinking = thinkingWithRun(MIN_THINKING);
    expect(thinking).toHaveLength(MIN_THINKING);
    const fake = fakeCmdCtx();
    wiring.onMessageUpdate(
      messageUpdate(assistantThinking(thinking, 'reasoning_content')),
      fake.ctx,
    );
    expect(fake.aborts()).toBe(1);
  });

  it(`${MIN_THINKING - 1} 文字の run → abort なし`, () => {
    const wiring = createScrubWiring({
      settingsDir: tempDir(),
      now: () => 7,
      followUp: () => undefined,
    });
    const thinking = thinkingWithRun(MIN_THINKING).slice(0, MIN_THINKING - 1);
    expect(thinking).toHaveLength(MIN_THINKING - 1);
    const fake = fakeCmdCtx();
    wiring.onMessageUpdate(
      messageUpdate(assistantThinking(thinking, 'reasoning_content')),
      fake.ctx,
    );
    expect(fake.aborts()).toBe(0);
    expect(wiring.getStatus().failures).toBe(0);
  });

  it('enabled: false → run でも abort なし', () => {
    const dir = tempDir();
    writeFileSync(join(dir, 'settings.json'), JSON.stringify({ enabled: false }));
    const wiring = createScrubWiring({ settingsDir: dir, now: () => 7, followUp: () => undefined });
    const fake = fakeCmdCtx();
    wiring.onMessageUpdate(
      messageUpdate(assistantThinking(thinkingWithRun(MIN_THINKING), 'reasoning_content')),
      fake.ctx,
    );
    expect(fake.aborts()).toBe(0);
  });

  it('署名の無い thinking でも run → abort', () => {
    const wiring = createScrubWiring({
      settingsDir: tempDir(),
      now: () => 7,
      followUp: () => undefined,
    });
    const fake = fakeCmdCtx();
    wiring.onMessageUpdate(
      messageUpdate(assistantThinking(thinkingWithRun(MIN_THINKING))),
      fake.ctx,
    );
    expect(fake.aborts()).toBe(1);
  });

  it('thinking の取得が投げる → 投げずに failures が 1 増える', () => {
    const wiring = createScrubWiring({
      settingsDir: tempDir(),
      now: () => 7,
      followUp: () => undefined,
    });
    const evil = {
      type: 'thinking',
      get thinking(): string {
        throw new Error('boom');
      },
    };
    const message = assistantMessage({ content: [evil] });
    const fake = fakeCmdCtx();
    expect(() => {
      wiring.onMessageUpdate(messageUpdate(message), fake.ctx);
    }).not.toThrow();
    expect(fake.aborts()).toBe(0);
    expect(wiring.getStatus().failures).toBe(1);
  });
});

describe('onAgentSettled', () => {
  it('aborted: true のあと → custom メッセージが 1 件、見本つき', () => {
    const sent: string[] = [];
    const wiring = createScrubWiring({
      settingsDir: tempDir(),
      now: () => 7,
      followUp: (content) => {
        sent.push(content);
      },
    });
    const thinking = thinkingWithRun(MIN_THINKING);
    const fake = fakeCmdCtx();
    wiring.onMessageUpdate(
      messageUpdate(assistantThinking(thinking, 'reasoning_content')),
      fake.ctx,
    );
    expect(fake.aborts()).toBe(1);
    wiring.onAgentSettled(agentSettled(true));
    expect(sent).toHaveLength(1);
    const first = sent.at(0);
    if (first === undefined) {
      throw new Error('followUp must be called');
    }
    expect(first).toContain('repeating');
    expect(first).toContain(loopSentence(0).slice(0, 20));
  });

  it('fake の sendMessage 経由 → customType と表示と triggerTurn が記録される', () => {
    const fake = fakePi();
    registerScrub(fake.pi, {
      settingsDir: tempDir(),
      now: () => 7,
      followUp: (content) => {
        fake.pi.sendMessage(
          { customType: 'thinking-scrub', content, display: true },
          { triggerTurn: true },
        );
      },
    });
    const update = fake.handlers.get('message_update');
    const settled = fake.handlers.get('agent_settled');
    if (update === undefined || settled === undefined) {
      throw new Error('handlers must exist');
    }
    let aborted = 0;
    const ctx = {
      abort: () => {
        aborted += 1;
      },
    };
    update(
      messageUpdate(assistantThinking(thinkingWithRun(MIN_THINKING), 'reasoning_content')),
      ctx,
    );
    expect(aborted).toBe(1);
    settled(agentSettled(true), {});
    expect(fake.sent).toHaveLength(1);
    const first = fake.sent.at(0);
    if (first === undefined) {
      throw new Error('must send');
    }
    expect(first.message).toMatchObject({
      customType: 'thinking-scrub',
      display: true,
      content: expect.stringContaining('repeating'),
    });
    expect(first.options).toMatchObject({ triggerTurn: true });
  });

  it('aborted: false → 何も送らない', () => {
    const sent: string[] = [];
    const wiring = createScrubWiring({
      settingsDir: tempDir(),
      now: () => 7,
      followUp: (content) => {
        sent.push(content);
      },
    });
    const fake = fakeCmdCtx();
    wiring.onMessageUpdate(
      messageUpdate(assistantThinking(thinkingWithRun(MIN_THINKING), 'reasoning_content')),
      fake.ctx,
    );
    expect(fake.aborts()).toBe(1);
    wiring.onAgentSettled(agentSettled(false));
    expect(sent).toHaveLength(0);
  });
});

describe('onBeforeAgentStart', () => {
  it(`user で戻り、${MAX_ABORTS} 回の後もまた止まれる。custom では戻らない`, () => {
    const wiring = createScrubWiring({
      settingsDir: tempDir(),
      now: () => 7,
      followUp: () => undefined,
    });
    const first = fakeCmdCtx();
    wiring.onMessageUpdate(
      messageUpdate(assistantThinking(thinkingWithRun(MIN_THINKING), 'reasoning_content')),
      first.ctx,
    );
    expect(first.aborts()).toBe(1);
    const second = fakeCmdCtx();
    wiring.onMessageUpdate(
      messageUpdate(
        assistantThinking(thinkingWithRun(MIN_THINKING + SCAN_EVERY), 'reasoning_content'),
      ),
      second.ctx,
    );
    expect(second.aborts()).toBe(1);
    expect(wiring.getStatus().failures).toBe(0);
    const third = fakeCmdCtx();
    wiring.onMessageUpdate(
      messageUpdate(
        assistantThinking(thinkingWithRun(MIN_THINKING + SCAN_EVERY * 2), 'reasoning_content'),
      ),
      third.ctx,
    );
    expect(third.aborts()).toBe(0);
    wiring.onBeforeAgentStart(beforeCustom());
    const fourth = fakeCmdCtx();
    wiring.onMessageUpdate(
      messageUpdate(
        assistantThinking(thinkingWithRun(MIN_THINKING + SCAN_EVERY * 3), 'reasoning_content'),
      ),
      fourth.ctx,
    );
    expect(fourth.aborts()).toBe(0);
    wiring.onBeforeAgentStart(beforeUser());
    const fifth = fakeCmdCtx();
    wiring.onMessageUpdate(
      messageUpdate(assistantThinking(thinkingWithRun(MIN_THINKING), 'reasoning_content')),
      fifth.ctx,
    );
    expect(fifth.aborts()).toBe(1);
  });
});

describe('onAgentEnd', () => {
  it('51 文字→25 文字の message_end が 2 回、そのあと agent_end → notify が 1 回、文が一致する', () => {
    expect(tallyThinking()).toHaveLength(51);
    const wiring = createScrubWiring({
      settingsDir: tempDir(),
      now: () => 7,
      followUp: () => undefined,
    });
    expect(wiring.onMessageEnd(messageEnd(tallyMessage()))).toBeDefined();
    expect(wiring.onMessageEnd(messageEnd(tallyMessage()))).toBeDefined();
    const { notified, levels, ctx } = fakeCmdCtx();
    wiring.onAgentEnd(ctx);
    expect(notified).toHaveLength(1);
    expect(notified.at(0)).toBe('thinking-scrub: removed 2 (52 chars)');
    expect(levels.at(0)).toBe('info');
  });

  it('何も消していない状態で agent_end → notify が呼ばれない', () => {
    const wiring = createScrubWiring({
      settingsDir: tempDir(),
      now: () => 7,
      followUp: () => undefined,
    });
    const { notified, ctx } = fakeCmdCtx();
    wiring.onAgentEnd(ctx);
    expect(notified).toHaveLength(0);
  });

  it('show が偽のとき message_end のあと agent_end → notify が呼ばれない', () => {
    const dir = tempDir();
    writeFileSync(join(dir, 'settings.json'), JSON.stringify({ enabled: true, show: false }));
    const wiring = createScrubWiring({ settingsDir: dir, now: () => 7, followUp: () => undefined });
    expect(wiring.onMessageEnd(messageEnd(tallyMessage()))).toBeDefined();
    const { notified, ctx } = fakeCmdCtx();
    wiring.onAgentEnd(ctx);
    expect(notified).toHaveLength(0);
  });

  it('notify のあと再度 agent_end → 2 回目は呼ばれない', () => {
    const wiring = createScrubWiring({
      settingsDir: tempDir(),
      now: () => 7,
      followUp: () => undefined,
    });
    wiring.onMessageEnd(messageEnd(tallyMessage()));
    const { notified, ctx } = fakeCmdCtx();
    wiring.onAgentEnd(ctx);
    expect(notified).toHaveLength(1);
    wiring.onAgentEnd(ctx);
    expect(notified).toHaveLength(1);
  });

  it('notify のあとに message_end → agent_end → もう一度 1 回呼ばれ、その実行の分だけになる', () => {
    const wiring = createScrubWiring({
      settingsDir: tempDir(),
      now: () => 7,
      followUp: () => undefined,
    });
    wiring.onMessageEnd(messageEnd(tallyMessage()));
    wiring.onMessageEnd(messageEnd(tallyMessage()));
    const { notified, ctx } = fakeCmdCtx();
    wiring.onAgentEnd(ctx);
    expect(notified).toHaveLength(1);
    expect(notified.at(0)).toBe('thinking-scrub: removed 2 (52 chars)');
    wiring.onMessageEnd(messageEnd(tallyMessage()));
    wiring.onAgentEnd(ctx);
    expect(notified).toHaveLength(2);
    expect(notified.at(1)).toBe('thinking-scrub: removed 1 (26 chars)');
  });

  it('message_end で例外 → failures が 1 増え、そのあとの agent_end は notify を呼ばない', () => {
    const wiring = createScrubWiring({
      settingsDir: tempDir(),
      now: () => 7,
      followUp: () => undefined,
    });
    const evil: Record<string, unknown> = {};
    Object.defineProperty(evil, 'role', {
      get() {
        throw new Error('boom');
      },
    });
    // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion -- 投げる偽物を作る
    const message = evil as unknown as AgentMessage;
    expect(wiring.onMessageEnd(messageEnd(message))).toBeUndefined();
    expect(wiring.getStatus().failures).toBe(1);
    const { notified, ctx } = fakeCmdCtx();
    wiring.onAgentEnd(ctx);
    expect(notified).toHaveLength(0);
  });
});

describe('integration', () => {
  it('foo + 改行を含む細切れの退化 → message_end の thinking が foo改行改行bar、agent_end で 1 行に removed 1', () => {
    const thinking = `foo${'\n\nThe **'.repeat(5)}bar`;
    const wiring = createScrubWiring({
      settingsDir: tempDir(),
      now: () => 7,
      followUp: () => undefined,
    });
    const result = wiring.onMessageEnd(
      messageEnd(
        assistantMessage({
          content: [{ type: 'thinking', thinking, thinkingSignature: 'reasoning_content' }],
        }),
      ),
    );
    expect(result).toBeDefined();
    if (result?.message?.role !== 'assistant') {
      throw new Error('message must be assistant');
    }
    const first = result.message.content.at(0);
    if (typeof first !== 'object' || first === null || !('thinking' in first)) {
      throw new Error('first block must be thinking');
    }
    expect(first.thinking).toBe('foo\n\nbar');
    const { notified, levels, ctx } = fakeCmdCtx();
    wiring.onAgentEnd(ctx);
    expect(notified).toHaveLength(1);
    expect(notified.at(0)).toContain('removed 1');
    expect(levels.at(0)).toBe('info');
  });

  it('The ** × 2 (12 文字) → message_end が undefined、agent_end でも notify が呼ばれない', () => {
    const thinking = 'The **'.repeat(2);
    expect(thinking).toHaveLength(12);
    const wiring = createScrubWiring({
      settingsDir: tempDir(),
      now: () => 7,
      followUp: () => undefined,
    });
    expect(
      wiring.onMessageEnd(
        messageEnd(
          assistantMessage({
            content: [{ type: 'thinking', thinking, thinkingSignature: 'reasoning_content' }],
          }),
        ),
      ),
    ).toBeUndefined();
    const { notified, ctx } = fakeCmdCtx();
    wiring.onAgentEnd(ctx);
    expect(notified).toHaveLength(0);
  });

  it('hide を書いた設定で細切れの退化 → message_end は差し替え、agent_end で 1 行も出ない', () => {
    const dir = tempDir();
    writeFileSync(join(dir, 'settings.json'), JSON.stringify({ enabled: true, show: false }));
    const thinking = `foo${'\n\nThe **'.repeat(5)}bar`;
    const wiring = createScrubWiring({ settingsDir: dir, now: () => 7, followUp: () => undefined });
    expect(
      wiring.onMessageEnd(
        messageEnd(
          assistantMessage({
            content: [{ type: 'thinking', thinking, thinkingSignature: 'reasoning_content' }],
          }),
        ),
      ),
    ).toBeDefined();
    const { notified, ctx } = fakeCmdCtx();
    wiring.onAgentEnd(ctx);
    expect(notified).toHaveLength(0);
  });
});

describe('onCommand', () => {
  it('コマンド off → settings.json の enabled が偽になり、次の message_end は undefined', () => {
    const dir = tempDir();
    const wiring = createScrubWiring({ settingsDir: dir, now: () => 7, followUp: () => undefined });
    wiring.onCommand('off', fakeCmdCtx().ctx);
    expect(JSON.parse(readFileSync(join(dir, 'settings.json'), 'utf8'))).toEqual({
      enabled: false,
    });
    expect(wiring.onMessageEnd(messageEnd(assistantMessage()))).toBeUndefined();
  });

  it('コマンド on → その後の message_end が差し替えを返す', () => {
    const dir = tempDir();
    writeFileSync(join(dir, 'settings.json'), JSON.stringify({ enabled: false }));
    const wiring = createScrubWiring({ settingsDir: dir, now: () => 7, followUp: () => undefined });
    expect(wiring.onMessageEnd(messageEnd(assistantMessage()))).toBeUndefined();
    wiring.onCommand('on', fakeCmdCtx().ctx);
    expect(wiring.onMessageEnd(messageEnd(assistantMessage()))).toBeDefined();
  });

  it('コマンドが引数無し → 通知が 1 回呼ばれ、runCommand の行が渡る', () => {
    const wiring = createScrubWiring({
      settingsDir: tempDir(),
      now: () => 7,
      followUp: () => undefined,
    });
    const { notified, ctx } = fakeCmdCtx();
    wiring.onCommand('', ctx);
    expect(notified).toHaveLength(1);
    expect(notified.at(0)).toContain('thinking-scrub:');
    expect(notified.at(0)).toContain('removed:');
  });

  it('コマンド hide → settings.json の show が偽になり、enabled はそのまま', () => {
    const dir = tempDir();
    writeFileSync(join(dir, 'settings.json'), JSON.stringify({ enabled: true, show: true }));
    const wiring = createScrubWiring({ settingsDir: dir, now: () => 7, followUp: () => undefined });
    wiring.onCommand('hide', fakeCmdCtx().ctx);
    expect(JSON.parse(readFileSync(join(dir, 'settings.json'), 'utf8'))).toEqual({
      enabled: true,
      show: false,
    });
  });

  it('コマンド off → 既存の show:false が保たれる', () => {
    const dir = tempDir();
    writeFileSync(join(dir, 'settings.json'), JSON.stringify({ enabled: true, show: false }));
    const wiring = createScrubWiring({ settingsDir: dir, now: () => 7, followUp: () => undefined });
    wiring.onCommand('off', fakeCmdCtx().ctx);
    expect(JSON.parse(readFileSync(join(dir, 'settings.json'), 'utf8'))).toEqual({
      enabled: false,
      show: false,
    });
  });

  it('コマンド on → 既存の show:false が保たれる', () => {
    const dir = tempDir();
    writeFileSync(join(dir, 'settings.json'), JSON.stringify({ enabled: false, show: false }));
    const wiring = createScrubWiring({ settingsDir: dir, now: () => 7, followUp: () => undefined });
    wiring.onCommand('on', fakeCmdCtx().ctx);
    expect(JSON.parse(readFileSync(join(dir, 'settings.json'), 'utf8'))).toEqual({
      enabled: true,
      show: false,
    });
  });

  it('置いた settings.json を readSettings で読む → enabled と show が真', () => {
    const read = readSettings(HERE);
    expect(read.kind).toBe('ok');
    if (read.kind !== 'ok') {
      throw new Error('settings.json must be readable');
    }
    expect(read.settings).toEqual({ enabled: true, show: true });
  });
});
