import { spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { tmpDir } from '../../test/tmp.ts';

// 入口は子プロセスで直に呼ぶ。`.mjs` を import すると底の 1 行がそのまま走るので、ここでは読まない。

const INDEX = join(process.cwd(), 'scripts', 'product-ready', 'index.mjs');

function writeFile(path: string): void {
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, 'x\n');
}

function makeTree(): {
  readonly root: string;
  readonly harnessJson: string;
  readonly harness: string;
  readonly nested: string;
  readonly tool: string;
  readonly env: string;
  readonly kept: string;
  readonly cycleA: string;
} {
  const root = tmpDir();
  const harnessJson = join(root, 'scripts', 'checks', 'scopes.json');
  const harness = join(root, '.pi', 'a.test.ts');
  const nested = join(root, '.pi', 'sub', 'b.test.ts');
  const tool = join(root, 'scripts', 'product-ready', 'tool.test.ts');
  const env = join(root, 'test', 'env.test.ts');
  const kept = join(root, 'test', 'keep.test.ts');
  const cycleA = join(root, 'cycles', '001-a');
  writeFile(harnessJson);
  writeFile(harness);
  writeFile(nested);
  writeFile(tool);
  writeFile(env);
  writeFile(kept);
  writeFile(join(cycleA, 'note.txt'));
  writeFile(join(root, 'cycles', '002-b', 'note.txt'));
  return { root, harnessJson, harness, nested, tool, env, kept, cycleA };
}

function run(
  script: string,
  args: readonly string[],
): { readonly status: number; readonly output: string; readonly errors: string } {
  const result = spawnSync('node', [script, ...args], { encoding: 'utf8' });
  return { status: result.status ?? 1, output: result.stdout ?? '', errors: result.stderr ?? '' };
}

describe('product-ready index', () => {
  it('表示だけ → 3つの見出しが出て、木は変わらない', () => {
    const tree = makeTree();
    const result = run(INDEX, ['--root', tree.root]);
    expect(result.status).toBe(0);
    expect(result.output).toContain('harness (');
    expect(result.output).toContain('tests (');
    expect(result.output).toContain('cycles (');
    expect(result.output.indexOf('harness (')).toBeLessThan(result.output.indexOf('tests ('));
    expect(result.output.indexOf('tests (')).toBeLessThan(result.output.indexOf('cycles ('));
    expect(result.output).toContain('a.test.ts');
    expect(result.output).toContain('tool.test.ts');
    expect(result.output).toContain('env.test.ts');
    expect(result.output).toContain('001-a');
    expect(existsSync(tree.harnessJson)).toBe(true);
    expect(existsSync(tree.harness)).toBe(true);
    expect(existsSync(tree.nested)).toBe(true);
    expect(existsSync(tree.tool)).toBe(true);
    expect(existsSync(tree.env)).toBe(true);
    expect(existsSync(tree.kept)).toBe(true);
    expect(existsSync(tree.cycleA)).toBe(true);
  });

  it('--only tests → tests の見出しだけ', () => {
    const tree = makeTree();
    const result = run(INDEX, ['--root', tree.root, '--only', 'tests']);
    expect(result.status).toBe(0);
    expect(result.output).toContain('tests (');
    expect(result.output).not.toContain('harness (');
    expect(result.output).not.toContain('cycles (');
    expect(result.output).not.toContain('no harness to remove');
    expect(existsSync(tree.harness)).toBe(true);
    expect(existsSync(tree.cycleA)).toBe(true);
  });

  it('--only=tests の形も同じ', () => {
    const tree = makeTree();
    const result = run(INDEX, ['--root', tree.root, '--only=tests']);
    expect(result.status).toBe(0);
    expect(result.output).toContain('tests (');
    expect(result.output).not.toContain('harness (');
    expect(result.output).not.toContain('cycles (');
  });

  it('--run → 3種とも消える', () => {
    const tree = makeTree();
    const result = run(INDEX, ['--root', tree.root, '--run']);
    expect(result.status).toBe(0);
    expect(existsSync(tree.harnessJson)).toBe(false);
    expect(existsSync(tree.harness)).toBe(false);
    expect(existsSync(tree.nested)).toBe(false);
    expect(existsSync(tree.tool)).toBe(false);
    expect(existsSync(tree.env)).toBe(false);
    expect(existsSync(tree.cycleA)).toBe(false);
    expect(existsSync(tree.kept)).toBe(true);
  });

  it('--only harness --run → harness だけ消え、.pi のテストは残る', () => {
    const tree = makeTree();
    const result = run(INDEX, ['--root', tree.root, '--only', 'harness', '--run']);
    expect(result.status).toBe(0);
    expect(existsSync(tree.harnessJson)).toBe(false);
    expect(existsSync(tree.harness)).toBe(true);
    expect(existsSync(tree.nested)).toBe(true);
    expect(existsSync(tree.tool)).toBe(true);
    expect(existsSync(tree.cycleA)).toBe(true);
  });

  it('--only harness で harness が無い → no harness to remove の1行、exit 0', () => {
    const root = tmpDir();
    writeFile(join(root, '.pi', 'a.test.ts'));
    const result = run(INDEX, ['--root', root, '--only', 'harness']);
    expect(result.status).toBe(0);
    expect(result.output.trim()).toBe('no harness to remove');
  });

  it('何も無い root で --run → 3つの no … to remove、exit 0', () => {
    const root = tmpDir();
    const result = run(INDEX, ['--root', root, '--run']);
    expect(result.status).toBe(0);
    expect(result.output).toContain('no harness to remove');
    expect(result.output).toContain('no tests to remove');
    expect(result.output).toContain('no cycles to remove');
  });

  it('--only に値が無い → exit 1', () => {
    const tree = makeTree();
    const result = run(INDEX, ['--root', tree.root, '--only']);
    expect(result.status).toBe(1);
    expect(existsSync(tree.harness)).toBe(true);
  });

  it('無い root → 1行の置き場エラーで exit 1', () => {
    const missing = join(tmpDir(), 'no-such');
    const result = run(INDEX, ['--root', missing, '--run']);
    expect(result.status).toBe(1);
    expect(result.output).toBe('');
    expect(result.errors.trim()).toBe(`no such directory: ${missing}`);
  });

  it('未知の引数 → exit 1', () => {
    const tree = makeTree();
    const result = run(INDEX, ['--root', tree.root, '--bogus']);
    expect(result.status).toBe(1);
    expect(result.output).toBe('');
    expect(result.errors.trim()).toBe('unknown argument: --bogus');
    expect(existsSync(tree.harness)).toBe(true);
    expect(existsSync(tree.tool)).toBe(true);
    expect(existsSync(tree.env)).toBe(true);
    expect(existsSync(tree.cycleA)).toBe(true);
  });

  it('2回目の --run → exit 0（消える物が無い）', () => {
    const tree = makeTree();
    expect(run(INDEX, ['--root', tree.root, '--run']).status).toBe(0);
    expect(existsSync(tree.cycleA)).toBe(false);
    const second = run(INDEX, ['--root', tree.root, '--run']);
    expect(second.status).toBe(0);
    expect(second.output).toContain('no tests to remove');
    expect(second.output).toContain('no cycles to remove');
  });
});
