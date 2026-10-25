import { writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import type {
  ContextUsage,
  ExtensionContext,
  SessionBeforeCompactEvent,
  SessionEntry,
} from '@earendil-works/pi-coding-agent';
import { tempDir } from '../../../test/temp-dir.ts';
import {
  createPrecompactWiring,
  registerPrecompact,
  type PiPort,
  type PrecompactCtx,
} from './index.ts';
import { NO_MODEL_REASON, type SummaryCtx } from './run/ports.ts';
import { readSettings } from './settings/read.ts';
import { createSessionFixture, projectEntries } from './test/session-entries.ts';
import { usageText } from './command/precompact.ts';
import { prepareFromProjection } from './prepare/copied.ts';
import { DEFAULT_THRESHOLD_RATIO, LEAD_RATIO, RESERVE_TOKENS } from './settings/constants.ts';
import type { Settings } from './settings/schema.ts';
import {
  brokenText,
  chatText,
  failureText,
  FALLBACK_TEXT,
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
  readonly throws?: 'projection' | 'branch' | 'usage';
  readonly notifyThrows?: boolean;
}): CtxSetup {
  const notified: { message: string; type: string | undefined }[] = [];
  const statuses: (string | undefined)[] = [];
  const sessionId = options.sessionId ?? SESSION_ID;
  const branch = options.branch;
  const manager = {
    buildSessionProjection: () => {
      if (options.throws === 'projection') {
        throw new Error(BOOM);
      }
      return {
        entries: projectEntries(branch),
        messages: [],
        thinkingLevel: 'off',
        model: null,
      };
    },
    getBranch: () => {
      if (options.throws === 'branch') {
        throw new Error(BOOM);
      }
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
      if (options.throws === 'usage') {
        throw new Error(BOOM);
      }
      return options.usage;
    },
    signal: options.signal,
    ui: {
      notify: (message: string, type?: 'info' | 'warning' | 'error') => {
        if (options.notifyThrows === true) {
          throw new Error(BOOM);
        }
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
  readonly setPiEnabled: (value: boolean) => void;
}

function fakePi(piEnabled = true): PiSetup {
  const events: string[] = [];
  const commands = new Map<string, (args: string, ctx: PrecompactCtx) => Promise<void>>();
  let enabled = piEnabled;
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
    getSettings: () => ({ compaction: { enabled } }),
    setPiEnabled: (value: boolean) => {
      enabled = value;
    },
  };
  // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion, typescript/no-unsafe-type-assertion -- on と命令を記録する偽物
  const pi = impl as unknown as PiPort;
  return { pi, events, commands, setPiEnabled: impl.setPiEnabled };
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
    const applied = appliedChat(THRESHOLD_TOKENS, ready.tokensAfter);
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
    const applied = appliedChat(THRESHOLD_TOKENS, ready.tokensAfter);
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
  it('now で拡張か Pi が off → preparing と off、pass なし', async () => {
    const session = createSessionFixture();
    const branch = session.turns(3);
    const wirings = [
      createPrecompactWiring(fakePi().pi, {
        settingsDir: settingsDirWith(settingsDocument({ enabled: false })),
        now: () => 0,
        compactFn: compactOk(),
      }),
      createPrecompactWiring(fakePi(false).pi, {
        settingsDir: defaultSettingsDir(),
        now: () => 0,
        compactFn: compactOk(),
      }),
    ];
    for (const wiring of wirings) {
      const setup = fakeCtx({ branch, usage: contextUsageOf(LEAD_TOKENS) });
      // eslint-disable-next-line no-await-in-loop -- 2 つの off を順に確かめる
      await wiring.onCommand('now', setup.ctx);
      // eslint-disable-next-line no-await-in-loop -- 2 つの off を順に確かめる
      await wiring.flush();
      expect(setup.notified).toEqual([
        { message: chatText({ kind: 'preparing' }), type: 'info' },
        { message: noticeText('off'), type: 'info' },
      ]);
      expect(wiring.getState().running).toBe(false);
    }
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
    expect(usageSetup.notified[0]?.message).toBe(usageText());
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

function okResult(preparation: Parameters<SummaryCtx['compactFn']>[0]) {
  return {
    summary: 's'.repeat(400),
    firstKeptEntryId: preparation.firstKeptEntryId,
    tokensBefore: LEAD_TOKENS,
    usage: llmUsage(),
    details: { readFiles: [], modifiedFiles: [] },
  };
}

function nowSetup(compactFn: SummaryCtx['compactFn'] = compactOk()) {
  const session = createSessionFixture();
  const branch = session.turns(3);
  const { pi, setPiEnabled } = fakePi();
  const dir = defaultSettingsDir();
  const wiring = createPrecompactWiring(pi, { settingsDir: dir, now: () => 0, compactFn });
  return { branch, wiring, dir, setPiEnabled };
}

async function preparedNow(setup: ReturnType<typeof nowSetup>) {
  const lead = fakeCtx({ branch: setup.branch, usage: contextUsageOf(LEAD_TOKENS) });
  await setup.wiring.onCommand('now', lead.ctx);
  await setup.wiring.flush();
  const ready = setup.wiring.getState().prepared;
  if (ready === undefined) throw new Error('prepared must be ready');
  return ready;
}

describe('precompact now apply', () => {
  it('now の draft は閾値未満の turn_end で適用される', async () => {
    const setup = nowSetup();
    const ready = await preparedNow(setup);
    const cold = fakeCtx({ branch: setup.branch, usage: contextUsageOf(LEAD_TOKENS) });
    expect((await setup.wiring.onTurnEnd(cold.ctx))?.entries).toHaveLength(1);
    expect(cold.notified).toContainEqual({
      message: appliedChat(LEAD_TOKENS, ready.tokensAfter),
      type: 'info',
    });
  });
  it('now の draft は閾値未満の agent_before_settle で適用される', async () => {
    const setup = nowSetup();
    const ready = await preparedNow(setup);
    const cold = fakeCtx({ branch: setup.branch, usage: contextUsageOf(LEAD_TOKENS) });
    expect(setup.wiring.onBeforeSettle(cold.ctx)?.entries).toHaveLength(1);
    expect(cold.notified).toContainEqual({
      message: appliedChat(LEAD_TOKENS, ready.tokensAfter),
      type: 'info',
    });
  });
  it('実行中の now は旗を立て、次の turn_end で適用する', async () => {
    let release!: () => void;
    const deferred: SummaryCtx['compactFn'] = async (prep) => {
      await new Promise<void>((resolve) => {
        release = resolve;
      });
      return okResult(prep);
    };
    const setup = nowSetup(deferred);
    const lead = fakeCtx({ branch: setup.branch, usage: contextUsageOf(LEAD_TOKENS) });
    await setup.wiring.onTurnEnd(lead.ctx);
    const busy = fakeCtx({ branch: setup.branch, usage: contextUsageOf(LEAD_TOKENS) });
    await setup.wiring.onCommand('now', busy.ctx);
    expect(busy.notified).toEqual([{ message: noticeText('running'), type: 'info' }]);
    release();
    await setup.wiring.flush();
    const cold = fakeCtx({ branch: setup.branch, usage: contextUsageOf(LEAD_TOKENS) });
    expect((await setup.wiring.onTurnEnd(cold.ctx))?.entries).toHaveLength(1);
  });
  it('now の失敗の後は旗が消え、自動の draft は適用されない', async () => {
    let calls = 0;
    const onceFails: SummaryCtx['compactFn'] = async (prep) => {
      calls += 1;
      if (calls === 1) {
        throw new Error(BOOM);
      }
      return okResult(prep);
    };
    const setup = nowSetup(onceFails);
    await preparedNow(setup).catch(() => undefined);
    expect(setup.wiring.getState().status.kind).toBe('failed');
    const auto = fakeCtx({ branch: setup.branch, usage: contextUsageOf(LEAD_TOKENS) });
    await setup.wiring.onTurnEnd(auto.ctx);
    await setup.wiring.flush();
    const cold = fakeCtx({ branch: setup.branch, usage: contextUsageOf(LEAD_TOKENS) });
    expect(await setup.wiring.onTurnEnd(cold.ctx)).toBeUndefined();
  });
  it('now の後に拡張を off にすると適用しない', async () => {
    const setup = nowSetup();
    await preparedNow(setup);
    writeFileSync(
      join(setup.dir, 'settings.json'),
      JSON.stringify(settingsDocument({ enabled: false })),
    );
    const cold = fakeCtx({ branch: setup.branch, usage: contextUsageOf(LEAD_TOKENS) });
    expect(await setup.wiring.onTurnEnd(cold.ctx)).toBeUndefined();
  });
  it('now の後に Pi を off にすると適用しない', async () => {
    const setup = nowSetup();
    await preparedNow(setup);
    setup.setPiEnabled(false);
    const cold = fakeCtx({ branch: setup.branch, usage: contextUsageOf(LEAD_TOKENS) });
    expect(await setup.wiring.onTurnEnd(cold.ctx)).toBeUndefined();
  });
  it('now の後に leaf が変わると stale で捨てる', async () => {
    const setup = nowSetup();
    await preparedNow(setup);
    const stale = fakeCtx({
      branch: setup.branch.slice(0, -1),
      usage: contextUsageOf(LEAD_TOKENS),
    });
    expect(await setup.wiring.onTurnEnd(stale.ctx)).toBeUndefined();
    expect(stale.notified).toContainEqual({ message: FALLBACK_TEXT, type: 'warning' });
  });
});

describe('precompact tokens after', () => {
  it('usage が undefined なら前は準備時の値、後ろは推定のまま', async () => {
    const setup = nowSetup();
    const ready = await preparedNow(setup);
    const noUsage = fakeCtx({ branch: setup.branch, usage: undefined });
    expect((await setup.wiring.onTurnEnd(noUsage.ctx))?.entries).toHaveLength(1);
    expect(setup.wiring.getState().status).toEqual({
      kind: 'applied',
      before: ready.tokensBefore,
      after: ready.tokensAfter,
    });
  });
  it('session_before_compact で usage が undefined なら準備時の値を使う', async () => {
    const setup = nowSetup();
    const ready = await preparedNow(setup);
    const noUsage = fakeCtx({ branch: setup.branch, usage: undefined });
    const outcome = setup.wiring.onSessionBeforeCompact(
      compactEvent(matchingPreparation(setup.branch), setup.branch),
      noUsage.ctx,
    );
    expect(outcome?.compaction?.tokensBefore).toBe(ready.result.tokensBefore);
    expect(setup.wiring.getState().status).toEqual({
      kind: 'applied',
      before: ready.result.tokensBefore,
      after: ready.tokensAfter,
    });
  });
});

describe('precompact guards', () => {
  it('拡張が off なら agent_before_settle は適用しない', async () => {
    const setup = nowSetup();
    await preparedNow(setup);
    writeFileSync(
      join(setup.dir, 'settings.json'),
      JSON.stringify(settingsDocument({ enabled: false })),
    );
    const hot = fakeCtx({ branch: setup.branch, usage: contextUsageOf(THRESHOLD_TOKENS) });
    expect(setup.wiring.onBeforeSettle(hot.ctx)).toBeUndefined();
  });
  it('Pi が off なら agent_before_settle は適用しない', async () => {
    const setup = nowSetup();
    await preparedNow(setup);
    setup.setPiEnabled(false);
    const hot = fakeCtx({ branch: setup.branch, usage: contextUsageOf(THRESHOLD_TOKENS) });
    expect(setup.wiring.onBeforeSettle(hot.ctx)).toBeUndefined();
  });
  it('拡張が off なら session_before_compact は渡さない', async () => {
    const setup = nowSetup();
    await preparedNow(setup);
    writeFileSync(
      join(setup.dir, 'settings.json'),
      JSON.stringify(settingsDocument({ enabled: false })),
    );
    const hot = fakeCtx({ branch: setup.branch, usage: contextUsageOf(THRESHOLD_TOKENS) });
    expect(
      setup.wiring.onSessionBeforeCompact(
        compactEvent(matchingPreparation(setup.branch), setup.branch),
        hot.ctx,
      ),
    ).toBeUndefined();
  });
  it('Pi が off なら session_before_compact は渡さない', async () => {
    const setup = nowSetup();
    await preparedNow(setup);
    setup.setPiEnabled(false);
    const hot = fakeCtx({ branch: setup.branch, usage: contextUsageOf(THRESHOLD_TOKENS) });
    expect(
      setup.wiring.onSessionBeforeCompact(
        compactEvent(matchingPreparation(setup.branch), setup.branch),
        hot.ctx,
      ),
    ).toBeUndefined();
  });
});

describe('precompact error path', () => {
  it('buildSessionProjection / getBranch / getContextUsage の throw は failed になる', async () => {
    for (const thrown of ['projection', 'branch', 'usage'] as const) {
      const setup = nowSetup();
      const bad = fakeCtx({
        branch: setup.branch,
        usage: contextUsageOf(LEAD_TOKENS),
        throws: thrown,
      });
      // eslint-disable-next-line no-await-in-loop -- 3 つの throw を順に確かめる
      await setup.wiring.onCommand('now', bad.ctx);
      // eslint-disable-next-line no-await-in-loop -- 3 つの throw を順に確かめる
      await setup.wiring.flush();
      expect(setup.wiring.getState().status.kind, thrown).toBe('failed');
    }
  });
  it('notify が throw すると now は reject し、running が戻る', async () => {
    const setup = nowSetup();
    const bad = fakeCtx({
      branch: setup.branch,
      usage: contextUsageOf(LEAD_TOKENS),
      notifyThrows: true,
    });
    await expect(setup.wiring.onCommand('now', bad.ctx)).rejects.toThrow(BOOM);
    expect(setup.wiring.getState().running).toBe(false);
  });
});

describe('precompact session reset', () => {
  it('session 切替の後、古い pass は状態を書かない', async () => {
    let release!: () => void;
    const deferred: SummaryCtx['compactFn'] = async (prep) => {
      await new Promise<void>((resolve) => {
        release = resolve;
      });
      return okResult(prep);
    };
    const setup = nowSetup(deferred);
    const lead = fakeCtx({ branch: setup.branch, usage: contextUsageOf(LEAD_TOKENS) });
    await setup.wiring.onTurnEnd(lead.ctx);
    setup.wiring.onSessionStart(lead.ctx);
    release();
    await setup.wiring.flush();
    expect(setup.wiring.getState().prepared).toBeUndefined();
    expect(setup.wiring.getState().status).toEqual({ kind: 'idle' });
  });
  it('古い pass の終了が、新しい pass の running を戻さない', async () => {
    const releases: (() => void)[] = [];
    const deferred: SummaryCtx['compactFn'] = async (prep) => {
      await new Promise<void>((resolve) => {
        releases.push(resolve);
      });
      return okResult(prep);
    };
    const setup = nowSetup(deferred);
    const lead = fakeCtx({ branch: setup.branch, usage: contextUsageOf(LEAD_TOKENS) });
    await setup.wiring.onTurnEnd(lead.ctx);
    setup.wiring.onSessionStart(lead.ctx);
    await setup.wiring.onTurnEnd(lead.ctx);
    await new Promise((resolve) => setTimeout(resolve, 0));
    releases[0]?.();
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(setup.wiring.getState().running).toBe(true);
    releases[1]?.();
    await setup.wiring.flush();
  });
  it('session 切替で forceApply を引き継がない', async () => {
    const setup = nowSetup();
    await preparedNow(setup);
    setup.wiring.onSessionStart(
      fakeCtx({ branch: setup.branch, usage: contextUsageOf(LEAD_TOKENS) }).ctx,
    );
    const cold = fakeCtx({ branch: setup.branch, usage: contextUsageOf(LEAD_TOKENS) });
    expect(await setup.wiring.onTurnEnd(cold.ctx)).toBeUndefined();
  });
});

describe('precompact command edges', () => {
  it('壊れた settings で on / off は warning', async () => {
    for (const command of ['on', 'off'] as const) {
      const dir = tempDir();
      writeFileSync(join(dir, 'settings.json'), '{');
      const { pi } = fakePi();
      const wiring = createPrecompactWiring(pi, {
        settingsDir: dir,
        now: () => 0,
        compactFn: compactOk(),
      });
      const setup = fakeCtx({ branch: [], usage: undefined });
      // eslint-disable-next-line no-await-in-loop -- on と off を順に確かめる
      await wiring.onCommand(command, setup.ctx);
      expect(setup.notified[0]?.type, command).toBe('warning');
    }
  });
});
