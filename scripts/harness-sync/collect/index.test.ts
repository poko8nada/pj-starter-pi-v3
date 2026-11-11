/**
 * `scripts/harness-sync/collect/index.mjs` の振る舞いを fake root で試す。
 *
 * fake root を `tempDir()` で作り、ファイルを置いてから `collect` で集める。
 * 期待はテストが渡した値から組み立てる。
 */

import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { tempDir } from '../../../test/temp-dir.ts';
import { collect } from './index.mjs';

function writeFile(abs: string, content = 'x\n'): void {
  mkdirSync(dirname(abs), { recursive: true });
  writeFileSync(abs, content);
}

describe('collect', () => {
  it('一覧の項目がコピー元にだけある → paths にそのパスが入る', () => {
    const root = tempDir();
    const rel = '.pi/a.ts';
    writeFile(join(root, '.pi', 'a.ts'), 'x\n');
    const got = collect(root, [rel]);
    expect(got.paths).toEqual([rel]);
    expect(got.missing).toEqual([]);
  });

  it('一覧の項目が両側にない → paths が空で、missing にその項目が入る', () => {
    const root = tempDir();
    const rel = '.pi/a.ts';
    const got = collect(root, [rel]);
    expect(got.paths).toEqual([]);
    expect(got.missing).toEqual([rel]);
  });

  it('一致 0 件の glob → missing にその項目が入る', () => {
    const root = tempDir();
    mkdirSync(join(root, '.pi'), { recursive: true });
    const pattern = '.pi/*.nomatch';
    const got = collect(root, [pattern]);
    expect(got.paths).toEqual([]);
    expect(got.missing).toEqual([pattern]);
  });

  it('node_modules と .git の中のファイル → paths に入らない', () => {
    const root = tempDir();
    writeFile(join(root, '.pi', 'a.ts'), 'x\n');
    writeFile(join(root, '.pi', 'node_modules', 'b.js'), 'x\n');
    writeFile(join(root, '.pi', '.git', 'c.js'), 'x\n');
    const got = collect(root, ['.pi']);
    expect(got.paths).toEqual(['.pi/a.ts']);
    expect(got.missing).toEqual([]);
  });

  it('ディレクトリの項目 → その下のファイルが paths に入る', () => {
    const root = tempDir();
    writeFile(join(root, '.pi', 'a.ts'), 'a\n');
    writeFile(join(root, '.pi', 'sub', 'b.ts'), 'b\n');
    const got = collect(root, ['.pi']);
    expect(got.paths).toEqual(['.pi/a.ts', '.pi/sub/b.ts']);
    expect(got.missing).toEqual([]);
  });

  it('同じパスが 2 つの項目から出る → paths で 1 つになる', () => {
    const root = tempDir();
    writeFile(join(root, '.pi', 'a.ts'), 'x\n');
    const got = collect(root, ['.pi/a.ts', '.pi/*.ts']);
    expect(got.paths).toEqual(['.pi/a.ts']);
    expect(got.missing).toEqual([]);
  });
});
