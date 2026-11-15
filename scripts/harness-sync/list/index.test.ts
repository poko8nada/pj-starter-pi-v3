/**
 * `scripts/harness-sync/list/index.mjs` の振る舞いを fake root で試す。
 *
 * fake root を `fakeRoot()` で作り、共有の `writeJson` でパスを作ってから読む。
 * 期待はテストが渡した値から組み立てる。
 */

import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { fakeRoot, writeJson } from '../../../test/scripts.fixture.ts';
import { readList } from './index.mjs';

describe('readList', () => {
  it('copy と push を書かない → 空として返す', () => {
    const starter = '~/Desktop/main/_pj-starter-pi-v3';
    const root = fakeRoot();
    writeJson(root, 'scripts/harness-sync/setting.json', { starter });
    expect(readList(root)).toEqual({ starter, copy: [], push: [] });
  });

  it('一覧のパスが無い → パスを入れた誤りで投げる', () => {
    const root = fakeRoot();
    const missing = join(root, 'scripts', 'harness-sync', 'setting.json');
    expect(() => readList(root)).toThrow(missing);
  });

  it('一覧の starter が無い → 投げる', () => {
    const root = fakeRoot();
    const file = join(root, 'scripts', 'harness-sync', 'setting.json');
    writeJson(root, 'scripts/harness-sync/setting.json', { copy: [] });
    expect(() => readList(root)).toThrow(file);
  });

  it('一覧の copy が配列でない → 投げる', () => {
    const root = fakeRoot();
    const file = join(root, 'scripts', 'harness-sync', 'setting.json');
    writeJson(root, 'scripts/harness-sync/setting.json', {
      starter: '~/x',
      copy: 'x',
    });
    expect(() => readList(root)).toThrow(file);
  });
});
