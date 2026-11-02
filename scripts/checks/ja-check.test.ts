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

function validConfig(): Record<string, Record<string, string>> {
  return {
    error: { [ERROR_WORD]: 'replacement-error' },
    warn: { [WARN_WORD]: 'replacement-warn' },
  };
}

describe('ja-check', () => {
  it('md内のwarn語 → warn行を出してexit 0', () => {
    const root = fakeRoot();
    writeConfig(root, validConfig());
    const file = writeFile(root, 'a.md', `${WARN_WORD}\n`);
    const out = run(root, [file]);
    expect(out.status).toBe(0);
    expect(out.stdout).toContain(`${file}:1: ${WARN_WORD}`);
    expect(out.stdout).toContain('[warn]');
    expect(out.stdout).toContain(`${WARN_WORD} → replacement-warn`);
    expect(out.stdout).toContain('ja-check: 1 ファイル、error 0 件、warn 1 件');
  });

  it('md内のerror語 → error行を出してexit 1', () => {
    const root = fakeRoot();
    writeConfig(root, validConfig());
    const file = writeFile(root, 'a.md', `${ERROR_WORD}\n`);
    const out = run(root, [file]);
    expect(out.status).toBe(1);
    expect(out.stdout).toContain(`${file}:1: ${ERROR_WORD}`);
    expect(out.stdout).toContain('[error]');
    expect(out.stdout).toContain(`${ERROR_WORD} → replacement-error`);
    expect(out.stdout).toContain('ja-check: 1 ファイル、error 1 件、warn 0 件');
  });

  it('引数なし → サマリー行を出してexit 0', () => {
    const root = fakeRoot();
    writeConfig(root, validConfig());
    const out = run(root, []);
    expect(out.status).toBe(0);
    expect(out.stdout).toContain('ja-check: 0 ファイル、error 0 件、warn 0 件');
  });

  it('読めないファイル → スキップしてサマリー行を出す', () => {
    const root = fakeRoot();
    writeConfig(root, validConfig());
    const missing = join(root, 'missing.md');
    const out = run(root, [missing]);
    expect(out.status).toBe(0);
    expect(out.stdout).toContain('ja-check: 1 ファイル、error 0 件、warn 0 件');
  });

  it('cycles配下のerror語 → 報告する', () => {
    const root = fakeRoot();
    writeConfig(root, validConfig());
    const file = writeFile(root, join('cycles', '999-test', 'a.md'), `${ERROR_WORD}\n`);
    const out = run(root, [file]);
    expect(out.status).toBe(1);
    expect(out.stdout).toContain('[error]');
  });

  it('ROADMAPの0.x.x節内のerror語 → 報告しない', () => {
    const root = fakeRoot();
    writeConfig(root, validConfig());
    const file = writeFile(root, 'ROADMAP.md', `## 1.x.x\nok\n## 0.x.x\n${ERROR_WORD}\n`);
    const out = run(root, [file]);
    expect(out.status).toBe(0);
    expect(out.stdout).not.toContain('[error]');
    expect(out.stdout).toContain('ja-check:');
  });

  it('ROADMAPの1.x.x節内のerror語 → 報告する', () => {
    const root = fakeRoot();
    writeConfig(root, validConfig());
    const file = writeFile(root, 'ROADMAP.md', `## 1.x.x\n${ERROR_WORD}\n## 0.x.x\nok\n`);
    const out = run(root, [file]);
    expect(out.status).toBe(1);
    expect(out.stdout).toContain('[error]');
  });

  it('ja-check.json自体のerror語 → 報告しない', () => {
    const root = fakeRoot();
    writeConfig(root, validConfig());
    const self = join(root, 'scripts', 'checks', 'ja-check.json');
    const out = run(root, [self]);
    expect(out.status).toBe(0);
    expect(out.stdout).not.toContain('[error]');
  });

  it('単独引用のerror語 → 報告しない', () => {
    const root = fakeRoot();
    writeConfig(root, validConfig());
    const quoted = `'${ERROR_WORD}'`;
    const file = writeFile(root, 'a.md', `${quoted}\n`);
    const out = run(root, [file]);
    expect(out.status).toBe(0);
    expect(out.stdout).not.toContain('[error]');
  });

  it('余分な文字付きの引用語 → 報告する', () => {
    const root = fakeRoot();
    writeConfig(root, validConfig());
    const content = `it('${WARN_WORD}extra')\n`;
    const file = writeFile(root, 'a.md', content);
    const out = run(root, [file]);
    expect(out.status).toBe(0);
    expect(out.stdout).toContain('[warn]');
  });

  it('バッククォート単独のコードコメント → 報告しない', () => {
    const root = fakeRoot();
    writeConfig(root, validConfig());
    const quoted = `\`${ERROR_WORD}\``;
    const file = writeFile(root, 'a.ts', `// ${quoted}\n`);
    const out = run(root, [file]);
    expect(out.status).toBe(0);
    expect(out.stdout).not.toContain('[error]');
  });

  it('ダブルクォート単独のerror語 → 報告しない', () => {
    const root = fakeRoot();
    writeConfig(root, validConfig());
    const quoted = `"${ERROR_WORD}"`;
    const file = writeFile(root, 'a.md', `${quoted}\n`);
    const out = run(root, [file]);
    expect(out.status).toBe(0);
    expect(out.stdout).not.toContain('[error]');
  });

  it('設定なし → 設定なし行をサマリーより前に出してexit 0', () => {
    const root = fakeRoot();
    const file = writeFile(root, 'a.md', `${ERROR_WORD}\n`);
    const out = run(root, [file]);
    expect(out.status).toBe(0);
    expect(out.stdout).toContain('設定なし');
    expect(out.stdout).toContain('ja-check:');
    const noSettingAt = out.stdout.indexOf('設定なし');
    const summaryAt = out.stdout.indexOf('ja-check:');
    expect(noSettingAt).toBeGreaterThanOrEqual(0);
    expect(summaryAt).toBeGreaterThan(noSettingAt);
  });

  it('壊れた設定 → exit 1', () => {
    const root = fakeRoot();
    writeFile(root, join('scripts', 'checks', 'ja-check.json'), '{not json');
    const file = writeFile(root, 'a.md', 'ok\n');
    const out = run(root, [file]);
    expect(out.status).toBe(1);
  });

  it('キーや値の型が誤った設定 → exit 1', () => {
    const root = fakeRoot();
    writeFile(
      root,
      join('scripts', 'checks', 'ja-check.json'),
      JSON.stringify({ error: 'x', warn: {} }),
    );
    const file = writeFile(root, 'a.md', 'ok\n');
    expect(run(root, [file]).status).toBe(1);
    const root2 = fakeRoot();
    writeFile(
      root2,
      join('scripts', 'checks', 'ja-check.json'),
      JSON.stringify({ error: { a: 1 }, warn: {}, extra: {} }),
    );
    const file2 = writeFile(root2, 'a.md', 'ok\n');
    expect(run(root2, [file2]).status).toBe(1);
  });
});
