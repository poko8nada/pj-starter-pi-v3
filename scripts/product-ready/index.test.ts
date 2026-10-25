import { spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { ONLY_FLAG, RUN_FLAG, countLine, indented } from '../../test/scripts-fixture.ts';
import { tempDir } from '../../test/temp-dir.ts';

// 入口は子プロセスで直に呼ぶ。`.mjs` を import すると底の 1 行がそのまま走るので、ここでは読まない。

const INDEX = join(process.cwd(), 'scripts', 'product-ready', 'index.mjs');
const FLAG = ' --config vitest.starter.config.ts';
const CONFIG_AT = 'vitest.starter.config.ts';
const CYCLES_LABEL = 'cycles';

function writeFile(path: string): void {
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, 'x\n');
}

function writePackageJson(root: string, scripts: Record<string, string>): void {
  const file = join(root, 'package.json');
  mkdirSync(dirname(file), { recursive: true });
  writeFileSync(file, `${JSON.stringify({ name: 't', private: true, scripts }, null, 2)}\n`);
}

function targetScriptNames(): readonly string[] {
  return ['test', 'test:run', 'test:related'];
}

function baseScripts(): Record<string, string> {
  return {
    test: 'vitest',
    'test:run': 'vitest run',
    'test:related': 'vitest related --run',
  };
}

function defaultScripts(): Record<string, string> {
  const base = baseScripts();
  return {
    test: `${base.test}${FLAG}`,
    'test:run': `${base['test:run']}${FLAG}`,
    'test:related': `${base['test:related']}${FLAG}`,
  };
}

function makeCycleNames(): readonly string[] {
  return ['001-a', '002-b'];
}

function writeStarterConfig(root: string): void {
  const file = join(root, CONFIG_AT);
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
  const names = makeCycleNames();
  const root = tempDir();
  for (const name of names) {
    writeFile(join(root, CYCLES_LABEL, name, 'note.txt'));
  }
  writePackageJson(root, defaultScripts());
  writeStarterConfig(root);
  return { root, cycleA: join(root, CYCLES_LABEL, names[0]) };
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
  it('--run → cycles が消え、スクリプトから flag が消え、config が消える', () => {
    const flagged = defaultScripts();
    const tree = makeTree();
    const names = makeCycleNames();
    const result = run(INDEX, [RUN_FLAG], tree.root);
    expect(result.status).toBe(0);
    for (const name of names) {
      expect(existsSync(join(tree.root, CYCLES_LABEL, name))).toBe(false);
    }
    const pkg = JSON.parse(readFileSync(join(tree.root, 'package.json'), 'utf8'));
    const base = baseScripts();
    expect(pkg.scripts.test).toBe(base.test);
    expect(pkg.scripts['test:run']).toBe(base['test:run']);
    expect(pkg.scripts['test:related']).toBe(base['test:related']);
    expect(flagged.test).toContain(FLAG);
    expect(existsSync(join(tree.root, CONFIG_AT))).toBe(false);
  });

  it('--run なし → 表示だけで、木は変わらない', () => {
    const tree = makeTree();
    const names = makeCycleNames();
    const scripts = targetScriptNames();
    const beforePkg = readFileSync(join(tree.root, 'package.json'), 'utf8');
    const beforeConfig = readFileSync(join(tree.root, CONFIG_AT), 'utf8');
    const result = run(INDEX, [], tree.root);
    expect(result.status).toBe(0);
    expect(result.output).toContain(`config: ${CONFIG_AT}`);
    expect(result.output).toContain(`scripts: ${scripts.join(', ')}`);
    expect(result.output).toContain(countLine(CYCLES_LABEL, names.length));
    expect(existsSync(tree.cycleA)).toBe(true);
    expect(readFileSync(join(tree.root, 'package.json'), 'utf8')).toBe(beforePkg);
    expect(readFileSync(join(tree.root, CONFIG_AT), 'utf8')).toBe(beforeConfig);
  });

  it('--only cycles 付き --run → cycles だけ消える', () => {
    const tree = makeTree();
    const names = makeCycleNames();
    const result = run(INDEX, [RUN_FLAG, ONLY_FLAG, CYCLES_LABEL], tree.root);
    expect(result.status).toBe(0);
    expect(result.output).toContain(countLine(CYCLES_LABEL, names.length));
    for (const name of names) {
      expect(existsSync(join(tree.root, CYCLES_LABEL, name))).toBe(false);
    }
  });

  it('もう一度 --run → 無い旨の表示', () => {
    const tree = makeTree();
    const names = makeCycleNames();
    expect(run(INDEX, [RUN_FLAG], tree.root).status).toBe(0);
    const second = run(INDEX, [RUN_FLAG], tree.root);
    expect(second.status).toBe(0);
    expect(second.output).toContain('no scripts to change');
    expect(second.output).toContain('no config to remove');
    expect(second.output).not.toContain(countLine(CYCLES_LABEL, names.length));
    for (const name of names) {
      expect(second.output).not.toContain(indented(join(CYCLES_LABEL, name)));
    }
  });

  it('flag の無い混在 → ある物だけ変わり、無い物は同じまま', () => {
    const tree = makeTree();
    const base = baseScripts();
    writePackageJson(tree.root, {
      test: base.test,
      'test:run': `${base['test:run']}${FLAG}`,
      'test:related': `${base['test:related']}${FLAG}`,
    });
    const result = run(INDEX, [RUN_FLAG], tree.root);
    expect(result.status).toBe(0);
    const pkg = JSON.parse(readFileSync(join(tree.root, 'package.json'), 'utf8'));
    expect(pkg.scripts.test).toBe(base.test);
    expect(pkg.scripts['test:run']).toBe(base['test:run']);
    expect(pkg.scripts['test:related']).toBe(base['test:related']);
  });

  it('scripts が無い package.json でも --run → cycles と config は消える', () => {
    const tree = makeTree();
    const names = makeCycleNames();
    writeFileSync(
      join(tree.root, 'package.json'),
      `${JSON.stringify({ name: 't', private: true }, null, 2)}\n`,
    );
    const result = run(INDEX, [RUN_FLAG], tree.root);
    expect(result.status).toBe(0);
    expect(result.output).toContain('no scripts to change');
    for (const name of names) {
      expect(existsSync(join(tree.root, CYCLES_LABEL, name))).toBe(false);
    }
    expect(existsSync(join(tree.root, CONFIG_AT))).toBe(false);
  });

  it('1鍵欠け → 欠けを作らず、ある鍵の flag だけ外す', () => {
    const tree = makeTree();
    const base = baseScripts();
    writePackageJson(tree.root, { test: `${base.test}${FLAG}` });
    const result = run(INDEX, [RUN_FLAG], tree.root);
    expect(result.status).toBe(0);
    const pkg = JSON.parse(readFileSync(join(tree.root, 'package.json'), 'utf8'));
    expect(pkg.scripts.test).toBe(base.test);
    expect('test:run' in pkg.scripts).toBe(false);
    expect('test:related' in pkg.scripts).toBe(false);
  });

  it('package.json が無い → 1行で exit 1、木は変わらない', () => {
    const root = tempDir();
    const cycleA = join(root, CYCLES_LABEL, '001-a');
    writeFile(join(cycleA, 'note.txt'));
    writeStarterConfig(root);
    const result = run(INDEX, [RUN_FLAG], root);
    expect(result.status).toBe(1);
    expect(result.output).toBe('');
    expect(result.errors.trim().split('\n')).toHaveLength(1);
    expect(existsSync(cycleA)).toBe(true);
  });

  it('package.json が JSON でない → 1行で exit 1、木は変わらない', () => {
    const tree = makeTree();
    writeFileSync(join(tree.root, 'package.json'), '{not json');
    const beforeCycles = existsSync(tree.cycleA);
    const beforeConfig = readFileSync(join(tree.root, CONFIG_AT), 'utf8');
    const result = run(INDEX, [RUN_FLAG], tree.root);
    expect(result.status).toBe(1);
    expect(result.output).toBe('');
    expect(result.errors.trim().split('\n')).toHaveLength(1);
    expect(existsSync(tree.cycleA)).toBe(beforeCycles);
    expect(readFileSync(join(tree.root, CONFIG_AT), 'utf8')).toBe(beforeConfig);
  });

  it('--only に値が無い → exit 1', () => {
    const tree = makeTree();
    const result = run(INDEX, [ONLY_FLAG], tree.root);
    expect(result.status).toBe(1);
    expect(existsSync(tree.cycleA)).toBe(true);
  });

  it('未知の引数 → exit 1', () => {
    const tree = makeTree();
    const unknown = '--bogus';
    const result = run(INDEX, [unknown], tree.root);
    expect(result.status).toBe(1);
    expect(result.output).toBe('');
    expect(result.errors.trim()).toBe(`unknown argument: ${unknown}`);
    expect(existsSync(tree.cycleA)).toBe(true);
  });
});
