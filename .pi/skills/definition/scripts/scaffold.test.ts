import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { tmpDir } from '../../../../test/tmp.ts';
import {
  cycleDirName,
  findPrevDefinition,
  nextNNN,
  parseArgs,
  slugBranch,
  stripMarkers,
  toYYMMDD,
} from './scaffold.mjs';

function writeDefinition(dir: string, body = 'x\n'): string {
  mkdirSync(dir, { recursive: true });
  const file = join(dir, 'definition.md');
  writeFileSync(file, body);
  return file;
}

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
});

describe('nextNNN', () => {
  it('新形・旧形を数値で拾い、合わない物は飛ばす', () => {
    expect(nextNNN(['001-2026-09-20', '261010-015-main', 'archive'])).toBe(16);
  });

  it('空 → 1', () => {
    expect(nextNNN([])).toBe(1);
  });
});

describe('cycleDirName', () => {
  it('0 埋めして組み立てる', () => {
    expect(cycleDirName(16, '261010', 'main')).toBe('261010-016-main');
    expect(cycleDirName(5, '261010', 'main')).toBe('261010-005-main');
  });
});

describe('parseArgs', () => {
  it('--root と src を読む', () => {
    expect(parseArgs(['--root', '/tmp/x'])).toEqual({ root: '/tmp/x', src: null });
    expect(parseArgs(['--root', '/tmp/x', 'foo.md'])).toEqual({ root: '/tmp/x', src: 'foo.md' });
  });

  it('空 → src は null', () => {
    expect(parseArgs([]).src).toBe(null);
  });

  it('未知引数・--root 値欠落は投げる', () => {
    expect(() => parseArgs(['--bogus'])).toThrow();
    expect(() => parseArgs(['--root'])).toThrow();
  });
});

describe('stripMarkers', () => {
  it('marker を落とす', () => {
    expect(stripMarkers('a **add** (ADR 01-1)')).toBe('a');
  });

  it('marker 無しはそのまま', () => {
    expect(stripMarkers('a')).toBe('a');
  });
});

describe('findPrevDefinition', () => {
  it('NNN が最大の definition.md を返す', () => {
    const root = tmpDir();
    const cyclesDir = join(root, 'cycles');
    const archiveDir = join(cyclesDir, 'archive');
    const live = writeDefinition(join(cyclesDir, '261010-015-main'), 'live\n');
    writeDefinition(join(archiveDir, '014-2026-10-09'), 'archive\n');
    expect(findPrevDefinition(cyclesDir, archiveDir)).toBe(live);
  });

  it('max-NNN の dir に無い時は番号を下がって探す', () => {
    const root = tmpDir();
    const cyclesDir = join(root, 'cycles');
    const archiveDir = join(cyclesDir, 'archive');
    mkdirSync(join(cyclesDir, '261010-015-main'), { recursive: true });
    const prev = writeDefinition(join(archiveDir, '014-2026-10-09'), 'archive\n');
    expect(findPrevDefinition(cyclesDir, archiveDir)).toBe(prev);
  });

  it('definition が無い木 → null', () => {
    const root = tmpDir();
    const cyclesDir = join(root, 'cycles');
    const archiveDir = join(cyclesDir, 'archive');
    mkdirSync(join(cyclesDir, '261010-015-main'), { recursive: true });
    expect(findPrevDefinition(cyclesDir, archiveDir)).toBe(null);
  });
});
