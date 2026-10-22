/**
 * `/thinking-scrub` の引数と実行。純関数だけを置く。
 *
 * 引数無しは status。前後の空白を落として小文字に直し、`on` / `off` だけを受ける。
 */

import type { SettingsRead } from '../settings/schema.ts';
import type { Status } from '../state/cell.ts';

export type ScrubCommand =
  | { readonly kind: 'set'; readonly enabled: boolean }
  | { readonly kind: 'display'; readonly show: boolean }
  | { readonly kind: 'status' }
  | { readonly kind: 'invalid'; readonly raw: string };

/** 引数無しは status。前後の空白を落として小文字に直し、`on` / `off` と `show` / `hide` を受け、他の語は invalid */
export function parseCommand(raw: string): ScrubCommand {
  const trimmed = raw.trim().toLowerCase();
  if (trimmed === '') {
    return { kind: 'status' };
  }
  if (trimmed === 'on') {
    return { kind: 'set', enabled: true };
  }
  if (trimmed === 'off') {
    return { kind: 'set', enabled: false };
  }
  if (trimmed === 'show') {
    return { kind: 'display', show: true };
  }
  if (trimmed === 'hide') {
    return { kind: 'display', show: false };
  }
  return { kind: 'invalid', raw };
}

function usageLine(): string {
  return 'thinking-scrub usage: /thinking-scrub [on|off]';
}

/** コマンドが読む口 */
export interface CommandPort {
  readonly settings: () => SettingsRead;
  readonly status: () => Status;
  readonly writeEnabled: (enabled: boolean) => void;
  readonly writeShow: (show: boolean) => void;
}

/** 引数を実行し、表示する行を返す */
export function runCommand(
  port: CommandPort,
  command: ScrubCommand,
  at: number,
): readonly string[] {
  void at;
  if (command.kind === 'set') {
    port.writeEnabled(command.enabled);
    return [command.enabled ? 'thinking-scrub: on' : 'thinking-scrub: off'];
  }
  if (command.kind === 'display') {
    port.writeShow(command.show);
    return [command.show ? 'thinking-scrub: show' : 'thinking-scrub: hide'];
  }
  if (command.kind === 'invalid') {
    return [usageLine()];
  }
  const read = port.settings();
  const status = port.status();
  const lines: string[] = [];
  if (read.kind === 'broken') {
    lines.push(`thinking-scrub settings: broken, using defaults (${read.reason})`);
  }
  const enabled = read.kind === 'ok' ? read.settings.enabled : true;
  const show = read.kind === 'ok' ? read.settings.show : true;
  lines.push(enabled ? 'thinking-scrub: on' : 'thinking-scrub: off');
  lines.push(show ? 'show: on' : 'show: off');
  lines.push(`removed: ${status.removed}`);
  lines.push(status.lastAt === null ? 'last: まだ無い' : `last: ${status.lastAt}`);
  return lines;
}
