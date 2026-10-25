/**
 * context-precompact の配線。閾値の手前で裏に準備し、境界で差し込む。
 *
 * 設定は毎回読み直す。壊れていれば 1 度だけ知らせ、何もしない。
 * 標準コンパクションは置き換えない。失敗・stale・不一致では Pi の既定に任せる。
 */
import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  compact,
  type BoundaryResult,
  type CompactionResult,
  type ExtensionAPI,
  type ExtensionContext,
  type SessionBeforeCompactEvent,
  type SessionBeforeCompactResult,
  type SessionEntry,
} from '@earendil-works/pi-coding-agent';
import { readSettings, writeEnabled } from './settings/read.ts';
import type { Settings } from './settings/schema.ts';
import { SUMMARY_TIMEOUT_MS } from './settings/constants.ts';
import { gate } from './gate/gate.ts';
import { compare } from './prepare/compare.ts';
import { guard } from './prepare/guard.ts';
import { prepare } from './prepare/prepare.ts';
import type { Prepared, PrepareStamp } from './prepare/types.ts';
import { createSummaryPorts, type SummaryCtx } from './run/ports.ts';
import { summarize } from './run/summarize.ts';
import { readyFrom, type ReadyCompaction } from './apply/draft.ts';
import {
  brokenText,
  chatText,
  FALLBACK_TEXT,
  failureText,
  noticeText,
  statusText,
  type NotifiableStatus,
  type StatusState,
} from './ui/status.ts';
import { parseCommand, statusLines, usageText } from './command/precompact.ts';

export type { StatusState };

export interface PiPort {
  readonly on: ExtensionAPI['on'];
  readonly registerCommand: ExtensionAPI['registerCommand'];
  readonly getSettings: ExtensionAPI['getSettings'];
}

export interface WiringOptions {
  readonly settingsDir: string;
  readonly now: () => number;
  readonly compactFn?: SummaryCtx['compactFn'];
}

export interface PrecompactCtx {
  readonly sessionManager: ExtensionContext['sessionManager'];
  readonly model: ExtensionContext['model'];
  readonly modelRegistry: ExtensionContext['modelRegistry'];
  readonly thinkingLevel?: ExtensionContext['thinkingLevel'];
  readonly getContextUsage: ExtensionContext['getContextUsage'];
  readonly signal: AbortSignal | undefined;
  readonly ui: {
    readonly notify: ExtensionContext['ui']['notify'];
    readonly setStatus: ExtensionContext['ui']['setStatus'];
  };
}

export interface PrecompactWiring {
  readonly onTurnEnd: (ctx: PrecompactCtx) => Promise<BoundaryResult | undefined>;
  readonly onBeforeSettle: (ctx: PrecompactCtx) => BoundaryResult | undefined;
  readonly onSessionBeforeCompact: (
    event: SessionBeforeCompactEvent,
    ctx: PrecompactCtx,
  ) => SessionBeforeCompactResult | undefined;
  readonly onSessionStart: (ctx: PrecompactCtx) => void;
  readonly onSessionShutdown: (ctx: PrecompactCtx) => void;
  readonly onCommand: (args: string, ctx: PrecompactCtx) => Promise<void>;
  readonly getState: () => WiringState;
  readonly flush: () => Promise<void>;
}

export interface WiringState {
  readonly running: boolean;
  readonly prepared: ReadyCompaction | undefined;
  readonly lastAppliedTokens: number | undefined;
  readonly status: StatusState;
}

type PassOutcome = 'ready' | 'failed' | 'idle' | 'running';

interface MutableState {
  running: boolean;
  prepared: ReadyCompaction | undefined;
  lastAppliedTokens: number | undefined;
  status: StatusState;
  brokenNotified: boolean;
  inFlight: Promise<PassOutcome> | undefined;
  forceApply: boolean;
  generation: number;
}

type BeginOptions = { readonly applyNext: boolean };

interface Deps {
  readonly port: PiPort;
  readonly options: WiringOptions;
  readonly clock: () => number;
  readonly state: MutableState;
}

/** 設定を読む。壊れていれば 1 度だけ知らせて undefined */
function readSettingsOrNotify(deps: Deps, ctx: PrecompactCtx): Settings | undefined {
  const read = readSettings(deps.options.settingsDir);
  if (read.kind === 'broken') {
    if (!deps.state.brokenNotified) {
      deps.state.brokenNotified = true;
      ctx.ui.notify(brokenText(read.reason), 'warning');
    }
    return undefined;
  }
  deps.state.brokenNotified = false;
  return read.settings;
}

/** Pi の自動コンパクションが有効か。無ければ有効とみなす */
function piEnabledOf(port: PiPort): boolean {
  return port.getSettings().compaction?.enabled ?? true;
}

/** 今の footer を状態に合わせる */
function refreshStatus(deps: Deps, ctx: PrecompactCtx): void {
  ctx.ui.setStatus('precompact', statusText(deps.state.status));
}

/** 状態を置いて footer も合わせる */
function setStatusState(deps: Deps, ctx: PrecompactCtx, status: StatusState): void {
  deps.state.status = status;
  refreshStatus(deps, ctx);
}

/** チャットに状態を出す。preparing / ready / applied だけ */
function notifyStatus(ctx: PrecompactCtx, status: NotifiableStatus): void {
  ctx.ui.notify(chatText(status), 'info');
}

/** branch の最新の compaction の id。無ければ undefined */
function latestCompactionIdOf(branch: readonly SessionEntry[]): string | undefined {
  for (let i = branch.length - 1; i >= 0; i--) {
    const entry = branch[i];
    if (entry !== undefined && entry.type === 'compaction') {
      return entry.id;
    }
  }
  return undefined;
}

/** 準備を捨ててフォールバックを知らせる */
function discardWithFallback(deps: Deps, ctx: PrecompactCtx): void {
  deps.state.prepared = undefined;
  deps.state.forceApply = false;
  deps.state.status = { kind: 'discarded' };
  refreshStatus(deps, ctx);
  ctx.ui.notify(FALLBACK_TEXT, 'warning');
}

/** 準備の stamp が今も使えるかを見る */
function guardOf(
  ready: ReadyCompaction,
  branch: readonly SessionEntry[],
  sessionId: string,
): ReturnType<typeof guard> {
  return guard({
    stamp: ready.stamp,
    currentSessionId: sessionId,
    branch,
    latestCompactionId: latestCompactionIdOf(branch),
    firstKeptEntryId: ready.prepared.firstKeptEntryId,
  });
}

/** 適用する。前は今の使用量にし、`lastAppliedTokens` を進める */
function applyReady(deps: Deps, ctx: PrecompactCtx, ready: ReadyCompaction): BoundaryResult {
  const tokensNow = ctx.getContextUsage()?.tokens;
  const before = typeof tokensNow === 'number' ? tokensNow : ready.tokensBefore;
  const applied: NotifiableStatus = { kind: 'applied', before, after: ready.tokensAfter };
  deps.state.prepared = undefined;
  deps.state.lastAppliedTokens = ready.tokensAfter;
  deps.state.forceApply = false;
  setStatusState(deps, ctx, applied);
  notifyStatus(ctx, applied);
  return { entries: [{ ...ready.draft }] };
}

/** 準備を今の branch に照らして適用する。無効なら何もしない */
function applyPrepared(deps: Deps, ctx: PrecompactCtx): BoundaryResult | undefined {
  const ready = deps.state.prepared;
  if (ready === undefined) {
    return undefined;
  }
  const settings = readSettingsOrNotify(deps, ctx);
  if (settings === undefined || !settings.enabled || !piEnabledOf(deps.port)) {
    return undefined;
  }
  const branch = ctx.sessionManager.getBranch();
  const guarded = guardOf(ready, branch, ctx.sessionManager.getSessionId());
  if (guarded.kind === 'stale') {
    discardWithFallback(deps, ctx);
    return undefined;
  }
  return applyReady(deps, ctx, ready);
}

/** 下ごしらえから要約までの 1 パス。`running` の開閉は呼ぶ側が行う */
async function doPass(deps: Deps, ctx: PrecompactCtx, generation: number): Promise<PassOutcome> {
  try {
    const settings = readSettingsOrNotify(deps, ctx);
    if (settings === undefined) {
      setStatusState(deps, ctx, { kind: 'idle' });
      return 'idle';
    }
    if (!settings.enabled || !piEnabledOf(deps.port)) {
      deps.state.forceApply = false;
      setStatusState(deps, ctx, { kind: 'idle' });
      ctx.ui.notify(noticeText('off'), 'info');
      return 'idle';
    }
    const tokensRaw = ctx.getContextUsage()?.tokens;
    const tokensBefore = typeof tokensRaw === 'number' ? tokensRaw : 0;
    const prepared = prepare({
      projectedEntries: ctx.sessionManager.buildSessionProjection().entries,
      branch: ctx.sessionManager.getBranch(),
      tokensBefore,
      settings,
      piEnabled: true,
      sessionId: ctx.sessionManager.getSessionId(),
    });
    if (prepared === undefined) {
      deps.state.forceApply = false;
      setStatusState(deps, ctx, { kind: 'idle' });
      ctx.ui.notify(noticeText('nothing'), 'info');
      return 'idle';
    }
    const signal =
      ctx.signal !== undefined
        ? AbortSignal.any([ctx.signal, AbortSignal.timeout(SUMMARY_TIMEOUT_MS)])
        : AbortSignal.timeout(SUMMARY_TIMEOUT_MS);
    const ports = createSummaryPorts({
      model: ctx.model,
      modelRegistry: ctx.modelRegistry,
      thinkingLevel: ctx.thinkingLevel,
      sessionManager: ctx.sessionManager,
      compactFn: deps.options.compactFn ?? compact,
    });
    const outcome = await summarize(ports, prepared.compaction, signal, deps.clock);
    if (deps.state.generation !== generation) {
      return 'idle';
    }
    if (outcome.kind === 'done') {
      const ready = readyFrom(outcome.result, prepared.compaction, prepared.stamp, {
        before: tokensBefore,
        kept: prepared.keptTokens,
      });
      deps.state.prepared = ready;
      setStatusState(deps, ctx, {
        kind: 'ready',
        before: ready.tokensBefore,
        after: ready.tokensAfter,
      });
      notifyStatus(ctx, { kind: 'ready', before: ready.tokensBefore, after: ready.tokensAfter });
      return 'ready';
    }
    return failPass(deps, ctx, outcome.reason);
  } catch (error) {
    if (deps.state.generation !== generation) {
      return 'idle';
    }
    return failPass(deps, ctx, error instanceof Error ? error.message : String(error));
  }
}

/** 失敗の後始末。理由を通知して `failed` を返す */
function failPass(deps: Deps, ctx: PrecompactCtx, reason: string): PassOutcome {
  deps.state.prepared = undefined;
  deps.state.forceApply = false;
  setStatusState(deps, ctx, { kind: 'failed', reason });
  ctx.ui.notify(failureText(reason), 'warning');
  return 'failed';
}

/** 裏で 1 パス走らせる。終わりは `flush` で待てる */
function beginPass(
  deps: Deps,
  ctx: PrecompactCtx,
  options: BeginOptions = { applyNext: false },
): void {
  const generation = deps.state.generation;
  deps.state.running = true;
  deps.state.forceApply = options.applyNext;
  setStatusState(deps, ctx, { kind: 'preparing' });
  try {
    notifyStatus(ctx, { kind: 'preparing' });
  } catch (error) {
    deps.state.running = false;
    deps.state.forceApply = false;
    throw error;
  }
  const flight: Promise<PassOutcome> = doPass(deps, ctx, generation).then(
    (outcome): PassOutcome => outcome,
    (): PassOutcome => 'failed',
  );
  deps.state.inFlight = flight;
  void flight.finally(() => {
    if (deps.state.generation !== generation) {
      return;
    }
    deps.state.running = false;
    if (deps.state.inFlight === flight) {
      deps.state.inFlight = undefined;
    }
  });
}

/** `turn_end` の受け口。適用か開始か見送りを決める */
async function onTurnEnd(deps: Deps, ctx: PrecompactCtx): Promise<BoundaryResult | undefined> {
  const settings = readSettingsOrNotify(deps, ctx);
  if (settings === undefined) {
    return undefined;
  }
  if (deps.state.forceApply && deps.state.prepared !== undefined) {
    return applyPrepared(deps, ctx);
  }
  const usage = ctx.getContextUsage();
  const decision = gate({
    enabled: settings.enabled,
    piEnabled: piEnabledOf(deps.port),
    tokens: usage?.tokens ?? null,
    contextWindow: usage?.contextWindow ?? 0,
    thresholdRatio: settings.thresholdRatio,
    keepRecentTokens: settings.keepRecentTokens,
    running: deps.state.running,
    prepared: deps.state.prepared !== undefined,
    lastAppliedTokens: deps.state.lastAppliedTokens,
  });
  if (decision.kind === 'apply') {
    return applyPrepared(deps, ctx);
  }
  if (decision.kind === 'start') {
    beginPass(deps, ctx);
  }
  return undefined;
}

/** `agent_before_settle` の受け口。適用だけし、開始はしない */
function onBeforeSettle(deps: Deps, ctx: PrecompactCtx): BoundaryResult | undefined {
  const ready = deps.state.prepared;
  if (ready === undefined) {
    return undefined;
  }
  const settings = readSettingsOrNotify(deps, ctx);
  if (settings === undefined || !settings.enabled || !piEnabledOf(deps.port)) {
    return undefined;
  }
  if (!deps.state.forceApply) {
    const usage = ctx.getContextUsage();
    const tokens = usage?.tokens;
    const contextWindow = usage?.contextWindow ?? 0;
    if (typeof tokens !== 'number' || contextWindow <= 0) {
      return undefined;
    }
    if (tokens / contextWindow < settings.thresholdRatio) {
      return undefined;
    }
  }
  return applyPrepared(deps, ctx);
}

/** `session_before_compact` の受け口。Pi の準備と照合して渡す */
function onSessionBeforeCompact(
  deps: Deps,
  event: SessionBeforeCompactEvent,
  ctx: PrecompactCtx,
): SessionBeforeCompactResult | undefined {
  const ready = deps.state.prepared;
  if (ready === undefined) {
    return undefined;
  }
  const settings = readSettingsOrNotify(deps, ctx);
  if (settings === undefined || !settings.enabled || !piEnabledOf(deps.port)) {
    return undefined;
  }
  const compared = compare(ready.prepared, {
    ...event.preparation,
  });
  if (compared.kind === 'mismatch') {
    discardWithFallback(deps, ctx);
    return undefined;
  }
  const branch = ctx.sessionManager.getBranch();
  const guarded = guardOf(ready, branch, ctx.sessionManager.getSessionId());
  if (guarded.kind === 'stale') {
    discardWithFallback(deps, ctx);
    return undefined;
  }
  // 前は今の使用量、後ろは準備時に見積もった残りと要約。
  const tokensNow = ctx.getContextUsage()?.tokens;
  const tokensBefore = typeof tokensNow === 'number' ? tokensNow : ready.result.tokensBefore;
  const compaction: CompactionResult = { ...ready.result, tokensBefore };
  const applied: NotifiableStatus = {
    kind: 'applied',
    before: tokensBefore,
    after: ready.tokensAfter,
  };
  deps.state.prepared = undefined;
  deps.state.forceApply = false;
  deps.state.lastAppliedTokens = ready.tokensAfter;
  deps.state.status = applied;
  refreshStatus(deps, ctx);
  notifyStatus(ctx, applied);
  return { compaction };
}

/** `session_start` と `session_shutdown` の受け口。状態を戻す */
function resetForSession(deps: Deps, ctx: PrecompactCtx): void {
  deps.state.prepared = undefined;
  deps.state.running = false;
  deps.state.lastAppliedTokens = undefined;
  deps.state.forceApply = false;
  deps.state.brokenNotified = false;
  deps.state.status = { kind: 'idle' };
  deps.state.generation += 1;
  refreshStatus(deps, ctx);
}

/** `/precompact` の受け口 */
async function onCommand(deps: Deps, args: string, ctx: PrecompactCtx): Promise<void> {
  const command = parseCommand(args);
  if (command.kind === 'usage') {
    ctx.ui.notify(usageText());
    return;
  }
  if (command.kind === 'on' || command.kind === 'off') {
    const enabled = command.kind === 'on';
    const outcome = writeEnabled(deps.options.settingsDir, enabled);
    if (outcome.kind === 'broken') {
      ctx.ui.notify(outcome.reason, 'warning');
      return;
    }
    ctx.ui.notify(noticeText(enabled ? 'on' : 'off'));
    return;
  }
  if (command.kind === 'status') {
    const settings = readSettingsOrNotify(deps, ctx);
    if (settings === undefined) {
      return;
    }
    ctx.ui.notify(
      statusLines({
        settings,
        prepared: deps.state.prepared !== undefined,
        running: deps.state.running,
        lastAppliedTokens: deps.state.lastAppliedTokens,
        status: deps.state.status,
      }).join('\n'),
    );
    return;
  }
  if (deps.state.running) {
    deps.state.forceApply = true;
    ctx.ui.notify(noticeText('running'), 'info');
    return;
  }
  beginPass(deps, ctx, { applyNext: true });
  return;
}

/** 配線の中身。`registerPrecompact` はこれを pi につなぐだけにする */
export function createPrecompactWiring(port: PiPort, options: WiringOptions): PrecompactWiring {
  const deps: Deps = {
    port,
    options,
    clock: options.now,
    state: {
      running: false,
      prepared: undefined,
      lastAppliedTokens: undefined,
      status: { kind: 'idle' },
      brokenNotified: false,
      inFlight: undefined,
      forceApply: false,
      generation: 0,
    },
  };
  return {
    onTurnEnd: (ctx) => onTurnEnd(deps, ctx),
    onBeforeSettle: (ctx) => onBeforeSettle(deps, ctx),
    onSessionBeforeCompact: (event, ctx) => onSessionBeforeCompact(deps, event, ctx),
    onSessionStart: (ctx) => {
      resetForSession(deps, ctx);
    },
    onSessionShutdown: (ctx) => {
      resetForSession(deps, ctx);
    },
    onCommand: (args, ctx) => onCommand(deps, args, ctx),
    getState: () => ({
      running: deps.state.running,
      prepared: deps.state.prepared,
      lastAppliedTokens: deps.state.lastAppliedTokens,
      status: deps.state.status,
    }),
    flush: () => deps.state.inFlight?.then(() => undefined) ?? Promise.resolve(),
  };
}

/** 拡張の配線。5 つのイベントと 1 つのコマンドをつなぐ */
export function registerPrecompact(pi: PiPort): void {
  const settingsDir = dirname(fileURLToPath(import.meta.url));
  const wiring = createPrecompactWiring(pi, { settingsDir, now: Date.now });
  pi.on('turn_end', (_event, ctx) => wiring.onTurnEnd(ctx));
  pi.on('agent_before_settle', (_event, ctx) => wiring.onBeforeSettle(ctx));
  pi.on('session_before_compact', (event, ctx) => wiring.onSessionBeforeCompact(event, ctx));
  pi.on('session_start', (_event, ctx) => {
    wiring.onSessionStart(ctx);
  });
  pi.on('session_shutdown', (_event, ctx) => {
    wiring.onSessionShutdown(ctx);
  });
  pi.registerCommand('precompact', {
    description: 'Prepare compaction in the background',
    handler: (args, ctx) => wiring.onCommand(args, ctx),
  });
}

export default function (pi: ExtensionAPI): void {
  registerPrecompact(pi);
}

export type { ReadyCompaction, PrepareStamp, Prepared };
