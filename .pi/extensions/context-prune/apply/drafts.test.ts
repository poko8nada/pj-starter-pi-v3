import { describe, expect, it } from 'vitest';
import { prunePass, pruneTemplate } from '../prune.fixture.ts';
import { draftsFor, markerText } from './drafts.ts';

const shownCases = [{ chars: 1234, shown: '1,234' }] as const;

describe('draftsFor', () => {
  it('3 件の drop、edited 空 → 3 つの draft', () => {
    const template = pruneTemplate();
    const { chars, shown } = shownCases[0];
    const drops = [
      { id: 'e1', chars },
      { id: 'e2', chars },
      { id: 'e3', chars },
    ];
    const drafts = draftsFor([prunePass({ dropped: drops })], new Set(), template);
    const text = template.split('{chars}').join(shown);
    expect(drafts).toStrictEqual(
      drops.map((drop) => ({
        type: 'context_edit',
        targetId: drop.id,
        replacement: { content: [{ type: 'text', text }] },
      })),
    );
  });

  it('印の置き換え', () => {
    const template = pruneTemplate();
    const { chars, shown } = shownCases[0];
    expect(markerText(chars, template)).toBe(template.split('{chars}').join(shown));
    const two = '{chars} と {chars}';
    expect(markerText(chars, two)).toBe(`${shown} と ${shown}`);
    const plain = '印だけ';
    expect(markerText(chars, plain)).toBe(plain);
  });

  it('2 つのパスが同じ id → draft は 1 つで最初のパスの chars', () => {
    const template = pruneTemplate();
    const { chars, shown } = shownCases[0];
    const drafts = draftsFor(
      [
        prunePass({ dropped: [{ id: 'e1', chars }] }),
        prunePass({ dropped: [{ id: 'e1', chars: 20 }] }),
      ],
      new Set(),
      template,
    );
    expect(drafts).toHaveLength(1);
    expect(drafts[0]).toStrictEqual({
      type: 'context_edit',
      targetId: 'e1',
      replacement: { content: [{ type: 'text', text: template.split('{chars}').join(shown) }] },
    });
  });

  it('edited に全部入っている → draft 0', () => {
    const template = pruneTemplate();
    const { chars } = shownCases[0];
    const drops = [
      { id: 'e1', chars },
      { id: 'e2', chars },
    ];
    const drafts = draftsFor(
      [prunePass({ dropped: drops })],
      new Set(drops.map((drop) => drop.id)),
      template,
    );
    expect(drafts).toHaveLength(0);
  });

  it('パスが無い → draft 0', () => {
    expect(draftsFor([], new Set(), pruneTemplate())).toHaveLength(0);
  });
});
