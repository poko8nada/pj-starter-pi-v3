import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  sessionEntryToContextMessages,
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
import type { SummaryCtx } from './run/ports.ts';
import { prepareFromProjection } from './prepare/copied.ts';
import { RESERVE_TOKENS } from './settings/constants.ts';
import { readSettings } from './settings/read.ts';

const CONTEXT_WINDOW = 10_000;
const LEAD_TOKENS = 7_600;
const THRESHOLD_TOKENS = 8_100;

let seq = 0;

function nextId(): { readonly id: string; readonly parentId: string | null } {
  seq += 1;
  return { id: `n${seq}`, parentId: seq > 1 ? `n${seq - 1}` : null };
}

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

function userEntry(text: string): SessionEntry {
  const ids = nextId();
  return {
    type: 'message',
    id: ids.id,
    parentId: ids.parentId,
    timestamp: new Date(seq).toISOString(),
    message: { role: 'user', content: [{ type: 'text', text }], timestamp: seq },
  };
}

function assistantEntry(text: string): SessionEntry {
  const ids = nextId();
  return {
    type: 'message',
    id: ids.id,
    parentId: ids.parentId,
    timestamp: new Date(seq).toISOString(),
    message: {
      role: 'assistant',
      content: [{ type: 'text', text }],
      api: 'openai-completions',
      provider: 'test',
      model: 'test-model',
      usage: llmUsage(),
      stopReason: 'stop',
      timestamp: seq,
    },
  };
}

function compactionEntry(summary: string): SessionEntry {
  const ids = nextId();
  return {
    type: 'compaction',
    id: ids.id,
    parentId: ids.parentId,
    timestamp: new Date(seq).toISOString(),
    summary,
    firstKeptEntryId: 'kept',
    tokensBefore: 100,
    details: undefined,
    fromHook: true,
  };
}

/** 6 件・約 6000 トークンの 3 ターンを作る */
function threeTurns(): SessionEntry[] {
  const entries: SessionEntry[] = [];
  for (let turn = 0; turn < 3; turn++) {
    entries.push(userEntry(`u${turn}-${'x'.repeat(4000)}`));
    entries.push(assistantEntry(`a${turn}-${'y'.repeat(4000)}`));
  }
  return entries;
}

function settingsDirWith(document: Record<string, unknown>): string {
  const dir = tempDir();
  writeFileSync(join(dir, 'settings.json'), JSON.stringify(document));
  return dir;
}

function defaultSettingsDir(): string {
  return settingsDirWith({ keepRecentTokens: 1500, thresholdRatio: 0.8 });
}

function contextUsageOf(tokens: number | null): ContextUsage {
  return { tokens, contextWindow: CONTEXT_WINDOW, percent: tokens === null ? null : 50 };
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

function compactFailing(): SummaryCtx['compactFn'] {
  return async (): Promise<never> => {
    throw new Error('boom');
  };
}

interface CtxSetup {
  readonly ctx: PrecompactCtx;
  readonly calls: string[];
  readonly notified: { readonly message: string; readonly type: string | undefined }[];
  readonly statuses: (string | undefined)[];
}

function fakeCtx(options: {
  readonly branch: readonly SessionEntry[];
  readonly sessionId?: string;
  readonly usage?: ContextUsage | undefined;
  readonly signal?: AbortSignal | undefined;
}): CtxSetup {
  const calls: string[] = [];
  const notified: { message: string; type: string | undefined }[] = [];
  const statuses: (string | undefined)[] = [];
  const sessionId = options.sessionId ?? 'sess-1';
  const branch = options.branch;
  const manager = {
    buildSessionProjection: () => {
      calls.push('buildSessionProjection');
      return {
        entries: branch.map((sourceEntry) => ({
          sourceEntry,
          messages: [...sessionEntryToContextMessages(sourceEntry)],
        })),
        messages: [],
        thinkingLevel: 'off',
        model: null,
      };
    },
    getBranch: () => {
      calls.push('getBranch');
      return [...branch];
    },
    getSessionId: () => {
      calls.push('getSessionId');
      return sessionId;
    },
  };
  const ctx: PrecompactCtx = {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion, typescript/no-unsafe-type-assertion -- 枝の読みだけ持つ偽物
    sessionManager: manager as unknown as ExtensionContext['sessionManager'],
    model: modelFake(),
    modelRegistry: registryFake(),
    thinkingLevel: 'medium',
    getContextUsage: () => {
      calls.push('getContextUsage');
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
  return { ctx, calls, notified, statuses };
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
  const wiring = createPrecompactWiring(pi, {
    settingsDir: dir ?? defaultSettingsDir(),
    now: () => 1000,
    compactFn: compactOk(),
  });
  return wiring;
}

function projectedOf(branch: readonly SessionEntry[]) {
  return branch.map((sourceEntry) => ({
    sourceEntry,
    messages: [...sessionEntryToContextMessages(sourceEntry)],
  }));
}

function matchingPreparation(branch: readonly SessionEntry[]) {
  const theirs = prepareFromProjection({
    projectedEntries: projectedOf(branch),
    pathEntries: branch,
    settings: { enabled: true, reserveTokens: RESERVE_TOKENS, keepRecentTokens: 1500 },
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
    signal: AbortSignal.timeout(1000),
  };
  // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion, typescript/no-unsafe-type-assertion -- 判定に使う口だけ持つ偽物
  return event as unknown as SessionBeforeCompactEvent;
}

describe('precompact wiring', () => {
  it('turn_end で比率が閾値の手前 → running が true、status が preparing', async () => {
    const branch = threeTurns();
    const { ctx } = fakeCtx({ branch, usage: contextUsageOf(LEAD_TOKENS) });
    const wiring = wiringWith();
    await wiring.onTurnEnd(ctx);
    expect(wiring.getState().running).toBe(true);
    expect(wiring.getState().status).toEqual({ kind: 'preparing' });
    await wiring.flush();
  });

  it('flush が実行中の pass を待つ → prepared が立ち、status が ready', async () => {
    const branch = threeTurns();
    const { ctx } = fakeCtx({ branch, usage: contextUsageOf(LEAD_TOKENS) });
    const wiring = wiringWith();
    await wiring.onTurnEnd(ctx);
    await wiring.flush();
    expect(wiring.getState().running).toBe(false);
    expect(wiring.getState().prepared).toBeDefined();
    expect(wiring.getState().status.kind).toBe('ready');
  });

  it('次の turn_end で比率が閾値 → draft 1 件・footer に applied・lastApplied', async () => {
    const branch = threeTurns();
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
    expect(hot.notified.some((n) => n.message.includes('applied'))).toBe(false);
    expect(hot.statuses[hot.statuses.length - 1]).toContain('precompact: applied');
    expect(wiring.getState().lastAppliedTokens).toBe(ready.tokensAfter);
  });

  it('agent_before_settle で prepared があり比率が閾値 → draft 1 件', async () => {
    const branch = threeTurns();
    const lead = fakeCtx({ branch, usage: contextUsageOf(LEAD_TOKENS) });
    const wiring = wiringWith();
    await wiring.onTurnEnd(lead.ctx);
    await wiring.flush();
    const hot = fakeCtx({ branch, usage: contextUsageOf(THRESHOLD_TOKENS) });
    expect(wiring.onBeforeSettle(hot.ctx)?.entries).toHaveLength(1);
  });

  it('agent_before_settle で比率が閾値未満 → undefined', async () => {
    const branch = threeTurns();
    const lead = fakeCtx({ branch, usage: contextUsageOf(LEAD_TOKENS) });
    const wiring = wiringWith();
    await wiring.onTurnEnd(lead.ctx);
    await wiring.flush();
    const cold = fakeCtx({ branch, usage: contextUsageOf(LEAD_TOKENS) });
    expect(wiring.onBeforeSettle(cold.ctx)).toBeUndefined();
  });

  it('agent_before_settle で prepared が stale → draft 無し・フォールバック通知', async () => {
    const branch = threeTurns();
    const lead = fakeCtx({ branch, usage: contextUsageOf(LEAD_TOKENS) });
    const wiring = wiringWith();
    await wiring.onTurnEnd(lead.ctx);
    await wiring.flush();
    expect(wiring.getState().prepared).toBeDefined();
    const stale = fakeCtx({
      branch: branch.slice(0, 5),
      usage: contextUsageOf(THRESHOLD_TOKENS),
    });
    expect(wiring.onBeforeSettle(stale.ctx)).toBeUndefined();
    expect(wiring.getState().prepared).toBeUndefined();
    expect(stale.notified.some((n) => n.message.includes('default compaction'))).toBe(true);
  });

  it('turn_end の apply で stale → draft 無し・フォールバック通知', async () => {
    const branch = threeTurns();
    const last = branch[branch.length - 1];
    const kept = branch[4];
    if (last === undefined || kept === undefined) {
      throw new Error('branch must have leaf and kept');
    }
    const variants: {
      readonly name: string;
      readonly branch: SessionEntry[];
      readonly sessionId: string;
    }[] = [
      { name: 'session', branch: [...branch], sessionId: 'sess-2' },
      { name: 'leaf', branch: branch.slice(0, 5), sessionId: 'sess-1' },
      {
        name: 'firstKept',
        branch: [...branch.slice(0, 4), ...(branch[5] === undefined ? [] : [branch[5]])],
        sessionId: 'sess-1',
      },
      { name: 'compaction', branch: [...branch, compactionEntry('new')], sessionId: 'sess-1' },
    ];
    for (const variant of variants) {
      const lead = fakeCtx({ branch, usage: contextUsageOf(LEAD_TOKENS) });
      const { pi } = fakePi();
      const wiring = createPrecompactWiring(pi, {
        settingsDir: defaultSettingsDir(),
        now: () => 1000,
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
      expect(
        hot.notified.some((n) => n.message.includes('default compaction')),
        variant.name,
      ).toBe(true);
    }
  });

  it('session_before_compact で一致 → compaction を返し tokensBefore が現在値', async () => {
    const branch = threeTurns();
    const lead = fakeCtx({ branch, usage: contextUsageOf(LEAD_TOKENS) });
    const wiring = wiringWith();
    await wiring.onTurnEnd(lead.ctx);
    await wiring.flush();
    const hot = fakeCtx({ branch, usage: contextUsageOf(8_200) });
    const outcome = wiring.onSessionBeforeCompact(
      compactEvent(matchingPreparation(branch), branch),
      hot.ctx,
    );
    expect(outcome?.compaction?.tokensBefore).toBe(8_200);
  });

  it('session_before_compact で firstKept が違う → undefined・フォールバック通知', async () => {
    const branch = threeTurns();
    const lead = fakeCtx({ branch, usage: contextUsageOf(LEAD_TOKENS) });
    const wiring = wiringWith();
    await wiring.onTurnEnd(lead.ctx);
    await wiring.flush();
    const hot = fakeCtx({ branch, usage: contextUsageOf(8_200) });
    const event = compactEvent(
      { ...matchingPreparation(branch), firstKeptEntryId: 'other-kept' },
      branch,
    );
    expect(wiring.onSessionBeforeCompact(event, hot.ctx)).toBeUndefined();
    expect(hot.notified.some((n) => n.message.includes('default compaction'))).toBe(true);
  });

  it('要約が失敗 → failed・フォールバック通知・prepared 無し', async () => {
    const branch = threeTurns();
    const setup = fakeCtx({ branch, usage: contextUsageOf(LEAD_TOKENS) });
    const { pi } = fakePi();
    const wiring = createPrecompactWiring(pi, {
      settingsDir: defaultSettingsDir(),
      now: () => 1000,
      compactFn: compactFailing(),
    });
    await wiring.onTurnEnd(setup.ctx);
    await wiring.flush();
    expect(wiring.getState().status).toEqual({ kind: 'failed' });
    expect(wiring.getState().prepared).toBeUndefined();
    expect(setup.notified.some((n) => n.message.includes('default compaction'))).toBe(true);
  });

  it('拡張か Pi の enabled が false → 開始しない', async () => {
    const branch = threeTurns();
    const offDir = settingsDirWith({ enabled: false, keepRecentTokens: 1500, thresholdRatio: 0.8 });
    const offSetup = fakeCtx({ branch, usage: contextUsageOf(LEAD_TOKENS) });
    const enabledPi = fakePi(true);
    const wiringOff = createPrecompactWiring(enabledPi.pi, {
      settingsDir: offDir,
      now: () => 1000,
      compactFn: compactOk(),
    });
    await wiringOff.onTurnEnd(offSetup.ctx);
    expect(wiringOff.getState().running).toBe(false);
    const piSetup = fakeCtx({ branch, usage: contextUsageOf(LEAD_TOKENS) });
    const disabledPi = fakePi(false);
    const wiringPi = createPrecompactWiring(disabledPi.pi, {
      settingsDir: defaultSettingsDir(),
      now: () => 1000,
      compactFn: compactOk(),
    });
    await wiringPi.onTurnEnd(piSetup.ctx);
    expect(wiringPi.getState().running).toBe(false);
  });

  it('設定が壊れている → 1 度だけ notify', async () => {
    const dir = tempDir();
    writeFileSync(join(dir, 'settings.json'), '{');
    const branch = threeTurns();
    const { pi } = fakePi();
    const wiring = createPrecompactWiring(pi, {
      settingsDir: dir,
      now: () => 1000,
      compactFn: compactOk(),
    });
    const first = fakeCtx({ branch, usage: contextUsageOf(LEAD_TOKENS) });
    await wiring.onTurnEnd(first.ctx);
    const second = fakeCtx({ branch, usage: contextUsageOf(LEAD_TOKENS) });
    await wiring.onTurnEnd(second.ctx);
    expect(first.notified.filter((n) => n.message.includes('broken'))).toHaveLength(1);
    expect(first.notified.find((n) => n.message.includes('broken'))?.type).toBe('warning');
    expect(second.notified.filter((n) => n.message.includes('broken'))).toHaveLength(0);
    expect(wiring.getState().running).toBe(false);
  });

  it('session_start / shutdown → clear・prepared 無し', async () => {
    const branch = threeTurns();
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

describe('precompact commands', () => {
  it('/precompact status と usage → それぞれの通知', async () => {
    const branch = threeTurns();
    const wiring = wiringWith();
    const statusSetup = fakeCtx({ branch, usage: contextUsageOf(LEAD_TOKENS) });
    await wiring.onCommand('', statusSetup.ctx);
    expect(statusSetup.notified[0]?.message).toContain('precompact: on');
    const usageSetup = fakeCtx({ branch, usage: contextUsageOf(LEAD_TOKENS) });
    await wiring.onCommand('foo', usageSetup.ctx);
    expect(usageSetup.notified[0]?.message).toContain('usage');
  });

  it('/precompact on / off / now → settings の書き換えと裏での準備開始', async () => {
    const dir = defaultSettingsDir();
    const branch = threeTurns();
    const { pi } = fakePi();
    const wiring = createPrecompactWiring(pi, {
      settingsDir: dir,
      now: () => 1000,
      compactFn: compactOk(),
    });
    const offSetup = fakeCtx({ branch, usage: contextUsageOf(LEAD_TOKENS) });
    await wiring.onCommand('off', offSetup.ctx);
    expect(offSetup.notified[0]?.message).toContain('off');
    const afterOff = readSettings(dir);
    if (afterOff.kind !== 'ok') {
      throw new Error('settings must stay readable');
    }
    expect(afterOff.settings.enabled).toBe(false);
    const onSetup = fakeCtx({ branch, usage: contextUsageOf(LEAD_TOKENS) });
    await wiring.onCommand('on', onSetup.ctx);
    expect(readFileSync(join(dir, 'settings.json'), 'utf8')).toContain('"enabled": true');
    const deferredSetup = fakeCtx({ branch, usage: contextUsageOf(LEAD_TOKENS) });
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
      now: () => 1000,
      compactFn: deferredCompact,
    });
    await wiringNow.onCommand('now', deferredSetup.ctx);
    expect(wiringNow.getState().running).toBe(true);
    expect(wiringNow.getState().status).toEqual({ kind: 'preparing' });
    expect(deferredSetup.notified).toHaveLength(0);
    const busySetup = fakeCtx({ branch, usage: contextUsageOf(LEAD_TOKENS) });
    await wiringNow.onCommand('now', busySetup.ctx);
    expect(busySetup.notified).toHaveLength(0);
    expect(wiringNow.getState().status).toEqual({ kind: 'preparing' });
    resolveGate();
    await wiringNow.flush();
    expect(wiringNow.getState().status.kind).toBe('ready');
    expect(deferredSetup.notified).toHaveLength(0);
  });

  it('prepare が 4 つの getter の値を使う', async () => {
    const branch = threeTurns();
    const setup = fakeCtx({ branch, usage: contextUsageOf(LEAD_TOKENS) });
    const wiring = wiringWith();
    await wiring.onTurnEnd(setup.ctx);
    await wiring.flush();
    for (const key of [
      'buildSessionProjection',
      'getBranch',
      'getContextUsage',
      'getSessionId',
    ] as const) {
      expect(setup.calls).toContain(key);
    }
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
