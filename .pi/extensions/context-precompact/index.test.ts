import { writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  type ContextUsage,
  type ExtensionContext,
  type SessionBeforeCompactEvent,
  type SessionEntry,
} from '@earendil-works/pi-coding-agent';
import { tempDir } from '../../../test/temp-dir.ts';
import {
  createPrecompactWiring,
  registerPrecompact,
  type PiPort,
  type PrecompactCtx,
} from './index.ts';
import { NO_MODEL_REASON, type SummaryCtx } from './run/ports.ts';
import { prepareFromProjection } from './prepare/copied.ts';
import { DEFAULT_THRESHOLD_RATIO, LEAD_RATIO, RESERVE_TOKENS } from './settings/constants.ts';
import { readSettings } from './settings/read.ts';
import type { Settings } from './settings/schema.ts';
import { createSessionFixture, projectEntries } from './test/session-entries.ts';
import {
  brokenText,
  chatText,
  FALLBACK_TEXT,
  failureText,
  noticeText,
  statusLine,
  type NotifiableStatus,
} from './ui/status.ts';

const CONTEXT_WINDOW = 10_000;
const THRESHOLD_RATIO = DEFAULT_THRESHOLD_RATIO;
const THRESHOLD_TOKENS = Math.floor(THRESHOLD_RATIO * CONTEXT_WINDOW);
const LEAD_TOKENS = Math.floor((THRESHOLD_RATIO - LEAD_RATIO / 2) * CONTEXT_WINDOW);
const KEEP_RECENT_TOKENS = 1_500;
const SESSION_ID = 'sess-1';
const OTHER_SESSION_ID = 'sess-2';
const BOOM = 'boom';

function llmUsage() {
  return {
    input: 1,
    output: 1,
    cacheRead: 0,
    cacheWrite: 0,
    totalTokens: 2,
    cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0, total: 0 },
  };
}

function settingsDocument(overrides: Partial<Settings> = {}): Record<string, unknown> {
  return { keepRecentTokens: KEEP_RECENT_TOKENS, thresholdRatio: THRESHOLD_RATIO, ...overrides };
}

function settingsDirWith(document: Record<string, unknown>): string {
  const dir = tempDir();
  writeFileSync(join(dir, 'settings.json'), JSON.stringify(document));
  return dir;
}

function defaultSettingsDir(): string {
  return settingsDirWith(settingsDocument());
}

function contextUsageOf(tokens: number | null): ContextUsage {
  return { tokens, contextWindow: CONTEXT_WINDOW, percent: null };
}

function modelFake(): ExtensionContext['model'] {
  const model = { provider: 'test', id: 'm1', maxTokens: 8000, contextWindow: CONTEXT_WINDOW };
  // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion, typescript/no-unsafe-type-assertion -- 使うモデルの偽物
  return model as unknown as ExtensionContext['model'];
}

function registryFake(): ExtensionContext['modelRegistry'] {
  const registry = {
    getApiKeyAndHeaders: async () => ({ ok: true, apiKey: 'k', headers: {}, env: {} }),
  };
  // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion, typescript/no-unsafe-type-assertion -- modelRegistry の使う口だけ持つ偽物
  return registry as unknown as ExtensionContext['modelRegistry'];
}

function compactOk(): SummaryCtx['compactFn'] {
  return async (preparation) => ({
    summary: 's'.repeat(400),
    firstKeptEntryId: preparation.firstKeptEntryId,
    tokensBefore: LEAD_TOKENS,
    usage: llmUsage(),
    details: { readFiles: [], modifiedFiles: [] },
  });
}

function compactOnceOk(): SummaryCtx['compactFn'] {
  const ok = compactOk();
  let calls = 0;
  return async (...args: Parameters<SummaryCtx['compactFn']>) => {
    calls += 1;
    if (calls === 1) {
      return ok(...args);
    }
    throw new Error(BOOM);
  };
}

interface CtxSetup {
  readonly ctx: PrecompactCtx;
  readonly notified: { readonly message: string; readonly type: string | undefined }[];
  readonly statuses: (string | undefined)[];
}

function fakeCtx(options: {
  readonly branch: readonly SessionEntry[];
  readonly sessionId?: string;
  readonly usage?: ContextUsage | undefined;
  readonly signal?: AbortSignal | undefined;
  readonly model?: ExtensionContext['model'];
}): CtxSetup {
  const notified: { message: string; type: string | undefined }[] = [];
  const statuses: (string | undefined)[] = [];
  const sessionId = options.sessionId ?? SESSION_ID;
  const branch = options.branch;
  const manager = {
    buildSessionProjection: () => {
      return {
        entries: projectEntries(branch),
        messages: [],
        thinkingLevel: 'off',
        model: null,
      };
    },
    getBranch: () => {
      return [...branch];
    },
    getSessionId: () => {
      return sessionId;
    },
  };
  const ctx: PrecompactCtx = {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion, typescript/no-unsafe-type-assertion -- 枝の読みだけ持つ偽物
    sessionManager: manager as unknown as ExtensionContext['sessionManager'],
    model: 'model' in options ? options.model : modelFake(),
    modelRegistry: registryFake(),
    thinkingLevel: 'medium',
    getContextUsage: () => {
      return options.usage;
    },
    signal: options.signal,
    ui: {
      notify: (message: string, type?: 'info' | 'warning' | 'error') => {
        notified.push({ message, type });
      },
      setStatus: (_key: string, text: string | undefined) => {
        statuses.push(text);
      },
    },
  };
  return { ctx, notified, statuses };
}

interface PiSetup {
  readonly pi: PiPort;
  readonly events: string[];
  readonly commands: Map<string, (args: string, ctx: PrecompactCtx) => Promise<void>>;
}

function fakePi(piEnabled = true): PiSetup {
  const events: string[] = [];
  const commands = new Map<string, (args: string, ctx: PrecompactCtx) => Promise<void>>();
  const impl = {
    on: (event: string, _handler: (event: unknown, ctx: PrecompactCtx) => unknown) => {
      events.push(event);
      return () => undefined;
    },
    registerCommand: (
      name: string,
      options: { handler: (args: string, ctx: PrecompactCtx) => Promise<void> },
    ) => {
      commands.set(name, options.handler);
    },
    getSettings: () => ({ compaction: { enabled: piEnabled } }),
  };
  // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion, typescript/no-unsafe-type-assertion -- on と命令を記録する偽物
  const pi = impl as unknown as PiPort;
  return { pi, events, commands };
}

function wiringWith(dir?: string) {
  const { pi } = fakePi();
  return createPrecompactWiring(pi, {
    settingsDir: dir ?? defaultSettingsDir(),
    now: () => 0,
    compactFn: compactOk(),
  });
}

function matchingPreparation(branch: readonly SessionEntry[]) {
  const theirs = prepareFromProjection({
    projectedEntries: projectEntries(branch),
    pathEntries: branch,
    settings: {
      enabled: true,
      reserveTokens: RESERVE_TOKENS,
      keepRecentTokens: KEEP_RECENT_TOKENS,
    },
    tokensBefore: LEAD_TOKENS,
  });
  if (theirs === undefined) {
    throw new Error('expected preparation must exist');
  }
  return theirs;
}

function compactEvent(
  preparation: ReturnType<typeof matchingPreparation>,
  branch: readonly SessionEntry[],
): SessionBeforeCompactEvent {
  const event = {
    type: 'session_before_compact',
    preparation,
    branchEntries: branch,
    reason: 'threshold',
    willRetry: false,
    signal: new AbortController().signal,
  };
  // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion, typescript/no-unsafe-type-assertion -- 判定に使う口だけ持つ偽物
  return event as unknown as SessionBeforeCompactEvent;
}

function appliedChat(before: number, after: number): string {
  const status: NotifiableStatus = { kind: 'applied', before, after };
  return chatText(status);
}

describe('precompact wiring', () => {
  it('turn_end で比率が閾値の手前 → running が true、status が preparing', async () => {
    const session = createSessionFixture();
    const branch = session.turns(3);
    const { ctx } = fakeCtx({ branch, usage: contextUsageOf(LEAD_TOKENS) });
    const wiring = wiringWith();
    await wiring.onTurnEnd(ctx);
    expect(wiring.getState().running).toBe(true);
    expect(wiring.getState().status).toEqual({ kind: 'preparing' });
    await wiring.flush();
  });

  it('flush が実行中の pass を待つ → prepared が立ち、status が ready', async () => {
    const session = createSessionFixture();
    const branch = session.turns(3);
    const { ctx } = fakeCtx({ branch, usage: contextUsageOf(LEAD_TOKENS) });
    const wiring = wiringWith();
    await wiring.onTurnEnd(ctx);
    await wiring.flush();
    expect(wiring.getState().running).toBe(false);
    expect(wiring.getState().prepared).toBeDefined();
    expect(wiring.getState().status.kind).toBe('ready');
  });

  it('次の turn_end で比率が閾値 → draft 1 件・chat に applied・lastApplied', async () => {
    const session = createSessionFixture();
    const branch = session.turns(3);
    const lead = fakeCtx({ branch, usage: contextUsageOf(LEAD_TOKENS) });
    const wiring = wiringWith();
    await wiring.onTurnEnd(lead.ctx);
    await wiring.flush();
    const ready = wiring.getState().prepared;
    if (ready === undefined) {
      throw new Error('prepared must be ready');
    }
    const hot = fakeCtx({ branch, usage: contextUsageOf(THRESHOLD_TOKENS) });
    const outcome = await wiring.onTurnEnd(hot.ctx);
    expect(outcome?.entries).toHaveLength(1);
    expect(outcome?.entries?.[0]).toMatchObject({ type: 'compaction' });
    const applied = appliedChat(ready.tokensBefore, ready.tokensAfter);
    expect(hot.notified).toContainEqual({ message: applied, type: 'info' });
    expect(hot.statuses.at(-1)).toBe(applied);
    expect(wiring.getState().lastAppliedTokens).toBe(ready.tokensAfter);
  });

  it('agent_before_settle で prepared があり比率が閾値 → draft 1 件', async () => {
    const session = createSessionFixture();
    const branch = session.turns(3);
    const lead = fakeCtx({ branch, usage: contextUsageOf(LEAD_TOKENS) });
    const wiring = wiringWith();
    await wiring.onTurnEnd(lead.ctx);
    await wiring.flush();
    const ready = wiring.getState().prepared;
    if (ready === undefined) {
      throw new Error('prepared must be ready');
    }
    const hot = fakeCtx({ branch, usage: contextUsageOf(THRESHOLD_TOKENS) });
    expect(wiring.onBeforeSettle(hot.ctx)?.entries).toHaveLength(1);
    const applied = appliedChat(ready.tokensBefore, ready.tokensAfter);
    expect(hot.notified).toContainEqual({ message: applied, type: 'info' });
    expect(wiring.getState().lastAppliedTokens).toBe(ready.tokensAfter);
    expect(hot.statuses.at(-1)).toBe(applied);
  });

  it('agent_before_settle で比率が閾値未満 → undefined', async () => {
    const session = createSessionFixture();
    const branch = session.turns(3);
    const lead = fakeCtx({ branch, usage: contextUsageOf(LEAD_TOKENS) });
    const wiring = wiringWith();
    await wiring.onTurnEnd(lead.ctx);
    await wiring.flush();
    const cold = fakeCtx({ branch, usage: contextUsageOf(LEAD_TOKENS) });
    expect(wiring.onBeforeSettle(cold.ctx)).toBeUndefined();
  });

  it('agent_before_settle で prepared が stale → draft 無し・フォールバック通知', async () => {
    const session = createSessionFixture();
    const branch = session.turns(3);
    const lead = fakeCtx({ branch, usage: contextUsageOf(LEAD_TOKENS) });
    const wiring = wiringWith();
    await wiring.onTurnEnd(lead.ctx);
    await wiring.flush();
    expect(wiring.getState().prepared).toBeDefined();
    const stale = fakeCtx({
      branch: branch.slice(0, -1),
      usage: contextUsageOf(THRESHOLD_TOKENS),
    });
    expect(wiring.onBeforeSettle(stale.ctx)).toBeUndefined();
    expect(wiring.getState().prepared).toBeUndefined();
    expect(stale.notified).toContainEqual({ message: FALLBACK_TEXT, type: 'warning' });
  });

  it('turn_end の apply で stale → draft 無し・フォールバック通知', async () => {
    const session = createSessionFixture();
    const branch = session.turns(3);
    const last = branch.at(-1);
    if (last === undefined) {
      throw new Error('branch must have leaf');
    }
    const variants: {
      readonly name: string;
      readonly branch: SessionEntry[];
      readonly sessionId: string;
    }[] = [
      { name: 'session', branch: [...branch], sessionId: OTHER_SESSION_ID },
      { name: 'leaf', branch: branch.slice(0, -1), sessionId: SESSION_ID },
      {
        name: 'firstKept',
        branch: [...branch.slice(0, 4), ...branch.slice(5)],
        sessionId: SESSION_ID,
      },
      {
        name: 'compaction',
        branch: [...branch, session.compaction('new')],
        sessionId: SESSION_ID,
      },
    ];
    for (const variant of variants) {
      const lead = fakeCtx({ branch, usage: contextUsageOf(LEAD_TOKENS) });
      const { pi } = fakePi();
      const wiring = createPrecompactWiring(pi, {
        settingsDir: defaultSettingsDir(),
        now: () => 0,
        compactFn: compactOk(),
      });
      // eslint-disable-next-line no-await-in-loop -- stale の 4 分岐を順に確かめる
      await wiring.onTurnEnd(lead.ctx);
      // eslint-disable-next-line no-await-in-loop -- stale の 4 分岐を順に確かめる
      await wiring.flush();
      const hot = fakeCtx({
        branch: variant.branch,
        sessionId: variant.sessionId,
        usage: contextUsageOf(THRESHOLD_TOKENS),
      });
      // eslint-disable-next-line no-await-in-loop -- stale の 4 分岐を順に確かめる
      const outcome = await wiring.onTurnEnd(hot.ctx);
      expect(outcome, variant.name).toBeUndefined();
      expect(hot.notified, variant.name).toContainEqual({
        message: FALLBACK_TEXT,
        type: 'warning',
      });
    }
  });

  it('session_before_compact で一致 → compaction を返し tokensBefore が現在値', async () => {
    const session = createSessionFixture();
    const branch = session.turns(3);
    const lead = fakeCtx({ branch, usage: contextUsageOf(LEAD_TOKENS) });
    const wiring = wiringWith();
    await wiring.onTurnEnd(lead.ctx);
    await wiring.flush();
    const ready = wiring.getState().prepared;
    if (ready === undefined) {
      throw new Error('prepared must be ready');
    }
    const hot = fakeCtx({ branch, usage: contextUsageOf(THRESHOLD_TOKENS) });
    const outcome = wiring.onSessionBeforeCompact(
      compactEvent(matchingPreparation(branch), branch),
      hot.ctx,
    );
    expect(outcome?.compaction?.tokensBefore).toBe(THRESHOLD_TOKENS);
    expect(wiring.getState().status).toEqual({
      kind: 'applied',
      before: THRESHOLD_TOKENS,
      after: ready.tokensAfter,
    });
    expect(wiring.getState().lastAppliedTokens).toBe(ready.tokensAfter);
    expect(hot.notified).toContainEqual({
      message: appliedChat(THRESHOLD_TOKENS, ready.tokensAfter),
      type: 'info',
    });
    expect(hot.statuses.at(-1)).toBe(appliedChat(THRESHOLD_TOKENS, ready.tokensAfter));
  });

  it('session_before_compact で firstKept が違う → 照合の不一致でフォールバック通知', async () => {
    const session = createSessionFixture();
    const branch = session.turns(3);
    const lead = fakeCtx({ branch, usage: contextUsageOf(LEAD_TOKENS) });
    const wiring = wiringWith();
    await wiring.onTurnEnd(lead.ctx);
    await wiring.flush();
    const hot = fakeCtx({ branch, usage: contextUsageOf(THRESHOLD_TOKENS) });
    const event = compactEvent(
      { ...matchingPreparation(branch), firstKeptEntryId: 'other-kept' },
      branch,
    );
    expect(wiring.onSessionBeforeCompact(event, hot.ctx)).toBeUndefined();
    expect(hot.notified).toContainEqual({ message: FALLBACK_TEXT, type: 'warning' });
    expect(wiring.getState().prepared).toBeUndefined();
  });

  it('拡張か Pi の enabled が false → 開始しない', async () => {
    const session = createSessionFixture();
    const branch = session.turns(3);
    const offSetup = fakeCtx({ branch, usage: contextUsageOf(LEAD_TOKENS) });
    const enabledPi = fakePi(true);
    const wiringOff = createPrecompactWiring(enabledPi.pi, {
      settingsDir: settingsDirWith(settingsDocument({ enabled: false })),
      now: () => 0,
      compactFn: compactOk(),
    });
    await wiringOff.onTurnEnd(offSetup.ctx);
    expect(wiringOff.getState().running).toBe(false);
    const piSetup = fakeCtx({ branch, usage: contextUsageOf(LEAD_TOKENS) });
    const disabledPi = fakePi(false);
    const wiringPi = createPrecompactWiring(disabledPi.pi, {
      settingsDir: defaultSettingsDir(),
      now: () => 0,
      compactFn: compactOk(),
    });
    await wiringPi.onTurnEnd(piSetup.ctx);
    expect(wiringPi.getState().running).toBe(false);
  });
});

describe('precompact wiring lifecycle', () => {
  it('設定が壊れている → 1 度だけ notify', async () => {
    const dir = tempDir();
    writeFileSync(join(dir, 'settings.json'), '{');
    const broken = readSettings(dir);
    if (broken.kind !== 'broken') {
      throw new Error('settings must be broken');
    }
    const session = createSessionFixture();
    const branch = session.turns(3);
    const { pi } = fakePi();
    const wiring = createPrecompactWiring(pi, {
      settingsDir: dir,
      now: () => 0,
      compactFn: compactOk(),
    });
    const first = fakeCtx({ branch, usage: contextUsageOf(LEAD_TOKENS) });
    await wiring.onTurnEnd(first.ctx);
    const second = fakeCtx({ branch, usage: contextUsageOf(LEAD_TOKENS) });
    await wiring.onTurnEnd(second.ctx);
    const expected = { message: brokenText(broken.reason), type: 'warning' };
    expect(first.notified).toContainEqual(expected);
    expect(first.notified).toHaveLength(1);
    expect(second.notified).toHaveLength(0);
    expect(wiring.getState().running).toBe(false);
  });

  it('session_start / shutdown → clear・prepared 無し', async () => {
    const session = createSessionFixture();
    const branch = session.turns(3);
    const { ctx } = fakeCtx({ branch, usage: contextUsageOf(LEAD_TOKENS) });
    const wiring = wiringWith();
    await wiring.onTurnEnd(ctx);
    await wiring.flush();
    expect(wiring.getState().prepared).toBeDefined();
    wiring.onSessionStart(ctx);
    expect(wiring.getState().prepared).toBeUndefined();
    expect(wiring.getState().status).toEqual({ kind: 'idle' });
    await wiring.onTurnEnd(ctx);
    await wiring.flush();
    wiring.onSessionShutdown(ctx);
    expect(wiring.getState().prepared).toBeUndefined();
    expect(wiring.getState().status).toEqual({ kind: 'idle' });
  });
});

describe('precompact failure reason', () => {
  it('1回目成功で prepared が立ち2回目の要約が boom で失敗 → preparing と warning の2通で理由入りで failed', async () => {
    const session = createSessionFixture();
    const branch = session.turns(3);
    const { pi } = fakePi();
    const wiring = createPrecompactWiring(pi, {
      settingsDir: defaultSettingsDir(),
      now: () => 0,
      compactFn: compactOnceOk(),
    });
    const lead = fakeCtx({ branch, usage: contextUsageOf(LEAD_TOKENS) });
    await wiring.onTurnEnd(lead.ctx);
    await wiring.flush();
    expect(wiring.getState().prepared).toBeDefined();
    const hot = fakeCtx({ branch, usage: contextUsageOf(LEAD_TOKENS) });
    await wiring.onCommand('now', hot.ctx);
    await wiring.flush();
    expect(wiring.getState().status).toEqual({ kind: 'failed', reason: BOOM });
    expect(wiring.getState().prepared).toBeUndefined();
    expect(hot.notified).toEqual([
      { message: chatText({ kind: 'preparing' }), type: 'info' },
      { message: failureText(BOOM), type: 'warning' },
    ]);
  });

  it('1回目に model ありで prepared が立ち2回目に model が undefined → 理由入りで failed', async () => {
    const session = createSessionFixture();
    const branch = session.turns(3);
    const { pi } = fakePi();
    const wiring = createPrecompactWiring(pi, {
      settingsDir: defaultSettingsDir(),
      now: () => 0,
      compactFn: compactOk(),
    });
    const lead = fakeCtx({ branch, usage: contextUsageOf(LEAD_TOKENS) });
    await wiring.onTurnEnd(lead.ctx);
    await wiring.flush();
    expect(wiring.getState().prepared).toBeDefined();
    const hot = fakeCtx({ branch, usage: contextUsageOf(LEAD_TOKENS), model: undefined });
    await wiring.onCommand('now', hot.ctx);
    await wiring.flush();
    expect(wiring.getState().status).toEqual({ kind: 'failed', reason: NO_MODEL_REASON });
    expect(wiring.getState().prepared).toBeUndefined();
    expect(hot.notified).toEqual([
      { message: chatText({ kind: 'preparing' }), type: 'info' },
      { message: failureText(NO_MODEL_REASON), type: 'warning' },
    ]);
  });
});

describe('precompact now response', () => {
  it('now で拡張が off → preparing と off、pass なし', async () => {
    const session = createSessionFixture();
    const branch = session.turns(3);
    const { pi } = fakePi();
    const wiring = createPrecompactWiring(pi, {
      settingsDir: settingsDirWith(settingsDocument({ enabled: false })),
      now: () => 0,
      compactFn: compactOk(),
    });
    const setup = fakeCtx({ branch, usage: contextUsageOf(LEAD_TOKENS) });
    await wiring.onCommand('now', setup.ctx);
    await wiring.flush();
    expect(setup.notified).toEqual([
      { message: chatText({ kind: 'preparing' }), type: 'info' },
      { message: noticeText('off'), type: 'info' },
    ]);
    expect(wiring.getState().status).toEqual({ kind: 'idle' });
    expect(wiring.getState().running).toBe(false);
  });

  it('now で Pi が off → preparing と off', async () => {
    const session = createSessionFixture();
    const branch = session.turns(3);
    const { pi } = fakePi(false);
    const wiring = createPrecompactWiring(pi, {
      settingsDir: defaultSettingsDir(),
      now: () => 0,
      compactFn: compactOk(),
    });
    const setup = fakeCtx({ branch, usage: contextUsageOf(LEAD_TOKENS) });
    await wiring.onCommand('now', setup.ctx);
    await wiring.flush();
    expect(setup.notified).toEqual([
      { message: chatText({ kind: 'preparing' }), type: 'info' },
      { message: noticeText('off'), type: 'info' },
    ]);
    expect(wiring.getState().running).toBe(false);
  });

  it('now で準備なし → preparing と nothing、status idle', async () => {
    const session = createSessionFixture();
    const branch = [...session.turns(3), session.compaction('summary')];
    const { pi } = fakePi();
    const wiring = createPrecompactWiring(pi, {
      settingsDir: defaultSettingsDir(),
      now: () => 0,
      compactFn: compactOk(),
    });
    const setup = fakeCtx({ branch, usage: contextUsageOf(LEAD_TOKENS) });
    await wiring.onCommand('now', setup.ctx);
    await wiring.flush();
    expect(setup.notified).toEqual([
      { message: chatText({ kind: 'preparing' }), type: 'info' },
      { message: noticeText('nothing'), type: 'info' },
    ]);
    expect(wiring.getState().status).toEqual({ kind: 'idle' });
  });
});

describe('precompact commands', () => {
  it('/precompact status と usage → statusLine と usage の通知', async () => {
    const session = createSessionFixture();
    const branch = session.turns(3);
    const wiring = wiringWith();
    const statusSetup = fakeCtx({ branch, usage: contextUsageOf(LEAD_TOKENS) });
    await wiring.onCommand('', statusSetup.ctx);
    expect(statusSetup.notified[0]?.message).toContain(`status: ${statusLine({ kind: 'idle' })}`);
    const usageSetup = fakeCtx({ branch, usage: contextUsageOf(LEAD_TOKENS) });
    await wiring.onCommand('foo', usageSetup.ctx);
    expect(usageSetup.notified[0]?.message).toContain('usage');
  });

  it('/precompact on / off / now → settings の書き換えと裏での準備開始', async () => {
    const dir = defaultSettingsDir();
    const session = createSessionFixture();
    const branch = session.turns(3);
    const { pi } = fakePi();
    const wiring = createPrecompactWiring(pi, {
      settingsDir: dir,
      now: () => 0,
      compactFn: compactOk(),
    });
    const offSetup = fakeCtx({ branch, usage: contextUsageOf(LEAD_TOKENS) });
    await wiring.onCommand('off', offSetup.ctx);
    expect(offSetup.notified[0]).toEqual({ message: noticeText('off'), type: undefined });
    const afterOff = readSettings(dir);
    if (afterOff.kind !== 'ok') {
      throw new Error('settings must stay readable');
    }
    expect(afterOff.settings.enabled).toBe(false);
    const onSetup = fakeCtx({ branch, usage: contextUsageOf(LEAD_TOKENS) });
    await wiring.onCommand('on', onSetup.ctx);
    const afterOn = readSettings(dir);
    if (afterOn.kind !== 'ok') {
      throw new Error('settings must stay readable');
    }
    expect(afterOn.settings.enabled).toBe(true);
    let resolveGate!: () => void;
    const gate = new Promise<void>((resolve) => {
      resolveGate = resolve;
    });
    const deferredCompact: SummaryCtx['compactFn'] = async (preparation) => {
      await gate;
      return {
        summary: 's'.repeat(400),
        firstKeptEntryId: preparation.firstKeptEntryId,
        tokensBefore: LEAD_TOKENS,
        usage: llmUsage(),
        details: { readFiles: [], modifiedFiles: [] },
      };
    };
    const { pi: piNow } = fakePi();
    const wiringNow = createPrecompactWiring(piNow, {
      settingsDir: defaultSettingsDir(),
      now: () => 0,
      compactFn: deferredCompact,
    });
    const deferredSetup = fakeCtx({ branch, usage: contextUsageOf(LEAD_TOKENS) });
    await wiringNow.onCommand('now', deferredSetup.ctx);
    expect(wiringNow.getState().running).toBe(true);
    expect(wiringNow.getState().status).toEqual({ kind: 'preparing' });
    expect(deferredSetup.notified).toEqual([
      { message: chatText({ kind: 'preparing' }), type: 'info' },
    ]);
    const busySetup = fakeCtx({ branch, usage: contextUsageOf(LEAD_TOKENS) });
    await wiringNow.onCommand('now', busySetup.ctx);
    expect(busySetup.notified).toEqual([{ message: noticeText('running'), type: 'info' }]);
    expect(wiringNow.getState().status).toEqual({ kind: 'preparing' });
    resolveGate();
    await wiringNow.flush();
    const readyStatus = wiringNow.getState().status;
    if (readyStatus.kind !== 'ready') {
      throw new Error('status must be ready');
    }
    expect(deferredSetup.notified).toEqual([
      { message: chatText({ kind: 'preparing' }), type: 'info' },
      {
        message: chatText({
          kind: 'ready',
          before: readyStatus.before,
          after: readyStatus.after,
        }),
        type: 'info',
      },
    ]);
  });

  it('/precompact が失敗の理由を status 行に出す', async () => {
    const session = createSessionFixture();
    const branch = session.turns(3);
    const { pi } = fakePi();
    const wiring = createPrecompactWiring(pi, {
      settingsDir: defaultSettingsDir(),
      now: () => 0,
      compactFn: async () => {
        throw new Error(BOOM);
      },
    });
    const failed = fakeCtx({ branch, usage: contextUsageOf(LEAD_TOKENS) });
    await wiring.onCommand('now', failed.ctx);
    await wiring.flush();
    const after = fakeCtx({ branch, usage: contextUsageOf(LEAD_TOKENS) });
    await wiring.onCommand('', after.ctx);
    expect(after.notified[0]?.message).toContain(
      `status: ${statusLine({ kind: 'failed', reason: BOOM })}`,
    );
  });
});

describe('registerPrecompact', () => {
  it('5 イベントと precompact 命令を登録する', () => {
    const { pi, events, commands } = fakePi();
    registerPrecompact(pi);
    for (const name of [
      'turn_end',
      'agent_before_settle',
      'session_before_compact',
      'session_start',
      'session_shutdown',
    ] as const) {
      expect(events).toContain(name);
    }
    expect(commands.has('precompact')).toBe(true);
  });
});
