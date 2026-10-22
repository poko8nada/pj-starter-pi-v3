/**
 * context-prune の配線。turn_end で裏に走らせ、次の境界で文脈から外す。
 *
 * 設定は毎回読み直す。壊れていれば 1 度だけ知らせ、何もしない。
 * 差し込みは次の境界（turn_end か agent_before_settle の早い方）で返す。
 * パスが終わったら custom エントリに積み、カードを出す。
 */

import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import type {
  BoundaryResult,
  ContextUsage,
  CustomEntry,
  ExtensionAPI,
  ExtensionContext,
  SessionEntry,
  Theme,
} from '@earendil-works/pi-coding-agent';
import type { Component } from '@earendil-works/pi-tui';
import { collect } from './prune/collect.ts';
import { gate } from './prune/plan.ts';
import { runPass, type PassPorts } from './prune/run.ts';
import { createPorts, type ModelCell } from './prune/ports.ts';
import { readSettings } from './settings/read.ts';
import type { Settings } from './settings/schema.ts';
import { CUSTOM_TYPE, isPrunePass, passesOf } from './entry/data.ts';
import { draftsFor } from './apply/drafts.ts';
import { createCard } from './entry/render.ts';
import {
  parseCommand,
  statusLines,
  usageText,
  writeEnabled,
  type Status,
} from './command/prune.ts';

/** この拡張が pi に求める口だけ。テストは偽物を渡す */
export interface PiPort {
  readonly on: (
    event: 'turn_end' | 'agent_before_settle',
    handler: (event: unknown, ctx: PruneCtx) => Promise<BoundaryResult | undefined>,
  ) => void;
  readonly registerCommand: (
    name: string,
    options: {
      readonly description: string;
      readonly handler: (args: string, ctx: PruneCtx) => Promise<void>;
    },
  ) => void;
  readonly registerEntryRenderer: (
    customType: string,
    renderer: (
      entry: CustomEntry,
      options: { readonly expanded: boolean },
      theme: Theme,
    ) => Component | undefined,
  ) => void;
  readonly appendEntry: (customType: string, data?: unknown) => void;
}

export interface PruneCtx {
  readonly sessionManager: ExtensionContext['sessionManager'];
  readonly getContextUsage: () => ContextUsage | undefined;
  readonly ui: { readonly notify: (message: string) => void };
}

export interface WiringOptions {
  readonly settingsDir: string;
  readonly ports: PassPorts;
  readonly now?: () => number;
}

export interface PruneWiring {
  readonly onTurnEnd: (ctx: PruneCtx) => Promise<BoundaryResult | undefined>;
  readonly onBeforeSettle: (ctx: PruneCtx) => Promise<BoundaryResult | undefined>;
  readonly onCommand: (args: string, ctx: PruneCtx) => Promise<void>;
  readonly getStatus: () => Status;
  readonly flush: () => Promise<void>;
}

type DraftSlot = 'turnEnd' | 'beforeSettle';

interface WiringState {
  status: Status;
  inFlight: Promise<void> | undefined;
  notifiedBroken: boolean;
  lastDraftKey: Record<DraftSlot, string | undefined>;
}

interface WiringDeps {
  readonly pi: PiPort;
  readonly ports: PassPorts;
  readonly clock: () => number;
  readonly settingsDir: string;
  readonly state: WiringState;
}

/** 枝に積まれたパスが落とした id を集める（もう聞かない） */
function droppedIds(branch: readonly SessionEntry[]): Set<string> {
  const ids = new Set<string>();
  for (const pass of passesOf(branch)) {
    for (const drop of pass.dropped) {
      ids.add(drop.id);
    }
  }
  return ids;
}

function patchStatus(state: WiringState, patch: Partial<Status>): void {
  state.status = { ...state.status, ...patch };
}

/** 冷却の起点。成功と失敗のうち at が新しい方の tokensBefore / tokens を見る */
function lastTokensOf(status: Status): number | undefined {
  if (status.lastPass === undefined) {
    return status.lastFailure?.tokens;
  }
  if (status.lastFailure === undefined) {
    return status.lastPass.tokensBefore;
  }
  return status.lastFailure.at >= status.lastPass.at
    ? status.lastFailure.tokens
    : status.lastPass.tokensBefore;
}

/** 設定を読む。壊れていれば 1 度だけ知らせて undefined */
function readOrNotify(deps: WiringDeps, ctx: PruneCtx): Settings | undefined {
  const read = readSettings(deps.settingsDir);
  if (read.kind === 'broken') {
    if (!deps.state.notifiedBroken) {
      deps.state.notifiedBroken = true;
      ctx.ui.notify(`context-prune: settings broken (${read.reason})`);
    }
    return undefined;
  }
  deps.state.notifiedBroken = false;
  return read.settings;
}

/** まだ文脈に効いていない落とし物を下書きにする。同じ境界の 2 回目は出さない */
function offerDrafts(
  deps: WiringDeps,
  slot: DraftSlot,
  branch: readonly SessionEntry[],
  settings: Settings,
): BoundaryResult | undefined {
  const edited = new Set<string>();
  for (const entry of branch) {
    if (entry.type === 'context_edit') {
      edited.add(entry.targetId);
    }
  }
  const drafts = draftsFor(passesOf(branch), edited, settings.marker);
  if (drafts.length === 0) {
    deps.state.lastDraftKey[slot] = undefined;
    return undefined;
  }
  const key = drafts.map((draft) => draft.targetId).join(',');
  if (key === deps.state.lastDraftKey[slot]) return undefined;
  deps.state.lastDraftKey[slot] = key;
  return { entries: [...drafts] };
}

/** 割合を超えたら裏で 1 パス走らせる。終わったら custom に積む */
function startInBackground(
  deps: WiringDeps,
  ctx: PruneCtx,
  settings: Settings,
  branch: readonly SessionEntry[],
): void {
  if (deps.state.status.running) return;
  const usage = ctx.getContextUsage();
  const tokens = usage?.tokens ?? null;
  const collected = collect({
    entries: branch,
    recentTokens: settings.recentTokens,
    done: droppedIds(branch),
  });
  const decision = gate({
    enabled: settings.enabled,
    tokens,
    contextWindow: usage?.contextWindow ?? 0,
    ratio: settings.ratio,
    rearmRatio: settings.rearmRatio,
    lastTokens: lastTokensOf(deps.state.status),
    running: false,
    candidates: collected.candidates.length,
  });
  if (decision.kind !== 'run' || tokens === null) return;
  patchStatus(deps.state, { running: true });
  deps.state.inFlight = runPass(
    {
      settings,
      tokens,
      candidates: collected.candidates,
      recent: collected.recent,
      now: deps.clock(),
    },
    deps.ports,
  )
    .then((outcome) => {
      deps.state.inFlight = undefined;
      if (outcome.kind === 'done') {
        deps.pi.appendEntry(CUSTOM_TYPE, outcome.pass);
        patchStatus(deps.state, { running: false, lastPass: outcome.pass });
      } else {
        patchStatus(deps.state, {
          running: false,
          failures: deps.state.status.failures + 1,
          lastFailure: { at: deps.clock(), tokens, reason: outcome.reason },
        });
      }
    })
    .catch((error: unknown) => {
      deps.state.inFlight = undefined;
      const reason = error instanceof Error ? error.message : String(error);
      patchStatus(deps.state, {
        running: false,
        failures: deps.state.status.failures + 1,
        lastFailure: { at: deps.clock(), tokens, reason },
      });
    });
}

/** `/prune now` の 1 回走り。割合とクールダウンは見ない */
async function runNow(
  deps: WiringDeps,
  ctx: PruneCtx,
  settings: Settings,
  branch: readonly SessionEntry[],
): Promise<void> {
  const collected = collect({
    entries: branch,
    recentTokens: settings.recentTokens,
    done: droppedIds(branch),
  });
  if (collected.candidates.length === 0) {
    ctx.ui.notify('prune: nothing to prune');
    return;
  }
  const usage = ctx.getContextUsage();
  patchStatus(deps.state, { running: true });
  try {
    const outcome = await runPass(
      {
        settings,
        tokens: usage?.tokens ?? 0,
        candidates: collected.candidates,
        recent: collected.recent,
        now: deps.clock(),
      },
      deps.ports,
    );
    if (outcome.kind === 'done') {
      deps.pi.appendEntry(CUSTOM_TYPE, outcome.pass);
      patchStatus(deps.state, { running: false, lastPass: outcome.pass });
      ctx.ui.notify(statusLines(deps.state.status, settings, deps.clock()).join('\n'));
    } else {
      patchStatus(deps.state, {
        running: false,
        failures: deps.state.status.failures + 1,
        lastFailure: { at: deps.clock(), tokens: usage?.tokens ?? 0, reason: outcome.reason },
      });
      ctx.ui.notify(`prune: failed (${outcome.reason})`);
    }
  } catch (error: unknown) {
    patchStatus(deps.state, {
      running: false,
      failures: deps.state.status.failures + 1,
      lastFailure: {
        at: deps.clock(),
        tokens: ctx.getContextUsage()?.tokens ?? 0,
        reason: error instanceof Error ? error.message : String(error),
      },
    });
    ctx.ui.notify('prune: failed');
  }
}

/** `/prune` の受け口。on/off は enabled だけを書き換える */
async function onCommand(deps: WiringDeps, args: string, ctx: PruneCtx): Promise<void> {
  const command = parseCommand(args);
  if (command.kind === 'usage') {
    ctx.ui.notify(usageText());
    return;
  }
  if (command.kind === 'on' || command.kind === 'off') {
    const enabled = command.kind === 'on';
    const outcome = writeEnabled(deps.settingsDir, enabled);
    // 壊れた設定は書かずに理由だけ知らせる
    if (outcome.kind === 'failed') {
      ctx.ui.notify(outcome.reason);
      return;
    }
    ctx.ui.notify(enabled ? 'prune: on' : 'prune: off');
    return;
  }
  if (command.kind === 'status') {
    const settings = readOrNotify(deps, ctx);
    if (settings === undefined) {
      return;
    }
    ctx.ui.notify(statusLines(deps.state.status, settings, deps.clock()).join('\n'));
    return;
  }
  if (deps.state.status.running) {
    ctx.ui.notify('prune: running');
    return;
  }
  const settings = readOrNotify(deps, ctx);
  if (settings === undefined || !settings.enabled) {
    if (settings !== undefined) {
      ctx.ui.notify('prune: off');
    }
    return;
  }
  await runNow(deps, ctx, settings, ctx.sessionManager.getBranch());
}

/** 配線の中身。`registerPrune` はこれを pi につなぐだけにする */
export function createWiring(pi: PiPort, options: WiringOptions): PruneWiring {
  const deps: WiringDeps = {
    pi,
    ports: options.ports,
    clock: options.now ?? Date.now,
    settingsDir: options.settingsDir,
    state: {
      status: { running: false, failures: 0, lastPass: undefined, lastFailure: undefined },
      inFlight: undefined,
      notifiedBroken: false,
      lastDraftKey: { turnEnd: undefined, beforeSettle: undefined },
    },
  };
  return {
    onTurnEnd: async (ctx) => {
      const settings = readOrNotify(deps, ctx);
      if (settings === undefined) return undefined;
      const branch = ctx.sessionManager.getBranch();
      const outcome = offerDrafts(deps, 'turnEnd', branch, settings);
      startInBackground(deps, ctx, settings, branch);
      return outcome;
    },
    onBeforeSettle: async (ctx) => {
      const settings = readOrNotify(deps, ctx);
      if (settings === undefined) return undefined;
      return offerDrafts(deps, 'beforeSettle', ctx.sessionManager.getBranch(), settings);
    },
    onCommand: (args, ctx) => onCommand(deps, args, ctx),
    getStatus: () => deps.state.status,
    flush: () => deps.state.inFlight?.then(() => undefined) ?? Promise.resolve(),
  };
}

/** 拡張の配線。turn_end と agent_before_settle と prune と描画をつなぐ */
export function registerPrune(pi: PiPort, options: WiringOptions): void {
  const wiring = createWiring(pi, options);
  pi.on('turn_end', (_event, ctx) => wiring.onTurnEnd(ctx));
  pi.on('agent_before_settle', (_event, ctx) => wiring.onBeforeSettle(ctx));
  pi.registerCommand('prune', {
    description: 'Prune old tool results from context',
    handler: (args, ctx) => wiring.onCommand(args, ctx),
  });
  pi.registerEntryRenderer(CUSTOM_TYPE, (entry, _renderOptions, theme) =>
    isPrunePass(entry.data) ? createCard(entry.data, theme) : undefined,
  );
}

export default function (pi: ExtensionAPI): void {
  const settingsDir = dirname(fileURLToPath(import.meta.url));
  const cell: ModelCell = {};
  const ports: PassPorts = createPorts(cell, settingsDir);
  const hold = (ctx: ExtensionContext): void => {
    cell.registry = ctx.modelRegistry;
    cell.model = ctx.model;
    cell.sessionId = ctx.sessionManager.getSessionId();
  };
  registerPrune(
    {
      on: (event, handler) => {
        if (event === 'turn_end') {
          pi.on('turn_end', (ev, ctx) => {
            hold(ctx);
            return handler(ev, ctx);
          });
        } else {
          pi.on('agent_before_settle', (ev, ctx) => {
            hold(ctx);
            return handler(ev, ctx);
          });
        }
      },
      registerCommand: (name, opts) => {
        pi.registerCommand(name, {
          description: opts.description,
          handler: (args, ctx) => {
            hold(ctx);
            return opts.handler(args, ctx);
          },
        });
      },
      registerEntryRenderer: (customType, renderer) => {
        pi.registerEntryRenderer(customType, renderer);
      },
      appendEntry: (customType, data) => {
        pi.appendEntry(customType, data);
      },
    },
    { settingsDir, ports },
  );
}
