/**
 * ja-check behavior, run as a child process.
 *
 * fake root holds temp files and a config. Real config is read for shape checks.
 * WARN_WORD lives in warn, ERROR_WORD lives in error. Quoted alone is skipped.
 */

import { spawnSync } from 'node:child_process';
import { mkdirSync, readFileSync, realpathSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { tempDir } from '../../test/temp-dir.ts';

const SCRIPT = join(process.cwd(), 'scripts', 'checks', 'ja-check.mjs');
const REAL_CONFIG = join(process.cwd(), 'scripts', 'checks', 'ja-check.json');

const WARN_WORD = '骨';
const ERROR_WORD = '雛形';
const NONE_WORDS = ['道具', '観点', '写し', '偽物', '印'];

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

function isUnknownRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isStringRecord(value: unknown): value is Record<string, string> {
  if (!isUnknownRecord(value)) {
    return false;
  }
  return Object.values(value).every((entry) => typeof entry === 'string');
}

function isJaConfig(
  value: unknown,
): value is { error: Record<string, string>; warn: Record<string, string> } {
  if (!isUnknownRecord(value)) {
    return false;
  }
  return isStringRecord(value.error) && isStringRecord(value.warn);
}

describe('ja-check', () => {
  it('warn word in md prints warn line and exits 0', () => {
    const root = fakeRoot();
    writeConfig(root, validConfig());
    const file = writeFile(root, 'a.md', `${WARN_WORD}\n`);
    const out = run(root, [file]);
    expect(out.status).toBe(0);
    expect(out.stdout).toContain(`${file}:1: ${WARN_WORD}`);
    expect(out.stdout).toContain('[warn]');
    expect(out.stdout).toContain('ja-check: 1');
  });

  it('error word in md prints error line and exits 1', () => {
    const root = fakeRoot();
    writeConfig(root, validConfig());
    const file = writeFile(root, 'a.md', `${ERROR_WORD}\n`);
    const out = run(root, [file]);
    expect(out.status).toBe(1);
    expect(out.stdout).toContain(`${file}:1: ${ERROR_WORD}`);
    expect(out.stdout).toContain('[error]');
  });

  it('no args exits 0 with summary line', () => {
    const root = fakeRoot();
    writeConfig(root, validConfig());
    const out = run(root, []);
    expect(out.status).toBe(0);
    expect(out.stdout).toContain('ja-check: 0');
  });

  it('unreadable file is skipped with summary line', () => {
    const root = fakeRoot();
    writeConfig(root, validConfig());
    const missing = join(root, 'missing.md');
    const out = run(root, [missing]);
    expect(out.status).toBe(0);
    expect(out.stdout).toContain('ja-check: 1');
  });

  it('cycles file with error word is reported', () => {
    const root = fakeRoot();
    writeConfig(root, validConfig());
    const file = writeFile(root, join('cycles', '999-test', 'a.md'), `${ERROR_WORD}\n`);
    const out = run(root, [file]);
    expect(out.status).toBe(1);
    expect(out.stdout).toContain('[error]');
  });

  it('ROADMAP 0.x.x section with error word is not reported', () => {
    const root = fakeRoot();
    writeConfig(root, validConfig());
    const file = writeFile(root, 'ROADMAP.md', `## 1.x.x\nok\n## 0.x.x\n${ERROR_WORD}\n`);
    const out = run(root, [file]);
    expect(out.status).toBe(0);
    expect(out.stdout).not.toContain('[error]');
    expect(out.stdout).toContain('ja-check:');
  });

  it('ROADMAP 1.x.x section with error word is reported', () => {
    const root = fakeRoot();
    writeConfig(root, validConfig());
    const file = writeFile(root, 'ROADMAP.md', `## 1.x.x\n${ERROR_WORD}\n## 0.x.x\nok\n`);
    const out = run(root, [file]);
    expect(out.status).toBe(1);
    expect(out.stdout).toContain('[error]');
  });

  it('ja-check.json itself with error word is not reported', () => {
    const root = fakeRoot();
    writeConfig(root, validConfig());
    const self = join(root, 'scripts', 'checks', 'ja-check.json');
    const out = run(root, [self]);
    expect(out.status).toBe(0);
    expect(out.stdout).not.toContain('[error]');
  });

  it('quoted alone error word is not reported', () => {
    const root = fakeRoot();
    writeConfig(root, validConfig());
    const quoted = `'${ERROR_WORD}'`;
    const file = writeFile(root, 'a.md', `${quoted}\n`);
    const out = run(root, [file]);
    expect(out.status).toBe(0);
    expect(out.stdout).not.toContain('[error]');
  });

  it('quoted word with extra chars is reported', () => {
    const root = fakeRoot();
    writeConfig(root, validConfig());
    const content = `it('${WARN_WORD}extra')\n`;
    const file = writeFile(root, 'a.md', content);
    const out = run(root, [file]);
    expect(out.status).toBe(0);
    expect(out.stdout).toContain('[warn]');
  });

  it('code comment with backtick alone is not reported', () => {
    const root = fakeRoot();
    writeConfig(root, validConfig());
    const quoted = `\`${ERROR_WORD}\``;
    const file = writeFile(root, 'a.ts', `// ${quoted}\n`);
    const out = run(root, [file]);
    expect(out.status).toBe(0);
    expect(out.stdout).not.toContain('[error]');
  });

  it('code string with single quotes alone is not reported', () => {
    const root = fakeRoot();
    writeConfig(root, validConfig());
    const quoted = `'${ERROR_WORD}'`;
    const file = writeFile(root, 'a.ts', `const x = ${quoted};\n`);
    const out = run(root, [file]);
    expect(out.status).toBe(0);
    expect(out.stdout).not.toContain('[error]');
  });

  it('missing config prints no-setting line before summary and exits 0', () => {
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

  it('broken config exits 1', () => {
    const root = fakeRoot();
    writeFile(root, join('scripts', 'checks', 'ja-check.json'), '{not json');
    const file = writeFile(root, 'a.md', 'ok\n');
    const out = run(root, [file]);
    expect(out.status).toBe(1);
  });

  it('config with wrong key or value types exits 1', () => {
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

  it('file with none words is not reported', () => {
    const root = fakeRoot();
    writeConfig(root, validConfig());
    const file = writeFile(root, 'a.md', `${NONE_WORDS.join(' ')}\n`);
    const out = run(root, [file]);
    expect(out.stdout).not.toContain('[error]');
  });

  it('real config has only error and warn keys without none words', () => {
    const raw = readFileSync(REAL_CONFIG, 'utf8');
    const parsed: unknown = JSON.parse(raw);
    expect(isUnknownRecord(parsed)).toBe(true);
    if (!isUnknownRecord(parsed)) {
      return;
    }
    expect(Object.keys(parsed).toSorted()).toEqual(['error', 'warn']);
    const text = JSON.stringify(parsed);
    for (const word of NONE_WORDS) {
      expect(text).not.toContain(`"${word}"`);
    }
  });

  it('real config has warn word in warn and error word in error', () => {
    const raw = readFileSync(REAL_CONFIG, 'utf8');
    const parsed: unknown = JSON.parse(raw);
    expect(isJaConfig(parsed)).toBe(true);
    if (!isJaConfig(parsed)) {
      return;
    }
    expect(parsed.warn[WARN_WORD]).toBeDefined();
    expect(parsed.error[ERROR_WORD]).toBeDefined();
  });
});
