/**
 * `scripts/harness-sync/collect/index.mjs` の振る舞いを fake root で試す。
 *
 * fake root を `fakeRoot()` で作り、ファイルを共有の `writeFile` で置いてから `collect` で集める。
 * 期待はテストが渡した値から組み立てる。
 */

import { mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { fakeRoot, writeFile } from '../../../test/scripts.fixture.ts';
import { collect } from './index.mjs';

describe('collect', () => {
  it('一覧の項目がコピー元にだけある → paths にそのパスが入る', () => {
    const root = fakeRoot();
    const rel = '.pi/a.ts';
    writeFile(root, rel);
    const got = collect(root, [rel]);
    expect(got.paths).toEqual([rel]);
    expect(got.missing).toEqual([]);
  });

  it('一覧の項目が両側にない → paths が空で、missing にその項目が入る', () => {
    const root = fakeRoot();
    const rel = '.pi/a.ts';
    const got = collect(root, [rel]);
    expect(got.paths).toEqual([]);
    expect(got.missing).toEqual([rel]);
  });

  it('一致 0 件の glob → missing にその項目が入る', () => {
    const root = fakeRoot();
    mkdirSync(join(root, '.pi'), { recursive: true });
    const pattern = '.pi/*.nomatch';
    const got = collect(root, [pattern]);
    expect(got.paths).toEqual([]);
    expect(got.missing).toEqual([pattern]);
  });

  it('node_modules と .git の中のファイル → paths に入らない', () => {
    const root = fakeRoot();
    writeFile(root, '.pi/a.ts', 'x\n');
    writeFile(root, '.pi/node_modules/b.js', 'x\n');
    writeFile(root, '.pi/.git/c.js', 'x\n');
    const got = collect(root, ['.pi']);
    expect(got.paths).toEqual(['.pi/a.ts']);
    expect(got.missing).toEqual([]);
  });

  it('ディレクトリの項目 → その下のファイルが paths に入る', () => {
    const root = fakeRoot();
    writeFile(root, '.pi/a.ts', 'a\n');
    writeFile(root, '.pi/sub/b.ts', 'b\n');
    const got = collect(root, ['.pi']);
    expect(got.paths).toEqual(['.pi/a.ts', '.pi/sub/b.ts']);
    expect(got.missing).toEqual([]);
  });

  it('同じパスが 2 つの項目から出る → paths で 1 つになる', () => {
    const root = fakeRoot();
    const rel = '.pi/a.ts';
    writeFile(root, rel);
    const got = collect(root, [rel, '.pi/*.ts']);
    expect(got.paths).toEqual([rel]);
    expect(got.missing).toEqual([]);
  });
});
