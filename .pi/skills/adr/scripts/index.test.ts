import { spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { tempDir } from '../../../../test/temp-dir.ts';
import { adrSkeleton, entrySkeleton } from './adr.mjs';
import { affectedEntrySkeleton, affectedSkeleton } from './affected.mjs';
import {
  appendEntry,
  createLeafDir,
  cycleDirName,
  dirNames,
  lastEntryNumber,
  nextNNN,
  openCycleDir,
  parseArgs,
  slugBranch,
  toYYMMDD,
} from './cycle.mjs';

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
  it('空の tmp に作り、既存の dir には作らず投げる', () => {
    const root = tempDir();
    const parent = join(root, 'cycles');
    mkdirSync(parent, { recursive: true });
    const leafName = cycleDirName(16, '261010', 'main');
    const leaf = createLeafDir(parent, leafName);
    expect(leaf).toBe(join(parent, leafName));
    expect(existsSync(leaf)).toBe(true);
    expect(() => createLeafDir(parent, leafName)).toThrow();
  });
});

describe('dirNames', () => {
  it('両ルートの dir 名を集め、無いルートは空として扱う', () => {
    const root = tempDir();
    const cyclesDir = join(root, 'cycles');
    const archiveDir = join(cyclesDir, 'archive');
    const cycleName = cycleDirName(15, '261010', 'main');
    const oldName = '014-2026-10-09';
    mkdirSync(join(cyclesDir, cycleName), { recursive: true });
    mkdirSync(join(archiveDir, oldName), { recursive: true });
    const expected = [oldName, cycleName, 'archive'].toSorted();
    expect(dirNames(cyclesDir, archiveDir).toSorted()).toEqual(expected);
    const emptyRoot = tempDir();
    expect(dirNames(join(emptyRoot, 'cycles'), join(emptyRoot, 'cycles', 'archive'))).toEqual([]);
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
  it('採用した形の4つの操作と、採用しなかった理由を含む', () => {
    const skeleton = entrySkeleton(1);
    expect(skeleton).toContain('Add:');
    expect(skeleton).toContain('Update:');
    expect(skeleton).toContain('Drop:');
    expect(skeleton).toContain('Keep:');
    expect(skeleton).toContain('Cost:');
    expect(skeleton).toContain('採用しなかった理由');
  });

  it('adr.format.md のエントリーの見出しと一致する', () => {
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
  it('## NN: を持つ markdown から、その最大値を返す', () => {
    expect(lastEntryNumber(adrSkeleton(7))).toBe(1);
    expect(lastEntryNumber(appendEntry(adrSkeleton(7), 2))).toBe(2);
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
  it('次の番号のエントリーを足し、# ADR は1つのまま', () => {
    const cases = [
      { base: adrSkeleton(7), next: 2 },
      { base: appendEntry(adrSkeleton(7), 2), next: 3 },
    ];
    for (const { base, next: nextNo } of cases) {
      const nn = String(nextNo).padStart(2, '0');
      const next = appendEntry(base, nextNo);
      expect(next).toContain(`## ${nn}: <問い>`);
      expect(next).toContain(`\n\n## ${nn}: <問い>`);
      expect(next.match(/^# ADR /gm) ?? []).toHaveLength(1);
      const lastSharp = next.split('\n').findLast((line) => line.startsWith('## '));
      expect(lastSharp).toBe(`## ${nn}: <問い>`);
    }
  });

  it('エントリーのない markdown → ## 01: を足す', () => {
    const markdown = '# ADR 007\n';
    const next = appendEntry(markdown, 1);
    expect(next).toContain('## 01: <問い>');
    expect(next).toContain('\n\n## 01: <問い>');
    expect(lastEntryNumber(next)).toBe(1);
  });
});

describe('openCycleDir', () => {
  it('adr.md を持ち close.md を持たないサイクルが1つ → その dir を返す', () => {
    const root = tempDir();
    const cyclesDir = join(root, 'cycles');
    const name = cycleDirName(15, '261010', 'main');
    mkdirSync(join(cyclesDir, name), { recursive: true });
    writeFileSync(join(cyclesDir, name, 'adr.md'), adrSkeleton(15));
    expect(openCycleDir(cyclesDir)).toBe(join(cyclesDir, name));
  });

  it('adr.md を持つサイクルがなければ → null を返す', () => {
    const root = tempDir();
    expect(openCycleDir(join(root, 'cycles'))).toBe(null);
  });

  it('dir はあるが adr.md がなければ → null を返す', () => {
    const root = tempDir();
    const cyclesDir = join(root, 'cycles');
    mkdirSync(join(cyclesDir, cycleDirName(15, '261010', 'main')), { recursive: true });
    expect(openCycleDir(cyclesDir)).toBe(null);
  });

  it('close.md を持つだけ → null を返す', () => {
    const root = tempDir();
    const cyclesDir = join(root, 'cycles');
    const name = cycleDirName(15, '261010', 'main');
    mkdirSync(join(cyclesDir, name), { recursive: true });
    writeFileSync(join(cyclesDir, name, 'adr.md'), adrSkeleton(15));
    writeFileSync(join(cyclesDir, name, 'close.md'), '# Close\n');
    expect(openCycleDir(cyclesDir)).toBe(null);
  });

  it('開いたサイクルが2つ → NNN の大きい方を返す', () => {
    const root = tempDir();
    const cyclesDir = join(root, 'cycles');
    const first = cycleDirName(15, '261010', 'main');
    const second = cycleDirName(16, '261011', 'main');
    for (const name of [first, second]) {
      mkdirSync(join(cyclesDir, name), { recursive: true });
      writeFileSync(join(cyclesDir, name, 'adr.md'), adrSkeleton(15));
    }
    expect(openCycleDir(cyclesDir)).toBe(join(cyclesDir, second));
  });
});

describe('affectedEntrySkeleton', () => {
  it('affected.format.md の見出しとブロックを持つ', () => {
    const skeleton = affectedEntrySkeleton(1);
    const headings = skeleton.split('\n').filter((line) => line.startsWith('#'));
    expect(headings).toEqual(['## 01: <問い>', '### Code', '### External']);
    expect(skeleton).toContain('- Path: `');
    expect(skeleton).toContain('- Kind: `module` | `test` | `doc` | `config` | `artifact` | `dir`');
    expect(skeleton).toContain('- Edge: `needs` | `names` | `mentions` | `checks` | `contains` `');
    expect(skeleton).toContain('- Name: `');
    expect(skeleton).toContain('- Kind: `env` | `contract` | `data` | `path` | `limit`');
    expect(skeleton).toContain('- Used by: `');
  });

  it('affected.md の骨組みは # Affected で始まり、渡したエントリー番号を持つ', () => {
    expect(affectedSkeleton(15, 1).startsWith('# Affected 015\n')).toBe(true);
    expect(affectedSkeleton(15, 1)).toContain('## 01: <問い>');
    expect(affectedSkeleton(15, 3).startsWith('# Affected 015\n')).toBe(true);
    expect(affectedSkeleton(15, 3)).toContain('## 03: <問い>');
  });
});

describe('CLI open cycle', () => {
  const script = fileURLToPath(new URL('./index.mjs', import.meta.url));

  it('開いたサイクルでは adr.md に ## NN: が1つ増える', () => {
    const root = tempDir();
    const cyclesDir = join(root, 'cycles');
    const name = cycleDirName(15, '261010', 'main');
    mkdirSync(join(cyclesDir, name), { recursive: true });
    writeFileSync(join(cyclesDir, name, 'adr.md'), adrSkeleton(15));
    const before = readdirSync(cyclesDir).toSorted();
    const done = spawnSync(process.execPath, [script, '--root', root], { encoding: 'utf8' });
    expect(done.status).toBe(0);
    expect(readdirSync(cyclesDir).toSorted()).toEqual(before);
    const after = readFileSync(join(cyclesDir, name, 'adr.md'), 'utf8');
    expect(after).toContain('## 02: <問い>');
    expect(after.match(/^# ADR /gm) ?? []).toHaveLength(1);
    expect(lastEntryNumber(after)).toBe(2);
  });

  it('## 02: を持つ開いたサイクルでは ## 03: が増える', () => {
    const root = tempDir();
    const cyclesDir = join(root, 'cycles');
    const name = cycleDirName(15, '261010', 'main');
    mkdirSync(join(cyclesDir, name), { recursive: true });
    writeFileSync(join(cyclesDir, name, 'adr.md'), appendEntry(adrSkeleton(15), 2));
    const before = readdirSync(cyclesDir).toSorted();
    const done = spawnSync(process.execPath, [script, '--root', root], { encoding: 'utf8' });
    expect(done.status).toBe(0);
    expect(readdirSync(cyclesDir).toSorted()).toEqual(before);
    const after = readFileSync(join(cyclesDir, name, 'adr.md'), 'utf8');
    expect(after).toContain('\n\n## 03: <問い>');
    expect(after.match(/^# ADR /gm) ?? []).toHaveLength(1);
    expect(lastEntryNumber(after)).toBe(3);
  });

  it('閉じたサイクルでは adr.md が変わらず新しい dir ができる', () => {
    const root = tempDir();
    const cyclesDir = join(root, 'cycles');
    const name = cycleDirName(15, '261010', 'main');
    mkdirSync(join(cyclesDir, name), { recursive: true });
    writeFileSync(join(cyclesDir, name, 'adr.md'), adrSkeleton(15));
    writeFileSync(join(cyclesDir, name, 'close.md'), '# Close\n');
    const beforeAdr = readFileSync(join(cyclesDir, name, 'adr.md'), 'utf8');
    const before = readdirSync(cyclesDir).toSorted();
    const done = spawnSync(process.execPath, [script, '--root', root], { encoding: 'utf8' });
    expect(done.status).toBe(0);
    expect(readFileSync(join(cyclesDir, name, 'adr.md'), 'utf8')).toBe(beforeAdr);
    expect(readdirSync(cyclesDir).toSorted().length).toBe(before.length + 1);
  });

  it('サイクルが無い場合も新しい dir ができる', () => {
    const root = tempDir();
    const done = spawnSync(process.execPath, [script, '--root', root], { encoding: 'utf8' });
    expect(done.status).toBe(0);
    const cyclesDir = join(root, 'cycles');
    expect(existsSync(cyclesDir)).toBe(true);
    expect(readdirSync(cyclesDir).length).toBe(1);
  });

  it('開いたサイクルがあるときに <nnn> を渡す → 理由付きで止まる', () => {
    const root = tempDir();
    const cyclesDir = join(root, 'cycles');
    const name = cycleDirName(15, '261010', 'main');
    mkdirSync(join(cyclesDir, name), { recursive: true });
    writeFileSync(join(cyclesDir, name, 'adr.md'), adrSkeleton(15));
    const beforeAdr = readFileSync(join(cyclesDir, name, 'adr.md'), 'utf8');
    const done = spawnSync(process.execPath, [script, '--root', root, '17'], { encoding: 'utf8' });
    expect(done.status).not.toBe(0);
    expect(`${done.stderr}${done.stdout}`).toMatch(/open cycle exists/);
    expect(readFileSync(join(cyclesDir, name, 'adr.md'), 'utf8')).toBe(beforeAdr);
  });

  it('開いたサイクルで adr.md と affected.md の両方に次のエントリーが追記される → 両ファイルに ## 02: が増える', () => {
    const root = tempDir();
    const cyclesDir = join(root, 'cycles');
    const name = cycleDirName(15, '261010', 'main');
    mkdirSync(join(cyclesDir, name), { recursive: true });
    writeFileSync(join(cyclesDir, name, 'adr.md'), adrSkeleton(15));
    writeFileSync(join(cyclesDir, name, 'affected.md'), affectedSkeleton(15, 1));
    const done = spawnSync(process.execPath, [script, '--root', root], { encoding: 'utf8' });
    expect(done.status).toBe(0);
    const adrAfter = readFileSync(join(cyclesDir, name, 'adr.md'), 'utf8');
    const affectedAfter = readFileSync(join(cyclesDir, name, 'affected.md'), 'utf8');
    expect(adrAfter).toContain('## 02: <問い>');
    expect(affectedAfter).toContain('## 02: <問い>');
  });

  it('開いたサイクルがなければ adr.md と affected.md が作られる → 両ファイルができる', () => {
    const root = tempDir();
    const done = spawnSync(process.execPath, [script, '--root', root], { encoding: 'utf8' });
    expect(done.status).toBe(0);
    const cyclesDir = join(root, 'cycles');
    const names = readdirSync(cyclesDir);
    expect(names).toHaveLength(1);
    const leaf = join(cyclesDir, names[0]);
    expect(existsSync(join(leaf, 'adr.md'))).toBe(true);
    expect(existsSync(join(leaf, 'affected.md'))).toBe(true);
    const affected = readFileSync(join(leaf, 'affected.md'), 'utf8');
    expect(affected.startsWith('# Affected 001\n')).toBe(true);
    expect(affected).toContain('## 01: <問い>');
  });

  it('開いたサイクルで affected.md がない → サイクル番号の見出しと ## 03: が書かれる', () => {
    const root = tempDir();
    const cyclesDir = join(root, 'cycles');
    const name = cycleDirName(15, '261010', 'main');
    mkdirSync(join(cyclesDir, name), { recursive: true });
    writeFileSync(join(cyclesDir, name, 'adr.md'), appendEntry(adrSkeleton(15), 2));
    const done = spawnSync(process.execPath, [script, '--root', root], { encoding: 'utf8' });
    expect(done.status).toBe(0);
    const affectedAfter = readFileSync(join(cyclesDir, name, 'affected.md'), 'utf8');
    expect(affectedAfter.startsWith('# Affected 015\n')).toBe(true);
    expect(affectedAfter).toContain('## 03: <問い>');
  });
});
