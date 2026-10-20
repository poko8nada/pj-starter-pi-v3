/**
 * `scripts/harness-state.mjs` の振る舞いを fake root で試す。
 *
 * fake root を `tmpDir()` で作り、道を作ってから読む / 書く。
 * 一覧の読み（`readList`）は `./harness-state.mjs` が `./harness.mjs` から借りた物をそのまま使う。
 */
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { tmpDir } from '../test/tmp.ts';
import {
  MODE_AT,
  TEST_GLOB,
  includeList,
  readList,
  readMode,
  writeMode,
} from './harness-state.mjs';

function writeFile(abs: string, content: string): void {
  mkdirSync(dirname(abs), { recursive: true });
  writeFileSync(abs, content);
}

function writeJson(abs: string, data: unknown): void {
  writeFile(abs, `${JSON.stringify(data, null, 2)}\n`);
}

describe('readMode', () => {
  it('{ "mode": "starter" } を置いたツリー → starter', () => {
    const root = tmpDir();
    writeJson(join(root, MODE_AT), { mode: 'starter' });
    expect(readMode(root)).toBe('starter');
  });

  it("writeMode(root, 'product') → 中身は鍵1つ・末に改行で、readMode が product", () => {
    const root = tmpDir();
    writeJson(join(root, MODE_AT), { mode: 'starter' });
    writeMode(root, 'product');
    expect(readFileSync(join(root, MODE_AT), 'utf8')).toBe('{\n  "mode": "product"\n}\n');
    expect(readMode(root)).toBe('product');
  });

  it('状態の道が無い → 投げる。エラーに scripts/harness.mode.json が入る', () => {
    const root = tmpDir();
    expect(() => readMode(root)).toThrow('scripts/harness.mode.json');
  });

  it('状態が JSON として読めない → 投げる', () => {
    const root = tmpDir();
    writeFile(join(root, MODE_AT), 'not json\n');
    expect(() => readMode(root)).toThrow();
  });

  it('状態が {"mode":"half"} → 投げる', () => {
    const root = tmpDir();
    writeJson(join(root, MODE_AT), { mode: 'half' });
    expect(() => readMode(root)).toThrow();
  });

  it('状態が {"mode":"starter","extra":1} → starter（鍵の増減は見ない）', () => {
    const root = tmpDir();
    writeJson(join(root, MODE_AT), { mode: 'starter', extra: 1 });
    expect(readMode(root)).toBe('starter');
  });

  it('この repo の scripts/harness.mode.json → starter', () => {
    expect(readMode(process.cwd())).toBe('starter');
  });
});

describe('readList', () => {
  it('{ "copy": [...], "skip": [...] } を置いたツリー → 同じ物を返す', () => {
    const root = tmpDir();
    writeJson(join(root, 'scripts', 'harness.json'), {
      copy: ['.pi', 'scripts/harness.mjs'],
      skip: ['logs'],
    });
    expect(readList(root)).toEqual({ copy: ['.pi', 'scripts/harness.mjs'], skip: ['logs'] });
  });

  it('一覧の道が無い → 投げる。エラーに scripts/harness.json が入る', () => {
    const root = tmpDir();
    expect(() => readList(root)).toThrow('scripts/harness.json');
  });

  it('一覧が {"copy":"x"} → 投げる', () => {
    const root = tmpDir();
    writeJson(join(root, 'scripts', 'harness.json'), { copy: 'x' });
    expect(() => readList(root)).toThrow();
  });

  it('この repo の scripts/harness.json → skip と copy に新しい道が入っている', () => {
    const list = readList(process.cwd());
    expect(list.skip).toContain('harness.mode.json');
    expect(list.copy).toContain('scripts/harness-state.mjs');
    expect(list.copy).toContain('scripts/harness-state.test.ts');
  });
});

describe('includeList', () => {
  it('starter → [TEST_GLOB] だけ（skip は出ない）', () => {
    expect(
      includeList({ copy: ['.pi', 'scripts/harness.json'], skip: ['logs'] }, 'starter'),
    ).toEqual([TEST_GLOB]);
  });

  it('product → [TEST_GLOB, 各道の否定2つずつ]（一覧の順のまま）', () => {
    expect(includeList({ copy: ['.pi', 'scripts/harness.json'], skip: [] }, 'product')).toEqual([
      TEST_GLOB,
      '!.pi',
      '!.pi/**',
      '!scripts/harness.json',
      '!scripts/harness.json/**',
    ]);
  });

  it('product で copy: [] → [TEST_GLOB]', () => {
    expect(includeList({ copy: [], skip: [] }, 'product')).toEqual([TEST_GLOB]);
  });

  it('".pi/" → "!.pi"（末の / は落とす）', () => {
    expect(includeList({ copy: ['.pi/'], skip: [] }, 'product')).toEqual([
      TEST_GLOB,
      '!.pi',
      '!.pi/**',
    ]);
  });

  it('skip は includeList に出ない', () => {
    expect(includeList({ copy: ['.pi'], skip: ['logs'] }, 'product')).toEqual([
      TEST_GLOB,
      '!.pi',
      '!.pi/**',
    ]);
  });
});
