/**
 * `scripts/harness-sync/diff/index.mjs` の振る舞いを fake root で試す。
 *
 * fake の 2 つのツリーを作り、`sameFile` で中身を比べ、`diffPaths` で写す物を作る。
 */

import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { tempDir } from '../../../test/temp-dir.ts';
import { diffPaths, sameFile } from './index.mjs';

function writeFile(abs: string, content = 'x\n'): void {
  mkdirSync(dirname(abs), { recursive: true });
  writeFileSync(abs, content);
}

describe('diffPaths', () => {
  it('コピー元にだけある → copy に入る', () => {
    expect(diffPaths(['.pi/a.ts'], [], () => true)).toEqual(['.pi/a.ts']);
  });

  it('両側にあって中身が違う → copy に入る', () => {
    const fromRoot = tempDir();
    const toRoot = tempDir();
    const rel = '.pi/a.ts';
    writeFile(join(fromRoot, rel), 'B\n');
    writeFile(join(toRoot, rel), 'A\n');
    expect(diffPaths([rel], [rel], (r) => sameFile(fromRoot, toRoot, r))).toEqual([rel]);
  });

  it('両側にあって中身が同じ → copy に入らない', () => {
    const fromRoot = tempDir();
    const toRoot = tempDir();
    const rel = '.pi/a.ts';
    writeFile(join(fromRoot, rel), 'same\n');
    writeFile(join(toRoot, rel), 'same\n');
    expect(diffPaths([rel], [rel], (r) => sameFile(fromRoot, toRoot, r))).toEqual([]);
  });

  it('コピー先にだけある → copy に入らない', () => {
    expect(diffPaths([], ['.pi/old.ts'], () => false)).toEqual([]);
  });
});
