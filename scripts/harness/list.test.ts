/**
 * `scripts/harness/list.mjs` の振る舞いを fake root で試す。
 *
 * fake root を `tempDir()` で作り、パスを作ってから読む。
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
  it('skip と legacy があっても返さない', () => {
    const starter = '~/Desktop/main/_pj-starter-pi-v3';
    const copy = ['.pi'];
    const push: string[] = [];
    const root = tempDir();
    writeJson(join(root, 'scripts', 'harness', 'harness.json'), {
      starter,
      copy,
      push,
      skip: ['logs'],
      legacy: ['old'],
    });
    expect(readList(root)).toEqual({ starter, copy, push });
  });

  it('copy と push を書かない → 空として返す', () => {
    const starter = '~/Desktop/main/_pj-starter-pi-v3';
    const root = tempDir();
    writeJson(join(root, 'scripts', 'harness', 'harness.json'), { starter });
    expect(readList(root)).toEqual({ starter, copy: [], push: [] });
  });

  it('一覧のパスが無い → パスを入れた誤りで投げる', () => {
    const root = tempDir();
    const missing = join(root, 'scripts', 'harness', 'harness.json');
    expect(() => readList(root)).toThrow(missing);
  });

  it('一覧の starter が無い → 投げる', () => {
    const root = tempDir();
    writeJson(join(root, 'scripts', 'harness', 'harness.json'), { copy: [] });
    expect(() => readList(root)).toThrow();
  });

  it('一覧の copy が配列でない → 投げる', () => {
    const root = tempDir();
    writeJson(join(root, 'scripts', 'harness', 'harness.json'), {
      starter: '~/x',
      copy: 'x',
    });
    expect(() => readList(root)).toThrow();
  });
});

describe('harnessExcludes', () => {
  it('copy 1 件と push 1 件 → 4 つの glob が順に並ぶ', () => {
    const first = '.pi';
    const second = 'lib';
    expect(harnessExcludes({ starter: '~/x', copy: [first], push: [second] })).toEqual([
      first,
      `${first}/**`,
      second,
      `${second}/**`,
    ]);
  });

  it('末尾の / は落とし、空と . は飛ばす', () => {
    const base = '.pi';
    expect(
      harnessExcludes({ starter: '~/x', copy: [`${base}/`, '', '.'], push: ['', '.'] }),
    ).toEqual([base, `${base}/**`]);
  });
});
