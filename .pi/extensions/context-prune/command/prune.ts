/**
 * `/prune` の引数と状態表示。設定の enabled だけを書き換える。
 */

import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { SETTINGS_FILE, type Settings } from '../settings/schema.ts';
import type { PrunePass } from '../entry/data.ts';
import { formatCount } from '../format/count.ts';

export interface Failure {
  readonly at: number;
  readonly tokens: number;
  readonly reason: string;
}

export interface Status {
  readonly running: boolean;
  readonly failures: number;
  readonly lastPass: PrunePass | undefined;
  readonly lastFailure: Failure | undefined;
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

/** 状態の表示。直近のパスが無ければ last と dropped はなし。失敗があれば最後の失敗を足す */
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
      : `dropped: ${status.lastPass.dropped.length} 件 (${formatCount(status.lastPass.droppedChars)} 文字)`;
  const lines = [head, ratio, last, dropped, `failures: ${status.failures}`];
  if (status.lastFailure !== undefined) {
    lines.push(
      `最後の失敗: ${Math.floor((now - status.lastFailure.at) / 1000)} 秒前 (${status.lastFailure.reason})`,
    );
  }
  return lines;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export type EnableOutcome =
  | { readonly kind: 'ok' }
  | { readonly kind: 'failed'; readonly reason: string };

/** settings.json の enabled だけを書き換える。壊れていれば書かずに failed */
export function writeEnabled(dir: string, enabled: boolean): EnableOutcome {
  const file = join(dir, SETTINGS_FILE);
  let text: string;
  try {
    text = readFileSync(file, 'utf8');
  } catch (error) {
    // 無ければ enabled だけの文書を作る
    if (typeof error === 'object' && error !== null && 'code' in error && error.code === 'ENOENT') {
      mkdirSync(dirname(file), { recursive: true });
      writeFileSync(file, `${JSON.stringify({ enabled }, null, 2)}\n`, 'utf8');
      return { kind: 'ok' };
    }
    const detail = error instanceof Error ? error.message : String(error);
    return { kind: 'failed', reason: `context-prune settings: could not read ${file} (${detail})` };
  }
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch (error) {
    const detail = error instanceof Error ? error.message : String(error);
    return { kind: 'failed', reason: `context-prune settings: not JSON (${detail})` };
  }
  if (!isRecord(parsed)) {
    return { kind: 'failed', reason: 'context-prune settings: must be an object' };
  }
  mkdirSync(dirname(file), { recursive: true });
  writeFileSync(file, `${JSON.stringify({ ...parsed, enabled }, null, 2)}\n`, 'utf8');
  return { kind: 'ok' };
}
