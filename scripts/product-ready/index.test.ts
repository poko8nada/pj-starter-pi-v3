import { spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, realpathSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  ONLY_FLAG,
  RUN_FLAG,
  configLine,
  countLine,
  testExcludeLine,
} from '../../test/scripts.fixture.ts';
import { tempDir } from '../../test/temp-dir.ts';

// 入口は子プロセスで直に呼ぶ。`.mjs` を import すると底の 1 行がそのまま走るので、ここでは読まない。

const INDEX = join(process.cwd(), 'scripts', 'product-ready', 'index.mjs');
const RULES = join(process.cwd(), 'rules');
const VITEST_CONFIG_AT = 'vitest.config.ts';
const TEST_EXCLUDE_AT = join('scripts', 'product-ready', 'test-exclude.json');
const CYCLES_LABEL = 'cycles';
const REPLACE_LABEL = 'replace';
const RULE_FILES = ['roadmap.md', 'definition.format.md', 'readme.format.md'];
const TEST_EXCLUDE_ENTRIES: readonly string[] = [
  'scripts/harness',
  '.pi',
  'scripts/checks',
  'scripts/product-ready',
  'test/temp-dir.ts',
  'test/pi.fixture.ts',
  'test/scripts.fixture.ts',
];

// テンプレートは実物の `rules/` から写す。形が変わったらこのテストが落ちる。
const SKELETON_WITHOUT_PRODUCT = [
  '# Definition format',
  '',
  '## Skeleton',
  '',
  '```md',
  '# DEFINITION',
  '',
  '### Who',
  '',
  '- <name>: x',
  '```',
  '',
].join('\n');

function writeFile(path: string): void {
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, 'x\n');
}

function writeText(root: string, rel: string, text: string): void {
  const path = join(root, rel);
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, text);
}

function writePackageJson(root: string, scripts: Record<string, string>): void {
  const file = join(root, 'package.json');
  mkdirSync(dirname(file), { recursive: true });
  writeFileSync(file, `${JSON.stringify({ name: 't', private: true, scripts }, null, 2)}\n`);
}

function baseScripts(): Record<string, string> {
  return {
    test: 'vitest',
    'test:run': 'vitest run',
    'test:related': 'vitest related --run',
  };
}

function makeCycleNames(): readonly string[] {
  return ['001-a', '002-b'];
}

function writeVitestConfig(root: string): void {
  const file = join(root, VITEST_CONFIG_AT);
  mkdirSync(dirname(file), { recursive: true });
  writeFileSync(
    file,
    [
      "import { configDefaults, defineConfig } from 'vitest/config';",
      '',
      "const verbose = process.env.TEST_VERBOSE === '1';",
      '',
      "type Reporters = ['verbose'] | [['default', { summary: boolean }]];",
      '',
      'export default defineConfig({',
      '  test: {',
      '    exclude: [',
      '      ...configDefaults.exclude,',
      '      // product-ready: test-exclude start',
      '      // product-ready: test-exclude end',
      '    ],',
      "    reporters: (verbose ? ['verbose'] : [['default', { summary: false }]]) as Reporters,",
      '    passWithNoTests: true,',
      '  },',
      '});',
      '',
    ].join('\n'),
  );
}

function writeTestExclude(root: string, entries: readonly string[] = TEST_EXCLUDE_ENTRIES): void {
  const file = join(root, TEST_EXCLUDE_AT);
  mkdirSync(dirname(file), { recursive: true });
  writeFileSync(file, `${JSON.stringify(entries, null, 2)}\n`);
}

function writeRules(root: string): void {
  for (const name of RULE_FILES) {
    writeText(root, join('rules', name), readFileSync(join(RULES, name), 'utf8'));
  }
}

const SOURCE_HEADINGS: readonly string[] = ['Roadmap & Cycle', 'Agent', 'Checks', 'Handover', 'CI'];

const SOURCE_PARAGRAPHS_EN: readonly string[] = [
  'Direction stays traceable.',
  'Work runs through a harness.',
  'Gates stay consistent.',
  'Moves stay explicit.',
  'Automation stays pending.',
];

const SOURCE_PARAGRAPHS_JA: readonly string[] = [
  '方向を記録に残す。',
  '作業を harness で進める。',
  '検査をそろえる。',
  '移動を明確にする。',
  '自動化を後で整える。',
];

function sourceReadme(paragraphs: readonly string[]): string {
  const body = SOURCE_HEADINGS.map(
    (heading, index) => `### ${heading}\n\n${paragraphs[index]}\n`,
  ).join('\n');
  return `# old\n\n## What is in it\n\n${body}`;
}

function writeReplaceTargets(root: string): void {
  writeText(
    root,
    'ROADMAP.md',
    '# Roadmap\n\n## 1.x.x\n\n| No | Ver | cycles | priority | title |\n| --- | --- | --- | --- | --- |\n| 001 | 1.0.0 | | high | old |\n',
  );
  writeText(
    root,
    'DEFINITION.md',
    '# DEFINITION\n\n## Product\n\nold name\n\n### What\n\nold what\n\n### Who\n\n- owner: x\n\n### Users can do\n\n- reader: x\n\n## Stack\n\n| a | b | c |\n',
  );
  writeText(root, 'README.md', sourceReadme(SOURCE_PARAGRAPHS_EN));
  writeText(root, 'README.ja.md', sourceReadme(SOURCE_PARAGRAPHS_JA));
  writeRules(root);
}

function readTargets(root: string): readonly string[] {
  return ['ROADMAP.md', 'DEFINITION.md', 'README.md', 'README.ja.md'].map((name) =>
    readFileSync(join(root, name), 'utf8'),
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
  writePackageJson(root, baseScripts());
  writeVitestConfig(root);
  writeTestExclude(root);
  writeReplaceTargets(root);
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
  it('happy: --run → 目印の間に7件が入り、JSON が残る', () => {
    const tree = makeTree();
    const names = makeCycleNames();
    const result = run(INDEX, [RUN_FLAG], tree.root);
    expect(result.status).toBe(0);
    for (const name of names) {
      expect(existsSync(join(tree.root, CYCLES_LABEL, name))).toBe(false);
    }
    const text = readFileSync(join(tree.root, VITEST_CONFIG_AT), 'utf8');
    for (const entry of TEST_EXCLUDE_ENTRIES) {
      expect(text).toContain(`'${entry}',`);
    }
    const kept = JSON.parse(readFileSync(join(tree.root, TEST_EXCLUDE_AT), 'utf8'));
    expect(kept).toEqual([...TEST_EXCLUDE_ENTRIES]);
  });

  it('error: JSON が壊れている → 1行で exit 1、ツリーは変わらない', () => {
    const tree = makeTree();
    const beforeConfig = readFileSync(join(tree.root, VITEST_CONFIG_AT), 'utf8');
    const beforeTargets = readTargets(tree.root);
    writeFileSync(join(tree.root, TEST_EXCLUDE_AT), '{not json');
    const result = run(INDEX, [RUN_FLAG], tree.root);
    expect(result.status).toBe(1);
    expect(result.output).toBe('');
    expect(result.errors.trim().split('\n')).toHaveLength(1);
    expect(result.errors).toContain('the test exclude is not valid:');
    expect(existsSync(tree.cycleA)).toBe(true);
    expect(readFileSync(join(tree.root, VITEST_CONFIG_AT), 'utf8')).toBe(beforeConfig);
    expect(readTargets(tree.root)).toEqual(beforeTargets);
  });

  it('--run → ROADMAP.md が rules/roadmap.md のテンプレートに置き換わる', () => {
    const tree = makeTree();
    const result = run(INDEX, [RUN_FLAG], tree.root);
    expect(result.status).toBe(0);
    const roadmap = readFileSync(join(tree.root, 'ROADMAP.md'), 'utf8');
    expect(roadmap).not.toContain('old');
    expect(roadmap).toContain('## 0.x.x');
    expect(roadmap).toContain('<何をするか。1 行>');
  });

  it('--run → DEFINITION.md の Product と What だけが入れ替わる', () => {
    const tree = makeTree();
    const result = run(INDEX, [RUN_FLAG], tree.root);
    expect(result.status).toBe(0);
    const definition = readFileSync(join(tree.root, 'DEFINITION.md'), 'utf8');
    expect(definition).not.toContain('old name');
    expect(definition).not.toContain('old what');
    expect(definition).toContain('<プロダクトの名前>');
    expect(definition).toContain('<何であるか、何をするか。1 文>');
    expect(definition).toContain('- owner: x');
    expect(definition).toContain('## Stack');
    expect(definition).toContain('| a | b | c |');
    expect(definition).toContain('- reader: x');
  });

  it('--run → README.md と README.ja.md がそれぞれのテンプレートに置き換わる', () => {
    const tree = makeTree();
    const result = run(INDEX, [RUN_FLAG], tree.root);
    expect(result.status).toBe(0);
    const readme = readFileSync(join(tree.root, 'README.md'), 'utf8');
    const readmeJa = readFileSync(join(tree.root, 'README.ja.md'), 'utf8');
    expect(readme).toContain('## What is in it');
    expect(readme).not.toContain('old');
    expect(readmeJa).toContain('## What is in it');
    expect(readmeJa).not.toContain('old');
    expect(readmeJa).not.toContain('## 入っているもの');
  });

  it('--run → README.md と README.ja.md の ## What is in it の下に ### Product と ### Default がこの順で並ぶ', () => {
    const tree = makeTree();
    const result = run(INDEX, [RUN_FLAG], tree.root);
    expect(result.status).toBe(0);
    for (const name of ['README.md', 'README.ja.md']) {
      const text = readFileSync(join(tree.root, name), 'utf8');
      const what = text.indexOf('## What is in it');
      const product = text.indexOf('### Product');
      const fallback = text.indexOf('### Default');
      expect(what).toBeGreaterThanOrEqual(0);
      expect(product).toBeGreaterThan(what);
      expect(fallback).toBeGreaterThan(product);
    }
  });

  it('--run なし → 表示だけで、ツリーは変わらない', () => {
    const tree = makeTree();
    const names = makeCycleNames();
    const beforePkg = readFileSync(join(tree.root, 'package.json'), 'utf8');
    const beforeConfig = readFileSync(join(tree.root, VITEST_CONFIG_AT), 'utf8');
    const beforeExclude = readFileSync(join(tree.root, TEST_EXCLUDE_AT), 'utf8');
    const beforeRoadmap = readFileSync(join(tree.root, 'ROADMAP.md'), 'utf8');
    const result = run(INDEX, [], tree.root);
    expect(result.status).toBe(0);
    const realRoot = realpathSync(tree.root);
    expect(result.output).toContain(testExcludeLine(join(realRoot, TEST_EXCLUDE_AT)));
    expect(result.output).toContain(configLine(join(realRoot, VITEST_CONFIG_AT)));
    expect(result.output).toContain(countLine(CYCLES_LABEL, names.length));
    expect(result.output).toContain(countLine(REPLACE_LABEL, 4));
    expect(existsSync(tree.cycleA)).toBe(true);
    expect(readFileSync(join(tree.root, 'package.json'), 'utf8')).toBe(beforePkg);
    expect(readFileSync(join(tree.root, VITEST_CONFIG_AT), 'utf8')).toBe(beforeConfig);
    expect(readFileSync(join(tree.root, TEST_EXCLUDE_AT), 'utf8')).toBe(beforeExclude);
    expect(readFileSync(join(tree.root, 'ROADMAP.md'), 'utf8')).toBe(beforeRoadmap);
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
    expect(readFileSync(join(tree.root, 'ROADMAP.md'), 'utf8')).toContain('old');
  });

  it('(error) 一度 --run した後の同じツリーでもう一度 --run する → 終了コード 1、エラー 1 行のみ、README は変わらない', () => {
    const tree = makeTree();
    expect(run(INDEX, [RUN_FLAG], tree.root).status).toBe(0);
    const before = readTargets(tree.root);
    const second = run(INDEX, [RUN_FLAG], tree.root);
    expect(second.status).toBe(1);
    expect(second.errors).toContain('no paragraph under');
    expect(second.errors.trim().split('\n')).toHaveLength(1);
    expect(second.output).not.toContain('headings:');
    expect(readTargets(tree.root)).toEqual(before);
  });

  it('(happy) 1 回目の --run で、表示の `headings:` 行と `### Default` の下の箇条書きの見出しが同じ順で並ぶ', () => {
    const tree = makeTree();
    const result = run(INDEX, [RUN_FLAG], tree.root);
    expect(result.status).toBe(0);
    const line = result.output.split('\n').find((entry) => entry.startsWith('headings: '));
    expect(line).toBeDefined();
    if (line === undefined) return;
    const shown = line.slice('headings: '.length).split(', ');
    const text = readFileSync(join(tree.root, 'README.md'), 'utf8');
    const defaultAt = text.indexOf('### Default');
    expect(defaultAt).toBeGreaterThanOrEqual(0);
    const bullets = text
      .slice(defaultAt)
      .split('\n')
      .filter((entry) => entry.startsWith('- '))
      .map((entry) => entry.slice(2).split(': ')[0]);
    expect(shown).toEqual(bullets);
  });

  it('(empty) `--only cycles` の dry-run → 差し替えの仕事が無いので`headings:` 行が出ない', () => {
    const tree = makeTree();
    const result = run(INDEX, [ONLY_FLAG, CYCLES_LABEL], tree.root);
    expect(result.status).toBe(0);
    expect(result.output).not.toContain('headings:');
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

  it('差し替える対象が 1 つも無い → 何も書かずに exit 0 で終わる', () => {
    const root = tempDir();
    writePackageJson(root, baseScripts());
    writeVitestConfig(root);
    writeTestExclude(root);
    const result = run(INDEX, [RUN_FLAG], root);
    expect(result.status).toBe(0);
    expect(result.output).toContain('no replace to replace');
  });

  it('テンプレートのファイルが無い → 1行のエラーで exit 1、ツリーは変わらない', () => {
    const tree = makeTree();
    const before = readTargets(tree.root);
    rmSync(join(tree.root, 'rules/roadmap.md'));
    const result = run(INDEX, [RUN_FLAG], tree.root);
    expect(result.status).toBe(1);
    expect(result.errors.trim().split('\n')).toHaveLength(1);
    expect(existsSync(tree.cycleA)).toBe(true);
    expect(readTargets(tree.root)).toEqual(before);
  });

  it('テンプレートのブロックに ## Product が無い → 1行のエラーで exit 1、ツリーは変わらない', () => {
    const tree = makeTree();
    const before = readTargets(tree.root);
    writeText(tree.root, 'rules/definition.format.md', SKELETON_WITHOUT_PRODUCT);
    const result = run(INDEX, [RUN_FLAG], tree.root);
    expect(result.status).toBe(1);
    expect(result.errors.trim().split('\n')).toHaveLength(1);
    expect(readTargets(tree.root)).toEqual(before);
  });
});
describe('product-ready defaults', () => {
  it('--run → README.md の ### Default の下に - <見出し名>: <説明> の5行が並ぶ', () => {
    const tree = makeTree();
    const result = run(INDEX, [RUN_FLAG], tree.root);
    expect(result.status).toBe(0);
    const lines = readFileSync(join(tree.root, 'README.md'), 'utf8').split('\n');
    const fallback = lines.findIndex((line) => line === '### Default');
    expect(fallback).toBeGreaterThanOrEqual(0);
    const rest = lines.slice(fallback + 1);
    const next = rest.findIndex((line) => line.startsWith('## '));
    const section = next === -1 ? rest : rest.slice(0, next);
    expect(section.filter((line) => line.startsWith('- '))).toEqual(
      SOURCE_HEADINGS.map((heading, index) => `- ${heading}: ${SOURCE_PARAGRAPHS_EN[index]}`),
    );
  });

  it('--run → 日本語の README.ja.md でも --run → 同じ5行が並び、見出し名は英語で説明文は日本語', () => {
    const tree = makeTree();
    const result = run(INDEX, [RUN_FLAG], tree.root);
    expect(result.status).toBe(0);
    const lines = readFileSync(join(tree.root, 'README.ja.md'), 'utf8').split('\n');
    const fallback = lines.findIndex((line) => line === '### Default');
    expect(fallback).toBeGreaterThanOrEqual(0);
    const rest = lines.slice(fallback + 1);
    const next = rest.findIndex((line) => line.startsWith('## '));
    const section = next === -1 ? rest : rest.slice(0, next);
    expect(section.filter((line) => line.startsWith('- '))).toEqual(
      SOURCE_HEADINGS.map((heading, index) => `- ${heading}: ${SOURCE_PARAGRAPHS_JA[index]}`),
    );
  });

  it('## What is in it を持たない README で --run → 1行のエラーで exit 1、ツリーは変わらない', () => {
    const tree = makeTree();
    const before = readTargets(tree.root);
    writeText(tree.root, 'README.md', '# old\n\n## Getting started\n\nx\n');
    const result = run(INDEX, [RUN_FLAG], tree.root);
    expect(result.status).toBe(1);
    expect(result.output).toBe('');
    expect(result.errors.trim().split('\n')).toHaveLength(1);
    expect(existsSync(tree.cycleA)).toBe(true);
    expect(readTargets(tree.root)).toEqual([
      before[0],
      before[1],
      '# old\n\n## Getting started\n\nx\n',
      before[3],
    ]);
  });

  it('### の直後に段落がない README で --run → 1行のエラーで exit 1、ツリーは変わらない', () => {
    const tree = makeTree();
    const before = readTargets(tree.root);
    const broken = [
      '# old',
      '',
      '## What is in it',
      '',
      '### Roadmap & Cycle',
      '',
      'Direction stays traceable.',
      '',
      '### Agent',
      '',
      '### Checks',
      '',
      'Checks paragraph.',
      '',
      '### Handover',
      '',
      'Handover paragraph.',
      '',
      '### CI',
      '',
      'CI paragraph.',
      '',
    ].join('\n');
    writeText(tree.root, 'README.md', broken);
    const result = run(INDEX, [RUN_FLAG], tree.root);
    expect(result.status).toBe(1);
    expect(result.output).toBe('');
    expect(result.errors.trim().split('\n')).toHaveLength(1);
    expect(existsSync(tree.cycleA)).toBe(true);
    expect(readTargets(tree.root)).toEqual([before[0], before[1], broken, before[3]]);
  });

  it('### が1つだけの README で --run → 1行のエラーで exit 1、ツリーは変わらない', () => {
    const tree = makeTree();
    const before = readTargets(tree.root);
    const broken = [
      '# old',
      '',
      '## What is in it',
      '',
      '### Roadmap & Cycle',
      '',
      'Direction stays traceable.',
      '',
    ].join('\n');
    writeText(tree.root, 'README.md', broken);
    const result = run(INDEX, [RUN_FLAG], tree.root);
    expect(result.status).toBe(1);
    expect(result.errors.trim().split('\n')).toHaveLength(1);
    expect(existsSync(tree.cycleA)).toBe(true);
    expect(readTargets(tree.root)).toEqual([before[0], before[1], broken, before[3]]);
  });

  it('--run なしの表示 → headings: <見出しの並び> の行が出る', () => {
    const tree = makeTree();
    const result = run(INDEX, [], tree.root);
    expect(result.status).toBe(0);
    expect(result.output).toContain(`headings: ${SOURCE_HEADINGS.join(', ')}`);
  });
});
