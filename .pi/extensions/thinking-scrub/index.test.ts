import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import type { MessageEndEvent } from '@earendil-works/pi-coding-agent';
import { tmpDir } from '../../../test/tmp.ts';
import { createScrubWiring, registerScrub, type PiPort } from './index.ts';
import { readSettings } from './settings/read.ts';

const HERE = dirname(fileURLToPath(import.meta.url));

type AgentMessage = MessageEndEvent['message'];

// PiPort は on と registerCommand を記録する偽物で渡す。

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

function fakePi(): {
  readonly events: string[];
  readonly handlers: Map<string, (event: MessageEndEvent) => unknown>;
  readonly commands: Map<string, (args: string, ctx: unknown) => unknown>;
  readonly pi: PiPort;
} {
  const events: string[] = [];
  const handlers = new Map<string, (event: MessageEndEvent) => unknown>();
  const commands = new Map<string, (args: string, ctx: unknown) => unknown>();
  const pi = {
    on: (event: string, handler: (event: MessageEndEvent) => unknown) => {
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
  };
  // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion -- 偽物は使う口だけ持つ
  return { events, handlers, commands, pi: pi as unknown as PiPort };
}

function fakeCmdCtx(): {
  readonly notified: string[];
  readonly ctx: { readonly ui: { readonly notify: (message: string) => void } };
} {
  const notified: string[] = [];
  return {
    notified,
    ctx: {
      ui: {
        notify: (message: string) => {
          notified.push(message);
        },
      },
    },
  };
}

function messageEnd(message: AgentMessage): MessageEndEvent {
  return { type: 'message_end', message };
}

describe('registerScrub', () => {
  it("on('message_end') が 1 回、registerCommand('thinking-scrub') が 1 回", () => {
    const fake = fakePi();
    registerScrub(fake.pi, { settingsDir: tmpDir(), now: () => 1 });
    expect(fake.events).toEqual(['message_end']);
    expect([...fake.commands.keys()]).toEqual(['thinking-scrub']);
  });
});

describe('onMessageEnd', () => {
  it('退化した thinking を持つ assistant を handler に渡す → { message } が返り、thinking から区間が消えている', () => {
    const wiring = createScrubWiring({ settingsDir: tmpDir(), now: () => 7 });
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
    const wiring = createScrubWiring({ settingsDir: tmpDir(), now: () => 7 });
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
    const wiring = createScrubWiring({ settingsDir: tmpDir(), now: () => 7 });
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
    const dir = tmpDir();
    writeFileSync(join(dir, 'settings.json'), JSON.stringify({ enabled: false }));
    const wiring = createScrubWiring({ settingsDir: dir, now: () => 7 });
    expect(wiring.onMessageEnd(messageEnd(assistantMessage()))).toBeUndefined();
    expect(wiring.getStatus().removed).toBe(0);
  });

  it('設定が壊れている → 既定で差し替えが返り、状態の failures は増えない', () => {
    const dir = tmpDir();
    writeFileSync(join(dir, 'settings.json'), '{');
    const wiring = createScrubWiring({ settingsDir: dir, now: () => 7 });
    const result = wiring.onMessageEnd(messageEnd(assistantMessage()));
    expect(result).toBeDefined();
    expect(wiring.getStatus().failures).toBe(0);
    expect(wiring.getStatus().removed).toBe(1);
  });

  it('handler の中で例外が起きる → undefined が返り、failures が 1 増える', () => {
    const wiring = createScrubWiring({ settingsDir: tmpDir(), now: () => 7 });
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
  });

  it('2 回畳む → 状態の removed が 2 回分の合計', () => {
    const wiring = createScrubWiring({ settingsDir: tmpDir(), now: () => 7 });
    expect(wiring.onMessageEnd(messageEnd(assistantMessage()))).toBeDefined();
    expect(wiring.onMessageEnd(messageEnd(assistantMessage()))).toBeDefined();
    expect(wiring.getStatus().removed).toBe(2);
    expect(wiring.getStatus().lastAt).toBe(7);
  });
});

describe('onCommand', () => {
  it('コマンド off → settings.json の enabled が偽になり、次の message_end は undefined', () => {
    const dir = tmpDir();
    const wiring = createScrubWiring({ settingsDir: dir, now: () => 7 });
    wiring.onCommand('off', fakeCmdCtx().ctx);
    expect(JSON.parse(readFileSync(join(dir, 'settings.json'), 'utf8'))).toEqual({
      enabled: false,
    });
    expect(wiring.onMessageEnd(messageEnd(assistantMessage()))).toBeUndefined();
  });

  it('コマンド on → その後の message_end が差し替えを返す', () => {
    const dir = tmpDir();
    writeFileSync(join(dir, 'settings.json'), JSON.stringify({ enabled: false }));
    const wiring = createScrubWiring({ settingsDir: dir, now: () => 7 });
    expect(wiring.onMessageEnd(messageEnd(assistantMessage()))).toBeUndefined();
    wiring.onCommand('on', fakeCmdCtx().ctx);
    expect(wiring.onMessageEnd(messageEnd(assistantMessage()))).toBeDefined();
  });

  it('コマンドが引数無し → 通知が 1 回呼ばれ、runCommand の行が渡る', () => {
    const wiring = createScrubWiring({ settingsDir: tmpDir(), now: () => 7 });
    const { notified, ctx } = fakeCmdCtx();
    wiring.onCommand('', ctx);
    expect(notified).toHaveLength(1);
    expect(notified.at(0)).toContain('thinking-scrub:');
    expect(notified.at(0)).toContain('removed:');
  });

  it('コマンド hide → settings.json の show が偽になり、enabled はそのまま', () => {
    const dir = tmpDir();
    writeFileSync(join(dir, 'settings.json'), JSON.stringify({ enabled: true, show: true }));
    const wiring = createScrubWiring({ settingsDir: dir, now: () => 7 });
    wiring.onCommand('hide', fakeCmdCtx().ctx);
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
