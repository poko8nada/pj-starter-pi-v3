import { describe, expect, it } from 'vitest';
import { prunePass, pruneTemplate } from '../../../../test/prune-fixture.ts';
import { draftsFor, markerText } from './drafts.ts';

function textOf(chars: number, template: string): string {
  return template.split('{chars}').join(String(chars));
}

describe('draftsFor', () => {
  it('3 件の drop、edited 空 → 3 つの draft', () => {
    const template = pruneTemplate();
    const drops = [
      { id: 'e1', chars: 10 },
      { id: 'e2', chars: 20 },
      { id: 'e3', chars: 30 },
    ];
    const drafts = draftsFor([prunePass({ dropped: drops })], new Set(), template);
    expect(drafts).toStrictEqual(
      drops.map((drop) => ({
        type: 'context_edit',
        targetId: drop.id,
        replacement: { content: [{ type: 'text', text: textOf(drop.chars, template) }] },
      })),
    );
  });

  it('印の置き換え', () => {
    const template = pruneTemplate();
    const chars = 123;
    expect(markerText(chars, template)).toBe(textOf(chars, template));
    const two = '{chars} と {chars}';
    expect(markerText(chars, two)).toBe(`${String(chars)} と ${String(chars)}`);
    const plain = '印だけ';
    expect(markerText(chars, plain)).toBe(plain);
    expect(markerText(0, template)).toBe(textOf(0, template));
  });

  it('2 つのパスが同じ id → draft は 1 つで最初のパスの chars', () => {
    const template = pruneTemplate();
    const firstChars = 10;
    const drafts = draftsFor(
      [
        prunePass({ dropped: [{ id: 'e1', chars: firstChars }] }),
        prunePass({ dropped: [{ id: 'e1', chars: 20 }] }),
      ],
      new Set(),
      template,
    );
    expect(drafts).toHaveLength(1);
    expect(drafts[0]).toStrictEqual({
      type: 'context_edit',
      targetId: 'e1',
      replacement: { content: [{ type: 'text', text: textOf(firstChars, template) }] },
    });
  });

  it('edited に全部入っている → draft 0', () => {
    const template = pruneTemplate();
    const drops = [
      { id: 'e1', chars: 10 },
      { id: 'e2', chars: 20 },
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
