/**
 * `scripts/harness/list/index.mjs` の振る舞いを fake root で試す。
 *
 * fake root を `tempDir()` で作り、パスを作ってから読む。
 * 期待はテストが渡した値から組み立てる。
 */

import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { tempDir } from '../../../test/temp-dir.ts';
import { readList } from './index.mjs';

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
    const file = join(root, 'scripts', 'harness', 'harness.json');
    writeJson(file, { copy: [] });
    expect(() => readList(root)).toThrow(file);
  });

  it('一覧の copy が配列でない → 投げる', () => {
    const root = tempDir();
    const file = join(root, 'scripts', 'harness', 'harness.json');
    writeJson(file, {
      starter: '~/x',
      copy: 'x',
    });
    expect(() => readList(root)).toThrow(file);
  });
});
