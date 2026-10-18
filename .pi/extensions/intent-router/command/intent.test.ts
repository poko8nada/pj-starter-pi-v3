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
import { createRecent } from '../record/recent.ts';
import { defaultSettings } from '../settings/schema.ts';
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
  const file = join(dir, 'recent.json');
  const recent = createRecent(50, file);
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
  registerCommand(pi, { flags, run, recent, settingsFile });
  return { handler: handler(), flags, run, file, settingsFile };
}

describe('parseIntent', () => {
  it('/intent on → live', () => {
    expect(parseIntent('on', defaultSettings())).toMatchObject({ kind: 'mode', mode: 'live' });
  });

  it('/intent off → shadow', () => {
    expect(parseIntent('off', defaultSettings())).toMatchObject({ kind: 'mode', mode: 'shadow' });
  });

  it('引数なし → show', () => {
    expect(parseIntent('', defaultSettings())).toMatchObject({ kind: 'show' });
  });

  it('/intent last → last（既定の数）', () => {
    expect(parseIntent('last', defaultSettings())).toMatchObject({
      kind: 'last',
      count: defaultSettings().record.recent,
    });
  });

  it('/intent last 3 → last 3', () => {
    expect(parseIntent('last 3', defaultSettings())).toMatchObject({ kind: 'last', count: 3 });
  });

  it('/intent foo → 使い方', () => {
    expect(parseIntent('foo', defaultSettings())).toMatchObject({ kind: 'usage' });
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

  it('/intent last → 直近の記録を返す', () => {
    const dir = tmpDir();
    const { handler } = wired(dir);
    const recent = createRecent(50, join(dir, 'recent.json'));
    recent.add({
      at: '2026-10-20T00:00:00.000Z',
      hook: 'route',
      owner_now: 'hello',
      agent_prev: '',
      choice: 'reply',
      confidence: 0.9,
      threshold: 0.8,
      guide: 'guide text',
      verdicts: null,
      streak: null,
      nudge: null,
      fired: true,
      state_chars: 10,
      truncated: false,
    });
    const ctx = fakeCtx();
    handler('last', ctx);
    expect(ctx.messages).toHaveLength(1);
    expect(ctx.messages[0]).toContain('hello');
  });

  it('/intent last 3 → 3 件だけ返す', () => {
    const dir = tmpDir();
    const { handler } = wired(dir);
    const recent = createRecent(50, join(dir, 'recent.json'));
    for (let index = 0; index < 5; index += 1) {
      recent.add({
        at: `2026-10-20T00:00:0${index}.000Z`,
        hook: 'route',
        owner_now: `hello${index}`,
        agent_prev: '',
        choice: 'reply',
        confidence: 0.9,
        threshold: 0.8,
        guide: 'guide text',
        verdicts: null,
        streak: null,
        nudge: null,
        fired: true,
        state_chars: 10,
        truncated: false,
      });
    }
    const ctx = fakeCtx();
    handler('last 3', ctx);
    expect(ctx.messages).toHaveLength(1);
    const lines = (ctx.messages[0] ?? '').split('\n').filter((line) => line !== '');
    expect(lines).toHaveLength(3);
    expect(ctx.messages[0]).toContain('hello4');
  });

  it('記録が 1 件も無い → 「まだ無い」を返す', () => {
    const { handler } = wired(tmpDir());
    const ctx = fakeCtx();
    handler('last', ctx);
    expect(ctx.messages).toHaveLength(1);
    expect(ctx.messages[0]).toContain('まだ無い');
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
