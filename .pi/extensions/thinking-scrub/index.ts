/**
 * thinking-scrub の配線。`message_end` で畳み、実行の終わり（`agent_end`）に合計を 1 行で報告し、`/thinking-scrub` で scrub と表示を切り替える。
 *
 * 設定は毎回読み直す。壊れていれば既定の有効で動く。例外は握りつぶさず、
 * 数えて `undefined` を返す。状態はセッションの間だけ持つ。
 */

import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import type {
  ExtensionAPI,
  MessageEndEvent,
  MessageEndEventResult,
} from '@earendil-works/pi-coding-agent';
import { parseCommand, runCommand } from './command/scrub.ts';
import { scrubMessage } from './scrub/message.ts';
import { defaultSettings, SETTINGS_FILE } from './settings/schema.ts';
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
}

export interface WiringOptions {
  readonly settingsDir: string;
  readonly now: () => number;
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

function writePatch(settingsDir: string, patch: Record<string, unknown>): void {
  const file = join(settingsDir, SETTINGS_FILE);
  const next = { ...readDoc(file), ...patch };
  mkdirSync(dirname(file), { recursive: true });
  writeFileSync(file, `${JSON.stringify(next, null, 2)}\n`, 'utf8');
}

function writeEnabled(settingsDir: string, enabled: boolean): void {
  writePatch(settingsDir, { enabled });
}

function writeShow(settingsDir: string, show: boolean): void {
  writePatch(settingsDir, { show });
}

export interface CommandCtx {
  readonly ui: {
    readonly notify: (message: string, level?: 'info' | 'warning' | 'error') => void;
  };
}

export interface ScrubWiring {
  readonly onMessageEnd: (event: MessageEndEvent) => MessageEndEventResult | undefined;
  readonly onAgentEnd: (ctx: CommandCtx) => void;
  readonly onCommand: (args: string, ctx: CommandCtx) => void;
  readonly getStatus: () => Status;
}

/** 配線の中身。`registerScrub` はこれを pi につなぐだけにする */
export function createScrubWiring(options: WiringOptions): ScrubWiring {
  let status: Status = emptyStatus();
  let tally: Tally = emptyTally();
  const onMessageEnd = (event: MessageEndEvent): MessageEndEventResult | undefined => {
    try {
      const read = readSettings(options.settingsDir);
      const enabled = read.kind === 'ok' ? read.settings.enabled : defaultSettings().enabled;
      if (!enabled) {
        return undefined;
      }
      const scrubbed = scrubMessage(event.message);
      if (scrubbed === undefined) {
        return undefined;
      }
      status = addScrub(status, scrubbed.removed, options.now());
      tally = addTally(tally, scrubbed.removed, scrubbed.chars);
      return { message: scrubbed.message };
    } catch {
      status = addFailure(status);
      return undefined;
    }
  };
  const onAgentEnd = (ctx: CommandCtx): void => {
    const read = readSettings(options.settingsDir);
    const show = read.kind === 'ok' ? read.settings.show : defaultSettings().show;
    const current = tally;
    tally = emptyTally();
    if (!show) {
      return;
    }
    if (current.runs === 0) {
      return;
    }
    ctx.ui.notify(`thinking-scrub: removed ${current.runs} (${current.chars} chars)`, 'info');
  };
  const onCommand = (args: string, ctx: CommandCtx): void => {
    const command = parseCommand(args);
    const lines = runCommand(
      {
        settings: () => readSettings(options.settingsDir),
        status: () => status,
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
  };
  return {
    onMessageEnd,
    onAgentEnd,
    onCommand,
    getStatus: () => status,
  };
}

/** 拡張の配線。既定の export は自分のディレクトリと時計でこれを呼ぶ */
export function registerScrub(pi: PiPort, options: WiringOptions): void {
  const wiring = createScrubWiring(options);
  pi.on('message_end', (event, _ctx) => wiring.onMessageEnd(event));
  pi.on('agent_end', (_event, ctx) => {
    wiring.onAgentEnd(ctx);
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
  registerScrub(pi, {
    settingsDir: dirname(fileURLToPath(import.meta.url)),
    now: Date.now,
  });
}
