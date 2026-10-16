import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { tmpDir } from '../../test/tmp.ts';
import { labels, plan, remove } from './targets.mjs';

function writeFile(path: string): void {
  mkdirSync(join(path, '..'), { recursive: true });
  writeFileSync(path, 'x\n');
}

describe('plan', () => {
  it('cycles/001-a と 002-b と README.md → cycles はフォルダの2つだけ', () => {
    const root = tmpDir();
    mkdirSync(join(root, 'cycles', '001-a'), { recursive: true });
    mkdirSync(join(root, 'cycles', '002-b'), { recursive: true });
    writeFile(join(root, 'cycles', 'README.md'));
    const found = plan(root);
    expect(found).toHaveLength(2);
    expect(found).toContainEqual({
      label: 'cycles',
      at: 'cycles/001-a',
      path: join(root, 'cycles', '001-a'),
    });
    expect(found).toContainEqual({
      label: 'cycles',
      at: 'cycles/002-b',
      path: join(root, 'cycles', '002-b'),
    });
  });

  it("plan(root, 'cycles') → cycles の行だけ", () => {
    const root = tmpDir();
    mkdirSync(join(root, 'cycles', '001-a'), { recursive: true });
    const found = plan(root, 'cycles');
    expect(found).toEqual([
      { label: 'cycles', at: 'cycles/001-a', path: join(root, 'cycles', '001-a') },
    ]);
  });

  it("plan(root, 'harness')（知らない label）→ []", () => {
    const root = tmpDir();
    mkdirSync(join(root, 'cycles', '001-a'), { recursive: true });
    expect(plan(root, 'harness')).toEqual([]);
  });

  it('何も無い root → []', () => {
    const root = tmpDir();
    expect(plan(root)).toEqual([]);
  });

  it('無い root → 投げる', () => {
    expect(() => plan(join(tmpDir(), 'no-such-root'))).toThrow();
  });

  it('at の昇順（作った順が逆でも）', () => {
    const root = tmpDir();
    mkdirSync(join(root, 'cycles', 'b'), { recursive: true });
    mkdirSync(join(root, 'cycles', 'a'), { recursive: true });
    const found = plan(root);
    expect(found).toEqual([
      { label: 'cycles', at: 'cycles/a', path: join(root, 'cycles', 'a') },
      { label: 'cycles', at: 'cycles/b', path: join(root, 'cycles', 'b') },
    ]);
    expect(found.map((entry) => entry.at).toSorted()).toEqual(found.map((entry) => entry.at));
  });

  it('旧 label の物（.pi のテスト・scopes.json）は入らない', () => {
    const root = tmpDir();
    writeFile(join(root, '.pi', 'a.test.ts'));
    writeFile(join(root, 'scripts', 'checks', 'scopes.json'));
    mkdirSync(join(root, 'cycles', '001-a'), { recursive: true });
    const found = plan(root);
    expect(found).toEqual([
      { label: 'cycles', at: 'cycles/001-a', path: join(root, 'cycles', '001-a') },
    ]);
  });
});

describe('labels', () => {
  it("labels(undefined) → ['cycles']", () => {
    expect(labels(undefined)).toEqual(['cycles']);
  });

  it("labels('cycles') → ['cycles']", () => {
    expect(labels('cycles')).toEqual(['cycles']);
  });
});

describe('remove', () => {
  it('remove を2回呼ぶ → 2回目は []', () => {
    const root = tmpDir();
    mkdirSync(join(root, 'cycles', '001-a'), { recursive: true });
    const targets = plan(root);
    expect(targets).toHaveLength(1);
    expect(remove(targets)).toHaveLength(1);
    expect(plan(root)).toEqual([]);
    expect(remove(targets)).toEqual([]);
  });

  it('消した at を返す', () => {
    const root = tmpDir();
    mkdirSync(join(root, 'cycles', '001-a'), { recursive: true });
    const targets = plan(root);
    const removed = remove(targets);
    expect(removed).toEqual(['cycles/001-a']);
    expect(plan(root)).toEqual([]);
  });
});
