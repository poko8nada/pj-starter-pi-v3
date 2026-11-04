/**
 * ja-check behavior, run as a child process.
 *
 * fake root holds temp files and a config.
 * WARN_WORD lives in warn, ERROR_WORD lives in error. Quoted alone is skipped.
 */

import { spawnSync } from 'node:child_process';
import { mkdirSync, realpathSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { tempDir } from '../../test/temp-dir.ts';

const SCRIPT = join(process.cwd(), 'scripts', 'checks', 'ja-check.mjs');

const WARN_WORD = '骨';
const ERROR_WORD = '雛形';

const HEADER_1 =
  'ja-check: Report to the owner. warn needs judgement (commit continues); error must be fixed (commit stops).';
const HEADER_2 = 'ja-check: Replacements are ideas; judge by context and content.';

interface JaCheckConfig {
  readonly error: Readonly<Record<string, string>>;
  readonly warn: Readonly<Record<string, string>>;
  readonly exception: readonly string[];
}

type TestConfig = JaCheckConfig;

interface RunOut {
  readonly status: number;
  readonly stdout: string;
  readonly stderr: string;
}

function run(root: string, args: readonly string[]): RunOut {
  const result = spawnSync('node', [SCRIPT, ...args], { encoding: 'utf8', cwd: root });
  return { status: result.status ?? -1, stdout: result.stdout ?? '', stderr: result.stderr ?? '' };
}

function fakeRoot(): string {
  return realpathSync(tempDir());
}

function writeFile(root: string, rel: string, content: string): string {
  const file = join(root, rel);
  mkdirSync(join(file, '..'), { recursive: true });
  writeFileSync(file, content);
  return file;
}

function writeConfig(root: string, value: unknown): void {
  writeFile(root, join('scripts', 'checks', 'ja-check.json'), JSON.stringify(value));
}

function validConfig(): TestConfig {
  return {
    error: { [ERROR_WORD]: 'replacement-error' },
    warn: { [WARN_WORD]: 'replacement-warn' },
    exception: [],
  };
}

describe('ja-check', () => {
  it('md内のwarn語 → warn行を出してexit 0', () => {
    const root = fakeRoot();
    writeConfig(root, validConfig());
    const file = writeFile(root, 'a.md', `${WARN_WORD}\n`);
    const out = run(root, [file]);
    expect(out.status).toBe(0);
    expect(out.stdout).toContain(HEADER_1);
    expect(out.stdout).toContain(HEADER_2);
    expect(out.stdout).toContain(`${file}:1: ${WARN_WORD}`);
    expect(out.stdout).toContain('[warn]');
    expect(out.stdout).toContain(`${WARN_WORD} → replacement-warn`);
    expect(out.stdout).toContain(`(…[${WARN_WORD}]…)`);
    expect(out.stdout).toContain('ja-check: 1 files, error 0, warn 1.');
    expect(out.stdout).not.toContain('ja-check: No findings.');
    expect(out.stdout).not.toContain('ja-check: No config.');
    const h1At = out.stdout.indexOf(HEADER_1);
    const h2At = out.stdout.indexOf(HEADER_2);
    expect(h1At).toBe(0);
    expect(h2At).toBeGreaterThan(h1At);
  });

  it('(empty) exceptionが空の配列でwarn語骨を含む行 → warn行を出してexit 0', () => {
    const root = fakeRoot();
    writeConfig(root, { ...validConfig(), exception: [] });
    const file = writeFile(root, 'a.md', `${WARN_WORD}\n`);
    const out = run(root, [file]);
    expect(out.status).toBe(0);
    expect(out.stdout).toContain(HEADER_1);
    expect(out.stdout).toContain(HEADER_2);
    expect(out.stdout).toContain(`${file}:1: ${WARN_WORD}`);
    expect(out.stdout).toContain('[warn]');
    expect(out.stdout).toContain('ja-check: 1 files, error 0, warn 1.');
  });
  it('md内のerror語 → error行を出してexit 1', () => {
    const root = fakeRoot();
    writeConfig(root, validConfig());
    const file = writeFile(root, 'a.md', `${ERROR_WORD}\n`);
    const out = run(root, [file]);
    expect(out.status).toBe(1);
    expect(out.stdout).toContain(HEADER_1);
    expect(out.stdout).toContain(HEADER_2);
    expect(out.stdout).toContain(`${file}:1: ${ERROR_WORD}`);
    expect(out.stdout).toContain('[error]');
    expect(out.stdout).toContain(`${ERROR_WORD} → replacement-error`);
    expect(out.stdout).toContain(`(…[${ERROR_WORD}]…)`);
    expect(out.stdout).toContain('ja-check: 1 files, error 1, warn 0.');
  });

  it('引数なし → サマリー行を出してexit 0', () => {
    const root = fakeRoot();
    writeConfig(root, validConfig());
    const out = run(root, []);
    expect(out.status).toBe(0);
    expect(out.stdout).toContain(HEADER_1);
    expect(out.stdout).toContain(HEADER_2);
    expect(out.stdout).toContain('ja-check: No findings.');
    expect(out.stdout).toContain('ja-check: 0 files, error 0, warn 0.');
  });

  it('読めないファイル → スキップしてサマリー行を出す', () => {
    const root = fakeRoot();
    writeConfig(root, validConfig());
    const missing = join(root, 'missing.md');
    const out = run(root, [missing]);
    expect(out.status).toBe(0);
    expect(out.stdout).toContain(HEADER_1);
    expect(out.stdout).toContain(HEADER_2);
    expect(out.stdout).toContain('ja-check: No findings.');
    expect(out.stdout).toContain('ja-check: 1 files, error 0, warn 0.');
  });

  it('cycles配下のerror語 → 報告する', () => {
    const root = fakeRoot();
    writeConfig(root, validConfig());
    const file = writeFile(root, join('cycles', '999-test', 'a.md'), `${ERROR_WORD}\n`);
    const out = run(root, [file]);
    expect(out.status).toBe(1);
    expect(out.stdout).toContain(HEADER_1);
    expect(out.stdout).toContain(HEADER_2);
    expect(out.stdout).toContain('[error]');
    expect(out.stdout).toContain(`(…[${ERROR_WORD}]…)`);
    expect(out.stdout).toContain('ja-check: 1 files, error 1, warn 0.');
  });

  it('ROADMAPの0.x.xセクション内のerror語 → 報告しない', () => {
    const root = fakeRoot();
    writeConfig(root, validConfig());
    const file = writeFile(root, 'ROADMAP.md', `## 1.x.x\nok\n## 0.x.x\n${ERROR_WORD}\n`);
    const out = run(root, [file]);
    expect(out.status).toBe(0);
    expect(out.stdout).toContain(HEADER_1);
    expect(out.stdout).toContain(HEADER_2);
    expect(out.stdout).not.toContain('[error]');
    expect(out.stdout).toContain('ja-check: No findings.');
    expect(out.stdout).toContain('ja-check: 1 files, error 0, warn 0.');
  });

  it('ROADMAPの1.x.xセクション内のerror語 → 報告する', () => {
    const root = fakeRoot();
    writeConfig(root, validConfig());
    const file = writeFile(root, 'ROADMAP.md', `## 1.x.x\n${ERROR_WORD}\n## 0.x.x\nok\n`);
    const out = run(root, [file]);
    expect(out.status).toBe(1);
    expect(out.stdout).toContain(HEADER_1);
    expect(out.stdout).toContain(HEADER_2);
    expect(out.stdout).toContain('[error]');
    expect(out.stdout).toContain(`(…[${ERROR_WORD}]…)`);
  });

  it('ja-check.json自体のerror語 → 報告しない', () => {
    const root = fakeRoot();
    writeConfig(root, validConfig());
    const self = join(root, 'scripts', 'checks', 'ja-check.json');
    const out = run(root, [self]);
    expect(out.status).toBe(0);
    expect(out.stdout).toContain(HEADER_1);
    expect(out.stdout).toContain(HEADER_2);
    expect(out.stdout).not.toContain('[error]');
    expect(out.stdout).toContain('ja-check: No findings.');
  });

  it('単独引用のerror語 → 報告しない', () => {
    const root = fakeRoot();
    writeConfig(root, validConfig());
    const quoted = `'${ERROR_WORD}'`;
    const file = writeFile(root, 'a.md', `${quoted}\n`);
    const out = run(root, [file]);
    expect(out.status).toBe(0);
    expect(out.stdout).toContain(HEADER_1);
    expect(out.stdout).not.toContain('[error]');
    expect(out.stdout).toContain('ja-check: No findings.');
  });

  it('余分な文字付きの引用語 → 報告する', () => {
    const root = fakeRoot();
    writeConfig(root, validConfig());
    const content = `it('${WARN_WORD}extra')\n`;
    const file = writeFile(root, 'a.md', content);
    const out = run(root, [file]);
    expect(out.status).toBe(0);
    expect(out.stdout).toContain(HEADER_1);
    expect(out.stdout).toContain(HEADER_2);
    expect(out.stdout).toContain('[warn]');
    expect(out.stdout).toContain(`(…it('[${WARN_WORD}]extra')…)`);
    expect(out.stdout).toContain('ja-check: 1 files, error 0, warn 1.');
  });

  it('前後が長い行 → 前後10文字に切り詰めて報告する', () => {
    const root = fakeRoot();
    writeConfig(root, validConfig());
    const prefix = 'x'.repeat(15);
    const suffix = 'y'.repeat(15);
    const file = writeFile(root, 'a.md', `${prefix}${WARN_WORD}${suffix}\n`);
    const out = run(root, [file]);
    expect(out.status).toBe(0);
    expect(out.stdout).toContain(HEADER_1);
    expect(out.stdout).toContain(HEADER_2);
    expect(out.stdout).toContain('[warn]');
    expect(out.stdout).toContain(`(…${'x'.repeat(10)}[${WARN_WORD}]${'y'.repeat(10)}…)`);
    expect(out.stdout).not.toContain(prefix);
    expect(out.stdout).not.toContain(suffix);
    expect(out.stdout).toContain('ja-check: 1 files, error 0, warn 1.');
  });

  it('バッククォート単独のコードコメント → 報告しない', () => {
    const root = fakeRoot();
    writeConfig(root, validConfig());
    const quoted = `\`${ERROR_WORD}\``;
    const file = writeFile(root, 'a.ts', `// ${quoted}\n`);
    const out = run(root, [file]);
    expect(out.status).toBe(0);
    expect(out.stdout).toContain(HEADER_1);
    expect(out.stdout).not.toContain('[error]');
    expect(out.stdout).toContain('ja-check: No findings.');
  });

  it('ダブルクォート単独のerror語 → 報告しない', () => {
    const root = fakeRoot();
    writeConfig(root, validConfig());
    const quoted = `"${ERROR_WORD}"`;
    const file = writeFile(root, 'a.md', `${quoted}\n`);
    const out = run(root, [file]);
    expect(out.status).toBe(0);
    expect(out.stdout).toContain(HEADER_1);
    expect(out.stdout).not.toContain('[error]');
    expect(out.stdout).toContain('ja-check: No findings.');
  });
});

describe('ja-check', () => {
  it('該当なしのmd → No findings行を出してexit 0', () => {
    const root = fakeRoot();
    writeConfig(root, validConfig());
    const file = writeFile(root, 'a.md', 'ok\n');
    const out = run(root, [file]);
    expect(out.status).toBe(0);
    expect(out.stdout).toContain(HEADER_1);
    expect(out.stdout).toContain(HEADER_2);
    expect(out.stdout).toContain('ja-check: No findings.');
    expect(out.stdout).toContain('ja-check: 1 files, error 0, warn 0.');
    expect(out.stdout).not.toContain('[warn]');
    expect(out.stdout).not.toContain('[error]');
    expect(out.stdout).not.toContain('ja-check: No config.');
  });

  it('設定なし → No config行をサマリーより前に出してexit 0', () => {
    const root = fakeRoot();
    const file = writeFile(root, 'a.md', `${ERROR_WORD}\n`);
    const out = run(root, [file]);
    expect(out.status).toBe(0);
    expect(out.stdout).toContain(HEADER_1);
    expect(out.stdout).toContain(HEADER_2);
    expect(out.stdout).toContain('ja-check: No config.');
    expect(out.stdout).toContain('ja-check: 1 files, error 0, warn 0.');
    expect(out.stdout).not.toContain('ja-check: No findings.');
    expect(out.stdout).not.toContain('設定なし');
    const noConfigAt = out.stdout.indexOf('ja-check: No config.');
    const summaryAt = out.stdout.indexOf('ja-check: 1 files, error 0, warn 0.');
    expect(noConfigAt).toBeGreaterThanOrEqual(0);
    expect(summaryAt).toBeGreaterThan(noConfigAt);
  });

  it('壊れた設定 → exit 1', () => {
    const root = fakeRoot();
    writeFile(root, join('scripts', 'checks', 'ja-check.json'), '{not json');
    const file = writeFile(root, 'a.md', 'ok\n');
    const out = run(root, [file]);
    expect(out.status).toBe(1);
    expect(out.stdout).toContain(HEADER_1);
    expect(out.stdout).toContain(HEADER_2);
    expect(out.stderr).toContain('is not valid JSON');
    expect(out.stdout).not.toContain('files, error');
    expect(out.stdout).not.toContain('ja-check: No findings.');
  });

  it('キーや値の型が誤った設定 → exit 1', () => {
    const root = fakeRoot();
    writeFile(
      root,
      join('scripts', 'checks', 'ja-check.json'),
      JSON.stringify({ error: 'x', warn: {} }),
    );
    const file = writeFile(root, 'a.md', 'ok\n');
    const out = run(root, [file]);
    expect(out.status).toBe(1);
    expect(out.stdout).toContain(HEADER_1);
    expect(out.stdout).toContain(HEADER_2);
    expect(out.stderr).toContain('is not valid JSON');
    expect(out.stdout).not.toContain('files, error');
    expect(out.stdout).not.toContain('ja-check: No findings.');
    const root2 = fakeRoot();
    writeFile(
      root2,
      join('scripts', 'checks', 'ja-check.json'),
      JSON.stringify({ error: { a: 1 }, warn: {}, extra: {} }),
    );
    const file2 = writeFile(root2, 'a.md', 'ok\n');
    const out2 = run(root2, [file2]);
    expect(out2.status).toBe(1);
    expect(out2.stdout).toContain(HEADER_1);
    expect(out2.stdout).toContain(HEADER_2);
    expect(out2.stderr).toContain('is not valid JSON');
    expect(out2.stdout).not.toContain('files, error');
    expect(out2.stdout).not.toContain('ja-check: No findings.');
  });

  it('(error) exceptionのない設定 → headerの2行を出してexit 1', () => {
    const root = fakeRoot();
    writeConfig(root, {
      error: { [ERROR_WORD]: 'replacement-error' },
      warn: { [WARN_WORD]: 'replacement-warn' },
    });
    const file = writeFile(root, 'a.md', 'ok\n');
    const out = run(root, [file]);
    expect(out.status).toBe(1);
    expect(out.stdout).toContain(HEADER_1);
    expect(out.stdout).toContain(HEADER_2);
  });
  it('頂点が非レコードの設定 → 冒頭2行を出してexit 1', () => {
    for (const bad of [null, [], 'x'] as const) {
      const root = fakeRoot();
      writeFile(root, join('scripts', 'checks', 'ja-check.json'), JSON.stringify(bad));
      const file = writeFile(root, 'a.md', 'ok\n');
      const out = run(root, [file]);
      expect(out.status).toBe(1);
      expect(out.stdout).toContain(HEADER_1);
      expect(out.stdout).toContain(HEADER_2);
    }
  });
});
