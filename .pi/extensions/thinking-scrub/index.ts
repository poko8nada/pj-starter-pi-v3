/**
 * thinking-scrub の配線。`message_end` で畳み、実行の終わり（`agent_end`）に合計を 1 行で報告し、`/thinking-scrub` で scrub と表示を切り替える。
 *
 * 生成中は `message_update` で文の周期を見て止め、`agent_settled` でフォローアップを送る。
 * 設定は毎回読み直す。壊れていれば既定の有効で動く。例外は握りつぶさず、
 * 数えて `undefined` を返す。状態はセッションの間だけ持つ。
 */

import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import type {
  AgentSettledEvent,
  BeforeAgentStartEvent,
  ExtensionAPI,
  MessageEndEvent,
  MessageEndEventResult,
  MessageUpdateEvent,
} from '@earendil-works/pi-coding-agent';
import { parseCommand, runCommand } from './command/scrub.ts';
import {
  emptyGuard,
  followUpText,
  MIN_THINKING,
  observe,
  resetOnUser,
  takeFollowUp,
  type Guard,
} from './live/guard.ts';
import { scrubMessage } from './scrub/message.ts';
import { defaultSettings, SETTINGS_FILE, type SettingsRead } from './settings/schema.ts';
import { readSettings } from './settings/read.ts';
import {
  addFailure,
  addScrub,
  addTally,
  emptyStatus,
  emptyTally,
  type Status,
  type Tally,
} from './state/cell.ts';

/** この拡張が pi に求める口だけ。テストは on と registerCommand を記録する偽物を渡す */
export interface PiPort {
  readonly on: ExtensionAPI['on'];
  readonly registerCommand: ExtensionAPI['registerCommand'];
  readonly sendMessage: ExtensionAPI['sendMessage'];
}

export interface AbortCtx {
  readonly abort: () => void;
}

export interface WiringOptions {
  readonly settingsDir: string;
  readonly now: () => number;
  readonly followUp: (content: string) => void;
  readonly readSettings: () => SettingsRead;
}

interface WiringState {
  status: Status;
  tally: Tally;
  guard: Guard;
}

function emptyWiringState(): WiringState {
  return { status: emptyStatus(), tally: emptyTally(), guard: emptyGuard() };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function readDoc(file: string): Record<string, unknown> {
  let text: string;
  try {
    text = readFileSync(file, 'utf8');
  } catch {
    return {};
  }
  try {
    const parsed: unknown = JSON.parse(text);
    return isRecord(parsed) ? { ...parsed } : {};
  } catch {
    return {};
  }
}

function mergeGroup<T extends object>(defaults: T, doc: unknown, patch: unknown): T {
  const docRecord: Record<string, unknown> = isRecord(doc) ? doc : {};
  const patchRecord: Record<string, unknown> = isRecord(patch) ? patch : {};
  return { ...defaults, ...docRecord, ...patchRecord };
}

function writePatch(settingsDir: string, patch: Record<string, unknown>): void {
  const file = join(settingsDir, SETTINGS_FILE);
  const doc = readDoc(file);
  const defaults = defaultSettings();
  const live = mergeGroup(defaults.live, doc['live'], patch['live']);
  const sentence = mergeGroup(defaults.sentence, doc['sentence'], patch['sentence']);
  const char = mergeGroup(defaults.char, doc['char'], patch['char']);
  const next = { ...defaults, ...doc, ...patch, live, sentence, char };
  mkdirSync(dirname(file), { recursive: true });
  writeFileSync(file, `${JSON.stringify(next, null, 2)}\n`, 'utf8');
}

function writeEnabled(settingsDir: string, enabled: boolean): void {
  writePatch(settingsDir, { enabled });
}

function writeShow(settingsDir: string, show: boolean): void {
  writePatch(settingsDir, { show });
}

function readEnabled(read: SettingsRead): boolean {
  return read.kind === 'ok' ? read.settings.enabled : defaultSettings().enabled;
}

function readShow(read: SettingsRead): boolean {
  return read.kind === 'ok' ? read.settings.show : defaultSettings().show;
}

/** thinking ブロックか。取得時の例外は呼び出し側の try で数える */
function isThinkingBlock(
  block: unknown,
): block is { readonly type: 'thinking'; readonly thinking: string } {
  if (!isRecord(block)) {
    return false;
  }
  return block['type'] === 'thinking' && typeof block['thinking'] === 'string';
}

/** 署名を求めずに thinking ブロックをつなげる。生成中の読みに使う */
function thinkingOf(message: MessageEndEvent['message']): string {
  if (!isRecord(message)) {
    return '';
  }
  const role: unknown = message['role'];
  if (role !== 'assistant') {
    return '';
  }
  const content: unknown = message['content'];
  if (!Array.isArray(content)) {
    return '';
  }
  const parts: string[] = [];
  for (const raw of content) {
    if (isThinkingBlock(raw)) {
      parts.push(raw.thinking);
    }
  }
  return parts.join('');
}

function handleMessageEnd(
  state: WiringState,
  options: WiringOptions,
  event: MessageEndEvent,
): MessageEndEventResult | undefined {
  try {
    if (!readEnabled(options.readSettings())) {
      return undefined;
    }
    const scrubbed = scrubMessage(event.message);
    if (scrubbed === undefined) {
      return undefined;
    }
    state.status = addScrub(state.status, scrubbed.removed, options.now());
    state.tally = addTally(state.tally, scrubbed.removed, scrubbed.chars);
    return { message: scrubbed.message };
  } catch {
    state.status = addFailure(state.status);
    return undefined;
  }
}

function handleMessageUpdate(
  state: WiringState,
  options: WiringOptions,
  event: MessageUpdateEvent,
  ctx: AbortCtx,
): void {
  try {
    const thinking = thinkingOf(event.message);
    if (thinking.length < MIN_THINKING) {
      return;
    }
    if (!readEnabled(options.readSettings())) {
      return;
    }
    const step = observe(state.guard, thinking);
    state.guard = step.guard;
    if (step.kind === 'stop') {
      ctx.abort();
    }
  } catch {
    state.status = addFailure(state.status);
  }
}

function handleAgentSettled(
  state: WiringState,
  options: WiringOptions,
  event: AgentSettledEvent,
): void {
  if (!event.aborted) {
    return;
  }
  const taken = takeFollowUp(state.guard);
  if (taken === undefined) {
    return;
  }
  state.guard = taken.guard;
  options.followUp(followUpText(taken.sample));
}

function handleBeforeAgentStart(state: WiringState, event: BeforeAgentStartEvent): void {
  if (event.messageType !== 'user') {
    return;
  }
  state.guard = resetOnUser(state.guard);
}

function handleAgentEnd(state: WiringState, options: WiringOptions, ctx: CommandCtx): void {
  const show = readShow(options.readSettings());
  const current = state.tally;
  state.tally = emptyTally();
  if (!show) {
    return;
  }
  if (current.runs === 0) {
    return;
  }
  ctx.ui.notify(`thinking-scrub: removed ${current.runs} (${current.chars} chars)`, 'info');
}

function handleCommand(
  state: WiringState,
  options: WiringOptions,
  args: string,
  ctx: CommandCtx,
): void {
  const command = parseCommand(args);
  const lines = runCommand(
    {
      settings: () => options.readSettings(),
      status: () => state.status,
      writeEnabled: (enabled) => {
        writeEnabled(options.settingsDir, enabled);
      },
      writeShow: (show) => {
        writeShow(options.settingsDir, show);
      },
    },
    command,
    options.now(),
  );
  ctx.ui.notify(lines.join('\n'));
}

export interface CommandCtx {
  readonly ui: {
    readonly notify: (message: string, level?: 'info' | 'warning' | 'error') => void;
  };
}

export interface ScrubWiring {
  readonly onMessageEnd: (event: MessageEndEvent) => MessageEndEventResult | undefined;
  readonly onMessageUpdate: (event: MessageUpdateEvent, ctx: AbortCtx) => void;
  readonly onAgentSettled: (event: AgentSettledEvent) => void;
  readonly onBeforeAgentStart: (event: BeforeAgentStartEvent) => void;
  readonly onAgentEnd: (ctx: CommandCtx) => void;
  readonly onCommand: (args: string, ctx: CommandCtx) => void;
  readonly getStatus: () => Status;
}

/** 配線の中身。`registerScrub` はこれを pi につなぐだけにする */
export function createScrubWiring(options: WiringOptions): ScrubWiring {
  const state = emptyWiringState();
  return {
    onMessageEnd: (event) => handleMessageEnd(state, options, event),
    onMessageUpdate: (event, ctx) => {
      handleMessageUpdate(state, options, event, ctx);
    },
    onAgentSettled: (event) => {
      handleAgentSettled(state, options, event);
    },
    onBeforeAgentStart: (event) => {
      handleBeforeAgentStart(state, event);
    },
    onAgentEnd: (ctx) => {
      handleAgentEnd(state, options, ctx);
    },
    onCommand: (args, ctx) => {
      handleCommand(state, options, args, ctx);
    },
    getStatus: () => state.status,
  };
}

/** 拡張の配線。既定の export は自分のディレクトリと時計でこれを呼ぶ */
export function registerScrub(pi: PiPort, options: WiringOptions): void {
  const wiring = createScrubWiring(options);
  pi.on('message_update', (event, ctx) => {
    wiring.onMessageUpdate(event, ctx);
  });
  pi.on('message_end', (event, _ctx) => wiring.onMessageEnd(event));
  pi.on('agent_settled', (event, _ctx) => {
    wiring.onAgentSettled(event);
  });
  pi.on('agent_end', (_event, ctx) => {
    wiring.onAgentEnd(ctx);
  });
  pi.on('before_agent_start', (event, _ctx) => {
    wiring.onBeforeAgentStart(event);
  });
  pi.registerCommand('thinking-scrub', {
    description: 'Scrub looped thinking (on/off/show/hide/status)',
    handler: (args, ctx) => {
      wiring.onCommand(args, ctx);
      return Promise.resolve();
    },
  });
}

export default function (pi: ExtensionAPI): void {
  const settingsDir = dirname(fileURLToPath(import.meta.url));
  registerScrub(pi, {
    settingsDir,
    now: Date.now,
    followUp: (content) => {
      pi.sendMessage(
        { customType: 'thinking-scrub', content, display: true },
        { triggerTurn: true },
      );
    },
    readSettings: () => readSettings(settingsDir),
  });
}
