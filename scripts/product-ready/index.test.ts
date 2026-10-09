import { spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { tmpDir } from '../../test/tmp.ts';

// 入口は子プロセスで直に呼ぶ。`.mjs` を import すると底の 1 行がそのまま走るので、ここでは読まない。

const INDEX = join(process.cwd(), 'scripts', 'product-ready', 'index.mjs');
const PRUNE_TESTS = join(process.cwd(), 'scripts', 'product-ready', 'prune-tests.mjs');
const PRUNE_CYCLES = join(process.cwd(), 'scripts', 'product-ready', 'prune-cycles.mjs');

function writeFile(path: string): void {
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, 'x\n');
}

function makeTree(): {
  readonly root: string;
  readonly harness: string;
  readonly nested: string;
  readonly kept: string;
  readonly cycleA: string;
} {
  const root = tmpDir();
  const harness = join(root, '.pi', 'a.test.ts');
  const nested = join(root, '.pi', 'sub', 'b.test.ts');
  const kept = join(root, 'test', 'keep.test.ts');
  const cycleA = join(root, 'cycles', '001-a');
  writeFile(harness);
  writeFile(nested);
  writeFile(kept);
  writeFile(join(cycleA, 'note.txt'));
  writeFile(join(root, 'cycles', '002-b', 'note.txt'));
  return { root, harness, nested, kept, cycleA };
}

function run(
  script: string,
  args: readonly string[],
): { readonly status: number; readonly output: string } {
  const result = spawnSync('node', [script, ...args], { encoding: 'utf8' });
  return { status: result.status ?? 1, output: result.stdout ?? '' };
}

describe('product-ready entries', () => {
  it('index の表示だけ → 消える物が出て、木は変わらない', () => {
    const tree = makeTree();
    const result = run(INDEX, ['--root', tree.root]);
    expect(result.status).toBe(0);
    expect(result.output).toContain('a.test.ts');
    expect(result.output).toContain('001-a');
    expect(existsSync(tree.harness)).toBe(true);
    expect(existsSync(tree.nested)).toBe(true);
    expect(existsSync(tree.kept)).toBe(true);
    expect(existsSync(tree.cycleA)).toBe(true);
  });

  it('index の --run → ハーネスのテストと cycles が消え、test/ は残る', () => {
    const tree = makeTree();
    const result = run(INDEX, ['--root', tree.root, '--run']);
    expect(result.status).toBe(0);
    expect(existsSync(tree.harness)).toBe(false);
    expect(existsSync(tree.nested)).toBe(false);
    expect(existsSync(tree.cycleA)).toBe(false);
    expect(existsSync(tree.kept)).toBe(true);
  });

  it('prune-tests → 表示だけでは消えず、--run で .pi/ のテストだけが消える', () => {
    const tree = makeTree();
    const shown = run(PRUNE_TESTS, ['--root', tree.root]);
    expect(shown.status).toBe(0);
    expect(shown.output).toContain('a.test.ts');
    expect(existsSync(tree.harness)).toBe(true);
    const done = run(PRUNE_TESTS, ['--root', tree.root, '--run']);
    expect(done.status).toBe(0);
    expect(existsSync(tree.harness)).toBe(false);
    expect(existsSync(tree.nested)).toBe(false);
    expect(existsSync(tree.cycleA)).toBe(true);
    expect(existsSync(tree.kept)).toBe(true);
  });

  it('prune-cycles → 表示だけでは消えず、--run の2回目も exit 0', () => {
    const tree = makeTree();
    const shown = run(PRUNE_CYCLES, ['--root', tree.root]);
    expect(shown.status).toBe(0);
    expect(shown.output).toContain('001-a');
    expect(existsSync(tree.cycleA)).toBe(true);
    expect(run(PRUNE_CYCLES, ['--root', tree.root, '--run']).status).toBe(0);
    expect(existsSync(tree.cycleA)).toBe(false);
    expect(existsSync(tree.harness)).toBe(true);
    const second = run(PRUNE_CYCLES, ['--root', tree.root, '--run']);
    expect(second.status).toBe(0);
    expect(second.output).toContain('no cycles');
  });

  it('prune-tests の --run で無い root → exit 1', () => {
    const root = tmpDir();
    expect(run(PRUNE_TESTS, ['--root', join(root, 'no-such'), '--run']).status).toBe(1);
  });
});
