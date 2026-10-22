/**
 * 印の文面と context_edit の下書き。edited にある物は出さない。同じ id は最初の 1 つ。
 */

import type { ContextEditEntryDraft } from '@earendil-works/pi-coding-agent';
import type { PrunePass } from '../entry/data.ts';
import { formatCount } from '../format/count.ts';

/** `{chars}` を桁区切りの数字に置き換える。無ければそのまま */
export function markerText(chars: number, template: string): string {
  return template.split('{chars}').join(formatCount(chars));
}

/** パスの落とし物を context_edit の下書きにする */
export function draftsFor(
  passes: readonly PrunePass[],
  edited: ReadonlySet<string>,
  template: string,
): readonly ContextEditEntryDraft[] {
  const seen = new Set<string>();
  const drafts: ContextEditEntryDraft[] = [];
  for (const pass of passes) {
    for (const drop of pass.dropped) {
      if (edited.has(drop.id) || seen.has(drop.id)) {
        continue;
      }
      seen.add(drop.id);
      drafts.push({
        type: 'context_edit',
        targetId: drop.id,
        replacement: { content: [{ type: 'text', text: markerText(drop.chars, template) }] },
      });
    }
  }
  return drafts;
}
