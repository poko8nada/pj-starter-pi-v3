import { spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { tmpDir } from '../../test/tmp.ts';

// 入口は子プロセスで直に呼ぶ。`.mjs` を import すると底の 1 行がそのまま走るので、ここでは読まない。

const INDEX = join(process.cwd(), 'scripts', 'product-ready', 'index.mjs');

function writeFile(path: string): void {
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, 'x\n');
}

function writeMode(root: string, mode: string): void {
  const file = join(root, 'scripts', 'harness.mode.json');
  mkdirSync(dirname(file), { recursive: true });
  writeFileSync(file, `{\n  "mode": "${mode}"\n}\n`);
}

function readMode(root: string): string {
  return JSON.parse(readFileSync(join(root, 'scripts', 'harness.mode.json'), 'utf8')).mode;
}

function makeTree(): {
  readonly root: string;
  readonly keptTest: string;
  readonly readyTest: string;
  readonly envTest: string;
  readonly scopes: string;
  readonly cycleA: string;
} {
  const root = tmpDir();
  const keptTest = join(root, '.pi', 'a.test.ts');
  const readyTest = join(root, 'scripts', 'product-ready', 'tool.test.ts');
  const envTest = join(root, 'test', 'env.test.ts');
  const scopes = join(root, 'scripts', 'checks', 'scopes.json');
  const cycleA = join(root, 'cycles', '001-a');
  writeMode(root, 'starter');
  writeFile(keptTest);
  writeFile(readyTest);
  writeFile(envTest);
  writeFile(scopes);
  writeFile(join(cycleA, 'note.txt'));
  writeFile(join(root, 'cycles', '002-b', 'note.txt'));
  return { root, keptTest, readyTest, envTest, scopes, cycleA };
}

function run(
  script: string,
  args: readonly string[],
): { readonly status: number; readonly output: string; readonly errors: string } {
  const result = spawnSync('node', [script, ...args], { encoding: 'utf8' });
  return { status: result.status ?? 1, output: result.stdout ?? '', errors: result.stderr ?? '' };
}

describe('product-ready index', () => {
  it('表示だけ → mode の1行と cycles の見出しが出て、木と状態は変わらない', () => {
    const tree = makeTree();
    const result = run(INDEX, ['--root', tree.root]);
    expect(result.status).toBe(0);
    const lines = result.output.split('\n');
    expect(lines[0]).toBe('mode: starter → product');
    expect(result.output).toContain('cycles (');
    expect(result.output).not.toContain('harness (');
    expect(result.output).not.toContain('tests (');
    expect(result.output).toContain('001-a');
    expect(existsSync(tree.cycleA)).toBe(true);
    expect(readMode(tree.root)).toBe('starter');
  });

  it('--only cycles → cycles の見出しだけ', () => {
    const tree = makeTree();
    const result = run(INDEX, ['--root', tree.root, '--only', 'cycles']);
    expect(result.status).toBe(0);
    expect(result.output).toContain('cycles (');
    expect(existsSync(tree.cycleA)).toBe(true);
    expect(readMode(tree.root)).toBe('starter');
  });

  it('--run → cycles の下の dir が消え、状態が product になる', () => {
    const tree = makeTree();
    const result = run(INDEX, ['--root', tree.root, '--run']);
    expect(result.status).toBe(0);
    expect(existsSync(tree.cycleA)).toBe(false);
    expect(existsSync(join(tree.root, 'cycles', '002-b'))).toBe(false);
    expect(readMode(tree.root)).toBe('product');
  });

  it('--run で旧 label の物は残る', () => {
    const tree = makeTree();
    const result = run(INDEX, ['--root', tree.root, '--run']);
    expect(result.status).toBe(0);
    expect(existsSync(tree.keptTest)).toBe(true);
    expect(existsSync(tree.readyTest)).toBe(true);
    expect(existsSync(tree.envTest)).toBe(true);
    expect(existsSync(tree.scopes)).toBe(true);
  });

  it('cycles の無い木で --run → no cycles to remove と mode: starter → product、状態が product になる', () => {
    const root = tmpDir();
    writeMode(root, 'starter');
    const result = run(INDEX, ['--root', root, '--run']);
    expect(result.status).toBe(0);
    expect(result.output).toContain('no cycles to remove');
    expect(result.output).toContain('mode: starter → product');
    expect(readMode(root)).toBe('product');
  });

  it('--run をもう一度 → mode: product → product、exit 0', () => {
    const tree = makeTree();
    expect(run(INDEX, ['--root', tree.root, '--run']).status).toBe(0);
    const second = run(INDEX, ['--root', tree.root, '--run']);
    expect(second.status).toBe(0);
    expect(second.output).toContain('no cycles to remove');
    expect(second.output).toContain('mode: product → product');
  });

  it('--only cycles --run → cycles だけ消え、状態は product になる', () => {
    const tree = makeTree();
    const result = run(INDEX, ['--root', tree.root, '--only', 'cycles', '--run']);
    expect(result.status).toBe(0);
    expect(existsSync(tree.cycleA)).toBe(false);
    expect(readMode(tree.root)).toBe('product');
  });

  it('--only に値が無い → exit 1、状態は starter のまま', () => {
    const tree = makeTree();
    const result = run(INDEX, ['--root', tree.root, '--only']);
    expect(result.status).toBe(1);
    expect(readMode(tree.root)).toBe('starter');
    expect(existsSync(tree.cycleA)).toBe(true);
  });

  it('無い root → 1行の置き場エラーで exit 1', () => {
    const missing = join(tmpDir(), 'no-such');
    const result = run(INDEX, ['--root', missing, '--run']);
    expect(result.status).toBe(1);
    expect(result.output).toBe('');
    expect(result.errors.trim()).toBe(`no such directory: ${missing}`);
    expect(existsSync(missing)).toBe(false);
  });

  it('状態の道が無い → exit 1（道を指す1行を出す）', () => {
    const root = tmpDir();
    mkdirSync(join(root, 'cycles', '001-a'), { recursive: true });
    const result = run(INDEX, ['--root', root]);
    expect(result.status).toBe(1);
    expect(result.output).toBe('');
    expect(result.errors.trim()).toContain('scripts/harness.mode.json');
    expect(existsSync(join(root, 'cycles', '001-a'))).toBe(true);
  });

  it('状態が壊れている → exit 1', () => {
    const root = tmpDir();
    mkdirSync(join(root, 'cycles', '001-a'), { recursive: true });
    const modeFile = join(root, 'scripts', 'harness.mode.json');
    mkdirSync(dirname(modeFile), { recursive: true });
    writeFileSync(modeFile, '{"mode":"half"}\n');
    const result = run(INDEX, ['--root', root, '--run']);
    expect(result.status).toBe(1);
    expect(result.output).toBe('');
    expect(existsSync(join(root, 'cycles', '001-a'))).toBe(true);
  });

  it('--only harness（知らない label）→ mode と no harness to remove の2行、exit 0', () => {
    const tree = makeTree();
    const result = run(INDEX, ['--root', tree.root, '--only', 'harness']);
    expect(result.status).toBe(0);
    expect(result.output.trim().split('\n')).toEqual([
      'mode: starter → product',
      'no harness to remove',
    ]);
    expect(existsSync(tree.cycleA)).toBe(true);
  });

  it('未知の引数 → exit 1', () => {
    const tree = makeTree();
    const result = run(INDEX, ['--root', tree.root, '--bogus']);
    expect(result.status).toBe(1);
    expect(result.output).toBe('');
    expect(result.errors.trim()).toBe('unknown argument: --bogus');
    expect(existsSync(tree.cycleA)).toBe(true);
  });
});
