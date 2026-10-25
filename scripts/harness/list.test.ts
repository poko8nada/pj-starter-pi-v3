/**
 * `scripts/harness/list.mjs` の振る舞いを fake root で試す。
 *
 * fake root を `tempDir()` で作り、道を作ってから読む。
 * `harnessExcludes` は純粋に一覧から glob を作る。
 * 期待はテストが渡した値から組み立てる。
 */

import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { tempDir } from '../../test/temp-dir.ts';
import { harnessExcludes, readList } from './list.mjs';

function writeFile(abs: string, content: string): void {
  mkdirSync(dirname(abs), { recursive: true });
  writeFileSync(abs, content);
}

function writeJson(abs: string, data: unknown): void {
  writeFile(abs, `${JSON.stringify(data, null, 2)}\n`);
}

describe('readList', () => {
  it('一覧を置いたツリー → 同じ物を返す', () => {
    const copy = ['.pi', join('scripts', 'harness', 'list.mjs')];
    const skip = ['logs'];
    const root = tempDir();
    writeJson(join(root, 'scripts', 'harness', 'harness.json'), { copy, skip });
    expect(readList(root)).toEqual({ copy, skip, legacy: [] });
  });

  it('一覧の道が無い → 道を入れた誤りで投げる', () => {
    const root = tempDir();
    const missing = join(root, 'scripts', 'harness', 'harness.json');
    expect(() => readList(root)).toThrow(missing);
  });

  it('一覧の copy が配列でない → 投げる', () => {
    const root = tempDir();
    writeJson(join(root, 'scripts', 'harness', 'harness.json'), { copy: 'x' });
    expect(() => readList(root)).toThrow();
  });
});

describe('harnessExcludes', () => {
  it('copy の 1 件から 2 つの glob を作り、2 件は順に並ぶ', () => {
    const first = '.pi';
    const second = join('scripts', 'harness', 'list.mjs');
    expect(harnessExcludes({ copy: [first], skip: [], legacy: [] })).toEqual([
      first,
      `${first}/**`,
    ]);
    expect(harnessExcludes({ copy: [first, second], skip: [], legacy: [] })).toEqual([
      first,
      `${first}/**`,
      second,
      `${second}/**`,
    ]);
  });

  it('末尾の / は落とし、空と . は飛ばす', () => {
    const base = '.pi';
    expect(harnessExcludes({ copy: [`${base}/`, '', '.'], skip: [], legacy: [] })).toEqual([
      base,
      `${base}/**`,
    ]);
  });
});
