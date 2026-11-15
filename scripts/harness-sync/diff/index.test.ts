/**
 * `scripts/harness-sync/diff/index.mjs` の振る舞いを fake root で試す。
 *
 * 共有 `fakeRoot` で 2 つのツリーを作り、`sameFile` で中身を比べ、`diffPaths` で写す物を作る。
 */

import { describe, expect, it } from 'vitest';
import { fakeRoot, writeFile } from '../../../test/scripts.fixture.ts';
import { diffPaths, sameFile } from './index.mjs';

describe('diffPaths', () => {
  it('コピー元にだけある → copy に入る', () => {
    expect(diffPaths(['.pi/a.ts'], [], () => true)).toEqual(['.pi/a.ts']);
  });

  it('両側にあって中身が違う → copy に入る', () => {
    const fromRoot = fakeRoot();
    const toRoot = fakeRoot();
    const rel = '.pi/a.ts';
    writeFile(fromRoot, rel, 'B\n');
    writeFile(toRoot, rel, 'A\n');
    expect(diffPaths([rel], [rel], (r) => sameFile(fromRoot, toRoot, r))).toEqual([rel]);
  });

  it('両側にあって中身が同じ → copy に入らない', () => {
    const fromRoot = fakeRoot();
    const toRoot = fakeRoot();
    const rel = '.pi/a.ts';
    writeFile(fromRoot, rel, 'same\n');
    writeFile(toRoot, rel, 'same\n');
    expect(diffPaths([rel], [rel], (r) => sameFile(fromRoot, toRoot, r))).toEqual([]);
  });

  it('コピー先にだけある → copy に入らない', () => {
    expect(diffPaths([], ['.pi/old.ts'], () => false)).toEqual([]);
  });
});
