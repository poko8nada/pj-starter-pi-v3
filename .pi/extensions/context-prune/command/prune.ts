/**
 * `/prune` の引数と状態表示。設定の enabled だけを書き換える。
 */

import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { SETTINGS_FILE, type Settings } from '../settings/schema.ts';
import type { PrunePass } from '../entry/data.ts';

export interface Status {
  readonly running: boolean;
  readonly failures: number;
  readonly lastPass: PrunePass | undefined;
}

export type Command =
  | { readonly kind: 'status' }
  | { readonly kind: 'on' }
  | { readonly kind: 'off' }
  | { readonly kind: 'now' }
  | { readonly kind: 'usage' };

/** 引数なしは status、on / off / now、小文字以外は usage */
export function parseCommand(args: string): Command {
  const trimmed = args.trim();
  if (trimmed === '') {
    return { kind: 'status' };
  }
  if (trimmed === 'on') {
    return { kind: 'on' };
  }
  if (trimmed === 'off') {
    return { kind: 'off' };
  }
  if (trimmed === 'now') {
    return { kind: 'now' };
  }
  return { kind: 'usage' };
}

export function usageText(): string {
  return [
    'prune usage: /prune [now|on|off]',
    '/prune        show status',
    '/prune now    run once now',
    '/prune on     enable',
    '/prune off    disable',
  ].join('\n');
}

/** 状態の 5 行。直近のパスが無ければ last と dropped はなし */
export function statusLines(status: Status, settings: Settings, now: number): readonly string[] {
  const head = settings.enabled ? 'prune: on' : 'prune: off';
  const ratio = `ratio: ${settings.ratio}`;
  const last =
    status.lastPass === undefined
      ? 'last: なし'
      : `last: ${Math.floor((now - status.lastPass.at) / 1000)} 秒前`;
  const dropped =
    status.lastPass === undefined
      ? 'dropped: なし'
      : `dropped: ${status.lastPass.dropped.length} 件 (${status.lastPass.droppedChars.toLocaleString()} 文字)`;
  return [head, ratio, last, dropped, `failures: ${status.failures}`];
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/** settings.json を読み、enabled だけを書き換えて書き戻す（他のキーは残す） */
export function writeEnabled(dir: string, enabled: boolean): void {
  const file = join(dir, SETTINGS_FILE);
  let document: Record<string, unknown> = {};
  try {
    const parsed: unknown = JSON.parse(readFileSync(file, 'utf8'));
    if (isRecord(parsed)) {
      document = { ...parsed };
    }
  } catch {
    document = {};
  }
  mkdirSync(dirname(file), { recursive: true });
  writeFileSync(file, `${JSON.stringify({ ...document, enabled }, null, 2)}\n`, 'utf8');
}
