import { writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { tempDir } from '../../../test/temp-dir.ts';
import { changedSince, filterByExtensions, fingerprint, parseStatus } from './targets.ts';

// porcelain の解析と差分だけを試す。git の起動は実際のリポジトリが要るので扱わない。
// porcelain の入力と期待するパスの一覧は表にし、断言は表の値から取る。

const trackedA = 'src/a.ts';
const trackedB = 'src/b.ts';
const untracked = 'new.md';
const spaced = 'a b.md';
const renamedTo = 'renamed-new.md';
const renamedFrom = 'renamed-old.md';
const kept = 'keep.md';

const statusTable: ReadonlyArray<{ readonly raw: string; readonly expected: readonly string[] }> = [
  {
    raw: ` M ${trackedA}\0A  ${trackedB}\0?? ${untracked}\0`,
    expected: [trackedA, trackedB, untracked],
  },
  { raw: `?? ${spaced}\0`, expected: [spaced] },
  { raw: `R  ${renamedTo}\0${renamedFrom}\0 M ${kept}\0`, expected: [renamedTo, kept] },
  { raw: '', expected: [] },
];

describe('parseStatus', () => {
  it('XY とパスを取り出し追跡されていないファイルも含める', () => {
    const row = statusTable[0];
    if (row === undefined) {
      throw new Error('statusTable[0] is missing');
    }
    expect(parseStatus(row.raw)).toEqual(row.expected);
  });

  it('空白を含むパスを壊さない', () => {
    const row = statusTable[1];
    if (row === undefined) {
      throw new Error('statusTable[1] is missing');
    }
    expect(parseStatus(row.raw)).toEqual(row.expected);
  });

  it('rename は元のパスを読み飛ばす', () => {
    const row = statusTable[2];
    if (row === undefined) {
      throw new Error('statusTable[2] is missing');
    }
    expect(parseStatus(row.raw)).toEqual(row.expected);
  });

  it('空の出力は空配列になる', () => {
    const row = statusTable[3];
    if (row === undefined) {
      throw new Error('statusTable[3] is missing');
    }
    expect(parseStatus(row.raw)).toEqual(row.expected);
  });
});

describe('changedSince', () => {
  const pathA = 'a.ts';
  const pathB = 'b.ts';
  const pathC = 'c.ts';
  const printA = '1:10';
  const printB = '2:20';
  const printC = '3:30';
  const printA2 = '9:10';
  const before = new Map([
    [pathA, printA],
    [pathB, printB],
  ]);

  it('新しく現れたパスと、再編集されたパスだけを返し、変わらなければ空になる', () => {
    const afterNew = new Map(before);
    afterNew.set(pathC, printC);
    expect(changedSince(before, afterNew)).toEqual([pathC]);
    const afterReedit = new Map(before);
    afterReedit.set(pathA, printA2);
    expect(changedSince(before, afterReedit)).toEqual([pathA]);
    expect(changedSince(before, new Map(before))).toEqual([]);
  });

  it('消えたパスは返さない', () => {
    const after = new Map([[pathB, printB]]);
    expect(changedSince(before, after)).toEqual([]);
  });
});

describe('fingerprint', () => {
  it('存在しないパスは入れない', () => {
    const name = 'nope-quality-gate';
    const missing = join(tempDir(), name);
    expect(fingerprint([missing]).size).toBe(0);
  });

  it('存在するファイルは mtime:ctime:size の指紋を持つ', () => {
    const file = join(tempDir(), 'a.txt');
    writeFileSync(file, 'x');
    const prints = fingerprint([file]);
    expect(prints.has(file)).toBe(true);
    expect(prints.get(file)).toMatch(/^\d+:\d+:\d+$/);
  });
});

describe('filterByExtensions', () => {
  it('format は md と json を通し、lint は ts だけを通す', () => {
    const ts = 'a.ts';
    const md = 'b.md';
    const json = 'c.json';
    const png = 'd.png';
    const paths = [ts, md, json, png];
    expect(filterByExtensions(paths, 'format')).toEqual([ts, md, json]);
    expect(filterByExtensions(paths, 'lint')).toEqual([ts]);
  });

  it('大文字の拡張子も通す', () => {
    const upper = 'A.TS';
    expect(filterByExtensions([upper], 'lint')).toEqual([upper]);
  });
});
