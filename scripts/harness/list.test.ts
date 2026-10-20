/**
 * `scripts/harness/list.mjs` の振る舞いを fake root で試す。
 *
 * fake root を `tmpDir()` で作り、道を作ってから読む。
 * `harnessExcludes` は純粋に一覧から glob を作る。
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { tmpDir } from '../../test/tmp.ts';
import { harnessExcludes, readList } from './list.mjs';

function writeFile(abs: string, content: string): void {
  mkdirSync(dirname(abs), { recursive: true });
  writeFileSync(abs, content);
}

function writeJson(abs: string, data: unknown): void {
  writeFile(abs, `${JSON.stringify(data, null, 2)}\n`);
}

describe('readList', () => {
  it('{ "copy": [...], "skip": [...] } を置いたツリー → 同じ物を返す', () => {
    const root = tmpDir();
    writeJson(join(root, 'scripts', 'harness', 'harness.json'), {
      copy: ['.pi', 'scripts/harness.mjs'],
      skip: ['logs'],
    });
    expect(readList(root)).toEqual({
      copy: ['.pi', 'scripts/harness.mjs'],
      skip: ['logs'],
      legacy: [],
    });
  });

  it('一覧の道が無い → 投げる。エラーに scripts/harness/harness.json が入る', () => {
    const root = tmpDir();
    expect(() => readList(root)).toThrow('scripts/harness/harness.json');
  });

  it('一覧が {"copy":"x"} → 投げる', () => {
    const root = tmpDir();
    writeJson(join(root, 'scripts', 'harness', 'harness.json'), { copy: 'x' });
    expect(() => readList(root)).toThrow();
  });

  it('この repo の scripts/harness/harness.json → copy に scripts/harness があり、旧5つの道が無い', () => {
    const list = readList(process.cwd());
    expect(list.copy).toContain('scripts/harness');
    expect(list.copy).not.toContain('scripts/harness.mjs');
    expect(list.copy).not.toContain('scripts/harness.json');
    expect(list.copy).not.toContain('scripts/harness.test.ts');
    expect(list.copy).not.toContain('scripts/harness-state.mjs');
    expect(list.copy).not.toContain('scripts/harness-state.test.ts');
  });
});

describe('harnessExcludes', () => {
  it("{ copy: ['.pi'] } → ['.pi', '.pi/**']", () => {
    expect(harnessExcludes({ copy: ['.pi'], skip: [], legacy: [] })).toEqual(['.pi', '.pi/**']);
  });

  it('copy が 2 つ → 4 つの glob が一覧の順に並ぶ', () => {
    expect(
      harnessExcludes({ copy: ['.pi', 'scripts/harness.json'], skip: [], legacy: [] }),
    ).toEqual(['.pi', '.pi/**', 'scripts/harness.json', 'scripts/harness.json/**']);
  });

  it("'.pi/' → '.pi' と '.pi/**'（末の / は落とす）", () => {
    expect(harnessExcludes({ copy: ['.pi/'], skip: [], legacy: [] })).toEqual(['.pi', '.pi/**']);
  });

  it('copy: [] → []', () => {
    expect(harnessExcludes({ copy: [], skip: [], legacy: [] })).toEqual([]);
  });

  it("copy: ['', '.'] → []", () => {
    expect(harnessExcludes({ copy: ['', '.'], skip: [], legacy: [] })).toEqual([]);
  });
});
