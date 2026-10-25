import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { tempDir } from '../../test/temp-dir.ts';
import { STARTER_ONLY, labels, plan, remove } from './targets.mjs';

function writeFile(path: string): void {
  mkdirSync(join(path, '..'), { recursive: true });
  writeFileSync(path, 'x\n');
}

function makeCycleNames(): readonly string[] {
  return ['001-a', '002-b'];
}

function cycleAt(name: string): string {
  return join('cycles', name);
}

describe('plan', () => {
  it('cycles の 2 件を集め、README は入れない', () => {
    const names = makeCycleNames();
    const root = tempDir();
    for (const name of names) {
      mkdirSync(join(root, cycleAt(name)), { recursive: true });
    }
    writeFile(join(root, 'cycles', 'README.md'));
    const found = plan(root);
    expect(found).toHaveLength(names.length);
    for (const name of names) {
      const at = cycleAt(name);
      expect(found).toContainEqual({ label: 'cycles', at, path: join(root, at) });
    }
  });

  it("plan(root, 'cycles') → cycles の行だけ", () => {
    const only = 'cycles';
    const name = '001-a';
    const root = tempDir();
    mkdirSync(join(root, cycleAt(name)), { recursive: true });
    const at = cycleAt(name);
    expect(plan(root, only)).toEqual([{ label: only, at, path: join(root, at) }]);
  });

  it("plan(root, 'harness')（知らない label）→ []", () => {
    const unknown = 'harness';
    const root = tempDir();
    mkdirSync(join(root, cycleAt('001-a')), { recursive: true });
    expect(plan(root, unknown)).toEqual([]);
  });

  it('何も無い root → []', () => {
    const root = tempDir();
    expect(plan(root)).toEqual([]);
  });

  it('無い root → 投げる', () => {
    expect(() => plan(join(tempDir(), 'no-such-root'))).toThrow();
  });

  it('at の昇順（作った順が逆でも）', () => {
    const names = ['b', 'a'];
    const root = tempDir();
    for (const name of names) {
      mkdirSync(join(root, cycleAt(name)), { recursive: true });
    }
    const found = plan(root);
    const sorted = [...names].toSorted();
    expect(found).toEqual(
      sorted.map((name) => {
        const at = cycleAt(name);
        return { label: 'cycles', at, path: join(root, at) };
      }),
    );
    expect(found.map((entry) => entry.at).toSorted()).toEqual(found.map((entry) => entry.at));
  });
});

describe('labels', () => {
  it('labels(undefined) → 既定の名前', () => {
    const expected = STARTER_ONLY.map((row) => row.label);
    expect(labels(undefined)).toEqual(expected);
  });

  it("labels('cycles') → その名前", () => {
    const only = 'cycles';
    expect(labels(only)).toEqual([only]);
  });
});

describe('remove', () => {
  it('remove を2回呼ぶ → 2回目は []', () => {
    const root = tempDir();
    mkdirSync(join(root, cycleAt('001-a')), { recursive: true });
    const targets = plan(root);
    expect(targets).toHaveLength(1);
    expect(remove(targets)).toHaveLength(targets.length);
    expect(plan(root)).toEqual([]);
    expect(remove(targets)).toEqual([]);
  });

  it('消した at を返す', () => {
    const root = tempDir();
    mkdirSync(join(root, cycleAt('001-a')), { recursive: true });
    const targets = plan(root);
    const removed = remove(targets);
    expect(removed).toEqual(targets.map((entry) => entry.at));
    expect(plan(root)).toEqual([]);
  });
});
