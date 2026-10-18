/**
 * `/intent` で切り替えと調整をする。settings.json の書き換えは `set` だけが行う。
 *
 * - 引数なし: 今の mode を文で返す
 * - `on`: live（頭も途中も実際に出す）
 * - `off`: shadow（どちらも記録だけ）
 * - `set <道> <値>`: settings.json を書く
 * - `last [数]`: 直近の記録を返す
 * - その他: 使い方を返す（投げない）
 *
 * `on` / `off` では抱えている run を捨てる。
 */

import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname } from 'node:path';
import { defaultSettings, parseSettings, type Settings } from '../settings/schema.ts';
import { idleRun, type FlagsPort, type Mode, type RunPort } from '../state/run.ts';
import type { IntentRecord } from '../record/log.ts';

export type { Mode };

export interface Flags {
  readonly mode: Mode;
}

export type IntentCommand =
  | { readonly kind: 'show' }
  | { readonly kind: 'mode'; readonly mode: Mode }
  | { readonly kind: 'set'; readonly path: string; readonly value: string }
  | { readonly kind: 'last'; readonly count: number }
  | { readonly kind: 'usage'; readonly text: string };

export function parseIntent(args: string, settings: Settings): IntentCommand {
  const trimmed = args.trim();
  if (trimmed === '') {
    return { kind: 'show' };
  }
  const parts = trimmed.split(/\s+/);
  const head = parts[0] ?? '';
  if (head === 'on') {
    return { kind: 'mode', mode: 'live' };
  }
  if (head === 'off') {
    return { kind: 'mode', mode: 'shadow' };
  }
  if (head === 'set') {
    const path = parts[1] ?? '';
    const value = parts.slice(2).join(' ');
    if (path === '' || value === '') {
      return { kind: 'usage', text: usageText() };
    }
    return { kind: 'set', path, value };
  }
  if (head === 'last') {
    const raw = parts[1];
    if (raw === undefined || raw === '') {
      return { kind: 'last', count: settings.record.recent };
    }
    const count = Number(raw);
    if (!Number.isInteger(count) || count < 1) {
      return { kind: 'usage', text: usageText() };
    }
    return { kind: 'last', count };
  }
  return { kind: 'usage', text: usageText() };
}

export function usageText(): string {
  return [
    'intent-router usage:',
    '/intent - show current mode',
    '/intent on - switch to live',
    '/intent off - switch to shadow',
    '/intent set <path> <value> - update settings.json',
    '/intent last [count] - show recent records',
  ].join('\n');
}

function parseValue(text: string): unknown {
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

function setPath(document: unknown, path: string, value: unknown): unknown {
  const keys = path.split('.');
  if (keys.some((key) => key === '')) {
    throw new Error(`intent-router set: bad path ${path}`);
  }
  const root: Record<string, unknown> =
    typeof document === 'object' && document !== null && !Array.isArray(document)
      ? // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion -- unknown の JSON 文書を読む
        { ...(document as Record<string, unknown>) }
      : {};
  let node: Record<string, unknown> = root;
  for (let index = 0; index < keys.length - 1; index += 1) {
    const key = keys[index] ?? '';
    const child = node[key];
    const next: Record<string, unknown> =
      typeof child === 'object' && child !== null && !Array.isArray(child)
        ? // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion -- unknown の JSON 文書を読む
          { ...(child as Record<string, unknown>) }
        : {};
    node[key] = next;
    node = next;
  }
  node[keys[keys.length - 1] ?? ''] = value;
  return root;
}

export interface CommandCtx {
  readonly ui: { readonly notify: (message: string) => void };
}

export interface CommandPiPort {
  registerCommand(
    name: string,
    options: {
      readonly description: string;
      readonly handler: (args: string, ctx: CommandCtx) => void;
    },
  ): void;
}

export interface IntentPorts {
  readonly flags: FlagsPort;
  readonly run: RunPort;
  readonly recent: {
    readonly add: (record: IntentRecord) => void;
    readonly tail: (count: number) => readonly IntentRecord[];
  };
  readonly settingsFile: string;
}

function readDoc(file: string): unknown {
  try {
    const text = readFileSync(file, 'utf8');
    if (text.trim() === '') {
      return {};
    }
    return JSON.parse(text);
  } catch (error) {
    if (
      typeof error === 'object' &&
      error !== null &&
      'code' in error &&
      (error as { code?: unknown }).code === 'ENOENT'
    ) {
      return {};
    }
    throw error;
  }
}

export function registerCommand(pi: CommandPiPort, deps: IntentPorts): void {
  pi.registerCommand('intent', {
    description: 'Show mode, switch live/shadow, set settings, or show recent records',
    handler: (args, ctx) => {
      const settings = defaultSettings();
      const command = parseIntent(args, settings);
      if (command.kind === 'show') {
        ctx.ui.notify(`intent-router: ${deps.flags.get().mode}`);
        return;
      }
      if (command.kind === 'mode') {
        deps.flags.set({ mode: command.mode });
        deps.run.set(idleRun());
        ctx.ui.notify(`intent-router: ${command.mode}`);
        return;
      }
      if (command.kind === 'last') {
        const records = deps.recent.tail(command.count);
        if (records.length === 0) {
          ctx.ui.notify('intent-router: まだ無い (no records yet)');
          return;
        }
        ctx.ui.notify(records.map((record) => JSON.stringify(record)).join('\n'));
        return;
      }
      if (command.kind === 'set') {
        let reason: string | undefined;
        try {
          const before = readDoc(deps.settingsFile);
          const next = setPath(before, command.path, parseValue(command.value));
          parseSettings(JSON.stringify(next), defaultSettings());
          mkdirSync(dirname(deps.settingsFile), { recursive: true });
          writeFileSync(deps.settingsFile, `${JSON.stringify(next, null, 2)}\n`, 'utf8');
        } catch (error) {
          reason = error instanceof Error ? error.message : String(error);
        }
        if (reason !== undefined) {
          ctx.ui.notify(`intent-router set: ${reason}`);
          return;
        }
        ctx.ui.notify(`intent-router: set ${command.path} ${command.value}`);
        return;
      }
      ctx.ui.notify(command.text);
    },
  });
}
