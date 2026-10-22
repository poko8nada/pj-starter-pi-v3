import { describe, expect, it } from 'vitest';
import type { PrunePass } from '../entry/data.ts';
import { draftsFor, markerText } from './drafts.ts';

const TEMPLATE = '古いツール結果（{chars} 文字）を省略';

function pass(drops: PrunePass['dropped']): PrunePass {
  let chars = 0;
  for (const drop of drops) {
    chars += drop.chars;
  }
  return {
    at: 1000,
    tokensBefore: 60000,
    summary: '要約',
    dropped: drops,
    droppedChars: chars,
    kept: 0,
    latencyMs: 1200,
    usage: undefined,
  };
}

describe('draftsFor', () => {
  it('3 件の drop、edited 空 → 3 つの draft（content は文字列でない）', () => {
    const drafts = draftsFor(
      [
        pass([
          { id: 'e1', chars: 10 },
          { id: 'e2', chars: 20 },
          { id: 'e3', chars: 30 },
        ]),
      ],
      new Set(),
      TEMPLATE,
    );
    expect(drafts).toStrictEqual([
      {
        type: 'context_edit',
        targetId: 'e1',
        replacement: { content: [{ type: 'text', text: '古いツール結果（10 文字）を省略' }] },
      },
      {
        type: 'context_edit',
        targetId: 'e2',
        replacement: { content: [{ type: 'text', text: '古いツール結果（20 文字）を省略' }] },
      },
      {
        type: 'context_edit',
        targetId: 'e3',
        replacement: { content: [{ type: 'text', text: '古いツール結果（30 文字）を省略' }] },
      },
    ]);
  });

  it('印の置き換え（1,234・2 つ・無し・0・1,234,567）', () => {
    expect(markerText(1234, TEMPLATE)).toBe('古いツール結果（1,234 文字）を省略');
    expect(markerText(1234, '{chars} と {chars}')).toBe('1,234 と 1,234');
    expect(markerText(1234, '印だけ')).toBe('印だけ');
    expect(markerText(0, TEMPLATE)).toBe('古いツール結果（0 文字）を省略');
    expect(markerText(1234567, TEMPLATE)).toBe('古いツール結果（1,234,567 文字）を省略');
  });

  it('2 つのパスが同じ id を持つ → draft は 1 つで最初のパスの chars を使う', () => {
    const drafts = draftsFor(
      [pass([{ id: 'e1', chars: 10 }]), pass([{ id: 'e1', chars: 20 }])],
      new Set(),
      TEMPLATE,
    );
    expect(drafts).toHaveLength(1);
    expect(drafts[0]).toStrictEqual({
      type: 'context_edit',
      targetId: 'e1',
      replacement: { content: [{ type: 'text', text: '古いツール結果（10 文字）を省略' }] },
    });
  });

  it('edited に全部入っている → draft 0', () => {
    const drafts = draftsFor(
      [
        pass([
          { id: 'e1', chars: 10 },
          { id: 'e2', chars: 20 },
        ]),
      ],
      new Set(['e1', 'e2']),
      TEMPLATE,
    );
    expect(drafts).toHaveLength(0);
  });

  it('パスが無い → draft 0', () => {
    expect(draftsFor([], new Set(), TEMPLATE)).toHaveLength(0);
  });
});
