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
  it('porcelain の表通りパスを取り出す', () => {
    for (const row of statusTable) {
      expect(parseStatus(row.raw)).toEqual(row.expected);
    }
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
    const afterDeleted = new Map([[pathB, printB]]);
    expect(changedSince(before, afterDeleted)).toEqual([]);
  });
});

describe('fingerprint', () => {
  it('存在するファイルだけ指紋を持ち、ないパスは入れない', () => {
    const missing = join(tempDir(), 'nope-quality-gate');
    expect(fingerprint([missing]).size).toBe(0);
    const file = join(tempDir(), 'a.txt');
    writeFileSync(file, 'x');
    const prints = fingerprint([file]);
    expect(prints.has(file)).toBe(true);
    expect(prints.get(file)).toMatch(/^\d+:\d+:\d+$/);
  });
});

describe('filterByExtensions', () => {
  it('format と lint の拡張子を通し、大文字も通す', () => {
    const ts = 'a.ts';
    const md = 'b.md';
    const json = 'c.json';
    const png = 'd.png';
    const paths = [ts, md, json, png];
    expect(filterByExtensions(paths, 'format')).toEqual([ts, md, json]);
    expect(filterByExtensions(paths, 'lint')).toEqual([ts]);
    const upper = 'A.TS';
    expect(filterByExtensions([upper], 'lint')).toEqual([upper]);
  });
});
