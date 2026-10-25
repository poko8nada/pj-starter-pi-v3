/**
 * `/precompact` の引数と状態表示。設定の `enabled` だけを書き換える。
 */
import type { Settings } from '../settings/schema.ts';
import { statusLine, type StatusState } from '../ui/status.ts';

export type Command =
  | { readonly kind: 'status' }
  | { readonly kind: 'on' }
  | { readonly kind: 'off' }
  | { readonly kind: 'now' }
  | { readonly kind: 'usage' };

export interface StatusInput {
  readonly settings: Settings;
  readonly prepared: boolean;
  readonly running: boolean;
  readonly lastAppliedTokens: number | undefined;
  readonly status: StatusState;
}

/** 引数なしは status、`on` / `off` / `now`、それ以外は usage */
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

/** `/precompact` の使い方 */
export function usageText(): string {
  return [
    'precompact usage: /precompact [now|on|off]',
    '/precompact        show status',
    '/precompact now    prepare once now',
    '/precompact on     enable',
    '/precompact off    disable',
  ].join('\n');
}

/** 状態の表示。設定・準備・実行中・最後の適用・status を並べる */
export function statusLines(input: StatusInput): readonly string[] {
  const head = input.settings.enabled ? 'precompact: on' : 'precompact: off';
  const prepared = input.prepared ? 'prepared: yes' : 'prepared: none';
  const running = input.running ? 'running: yes' : 'running: no';
  const last =
    input.lastAppliedTokens === undefined
      ? 'lastApplied: none'
      : `lastApplied: ${input.lastAppliedTokens}`;
  return [head, prepared, running, last, `status: ${statusLine(input.status)}`];
}
