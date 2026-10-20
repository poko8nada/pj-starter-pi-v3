import { spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { tmpDir } from '../../test/tmp.ts';

// 入口は子プロセスで直に呼ぶ。`.mjs` を import すると底の 1 行がそのまま走るので、ここでは読まない。

const INDEX = join(process.cwd(), 'scripts', 'product-ready', 'index.mjs');
const FLAG = ' --config vitest.starter.config.ts';

function writeFile(path: string): void {
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, 'x\n');
}

function writePackageJson(root: string, scripts: Record<string, string>): void {
  const file = join(root, 'package.json');
  mkdirSync(dirname(file), { recursive: true });
  writeFileSync(file, `${JSON.stringify({ name: 't', private: true, scripts }, null, 2)}\n`);
}

function defaultScripts(): Record<string, string> {
  return {
    test: `vitest${FLAG}`,
    'test:run': `vitest run${FLAG}`,
    'test:related': `vitest related --run${FLAG}`,
  };
}

function writeStarterConfig(root: string): void {
  const file = join(root, 'vitest.starter.config.ts');
  mkdirSync(dirname(file), { recursive: true });
  writeFileSync(
    file,
    "import { defineConfig } from 'vitest/config';\nexport default defineConfig({});\n",
  );
}

function makeTree(): {
  readonly root: string;
  readonly cycleA: string;
} {
  const root = tmpDir();
  const cycleA = join(root, 'cycles', '001-a');
  writeFile(join(cycleA, 'note.txt'));
  writeFile(join(root, 'cycles', '002-b', 'note.txt'));
  writePackageJson(root, defaultScripts());
  writeStarterConfig(root);
  return { root, cycleA };
}

function run(
  script: string,
  args: readonly string[],
  cwd: string,
): { readonly status: number; readonly output: string; readonly errors: string } {
  const result = spawnSync('node', [script, ...args], { encoding: 'utf8', cwd });
  return { status: result.status ?? 1, output: result.stdout ?? '', errors: result.stderr ?? '' };
}

describe('product-ready index', () => {
  it('--run → cycles が消え、3 つのスクリプトから flag が消え、vitest.starter.config.ts が消える', () => {
    const tree = makeTree();
    const result = run(INDEX, ['--run'], tree.root);
    expect(result.status).toBe(0);
    expect(existsSync(tree.cycleA)).toBe(false);
    expect(existsSync(join(tree.root, 'cycles', '002-b'))).toBe(false);
    const pkg = JSON.parse(readFileSync(join(tree.root, 'package.json'), 'utf8'));
    expect(pkg.scripts.test).toBe('vitest');
    expect(pkg.scripts['test:run']).toBe('vitest run');
    expect(pkg.scripts['test:related']).toBe('vitest related --run');
    expect(existsSync(join(tree.root, 'vitest.starter.config.ts'))).toBe(false);
  });

  it('--run なし → switchLines の2行と cycles の見出しが出て、cycles は残り、package.json と config は変わらない', () => {
    const tree = makeTree();
    const beforePkg = readFileSync(join(tree.root, 'package.json'), 'utf8');
    const beforeConfig = readFileSync(join(tree.root, 'vitest.starter.config.ts'), 'utf8');
    const result = run(INDEX, [], tree.root);
    expect(result.status).toBe(0);
    expect(result.output).toContain('config: vitest.starter.config.ts');
    expect(result.output).toContain('scripts: test, test:run, test:related');
    expect(result.output).toContain('cycles (');
    expect(existsSync(tree.cycleA)).toBe(true);
    expect(readFileSync(join(tree.root, 'package.json'), 'utf8')).toBe(beforePkg);
    expect(readFileSync(join(tree.root, 'vitest.starter.config.ts'), 'utf8')).toBe(beforeConfig);
  });

  it('--only cycles 付き --run → tree の cwd で cycles が消え、exit 0', () => {
    const tree = makeTree();
    const result = run(INDEX, ['--run', '--only', 'cycles'], tree.root);
    expect(result.status).toBe(0);
    expect(result.output).toContain('cycles (2):');
    expect(existsSync(tree.cycleA)).toBe(false);
    expect(existsSync(join(tree.root, 'cycles', '002-b'))).toBe(false);
  });

  it('もう一度 --run → no scripts to change と no config to remove、exit 0', () => {
    const tree = makeTree();
    expect(run(INDEX, ['--run'], tree.root).status).toBe(0);
    const second = run(INDEX, ['--run'], tree.root);
    expect(second.status).toBe(0);
    expect(second.output).toContain('no scripts to change');
    expect(second.output).toContain('no config to remove');
  });

  it('flag の無いスクリプトが混ざる → その1つは残り、他は変わる', () => {
    const tree = makeTree();
    writePackageJson(tree.root, {
      test: 'vitest',
      'test:run': `vitest run${FLAG}`,
      'test:related': `vitest related --run${FLAG}`,
    });
    const result = run(INDEX, ['--run'], tree.root);
    expect(result.status).toBe(0);
    const pkg = JSON.parse(readFileSync(join(tree.root, 'package.json'), 'utf8'));
    expect(pkg.scripts.test).toBe('vitest');
    expect(pkg.scripts['test:run']).toBe('vitest run');
    expect(pkg.scripts['test:related']).toBe('vitest related --run');
  });

  it('scripts が無い package.json でも --run → cycles と config は消える', () => {
    const tree = makeTree();
    writeFileSync(
      join(tree.root, 'package.json'),
      `${JSON.stringify({ name: 't', private: true }, null, 2)}\n`,
    );
    const result = run(INDEX, ['--run'], tree.root);
    expect(result.status).toBe(0);
    expect(result.output).toContain('no scripts to change');
    expect(existsSync(tree.cycleA)).toBe(false);
    expect(existsSync(join(tree.root, 'vitest.starter.config.ts'))).toBe(false);
  });

  it('1鍵欠けの package.json → 欠けた鍵は作らず、ある鍵の flag だけ外す', () => {
    const tree = makeTree();
    writePackageJson(tree.root, { test: `vitest${FLAG}` });
    const result = run(INDEX, ['--run'], tree.root);
    expect(result.status).toBe(0);
    const pkg = JSON.parse(readFileSync(join(tree.root, 'package.json'), 'utf8'));
    expect(pkg.scripts.test).toBe('vitest');
    expect('test:run' in pkg.scripts).toBe(false);
    expect('test:related' in pkg.scripts).toBe(false);
  });

  it('package.json が無い → 1行、exit 1、cycles は残る', () => {
    const root = tmpDir();
    const cycleA = join(root, 'cycles', '001-a');
    writeFile(join(cycleA, 'note.txt'));
    writeStarterConfig(root);
    const result = run(INDEX, ['--run'], root);
    expect(result.status).toBe(1);
    expect(result.output).toBe('');
    expect(result.errors.trim().split('\n')).toHaveLength(1);
    expect(existsSync(cycleA)).toBe(true);
  });

  it('package.json が JSON でない → 1行、exit 1、何も変わらない', () => {
    const tree = makeTree();
    writeFileSync(join(tree.root, 'package.json'), '{not json');
    const beforeCycles = existsSync(tree.cycleA);
    const beforeConfig = readFileSync(join(tree.root, 'vitest.starter.config.ts'), 'utf8');
    const result = run(INDEX, ['--run'], tree.root);
    expect(result.status).toBe(1);
    expect(result.output).toBe('');
    expect(result.errors.trim().split('\n')).toHaveLength(1);
    expect(existsSync(tree.cycleA)).toBe(beforeCycles);
    expect(readFileSync(join(tree.root, 'vitest.starter.config.ts'), 'utf8')).toBe(beforeConfig);
  });

  it('--only に値が無い → exit 1', () => {
    const tree = makeTree();
    const result = run(INDEX, ['--only'], tree.root);
    expect(result.status).toBe(1);
    expect(existsSync(tree.cycleA)).toBe(true);
  });

  it('未知の引数 → exit 1', () => {
    const tree = makeTree();
    const result = run(INDEX, ['--bogus'], tree.root);
    expect(result.status).toBe(1);
    expect(result.output).toBe('');
    expect(result.errors.trim()).toBe('unknown argument: --bogus');
    expect(existsSync(tree.cycleA)).toBe(true);
  });
});
