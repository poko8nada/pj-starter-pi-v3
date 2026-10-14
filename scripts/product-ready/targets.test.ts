import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { tmpDir } from '../../test/tmp.ts';
import { labels, plan, remove } from './targets.mjs';

function writeFile(path: string): void {
  mkdirSync(join(path, '..'), { recursive: true });
  writeFileSync(path, 'x\n');
}

function writeBase(root: string): {
  readonly piX: string;
  readonly piY: string;
  readonly readyZ: string;
  readonly env: string;
  readonly stagedCheck: string;
} {
  const piX = join(root, '.pi', 'x.test.ts');
  const piY = join(root, '.pi', 'dir', 'y.test.ts');
  const readyZ = join(root, 'scripts', 'product-ready', 'z.test.ts');
  const env = join(root, 'test', 'env.test.ts');
  const stagedCheck = join(root, 'scripts', 'typecheck-staged.test.ts');
  writeFile(piX);
  writeFile(piY);
  writeFile(readyZ);
  writeFile(env);
  writeFile(stagedCheck);
  return { piX, piY, readyZ, env, stagedCheck };
}

describe('plan', () => {
  it('名指しの4か所があるツリー → 5つ、`at` は相対・`path` は絶対', () => {
    const root = tmpDir();
    const base = writeBase(root);
    const found = plan(root);
    expect(found).toHaveLength(5);
    expect(found).toContainEqual({ label: 'tests', at: '.pi/x.test.ts', path: base.piX });
    expect(found).toContainEqual({ label: 'tests', at: '.pi/dir/y.test.ts', path: base.piY });
    expect(found).toContainEqual({
      label: 'tests',
      at: 'scripts/product-ready/z.test.ts',
      path: base.readyZ,
    });
    expect(found).toContainEqual({ label: 'tests', at: 'test/env.test.ts', path: base.env });
    expect(found).toContainEqual({
      label: 'tests',
      at: 'scripts/typecheck-staged.test.ts',
      path: base.stagedCheck,
    });
    for (const entry of found) {
      expect(entry.path).toBe(join(root, entry.at));
    }
  });

  it('scripts/harness-scopes.json があるツリー → harness の1つが入る', () => {
    const root = tmpDir();
    writeBase(root);
    const harness = join(root, 'scripts', 'harness-scopes.json');
    writeFile(harness);
    const found = plan(root);
    expect(found).toContainEqual({
      label: 'harness',
      at: 'scripts/harness-scopes.json',
      path: harness,
    });
  });

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

  it("plan(root, 'tests') → harness と cycles の行が入らない", () => {
    const root = tmpDir();
    writeBase(root);
    writeFile(join(root, 'scripts', 'harness-scopes.json'));
    mkdirSync(join(root, 'cycles', '001-a'), { recursive: true });
    const found = plan(root, 'tests');
    expect(found).toHaveLength(5);
    expect(found.map((entry) => entry.label)).toEqual([
      'tests',
      'tests',
      'tests',
      'tests',
      'tests',
    ]);
  });

  it("plan(root, 'harness') → harness-scopes.json の1つだけ", () => {
    const root = tmpDir();
    writeBase(root);
    const harness = join(root, 'scripts', 'harness-scopes.json');
    writeFile(harness);
    mkdirSync(join(root, 'cycles', '001-a'), { recursive: true });
    const found = plan(root, 'harness');
    expect(found).toEqual([{ label: 'harness', at: 'scripts/harness-scopes.json', path: harness }]);
  });

  it("plan(root, 'harness') で scripts/harness-scopes.json が無い → []", () => {
    const root = tmpDir();
    writeBase(root);
    expect(plan(root, 'harness')).toEqual([]);
  });

  it('何も無い root → []', () => {
    const root = tmpDir();
    expect(plan(root)).toEqual([]);
  });

  it('無い root → 投げる', () => {
    expect(() => plan(join(tmpDir(), 'no-such-root'))).toThrow();
  });

  it('.pi の中の node_modules / .git は walk が飛ばす', () => {
    const root = tmpDir();
    const base = writeBase(root);
    writeFile(join(root, 'node_modules', 'a.test.ts'));
    writeFile(join(root, '.git', 'b.test.ts'));
    writeFile(join(root, '.pi', 'node_modules', 'c.test.ts'));
    writeFile(join(root, '.pi', '.git', 'd.test.ts'));
    const found = plan(root);
    expect(found).toHaveLength(5);
    expect(found.map((entry) => entry.path)).toContain(base.piX);
    expect(found.map((entry) => entry.at)).not.toContainEqual(
      expect.stringMatching(/node_modules|\.git/),
    );
  });

  it('at の昇順（作った順が逆でも）', () => {
    const root = tmpDir();
    writeFile(join(root, '.pi', 'b.test.ts'));
    writeFile(join(root, '.pi', 'a.test.ts'));
    const found = plan(root);
    expect(found).toEqual([
      { label: 'tests', at: '.pi/a.test.ts', path: join(root, '.pi', 'a.test.ts') },
      { label: 'tests', at: '.pi/b.test.ts', path: join(root, '.pi', 'b.test.ts') },
    ]);
    expect(found.map((entry) => entry.at).toSorted()).toEqual(found.map((entry) => entry.at));
  });

  it('名指しの外（test/keep.test.ts・src/keep.test.ts）は入らない', () => {
    const root = tmpDir();
    writeBase(root);
    writeFile(join(root, 'test', 'keep.test.ts'));
    writeFile(join(root, 'src', 'keep.test.ts'));
    const found = plan(root);
    expect(found).toHaveLength(5);
    expect(found.map((entry) => entry.path)).not.toContain(join(root, 'test', 'keep.test.ts'));
    expect(found.map((entry) => entry.path)).not.toContain(join(root, 'src', 'keep.test.ts'));
  });

  it('vitest の既定 include（.spec.ts）も拾う', () => {
    const root = tmpDir();
    const base = writeBase(root);
    const spec = join(root, 'scripts', 'product-ready', 'z.spec.ts');
    writeFile(spec);
    const found = plan(root);
    expect(found).toHaveLength(6);
    expect(found.map((entry) => entry.path)).toContain(base.piX);
    expect(found.map((entry) => entry.path)).toContain(base.readyZ);
    expect(found.map((entry) => entry.path)).toContain(base.env);
    expect(found.map((entry) => entry.path)).toContain(spec);
  });

  it('walk の中の非テスト（test/setup.ts）は拾わない', () => {
    const root = tmpDir();
    writeBase(root);
    writeFile(join(root, 'test', 'setup.ts'));
    writeFile(join(root, '.pi', 'setup.ts'));
    writeFile(join(root, 'scripts', 'product-ready', 'setup.ts'));
    const found = plan(root);
    expect(found).toHaveLength(5);
    expect(found.map((entry) => entry.path)).not.toContain(join(root, 'test', 'setup.ts'));
    expect(found.map((entry) => entry.path)).not.toContain(join(root, '.pi', 'setup.ts'));
  });
});

describe('labels', () => {
  it("labels(undefined) → ['harness', 'tests', 'cycles']", () => {
    expect(labels(undefined)).toEqual(['harness', 'tests', 'cycles']);
  });

  it("labels('tests') → ['tests']", () => {
    expect(labels('tests')).toEqual(['tests']);
  });
});

describe('remove', () => {
  it('remove を2回呼ぶ → 2回目は []', () => {
    const root = tmpDir();
    writeFile(join(root, '.pi', 'a.test.ts'));
    const targets = plan(root);
    expect(targets).toHaveLength(1);
    expect(remove(targets)).toHaveLength(1);
    expect(plan(root)).toEqual([]);
    expect(remove(targets)).toEqual([]);
  });

  it('消した at を返し、cycles のフォルダも消す', () => {
    const root = tmpDir();
    writeFile(join(root, '.pi', 'a.test.ts'));
    mkdirSync(join(root, 'cycles', '001-a'), { recursive: true });
    const targets = plan(root);
    const removed = remove(targets);
    expect(removed.toSorted()).toEqual(['.pi/a.test.ts', 'cycles/001-a']);
    expect(plan(root)).toEqual([]);
  });
});
