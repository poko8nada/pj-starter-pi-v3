import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { tmpDir } from '../../test/tmp.ts';
import { intentMessage, registerCommand, type CommandCtx, type CommandPiPort } from './command.ts';
import { append, type LogRecord } from './log.ts';
import { defaultSettings, readSettings } from './settings.ts';
import { arm, idleRun, type FlagsPort, type Run, type RunPort } from './state.ts';

function fakeFlags(enabled: boolean): FlagsPort {
  let current = { enabled };
  return {
    get: () => current,
    set: (next) => {
      current = next;
    },
  };
}

function fakeRun(initial?: Run): RunPort {
  let current: Run = initial ?? idleRun();
  return {
    get: () => current,
    set: (next) => {
      current = next;
    },
  };
}

function fakePi(): {
  readonly pi: CommandPiPort;
  readonly handler: () => (args: string, ctx: CommandCtx) => void;
} {
  let captured: ((args: string, ctx: CommandCtx) => void) | undefined;
  const pi: CommandPiPort = {
    registerCommand: (_name, options) => {
      captured = options.handler;
    },
  };
  return {
    pi,
    handler: () => {
      if (captured === undefined) {
        throw new Error('command was not registered');
      }
      return captured;
    },
  };
}

function fakeCtx(): CommandCtx & { readonly messages: string[] } {
  const messages: string[] = [];
  return {
    messages,
    ui: {
      notify: (message: string) => {
        messages.push(message);
      },
    },
  };
}

function isLogRecord(value: unknown): value is LogRecord {
  return typeof value === 'object' && value !== null && 'hook' in value && 'at' in value;
}

function readRecords(dir: string): LogRecord[] {
  const out: LogRecord[] = [];
  for (const name of readdirSync(dir)) {
    if (!name.endsWith('.jsonl')) {
      continue;
    }
    const text = readFileSync(join(dir, name), 'utf8');
    for (const line of text.split('\n')) {
      if (line === '') {
        continue;
      }
      const parsed: unknown = JSON.parse(line);
      if (isLogRecord(parsed)) {
        out.push(parsed);
      }
    }
  }
  return out;
}

describe('intentMessage', () => {
  it("off → next が false で 'intent-router: off'", () => {
    expect(intentMessage('off', true)).toEqual({
      next: { enabled: false },
      message: 'intent-router: off',
    });
  });

  it('on → next が true', () => {
    expect(intentMessage('on', false)).toEqual({
      next: { enabled: true },
      message: 'intent-router: on',
    });
  });

  it("引数なし → 状態のまま 'intent-router: on'", () => {
    expect(intentMessage('', true)).toEqual({
      next: { enabled: true },
      message: 'intent-router: on',
    });
  });

  it("変な引数 → 状態のまま 'intent-router: on|off'", () => {
    expect(intentMessage('maybe', true)).toEqual({
      next: { enabled: true },
      message: 'intent-router: on|off',
    });
  });
});

describe('registerCommand', () => {
  it('off → flags が false、notify が1回、run が idle', () => {
    const dir = tmpDir();
    const flags = fakeFlags(true);
    const run = fakeRun(
      arm({
        prompt: 'hello',
        label: 'question',
        confidence: 0.9,
        candidate: { provider: 'opencode', model: 'jev-1.13-free' },
        now: 1,
      }),
    );
    const { pi, handler } = fakePi();
    registerCommand(pi, {
      flags,
      run,
      log: (record) => {
        append(record, dir);
      },
    });
    const ctx = fakeCtx();
    handler()('off', ctx);
    expect(flags.get().enabled).toBe(false);
    expect(ctx.messages).toEqual(['intent-router: off']);
    expect(run.get().kind).toBe('idle');
  });

  it('off の前後で settings.json は同じ値（セッション限り）', () => {
    const before = readSettings('.pi/extensions/intent-router', defaultSettings());
    const flags = fakeFlags(true);
    const { pi, handler } = fakePi();
    registerCommand(pi, { flags, run: fakeRun(), log: () => {} });
    handler()('off', fakeCtx());
    const after = readSettings('.pi/extensions/intent-router', defaultSettings());
    expect(after).toEqual(before);
  });

  it("off のログに hook: 'command' の行が1件あり enabled が false", () => {
    const dir = tmpDir();
    const { pi, handler } = fakePi();
    registerCommand(pi, {
      flags: fakeFlags(true),
      run: fakeRun(),
      log: (record) => {
        append(record, dir);
      },
    });
    handler()('off', fakeCtx());
    const records = readRecords(dir);
    expect(records).toHaveLength(1);
    expect(records[0]).toMatchObject({ hook: 'command', enabled: false });
  });
});
