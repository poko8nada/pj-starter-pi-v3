import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import type {
  AgentSettledEvent,
  BeforeAgentStartEvent,
  MessageEndEvent,
  MessageUpdateEvent,
  NormalizedBuildSystemPromptOptions,
} from '@earendil-works/pi-coding-agent';
import {
  DEGENERATE_UNIT,
  FOLLOWUP_REPEATING,
  SCRUB_PREFIX,
  SCRUB_REMOVED_LABEL,
  SCRUB_REMOVED_MARK,
  assistantMessage,
  degenerate,
  degenerateExpected,
  thinkingWithRun,
} from './scrub.fixture.ts';
import { tempDir } from '../../../test/temp-dir.ts';
import { createScrubWiring, registerScrub, type PiPort } from './index.ts';
import { readSettings } from './settings/read.ts';
import { defaultSettings, type SettingsRead } from './settings/schema.ts';

function okSettings(): SettingsRead {
  return { kind: 'ok', settings: defaultSettings() };
}

type AgentMessage = MessageEndEvent['message'];

// PiPort は on と registerCommand と sendMessage を記録する偽物で渡す。

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
  if (message.role !== 'assistant') {
    throw new Error('messageUpdate は assistant のメッセージだけを受ける');
  }
  return {
    type: 'message_update',
    message,
    assistantMessageEvent: { type: 'thinking_delta', contentIndex: 0, delta: '', partial: message },
  };
}

function agentSettled(aborted: boolean): AgentSettledEvent {
  return { type: 'agent_settled', aborted };
}

function normalizedPromptOptions(): NormalizedBuildSystemPromptOptions {
  return {
    cwd: '/repo',
    selectedTools: [],
    hiddenTools: [],
    toolSnippets: {},
    toolGuidelines: {},
    promptGuidelines: [],
    appendSystemPrompt: '',
    sections: {},
    contextFiles: [],
    skills: [],
  };
}

function beforeUser(): BeforeAgentStartEvent {
  return {
    type: 'before_agent_start',
    messageType: 'user',
    prompt: 'do the task',
    systemPrompt: '',
    systemPromptOptions: normalizedPromptOptions(),
  };
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
    systemPromptOptions: normalizedPromptOptions(),
  };
}

function degenerateChars(): number {
  return degenerate().length - degenerateExpected().length;
}

function removedLine(runs: number, chars: number): string {
  return `${SCRUB_REMOVED_MARK} ${runs} (${chars} chars)`;
}

describe('registerScrub', () => {
  it("on が 5 件の順序で、registerCommand('thinking-scrub') が 1 回", () => {
    const fake = fakePi();
    registerScrub(fake.pi, {
      settingsDir: tempDir(),
      now: () => 1,
      followUp: () => undefined,
      readSettings: () => okSettings(),
    });
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
  it('退化の無い assistant → undefined', () => {
    const wiring = createScrubWiring({
      settingsDir: tempDir(),
      now: () => 7,
      followUp: () => undefined,
      readSettings: () => okSettings(),
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
      readSettings: () => okSettings(),
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
    const wiring = createScrubWiring({
      settingsDir: dir,
      now: () => 7,
      followUp: () => undefined,
      readSettings: () => readSettings(dir),
    });
    expect(wiring.onMessageEnd(messageEnd(assistantMessage()))).toBeUndefined();
    expect(wiring.getStatus().removed).toBe(0);
  });

  it('設定が壊れている → 既定で差し替えが返り、状態の failures は増えない', () => {
    const dir = tempDir();
    writeFileSync(join(dir, 'settings.json'), '{');
    const wiring = createScrubWiring({
      settingsDir: dir,
      now: () => 7,
      followUp: () => undefined,
      readSettings: () => readSettings(dir),
    });
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
      readSettings: () => okSettings(),
    });
    expect(wiring.onMessageEnd(messageEnd(assistantMessage()))).toBeDefined();
    expect(wiring.onMessageEnd(messageEnd(assistantMessage()))).toBeDefined();
    expect(wiring.getStatus().removed).toBe(2);
    expect(wiring.getStatus().lastAt).toBe(7);
  });

  it('1 回の message_end → 作成時の 1 回と message_end の 1 回で 2 回呼ぶ', () => {
    let calls = 0;
    const wiring = createScrubWiring({
      settingsDir: tempDir(),
      now: () => 7,
      followUp: () => undefined,
      readSettings: () => {
        calls += 1;
        return okSettings();
      },
    });
    expect(calls).toBe(1);
    expect(wiring.onMessageEnd(messageEnd(assistantMessage()))).toBeDefined();
    expect(calls).toBe(2);
  });

  it('okSettings と message_end → 3 グループの既定値で差し替える', () => {
    const wiring = createScrubWiring({
      settingsDir: tempDir(),
      now: () => 7,
      followUp: () => undefined,
      readSettings: () => okSettings(),
    });
    const result = wiring.onMessageEnd(messageEnd(assistantMessage()));
    expect(result).toBeDefined();
    if (result?.message?.role !== 'assistant') {
      throw new Error('message must be assistant');
    }
    const first = result.message.content.at(0);
    if (typeof first !== 'object' || first === null || !('thinking' in first)) {
      throw new Error('first block must be thinking');
    }
    expect(first.thinking).toBe(degenerateExpected());
  });

  it('char.minLength を 100 にした設定と message_end → 66 文字の退化を差し替えない', () => {
    const strict: SettingsRead = {
      kind: 'ok',
      settings: {
        ...defaultSettings(),
        char: { ...defaultSettings().char, minLength: 100 },
      },
    };
    expect(degenerate().length).toBe(66);
    const wiring = createScrubWiring({
      settingsDir: tempDir(),
      now: () => 7,
      followUp: () => undefined,
      readSettings: () => strict,
    });
    expect(wiring.onMessageEnd(messageEnd(assistantMessage()))).toBeUndefined();
    expect(wiring.getStatus().removed).toBe(0);
  });
});

describe('onMessageUpdate', () => {
  it('作成時に 1 回読み、minThinking 未満では読まない', () => {
    let calls = 0;
    const wiring = createScrubWiring({
      settingsDir: tempDir(),
      now: () => 7,
      followUp: () => undefined,
      readSettings: () => {
        calls += 1;
        return okSettings();
      },
    });
    expect(calls).toBe(1);
    const thinking = thinkingWithRun(defaultSettings().live.minThinking).slice(
      0,
      defaultSettings().live.minThinking - 1,
    );
    const fake = fakeCmdCtx();
    wiring.onMessageUpdate(
      messageUpdate(assistantThinking(thinking, 'reasoning_content')),
      fake.ctx,
    );
    expect(calls).toBe(1);
    expect(fake.aborts()).toBe(0);
  });

  it('差分が scanEvery 未満なら読まない', () => {
    let calls = 0;
    const wiring = createScrubWiring({
      settingsDir: tempDir(),
      now: () => 7,
      followUp: () => undefined,
      readSettings: () => {
        calls += 1;
        return okSettings();
      },
    });
    expect(calls).toBe(1);
    const base = thinkingWithRun(defaultSettings().live.minThinking);
    const first = fakeCmdCtx();
    wiring.onMessageUpdate(messageUpdate(assistantThinking(base, 'reasoning_content')), first.ctx);
    expect(first.aborts()).toBe(1);
    expect(calls).toBe(2);
    const extended = `${base}${'x'.repeat(defaultSettings().live.scanEvery - 1)}`;
    const second = fakeCmdCtx();
    wiring.onMessageUpdate(
      messageUpdate(assistantThinking(extended, 'reasoning_content')),
      second.ctx,
    );
    expect(calls).toBe(2);
    expect(second.aborts()).toBe(0);
  });

  it('差分が scanEvery 以上なら 1 回読み、ランがあれば止まる', () => {
    let calls = 0;
    const wiring = createScrubWiring({
      settingsDir: tempDir(),
      now: () => 7,
      followUp: () => undefined,
      readSettings: () => {
        calls += 1;
        return okSettings();
      },
    });
    expect(calls).toBe(1);
    const fake = fakeCmdCtx();
    wiring.onMessageUpdate(
      messageUpdate(
        assistantThinking(thinkingWithRun(defaultSettings().live.minThinking), 'reasoning_content'),
      ),
      fake.ctx,
    );
    expect(calls).toBe(2);
    expect(fake.aborts()).toBe(1);
  });

  it('MAX_ABORTS に達したら読まず、scanned が進む', () => {
    let calls = 0;
    const wiring = createScrubWiring({
      settingsDir: tempDir(),
      now: () => 7,
      followUp: () => undefined,
      readSettings: () => {
        calls += 1;
        return okSettings();
      },
    });
    expect(calls).toBe(1);
    wiring.onMessageUpdate(
      messageUpdate(
        assistantThinking(thinkingWithRun(defaultSettings().live.minThinking), 'reasoning_content'),
      ),
      fakeCmdCtx().ctx,
    );
    wiring.onMessageUpdate(
      messageUpdate(
        assistantThinking(
          thinkingWithRun(defaultSettings().live.minThinking + defaultSettings().live.scanEvery),
          'reasoning_content',
        ),
      ),
      fakeCmdCtx().ctx,
    );
    expect(calls).toBe(3);
    const fake = fakeCmdCtx();
    wiring.onMessageUpdate(
      messageUpdate(
        assistantThinking(
          thinkingWithRun(
            defaultSettings().live.minThinking + defaultSettings().live.scanEvery * 2,
          ),
          'reasoning_content',
        ),
      ),
      fake.ctx,
    );
    expect(calls).toBe(3);
    expect(fake.aborts()).toBe(0);
  });

  it('無効のとき、間隔ごとに 1 回だけ読み、scanned が進む', () => {
    let calls = 0;
    const wiring = createScrubWiring({
      settingsDir: tempDir(),
      now: () => 7,
      followUp: () => undefined,
      readSettings: (): SettingsRead => {
        calls += 1;
        return { kind: 'ok', settings: { ...defaultSettings(), enabled: false } };
      },
    });
    expect(calls).toBe(1);
    const base = thinkingWithRun(defaultSettings().live.minThinking);
    const first = fakeCmdCtx();
    wiring.onMessageUpdate(messageUpdate(assistantThinking(base, 'reasoning_content')), first.ctx);
    expect(calls).toBe(2);
    expect(first.aborts()).toBe(0);
    const extended = `${base}${'x'.repeat(defaultSettings().live.scanEvery)}`;
    const second = fakeCmdCtx();
    wiring.onMessageUpdate(
      messageUpdate(assistantThinking(extended, 'reasoning_content')),
      second.ctx,
    );
    expect(calls).toBe(3);
    expect(second.aborts()).toBe(0);
    const third = fakeCmdCtx();
    wiring.onMessageUpdate(
      messageUpdate(assistantThinking(`${extended}x`, 'reasoning_content')),
      third.ctx,
    );
    expect(calls).toBe(3);
    expect(third.aborts()).toBe(0);
  });

  it('command off の後、次の更新でキャッシュが効いて止まらない', () => {
    const dir = tempDir();
    const wiring = createScrubWiring({
      settingsDir: dir,
      now: () => 7,
      followUp: () => undefined,
      readSettings: () => readSettings(dir),
    });
    const first = fakeCmdCtx();
    wiring.onMessageUpdate(
      messageUpdate(
        assistantThinking(thinkingWithRun(defaultSettings().live.minThinking), 'reasoning_content'),
      ),
      first.ctx,
    );
    expect(first.aborts()).toBe(1);
    wiring.onCommand('off', fakeCmdCtx().ctx);
    const second = fakeCmdCtx();
    wiring.onMessageUpdate(
      messageUpdate(
        assistantThinking(
          thinkingWithRun(defaultSettings().live.minThinking + defaultSettings().live.scanEvery),
          'reasoning_content',
        ),
      ),
      second.ctx,
    );
    expect(second.aborts()).toBe(0);
  });

  it('message_end の後、キャッシュが新しい設定になる', () => {
    const dir = tempDir();
    const custom = {
      ...defaultSettings(),
      live: { ...defaultSettings().live, minThinking: 5000 },
    };
    writeFileSync(join(dir, 'settings.json'), JSON.stringify(custom));
    let calls = 0;
    const wiring = createScrubWiring({
      settingsDir: dir,
      now: () => 7,
      followUp: () => undefined,
      readSettings: () => {
        calls += 1;
        return readSettings(dir);
      },
    });
    expect(calls).toBe(1);
    writeFileSync(join(dir, 'settings.json'), JSON.stringify(defaultSettings()));
    expect(wiring.onMessageEnd(messageEnd(assistantMessage()))).toBeDefined();
    expect(calls).toBe(2);
    const fake = fakeCmdCtx();
    wiring.onMessageUpdate(
      messageUpdate(assistantThinking(thinkingWithRun(6000), 'reasoning_content')),
      fake.ctx,
    );
    expect(calls).toBe(2);
    expect(fake.aborts()).toBe(0);
  });

  it('署名の無い thinking でも run → abort', () => {
    const wiring = createScrubWiring({
      settingsDir: tempDir(),
      now: () => 7,
      followUp: () => undefined,
      readSettings: () => okSettings(),
    });
    const fake = fakeCmdCtx();
    wiring.onMessageUpdate(
      messageUpdate(assistantThinking(thinkingWithRun(defaultSettings().live.minThinking))),
      fake.ctx,
    );
    expect(fake.aborts()).toBe(1);
  });
});

describe('onAgentSettled', () => {
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
      readSettings: () => okSettings(),
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
      messageUpdate(
        assistantThinking(thinkingWithRun(defaultSettings().live.minThinking), 'reasoning_content'),
      ),
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
      content: expect.stringContaining(FOLLOWUP_REPEATING),
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
      readSettings: () => okSettings(),
    });
    const fake = fakeCmdCtx();
    wiring.onMessageUpdate(
      messageUpdate(
        assistantThinking(thinkingWithRun(defaultSettings().live.minThinking), 'reasoning_content'),
      ),
      fake.ctx,
    );
    expect(fake.aborts()).toBe(1);
    wiring.onAgentSettled(agentSettled(false));
    expect(sent).toHaveLength(0);
  });

  it('aborted: true でも pending が無い → 何も送らない', () => {
    const sent: string[] = [];
    const wiring = createScrubWiring({
      settingsDir: tempDir(),
      now: () => 7,
      followUp: (content) => {
        sent.push(content);
      },
      readSettings: () => okSettings(),
    });
    wiring.onAgentSettled(agentSettled(true));
    expect(sent).toHaveLength(0);
  });
});

describe('onBeforeAgentStart', () => {
  it(`user で戻り、${defaultSettings().live.maxAborts} 回の後もまた止まれる。custom では戻らない`, () => {
    const wiring = createScrubWiring({
      settingsDir: tempDir(),
      now: () => 7,
      followUp: () => undefined,
      readSettings: () => okSettings(),
    });
    const first = fakeCmdCtx();
    wiring.onMessageUpdate(
      messageUpdate(
        assistantThinking(thinkingWithRun(defaultSettings().live.minThinking), 'reasoning_content'),
      ),
      first.ctx,
    );
    expect(first.aborts()).toBe(1);
    const second = fakeCmdCtx();
    wiring.onMessageUpdate(
      messageUpdate(
        assistantThinking(
          thinkingWithRun(defaultSettings().live.minThinking + defaultSettings().live.scanEvery),
          'reasoning_content',
        ),
      ),
      second.ctx,
    );
    expect(second.aborts()).toBe(1);
    expect(wiring.getStatus().failures).toBe(0);
    const third = fakeCmdCtx();
    wiring.onMessageUpdate(
      messageUpdate(
        assistantThinking(
          thinkingWithRun(
            defaultSettings().live.minThinking + defaultSettings().live.scanEvery * 2,
          ),
          'reasoning_content',
        ),
      ),
      third.ctx,
    );
    expect(third.aborts()).toBe(0);
    wiring.onBeforeAgentStart(beforeCustom());
    const fourth = fakeCmdCtx();
    wiring.onMessageUpdate(
      messageUpdate(
        assistantThinking(
          thinkingWithRun(
            defaultSettings().live.minThinking + defaultSettings().live.scanEvery * 3,
          ),
          'reasoning_content',
        ),
      ),
      fourth.ctx,
    );
    expect(fourth.aborts()).toBe(0);
    wiring.onBeforeAgentStart(beforeUser());
    const fifth = fakeCmdCtx();
    wiring.onMessageUpdate(
      messageUpdate(
        assistantThinking(thinkingWithRun(defaultSettings().live.minThinking), 'reasoning_content'),
      ),
      fifth.ctx,
    );
    expect(fifth.aborts()).toBe(1);
  });
});

describe('onAgentEnd', () => {
  it('退化の message_end が 2 回、そのあと agent_end → notify が 1 回、文は回数から', () => {
    const wiring = createScrubWiring({
      settingsDir: tempDir(),
      now: () => 7,
      followUp: () => undefined,
      readSettings: () => okSettings(),
    });
    expect(wiring.onMessageEnd(messageEnd(assistantMessage()))).toBeDefined();
    expect(wiring.onMessageEnd(messageEnd(assistantMessage()))).toBeDefined();
    const { notified, levels, ctx } = fakeCmdCtx();
    wiring.onAgentEnd(ctx);
    const runs = 2;
    const chars = degenerateChars() * runs;
    expect(notified).toHaveLength(1);
    expect(notified.at(0)).toBe(removedLine(runs, chars));
    expect(levels.at(0)).toBe('info');
  });

  it('何も消していない状態で agent_end → notify が呼ばれない', () => {
    const wiring = createScrubWiring({
      settingsDir: tempDir(),
      now: () => 7,
      followUp: () => undefined,
      readSettings: () => okSettings(),
    });
    const { notified, ctx } = fakeCmdCtx();
    wiring.onAgentEnd(ctx);
    expect(notified).toHaveLength(0);
  });

  it('show が偽のとき message_end のあと agent_end → notify が呼ばれない', () => {
    const dir = tempDir();
    writeFileSync(join(dir, 'settings.json'), JSON.stringify({ enabled: true, show: false }));
    const wiring = createScrubWiring({
      settingsDir: dir,
      now: () => 7,
      followUp: () => undefined,
      readSettings: () => readSettings(dir),
    });
    expect(wiring.onMessageEnd(messageEnd(assistantMessage()))).toBeDefined();
    const { notified, ctx } = fakeCmdCtx();
    wiring.onAgentEnd(ctx);
    expect(notified).toHaveLength(0);
  });

  it('notify のあと再度 agent_end → 2 回目は呼ばれない', () => {
    const wiring = createScrubWiring({
      settingsDir: tempDir(),
      now: () => 7,
      followUp: () => undefined,
      readSettings: () => okSettings(),
    });
    wiring.onMessageEnd(messageEnd(assistantMessage()));
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
      readSettings: () => okSettings(),
    });
    wiring.onMessageEnd(messageEnd(assistantMessage()));
    wiring.onMessageEnd(messageEnd(assistantMessage()));
    const { notified, ctx } = fakeCmdCtx();
    wiring.onAgentEnd(ctx);
    expect(notified).toHaveLength(1);
    expect(notified.at(0)).toBe(removedLine(2, degenerateChars() * 2));
    wiring.onMessageEnd(messageEnd(assistantMessage()));
    wiring.onAgentEnd(ctx);
    expect(notified).toHaveLength(2);
    expect(notified.at(1)).toBe(removedLine(1, degenerateChars()));
  });

  it('message_end で例外 → failures が 1 増え、そのあとの agent_end は notify を呼ばない', () => {
    const wiring = createScrubWiring({
      settingsDir: tempDir(),
      now: () => 7,
      followUp: () => undefined,
      readSettings: () => okSettings(),
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
  it('改行を含む細切れの退化 → message_end の thinking が詰まり、agent_end で 1 行に removed 1', () => {
    const prefix = 'foo';
    const suffix = 'bar';
    const doubleReturn = '\n\n';
    const thinking = `${prefix}${`${doubleReturn}${DEGENERATE_UNIT}`.repeat(5)}${suffix}`;
    const expectedThinking = `${prefix}${doubleReturn}${suffix}`;
    const wiring = createScrubWiring({
      settingsDir: tempDir(),
      now: () => 7,
      followUp: () => undefined,
      readSettings: () => okSettings(),
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
    expect(first.thinking).toBe(expectedThinking);
    const { notified, levels, ctx } = fakeCmdCtx();
    wiring.onAgentEnd(ctx);
    expect(notified).toHaveLength(1);
    expect(notified.at(0)).toContain(`${SCRUB_REMOVED_MARK} 1`);
    expect(levels.at(0)).toBe('info');
  });

  it('短い繰り返し 2 回 → message_end が undefined、agent_end でも notify が呼ばれない', () => {
    const thinking = DEGENERATE_UNIT.repeat(2);
    const wiring = createScrubWiring({
      settingsDir: tempDir(),
      now: () => 7,
      followUp: () => undefined,
      readSettings: () => okSettings(),
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
});

describe('onCommand', () => {
  it('コマンド off → settings.json の enabled が偽になり、次の message_end は undefined', () => {
    const dir = tempDir();
    const wiring = createScrubWiring({
      settingsDir: dir,
      now: () => 7,
      followUp: () => undefined,
      readSettings: () => readSettings(dir),
    });
    wiring.onCommand('off', fakeCmdCtx().ctx);
    expect(JSON.parse(readFileSync(join(dir, 'settings.json'), 'utf8'))).toEqual({
      ...defaultSettings(),
      enabled: false,
    });
    expect(wiring.onMessageEnd(messageEnd(assistantMessage()))).toBeUndefined();
  });

  it('壊れたファイルに command on → 既定の 3 グループとパッチを持つ完全なファイルができる', () => {
    const dir = tempDir();
    writeFileSync(join(dir, 'settings.json'), '{');
    const wiring = createScrubWiring({
      settingsDir: dir,
      now: () => 7,
      followUp: () => undefined,
      readSettings: () => readSettings(dir),
    });
    wiring.onCommand('on', fakeCmdCtx().ctx);
    expect(JSON.parse(readFileSync(join(dir, 'settings.json'), 'utf8'))).toEqual({
      ...defaultSettings(),
      enabled: true,
    });
  });

  it('コマンド on → その後の message_end が差し替えを返す', () => {
    const dir = tempDir();
    writeFileSync(join(dir, 'settings.json'), JSON.stringify({ enabled: false }));
    const wiring = createScrubWiring({
      settingsDir: dir,
      now: () => 7,
      followUp: () => undefined,
      readSettings: () => readSettings(dir),
    });
    expect(wiring.onMessageEnd(messageEnd(assistantMessage()))).toBeUndefined();
    wiring.onCommand('on', fakeCmdCtx().ctx);
    expect(wiring.onMessageEnd(messageEnd(assistantMessage()))).toBeDefined();
  });

  it('コマンドが引数無し → 通知が 1 回呼ばれ、runCommand の行が渡る', () => {
    const wiring = createScrubWiring({
      settingsDir: tempDir(),
      now: () => 7,
      followUp: () => undefined,
      readSettings: () => okSettings(),
    });
    const { notified, ctx } = fakeCmdCtx();
    wiring.onCommand('', ctx);
    expect(notified).toHaveLength(1);
    expect(notified.at(0)).toContain(SCRUB_PREFIX);
    expect(notified.at(0)).toContain(SCRUB_REMOVED_LABEL);
  });

  it('コマンド hide → settings.json の show が偽になり、enabled はそのまま', () => {
    const dir = tempDir();
    writeFileSync(join(dir, 'settings.json'), JSON.stringify({ enabled: true, show: true }));
    const wiring = createScrubWiring({
      settingsDir: dir,
      now: () => 7,
      followUp: () => undefined,
      readSettings: () => readSettings(dir),
    });
    wiring.onCommand('hide', fakeCmdCtx().ctx);
    expect(JSON.parse(readFileSync(join(dir, 'settings.json'), 'utf8'))).toEqual({
      ...defaultSettings(),
      enabled: true,
      show: false,
    });
  });

  it('コマンド off / on → 既存の show:false が保たれる', () => {
    for (const [command, enabled] of [
      ['off', false],
      ['on', true],
    ] as const) {
      const dir = tempDir();
      writeFileSync(join(dir, 'settings.json'), JSON.stringify({ enabled: !enabled, show: false }));
      const wiring = createScrubWiring({
        settingsDir: dir,
        now: () => 7,
        followUp: () => undefined,
        readSettings: () => readSettings(dir),
      });
      wiring.onCommand(command, fakeCmdCtx().ctx);
      expect(JSON.parse(readFileSync(join(dir, 'settings.json'), 'utf8'))).toEqual({
        ...defaultSettings(),
        enabled,
        show: false,
      });
    }
  });
});
