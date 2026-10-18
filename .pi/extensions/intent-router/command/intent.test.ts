import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { tmpDir } from '../../../../test/tmp.ts';
import {
  parseIntent,
  registerCommand,
  usageText,
  type CommandCtx,
  type CommandPiPort,
} from './intent.ts';
import { readSettings } from '../settings/read.ts';
import { arm, idleRun, type FlagsPort, type Mode, type Run, type RunPort } from '../state/run.ts';

function fakeFlags(mode: Mode): FlagsPort {
  let current = { mode };
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
      notify: (message) => {
        messages.push(message);
      },
    },
  };
}

function wired(dir: string, mode: Mode = 'shadow') {
  const flags = fakeFlags(mode);
  const run = fakeRun(
    arm({
      ownerNow: 'hello',
      choice: 'reply',
      confidence: 0.9,
      candidate: { provider: 'opencode', model: 'jev-1.13-free' },
      now: 1,
    }),
  );
  const settingsFile = join(dir, 'settings.json');
  const { pi, handler } = fakePi();
  registerCommand(pi, { flags, run, settingsFile });
  return { handler: handler(), flags, run, settingsFile };
}

describe('parseIntent', () => {
  it('/intent on → live', () => {
    expect(parseIntent('on')).toMatchObject({ kind: 'mode', mode: 'live' });
  });

  it('/intent off → shadow', () => {
    expect(parseIntent('off')).toMatchObject({ kind: 'mode', mode: 'shadow' });
  });

  it('引数なし → show', () => {
    expect(parseIntent('')).toMatchObject({ kind: 'show' });
  });

  it('消えた下位コマンド（last / last 3）→ 使い方を返し、文に last の行が無い', () => {
    for (const args of ['last', 'last 3']) {
      const command = parseIntent(args);
      expect(command).toMatchObject({ kind: 'usage' });
      if (command.kind !== 'usage') {
        throw new Error(`${args} must return usage`);
      }
      expect(command.text).toContain('usage');
      expect(command.text).not.toContain('last');
    }
    expect(usageText()).not.toContain('last');
  });

  it('/intent foo → 使い方', () => {
    expect(parseIntent('foo')).toMatchObject({ kind: 'usage' });
  });
});

describe('registerCommand', () => {
  it('/intent on → mode が live', () => {
    const { handler, flags } = wired(tmpDir());
    const ctx = fakeCtx();
    handler('on', ctx);
    expect(flags.get().mode).toBe('live');
    expect(ctx.messages).toEqual(['intent-router: live']);
  });

  it('/intent off → mode が shadow', () => {
    const { handler, flags } = wired(tmpDir(), 'live');
    const ctx = fakeCtx();
    handler('off', ctx);
    expect(flags.get().mode).toBe('shadow');
    expect(ctx.messages).toEqual(['intent-router: shadow']);
  });

  it('mode を切り替える → 抱えている run が idle に戻る', () => {
    const { handler, run } = wired(tmpDir());
    expect(run.get().kind).toBe('armed');
    handler('on', fakeCtx());
    expect(run.get().kind).toBe('idle');
  });

  it('引数なしの /intent → 今の mode を文で返す', () => {
    const { handler } = wired(tmpDir(), 'live');
    const ctx = fakeCtx();
    handler('', ctx);
    expect(ctx.messages).toEqual(['intent-router: live']);
  });

  it('消えた下位コマンドを打つ → 使い方の文を返す（文に last の行が無い）', () => {
    const { handler } = wired(tmpDir());
    for (const args of ['last', 'last 3']) {
      const ctx = fakeCtx();
      expect(() => {
        handler(args, ctx);
      }).not.toThrow();
      expect(ctx.messages).toHaveLength(1);
      expect(ctx.messages[0]).toContain('usage');
      expect(ctx.messages[0]).not.toContain('last');
    }
  });

  it('/intent foo → 使い方を返す（投げない）', () => {
    const { handler } = wired(tmpDir());
    const ctx = fakeCtx();
    expect(() => {
      handler('foo', ctx);
    }).not.toThrow();
    expect(ctx.messages).toHaveLength(1);
    expect(ctx.messages[0]).toContain('usage');
    expect(usageText()).toContain('/intent set');
  });

  it('/intent set route.thresholds.approve 0.9 → そのファイルが変わり、次の readSettings が 0.9 を返す', () => {
    const dir = tmpDir();
    const { handler, settingsFile } = wired(dir);
    const ctx = fakeCtx();
    handler('set route.thresholds.approve 0.9', ctx);
    expect(readSettings(dir).route.thresholds.approve).toBe(0.9);
    expect(JSON.parse(readFileSync(settingsFile, 'utf8'))).toMatchObject({
      route: { thresholds: { approve: 0.9 } },
    });
  });

  it('/intent set route.thresholds.approve abc → 投げずに理由を返し、ファイルは変わらない', () => {
    const dir = tmpDir();
    const { handler, settingsFile } = wired(dir);
    writeFileSync(settingsFile, JSON.stringify({ route: { thresholds: { approve: 0.9 } } }));
    const before = readFileSync(settingsFile, 'utf8');
    const ctx = fakeCtx();
    expect(() => {
      handler('set route.thresholds.approve abc', ctx);
    }).not.toThrow();
    expect(ctx.messages).toHaveLength(1);
    expect(readFileSync(settingsFile, 'utf8')).toBe(before);
  });
});
