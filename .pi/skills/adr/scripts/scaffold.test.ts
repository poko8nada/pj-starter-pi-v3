import { existsSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { tempDir } from '../../../../test/temp-dir.ts';
import {
  adrSkeleton,
  appendEntry,
  createLeafDir,
  cycleDirName,
  dirNames,
  entrySkeleton,
  lastEntryNumber,
  nextNNN,
  parseArgs,
  slugBranch,
  toYYMMDD,
} from './scaffold.mjs';

describe('adrSkeleton', () => {
  it('番号を 0 埋めした見出しで始まる', () => {
    const cases = [
      { input: 17, expected: '# ADR 017\n' },
      { input: 1, expected: '# ADR 001\n' },
    ];
    for (const { input, expected } of cases) {
      expect(adrSkeleton(input).startsWith(expected)).toBe(true);
    }
  });
});

describe('slugBranch', () => {
  it('main/develop/feature/fix を写像する', () => {
    const cases = [
      { input: 'main', expected: 'main' },
      { input: 'develop', expected: 'dev' },
      { input: 'feature/a/b', expected: 'feat-a-b' },
      { input: 'fix/x', expected: 'fix-x' },
    ];
    for (const { input, expected } of cases) {
      expect(slugBranch(input)).toBe(expected);
    }
  });

  it('小文字化と英数以外→`-`をやる', () => {
    const cases = [
      { input: 'Fix/X', expected: 'fix-x' },
      { input: '2-consult.retry', expected: '2-consult-retry' },
    ];
    for (const { input, expected } of cases) {
      expect(slugBranch(input)).toBe(expected);
    }
  });

  it('空は no-branch、日本語を含む枝名からは英数を拾う', () => {
    const cases = [
      { input: '', expected: 'no-branch' },
      { input: '日本語/x', expected: 'x' },
    ];
    for (const { input, expected } of cases) {
      expect(slugBranch(input)).toBe(expected);
    }
  });
});

describe('toYYMMDD', () => {
  it('ローカル日付を YYMMDD にする', () => {
    const cases = [
      { input: new Date(2026, 9, 10), expected: '261010' },
      { input: new Date(2026, 0, 5), expected: '260105' },
    ];
    for (const { input, expected } of cases) {
      expect(toYYMMDD(input)).toBe(expected);
    }
  });
});

describe('nextNNN', () => {
  it('新形を数値で拾い、合わない物は飛ばして max+1 を返す', () => {
    const names = ['261010-015-main', 'archive'];
    const expected = 16;
    expect(nextNNN(names)).toBe(expected);
  });

  it('空 → 1', () => {
    const expected = 1;
    expect(nextNNN([])).toBe(expected);
  });

  it('旧形だけでも max+1 を返す', () => {
    const names = ['001-2026-09-20', '014-2026-10-09'];
    const expected = 15;
    expect(nextNNN(names)).toBe(expected);
  });
});

describe('cycleDirName', () => {
  it('0 埋めして組み立てる', () => {
    const cases = [
      { nnn: 16, yymmdd: '261010', slug: 'main', expected: '261010-016-main' },
      { nnn: 5, yymmdd: '261010', slug: 'main', expected: '261010-005-main' },
    ];
    for (const { nnn, yymmdd, slug, expected } of cases) {
      expect(cycleDirName(nnn, yymmdd, slug)).toBe(expected);
    }
  });
});

describe('createLeafDir', () => {
  it('空 tmp に作る → path が返り dir ができる', () => {
    const root = tempDir();
    const parent = join(root, 'cycles');
    mkdirSync(parent, { recursive: true });
    const leafName = cycleDirName(16, '261010', 'main');
    const leaf = createLeafDir(parent, leafName);
    expect(leaf).toBe(join(parent, leafName));
    expect(existsSync(leaf)).toBe(true);
  });

  it('既存 dir には作らず投げる', () => {
    const root = tempDir();
    const parent = join(root, 'cycles');
    const leafName = cycleDirName(16, '261010', 'main');
    mkdirSync(join(parent, leafName), { recursive: true });
    expect(() => createLeafDir(parent, leafName)).toThrow();
  });
});

describe('dirNames', () => {
  it('両ルートの dir 名を集める（`archive` も入る）', () => {
    const root = tempDir();
    const cyclesDir = join(root, 'cycles');
    const archiveDir = join(cyclesDir, 'archive');
    const cycleName = cycleDirName(15, '261010', 'main');
    const oldName = '014-2026-10-09';
    mkdirSync(join(cyclesDir, cycleName), { recursive: true });
    mkdirSync(join(archiveDir, oldName), { recursive: true });
    const expected = [oldName, cycleName, 'archive'].toSorted();
    expect(dirNames(cyclesDir, archiveDir).toSorted()).toEqual(expected);
  });

  it('無いルートは空として扱う', () => {
    const root = tempDir();
    const expected: readonly string[] = [];
    expect(dirNames(join(root, 'cycles'), join(root, 'cycles', 'archive'))).toEqual(expected);
  });
});

describe('parseArgs', () => {
  it('位置引数は番号になる', () => {
    const input = '017';
    expect(parseArgs([input])).toEqual({ root: process.cwd(), nnn: Number(input) });
  });

  it('空 → root は cwd、nnn は null', () => {
    expect(parseArgs([])).toEqual({ root: process.cwd(), nnn: null });
  });

  it('--root を読む', () => {
    const root = '/tmp/x';
    expect(parseArgs(['--root', root])).toEqual({ root, nnn: null });
  });

  it('数でない位置引数は投げる', () => {
    const cases = [{ input: 'abc' }, { input: '1.5' }, { input: '0' }];
    for (const { input } of cases) {
      expect(() => parseArgs([input])).toThrow();
    }
  });

  it('--root の値が欠けていても投げる', () => {
    expect(() => parseArgs(['--root'])).toThrow();
  });

  it('2 つ目位置引数は投げる', () => {
    const first = '017';
    const second = '018';
    expect(() => parseArgs([first, second])).toThrow();
  });
});

describe('entrySkeleton', () => {
  it('format.md のエントリーの見出しと一致する', () => {
    const headings = entrySkeleton(1)
      .split('\n')
      .filter((line) => line.startsWith('#'));
    const expected = [
      '## 01: <問い>',
      '### Context',
      '### Scope',
      '### Research & Trial',
      '### Decision',
      '### Definition',
    ];
    expect(headings).toEqual(expected);
  });
});

describe('lastEntryNumber', () => {
  it('## 01: を持つ markdown → 1 を返す', () => {
    const markdown = adrSkeleton(7);
    expect(lastEntryNumber(markdown)).toBe(1);
  });

  it('## 02: を持つ markdown → 2 を返す', () => {
    const markdown = appendEntry(adrSkeleton(7), 2);
    expect(lastEntryNumber(markdown)).toBe(2);
  });

  it('エントリーのない markdown → null を返す', () => {
    const markdown = '# ADR 007\n';
    expect(lastEntryNumber(markdown)).toBe(null);
  });

  it('壊れた見出し → 理由付きで投げる', () => {
    const cases = ['# ADR 007\n\n## 1: <問い>\n', '# ADR 007\n\n## 01 <問い>\n'];
    for (const markdown of cases) {
      expect(() => lastEntryNumber(markdown)).toThrow(/## NN:/);
    }
  });
});

describe('appendEntry', () => {
  it('## 01: を持つ markdown → ## 02: を足し # ADR は1つのまま', () => {
    const markdown = adrSkeleton(7);
    const next = appendEntry(markdown, 2);
    expect(next).toContain('## 02: <問い>');
    expect(next.match(/^# ADR /gm) ?? []).toHaveLength(1);
    const lastSharp = next.split('\n').findLast((line) => line.startsWith('## '));
    expect(lastSharp).toBe('## 02: <問い>');
  });

  it('## 02: を持つ markdown → ## 03: を足す', () => {
    const markdown = appendEntry(adrSkeleton(7), 2);
    const next = appendEntry(markdown, 3);
    expect(next).toContain('## 03: <問い>');
    expect(next.match(/^# ADR /gm) ?? []).toHaveLength(1);
    const lastSharp = next.split('\n').findLast((line) => line.startsWith('## '));
    expect(lastSharp).toBe('## 03: <問い>');
  });

  it('エントリーのない markdown → ## 01: を足す', () => {
    const markdown = '# ADR 007\n';
    const next = appendEntry(markdown, 1);
    expect(next).toContain('## 01: <問い>');
    expect(lastEntryNumber(next)).toBe(1);
  });
});
