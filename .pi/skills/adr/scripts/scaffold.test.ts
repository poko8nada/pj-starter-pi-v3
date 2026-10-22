import { existsSync, mkdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { tmpDir } from '../../../../test/tmp.ts';
import {
  adrSkeleton,
  createLeafDir,
  cycleDirName,
  dirNames,
  nextNNN,
  parseArgs,
  slugBranch,
  toYYMMDD,
} from './scaffold.mjs';

describe('adrSkeleton', () => {
  it('番号を 0 埋めした見出しで始まる', () => {
    expect(adrSkeleton(17).startsWith('# ADR 017\n')).toBe(true);
    expect(adrSkeleton(1).startsWith('# ADR 001\n')).toBe(true);
  });
});

describe('slugBranch', () => {
  it('main/develop/feature/fix を写像する', () => {
    expect(slugBranch('main')).toBe('main');
    expect(slugBranch('develop')).toBe('dev');
    expect(slugBranch('feature/a/b')).toBe('feat-a-b');
    expect(slugBranch('fix/x')).toBe('fix-x');
  });

  it('小文字化と英数以外→`-`をやる', () => {
    expect(slugBranch('Fix/X')).toBe('fix-x');
    expect(slugBranch('2-consult.retry')).toBe('2-consult-retry');
  });

  it('空・`///` → no-branch、日本語/x → x、80 文字はそのまま', () => {
    expect(slugBranch('')).toBe('no-branch');
    expect(slugBranch('日本語/x')).toBe('x');
    expect(slugBranch('///')).toBe('no-branch');
    expect(slugBranch('x'.repeat(80))).toBe('x'.repeat(80));
  });
});

describe('toYYMMDD', () => {
  it('ローカル日付を YYMMDD にする', () => {
    expect(toYYMMDD(new Date(2026, 9, 10))).toBe('261010');
  });

  it('一桁月日は 0 埋めする', () => {
    expect(toYYMMDD(new Date(2026, 0, 5))).toBe('260105');
  });
});

describe('nextNNN', () => {
  it('新形・旧形を数値で拾い、合わない物は飛ばす', () => {
    expect(nextNNN(['001-2026-09-20', '261010-015-main', 'archive'])).toBe(16);
  });

  it('空 → 1', () => {
    expect(nextNNN([])).toBe(1);
  });

  it('旧形だけでも max+1 を返す', () => {
    expect(nextNNN(['001-2026-09-20', '014-2026-10-09'])).toBe(15);
  });
});

describe('cycleDirName', () => {
  it('0 埋めして組み立てる', () => {
    expect(cycleDirName(16, '261010', 'main')).toBe('261010-016-main');
    expect(cycleDirName(5, '261010', 'main')).toBe('261010-005-main');
  });
});

describe('createLeafDir', () => {
  it('空 tmp に作る → path が返り dir ができる', () => {
    const root = tmpDir();
    const parent = join(root, 'cycles');
    mkdirSync(parent, { recursive: true });
    const leaf = createLeafDir(parent, '261010-016-main');
    expect(leaf).toBe(join(parent, '261010-016-main'));
    expect(existsSync(leaf)).toBe(true);
    expect(statSync(leaf).isDirectory()).toBe(true);
  });

  it('既存 dir → EEXIST で投げる', () => {
    const root = tmpDir();
    const parent = join(root, 'cycles');
    mkdirSync(join(parent, '261010-016-main'), { recursive: true });
    try {
      createLeafDir(parent, '261010-016-main');
      expect.unreachable();
    } catch (err) {
      expect(err).toMatchObject({ code: 'EEXIST' });
    }
  });
});

describe('dirNames', () => {
  it('両ルートの dir 名を集める（`archive` も入る）', () => {
    const root = tmpDir();
    const cyclesDir = join(root, 'cycles');
    const archiveDir = join(cyclesDir, 'archive');
    mkdirSync(join(cyclesDir, '261010-015-main'), { recursive: true });
    mkdirSync(join(archiveDir, '014-2026-10-09'), { recursive: true });
    expect(dirNames(cyclesDir, archiveDir).toSorted()).toEqual([
      '014-2026-10-09',
      '261010-015-main',
      'archive',
    ]);
  });

  it('無いルートは空として扱う', () => {
    const root = tmpDir();
    expect(dirNames(join(root, 'cycles'), join(root, 'cycles', 'archive'))).toEqual([]);
  });
});

describe('parseArgs', () => {
  it('位置引数は番号になる', () => {
    expect(parseArgs(['017'])).toEqual({ root: process.cwd(), nnn: 17 });
  });

  it('空 → root は cwd、nnn は null', () => {
    expect(parseArgs([])).toEqual({ root: process.cwd(), nnn: null });
  });

  it('--root を読む', () => {
    expect(parseArgs(['--root', '/tmp/x'])).toEqual({ root: '/tmp/x', nnn: null });
  });

  it('数でない・小数・0 は投げる', () => {
    expect(() => parseArgs(['abc'])).toThrow();
    expect(() => parseArgs(['1.5'])).toThrow();
    expect(() => parseArgs(['0'])).toThrow();
  });

  it('未知引数・`=` 形・--root 値欠落は投げる', () => {
    expect(() => parseArgs(['--bogus'])).toThrow();
    expect(() => parseArgs(['--root=/tmp/x'])).toThrow();
    expect(() => parseArgs(['--root'])).toThrow();
  });

  it('2 つ目位置引数は投げる', () => {
    expect(() => parseArgs(['017', '018'])).toThrow();
  });
});
