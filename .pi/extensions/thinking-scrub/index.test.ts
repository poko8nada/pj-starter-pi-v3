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
  SCRUB_REMOVED_MARK,
  assistantMessage,
  degenerate,
  degenerateExpected,
  removedLine,
  scrubWiring,
  thinkingWithRun,
} from './scrub.fixture.ts';
import { settingsDirWith } from '../../../test/settings.fixture.ts';
import { tempDir } from '../../../test/temp-dir.ts';
import { registerScrub, type PiPort } from './index.ts';
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
  // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion -- 偽物は使う窓口だけを持つ
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

describe('registerScrub', () => {
  it("on が 5 件で registerCommand('thinking-scrub') が 1 回呼ばれる", () => {
    const fake = fakePi();
    registerScrub(fake.pi, {
      settingsDir: tempDir(),
      now: () => 1,
      followUp: () => undefined,
      readSettings: () => okSettings(),
    });
    expect(fake.events.toSorted()).toEqual([
      'agent_end',
      'agent_settled',
      'before_agent_start',
      'message_end',
      'message_update',
    ]);
    expect([...fake.commands.keys()]).toEqual(['thinking-scrub']);
  });
});

describe('onMessageEnd', () => {
  it('退化のない assistant なら undefined になる', () => {
    const wiring = scrubWiring();
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

  it('role が assistant 以外と対象でない署名の assistant はどちらも undefined になる', () => {
    const wiring = scrubWiring();
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

  it('設定が enabled が false なら undefined になる', () => {
    const dir = settingsDirWith({ enabled: false });
    const wiring = scrubWiring({ settingsDir: dir });
    expect(wiring.onMessageEnd(messageEnd(assistantMessage()))).toBeUndefined();
    expect(wiring.getStatus().removed).toBe(0);
  });

  it('設定が壊れていれば既定で差し替えが返り状態の failures は増えない', () => {
    const dir = settingsDirWith('{');
    const wiring = scrubWiring({ settingsDir: dir, readSettings: () => readSettings(dir) });
    const result = wiring.onMessageEnd(messageEnd(assistantMessage()));
    expect(result).toBeDefined();
    expect(wiring.getStatus().failures).toBe(0);
    expect(wiring.getStatus().removed).toBe(1);
  });

  it('2 回まとめれば状態の removed が 2 回分の合計になる', () => {
    const wiring = scrubWiring();
    expect(wiring.onMessageEnd(messageEnd(assistantMessage()))).toBeDefined();
    expect(wiring.onMessageEnd(messageEnd(assistantMessage()))).toBeDefined();
    expect(wiring.getStatus().removed).toBe(2);
    expect(wiring.getStatus().lastAt).toBe(7);
  });
});

describe('onMessageUpdate', () => {
  it('作成時に 1 回読み minThinking 未満では読まない', () => {
    let calls = 0;
    const wiring = scrubWiring({
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

  it('差分が scanEvery 未満なら読まないことを確かめる', () => {
    let calls = 0;
    const wiring = scrubWiring({
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

  it('差分が scanEvery 以上なら 1 回読みランがあれば止まる', () => {
    let calls = 0;
    const wiring = scrubWiring({
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

  it('live.maxAborts に達したら読まず scanned が進む', () => {
    let calls = 0;
    const wiring = scrubWiring({
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

  it('無効のときは間隔ごとに 1 回だけ読み scanned が進む', () => {
    let calls = 0;
    const wiring = scrubWiring({
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

  it('command の off の後、次の更新でキャッシュが効いて止まらない', () => {
    const dir = tempDir();
    let calls = 0;
    const wiring = scrubWiring({
      settingsDir: dir,
      readSettings: () => {
        calls += 1;
        return readSettings(dir);
      },
    });
    expect(calls).toBe(1);
    const first = fakeCmdCtx();
    wiring.onMessageUpdate(
      messageUpdate(
        assistantThinking(thinkingWithRun(defaultSettings().live.minThinking), 'reasoning_content'),
      ),
      first.ctx,
    );
    expect(calls).toBe(2);
    expect(first.aborts()).toBe(1);
    wiring.onCommand('off', fakeCmdCtx().ctx);
    expect(calls).toBe(3);
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
    expect(calls).toBe(4);
    expect(second.aborts()).toBe(0);
  });

  it('message_end の後はキャッシュが新しい設定になる', () => {
    const custom = {
      ...defaultSettings(),
      live: { ...defaultSettings().live, minThinking: 5000 },
    };
    const dir = settingsDirWith(custom);
    let calls = 0;
    const wiring = scrubWiring({
      settingsDir: dir,
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

  it('署名のない thinking でもランがあれば中断する', () => {
    const wiring = scrubWiring();
    const fake = fakeCmdCtx();
    wiring.onMessageUpdate(
      messageUpdate(assistantThinking(thinkingWithRun(defaultSettings().live.minThinking))),
      fake.ctx,
    );
    expect(fake.aborts()).toBe(1);
  });
});

describe('onAgentSettled', () => {
  it('fake の sendMessage 経由なら customType と表示と triggerTurn が記録される', () => {
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
});

describe('onBeforeAgentStart', () => {
  it(`user で戻れば ${defaultSettings().live.maxAborts} 回の後もまた止まれる。custom では戻らない`, () => {
    const wiring = scrubWiring();
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
  it('退化の message_end が 2 回ありそのあと agent_end なら notify が 1 回呼ばれ文は回数から作る', () => {
    const wiring = scrubWiring();
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

  it('何も消していない状態で agent_end なら notify が呼ばれない', () => {
    const wiring = scrubWiring();
    const { notified, ctx } = fakeCmdCtx();
    wiring.onAgentEnd(ctx);
    expect(notified).toHaveLength(0);
  });

  it('show が false のとき message_end のあと agent_end なら notify が呼ばれない', () => {
    const dir = settingsDirWith({ enabled: true, show: false });
    const wiring = scrubWiring({ settingsDir: dir, readSettings: () => readSettings(dir) });
    expect(wiring.onMessageEnd(messageEnd(assistantMessage()))).toBeDefined();
    const { notified, ctx } = fakeCmdCtx();
    wiring.onAgentEnd(ctx);
    expect(notified).toHaveLength(0);
  });

  it('notify のあと再度 agent_end なら 2 回目は呼ばれない', () => {
    const wiring = scrubWiring();
    wiring.onMessageEnd(messageEnd(assistantMessage()));
    const { notified, ctx } = fakeCmdCtx();
    wiring.onAgentEnd(ctx);
    expect(notified).toHaveLength(1);
    wiring.onAgentEnd(ctx);
    expect(notified).toHaveLength(1);
  });

  it('notify のあとに message_end と agent_end があればもう一度 1 回呼ばれその実行の分だけになる', () => {
    const wiring = scrubWiring();
    wiring.onMessageEnd(messageEnd(assistantMessage()));
    wiring.onMessageEnd(messageEnd(assistantMessage()));
    const { notified, ctx } = fakeCmdCtx();
    wiring.onAgentEnd(ctx);
    wiring.onMessageEnd(messageEnd(assistantMessage()));
    wiring.onAgentEnd(ctx);
    expect(notified).toHaveLength(2);
    expect(notified.at(1)).toBe(removedLine(1, degenerateChars()));
  });

  it('message_end で例外があれば failures が 1 増えそのあとの agent_end は notify を呼ばない', () => {
    const wiring = scrubWiring();
    const evil: Record<string, unknown> = {};
    Object.defineProperty(evil, 'role', {
      get() {
        throw new Error('boom');
      },
    });
    // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion -- 例外を投げる偽物を作る
    const message = evil as unknown as AgentMessage;
    expect(wiring.onMessageEnd(messageEnd(message))).toBeUndefined();
    expect(wiring.getStatus().failures).toBe(1);
    const { notified, ctx } = fakeCmdCtx();
    wiring.onAgentEnd(ctx);
    expect(notified).toHaveLength(0);
  });
});

describe('integration', () => {
  it('改行を含む細切れの退化なら message_end の thinking が詰まり agent_end で 1 行に removed が 1 になる', () => {
    const prefix = 'foo';
    const suffix = 'bar';
    const doubleReturn = '\n\n';
    const thinking = `${prefix}${`${doubleReturn}${DEGENERATE_UNIT}`.repeat(5)}${suffix}`;
    const expectedThinking = `${prefix}${doubleReturn}${suffix}`;
    const wiring = scrubWiring();
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
});

describe('onCommand', () => {
  it('コマンドの off なら settings.json の enabled が false になり次の message_end は undefined になる', () => {
    const dir = tempDir();
    const wiring = scrubWiring({ settingsDir: dir, readSettings: () => readSettings(dir) });
    wiring.onCommand('off', fakeCmdCtx().ctx);
    expect(JSON.parse(readFileSync(join(dir, 'settings.json'), 'utf8'))).toEqual({
      ...defaultSettings(),
      enabled: false,
    });
    expect(wiring.onMessageEnd(messageEnd(assistantMessage()))).toBeUndefined();
  });

  it('壊れたファイルに command の on があれば既定の 3 グループとパッチを持つ完全なファイルができる', () => {
    const dir = settingsDirWith('{');
    const wiring = scrubWiring({ settingsDir: dir, readSettings: () => readSettings(dir) });
    wiring.onCommand('on', fakeCmdCtx().ctx);
    expect(JSON.parse(readFileSync(join(dir, 'settings.json'), 'utf8'))).toEqual({
      ...defaultSettings(),
      enabled: true,
    });
  });

  it('コマンドの on ならその後の message_end が差し替えを返す', () => {
    const dir = settingsDirWith({ enabled: false });
    const wiring = scrubWiring({ settingsDir: dir, readSettings: () => readSettings(dir) });
    expect(wiring.onMessageEnd(messageEnd(assistantMessage()))).toBeUndefined();
    wiring.onCommand('on', fakeCmdCtx().ctx);
    expect(wiring.onMessageEnd(messageEnd(assistantMessage()))).toBeDefined();
  });

  it('コマンドが引数なしなら通知が 1 回呼ばれる', () => {
    const wiring = scrubWiring();
    const { notified, ctx } = fakeCmdCtx();
    wiring.onCommand('', ctx);
    expect(notified).toHaveLength(1);
  });

  it('コマンドの hide なら settings.json の show が false になり enabled はそのままである', () => {
    const dir = settingsDirWith({ enabled: true, show: true });
    const wiring = scrubWiring({ settingsDir: dir, readSettings: () => readSettings(dir) });
    wiring.onCommand('hide', fakeCmdCtx().ctx);
    expect(JSON.parse(readFileSync(join(dir, 'settings.json'), 'utf8'))).toEqual({
      ...defaultSettings(),
      enabled: true,
      show: false,
    });
  });

  it('コマンドの off と on なら既存の show が false のまま保たれる', () => {
    for (const [command, enabled] of [
      ['off', false],
      ['on', true],
    ] as const) {
      const dir = settingsDirWith({ enabled: !enabled, show: false });
      const wiring = scrubWiring({ settingsDir: dir, readSettings: () => readSettings(dir) });
      wiring.onCommand(command, fakeCmdCtx().ctx);
      expect(JSON.parse(readFileSync(join(dir, 'settings.json'), 'utf8'))).toEqual({
        ...defaultSettings(),
        enabled,
        show: false,
      });
    }
  });

  it('独自キーを持つ settings.json に command の off と on があれば独自キーが残り enabled が切り替わる', () => {
    for (const [command, enabled] of [
      ['off', false],
      ['on', true],
    ] as const) {
      const dir = settingsDirWith({ customTop: 'kept', live: { customLive: 'kept' } });
      const wiring = scrubWiring({ settingsDir: dir, readSettings: () => readSettings(dir) });
      wiring.onCommand(command, fakeCmdCtx().ctx);
      expect(JSON.parse(readFileSync(join(dir, 'settings.json'), 'utf8'))).toEqual({
        ...defaultSettings(),
        customTop: 'kept',
        enabled,
        live: { ...defaultSettings().live, customLive: 'kept' },
      });
    }
  });
});
