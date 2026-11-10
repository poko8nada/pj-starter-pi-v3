/**
 * consult の稼働表示 — エディタの上の 1 行。
 *
 * 記録から数えた役割ごとの稼働数を、`[res:2 pro:1]` の 1 行にして、pi のウィジェットに渡す。
 * 短い名前は役割名の先頭 3 文字である。並びは `types.json` の並びで、そこにない役割は
 * 初出順に後ろへ置く。稼働が 0 の役割は出さない。
 */

import type { ExtensionUIContext } from '@earendil-works/pi-coding-agent';
import type { RunRecord } from '../run/log.ts';

/** ウィジェットのキー。他の拡張と重ならない名前にする */
export const WIDGET_KEY = 'consult-running';

/** 1 つの役割の稼働数 */
export interface RoleCount {
  readonly role: string;
  readonly count: number;
}

/** ウィジェットを出す窓口。pi の `ExtensionUIContext` の `setWidget` だけを使う */
export type WidgetUI = Pick<ExtensionUIContext, 'setWidget'>;

/** 役割の短い名前。名前の先頭 3 文字（research → res） */
export function roleShort(role: string): string {
  return role.slice(0, 3);
}

/**
 * 記録を役割ごとに数える。
 *
 * `order` の順に並べ、`order` にない役割は初出順でそのあとに置く。
 */
export function countRoles(
  runs: readonly RunRecord[],
  order: readonly string[],
): readonly RoleCount[] {
  const counts = new Map<string, number>();
  for (const run of runs) {
    counts.set(run.role, (counts.get(run.role) ?? 0) + 1);
  }
  const out: RoleCount[] = [];
  for (const role of order) {
    const count = counts.get(role);
    if (count === undefined) {
      continue;
    }
    out.push({ role, count });
    counts.delete(role);
  }
  for (const [role, count] of counts) {
    out.push({ role, count });
  }
  return out;
}

/** 稼働数を `[res:2 pro:1]` の 1 行にする。数が 0 より大きい役割だけを出し、1 つもなければ `undefined` */
export function runningLine(counts: readonly RoleCount[]): string | undefined {
  const parts: string[] = [];
  for (const entry of counts) {
    if (entry.count > 0) {
      parts.push(`${roleShort(entry.role)}:${entry.count}`);
    }
  }
  return parts.length === 0 ? undefined : `[${parts.join(' ')}]`;
}

/** 1 行をウィジェットに渡す。行がなければ消す */
export function showRunning(ui: WidgetUI, counts: readonly RoleCount[]): void {
  const line = runningLine(counts);
  ui.setWidget(WIDGET_KEY, line === undefined ? undefined : [line]);
}
