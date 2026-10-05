import { writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { tmpDir } from '../../test/tmp.ts';
import { changedSince, fingerprint, parseStatus } from './targets.ts';

// porcelain の解析と差分だけを試す。git の起動は実際のリポジトリが要るので扱わない。

describe('parseStatus', () => {
  it('XY とパスを取り出す', () => {
    expect(parseStatus(' M src/a.ts\0A  src/b.ts\0')).toEqual(['src/a.ts', 'src/b.ts']);
  });

  it('未追跡も拾う', () => {
    expect(parseStatus('?? new.md\0')).toEqual(['new.md']);
  });

  it('空白を含むパスを壊さない', () => {
    expect(parseStatus('?? a b.md\0')).toEqual(['a b.md']);
  });

  it('rename は元のパスを読み飛ばす', () => {
    expect(parseStatus('R  new.md\0old.md\0 M keep.md\0')).toEqual(['new.md', 'keep.md']);
  });

  it('空の出力は空配列', () => {
    expect(parseStatus('')).toEqual([]);
  });
});

describe('changedSince', () => {
  const before = new Map([
    ['a.ts', '1:10'],
    ['b.ts', '2:20'],
  ]);

  it('新しく現れたパスを返す', () => {
    const after = new Map(before);
    after.set('c.ts', '3:30');
    expect(changedSince(before, after)).toEqual(['c.ts']);
  });

  it('既に dirty なファイルの再編集を拾う（状態の文字では分からない）', () => {
    const after = new Map(before);
    after.set('a.ts', '9:10');
    expect(changedSince(before, after)).toEqual(['a.ts']);
  });

  it('変わらなければ空', () => {
    expect(changedSince(before, new Map(before))).toEqual([]);
  });

  it('消えたパスは返さない', () => {
    const after = new Map([['b.ts', '2:20']]);
    expect(changedSince(before, after)).toEqual([]);
  });
});

describe('fingerprint', () => {
  it('存在しないパスは入らない', () => {
    expect(fingerprint(['/no-such-file-quality-gate']).size).toBe(0);
  });
});

describe('fingerprint: 肯定側', () => {
  it('存在するファイルは mtime:ctime:size の指紋を持つ', () => {
    const file = join(tmpDir(), 'a.txt');
    writeFileSync(file, 'x');
    const prints = fingerprint([file]);
    expect(prints.has(file)).toBe(true);
    expect(prints.get(file)).toMatch(/^\d+:\d+:\d+$/);
  });

  it('存在しないファイルは入れない', () => {
    expect(fingerprint([join(tmpDir(), 'nope')]).size).toBe(0);
  });
});
