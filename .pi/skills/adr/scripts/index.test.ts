import { spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { tempDir } from '../../../../test/temp-dir.ts';
import { adrSkeleton, checkEntry, entrySkeleton } from './adr.mjs';
import { affectedEntrySkeleton } from './affected.mjs';
import {
  appendEntry,
  createLeafDir,
  cycleDirName,
  deleteEntry,
  dirNames,
  entryNumbers,
  lastEntryNumber,
  nextNNN,
  openCycleDir,
  parseArgs,
  renumberEntries,
  setEntryTitle,
  setEntryType,
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

  it('題名を渡すと最初のエントリーに見出しとして入る', () => {
    expect(adrSkeleton(7, '題名')).toContain('## 01: 題名');
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
    expect(nextNNN([])).toBe(1);
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
  it('空 → すべて null と false', () => {
    expect(parseArgs([])).toEqual({
      root: process.cwd(),
      add: null,
      del: null,
      set: null,
      check: false,
    });
  });

  it('--root を読む', () => {
    const root = '/tmp/x';
    expect(parseArgs(['--root', root])).toEqual({
      root,
      add: null,
      del: null,
      set: null,
      check: false,
    });
  });

  it('--add は題名と Full になる', () => {
    expect(parseArgs(['--add', '題名']).add).toEqual({ title: '題名', type: 'Full' });
  });

  it('--add 題名 Simple は Simple になる', () => {
    expect(parseArgs(['--add', '題名', 'Simple']).add).toEqual({ title: '題名', type: 'Simple' });
  });

  it('--delete は番号になる', () => {
    expect(parseArgs(['--delete', '2']).del).toBe(2);
  });

  it('--set は番号と題名になり Type は null になる', () => {
    expect(parseArgs(['--set', '2', '題名']).set).toEqual({ nn: 2, title: '題名', type: null });
  });

  it('--set 2 題名 Full は Type 付きになる', () => {
    expect(parseArgs(['--set', '2', '題名', 'Full']).set).toEqual({
      nn: 2,
      title: '題名',
      type: 'Full',
    });
  });

  it('--check は検査の印になる', () => {
    expect(parseArgs(['--check']).check).toBe(true);
  });

  it('数でない --delete は投げる', () => {
    for (const input of ['abc', '1.5', '0']) {
      expect(() => parseArgs(['--delete', input])).toThrow();
    }
  });

  it('値の欠落は投げる', () => {
    expect(() => parseArgs(['--root'])).toThrow();
    expect(() => parseArgs(['--add'])).toThrow();
    expect(() => parseArgs(['--delete'])).toThrow();
    expect(() => parseArgs(['--set', '1'])).toThrow();
  });

  it('操作の併用は投げる', () => {
    expect(() => parseArgs(['--add', 'a', '--check'])).toThrow(/too many/);
    expect(() => parseArgs(['--delete', '1', '--set', '1', 'a'])).toThrow(/too many/);
  });

  it('位置引数は投げる', () => {
    expect(() => parseArgs(['017'])).toThrow(/unknown argument/);
  });

  it('未知の引数は投げる', () => {
    expect(() => parseArgs(['--unknown'])).toThrow(/unknown argument/);
  });
});

describe('entrySkeleton', () => {
  it('採用した形の3つの操作と、Policy を含む', () => {
    const skeleton = entrySkeleton(1);
    expect(skeleton).toContain('Add:');
    expect(skeleton).toContain('Update:');
    expect(skeleton).toContain('Drop:');
    expect(skeleton).toContain('Policy:');
    expect(skeleton).toContain('Allowed:');
    expect(skeleton).toContain('Forbidden:');
    expect(skeleton).toContain('Main:');
    expect(skeleton).toContain('Sub:');
    expect(skeleton).toContain('#### Details');
    expect(skeleton).toContain('  ```text');
    expect(skeleton).toContain('出所: <出所>');
    expect(skeleton).toContain('Type: _Full_');
  });

  it('adr.format.md のエントリーの見出しと一致する', () => {
    const headings = entrySkeleton(1)
      .split('\n')
      .filter((line) => line.startsWith('#'));
    const expected = [
      '## 01: <問い>',
      '### Context',
      '### Research & Trial',
      '### Scope',
      '### Decision',
      '#### Details',
      '### Definition',
    ];
    expect(headings).toEqual(expected);
  });

  it('Scope は In と Out を持つ', () => {
    const skeleton = entrySkeleton(1);
    expect(skeleton).toContain('- In:');
    expect(skeleton).toContain('- Out:');
  });

  it('題名を渡すと見出しに入る', () => {
    expect(entrySkeleton(2, '題名')).toContain('## 02: 題名');
  });
});

const entry = (
  decision: string,
  context = '- C1: 前提\n- C2: 制約',
  research = '- F1: 事実',
  bodies: { details?: string; scope?: string } = {},
) => {
  const { details = '- 例\n  ```text\n  何か\n  ```', scope = '- In:\n  - format: 何か' } = bodies;
  return `# ADR 001

## 01: <問い>

Type: _Full_

### Context

${context}

### Research & Trial

${research}

### Scope

${scope}

### Decision

${decision}

#### Details

${details}

### Definition

- \`Unit.<name>\`(updated): 新しい行
`;
};

const decision = (lines: string) => `- Status:
- Main: この関心事は、何がどうなるか
${lines}
`;

describe('checkEntry', () => {
  it('(happy) Policy で C と F を参照する決定 → 抜けは空', () => {
    const markdown = entry(
      decision(
        '  - Add:\n      - 何か（C1, F1）\n- Policy:\n  - Allowed:\n    - 何か（C2）\n  - Forbidden:\n    - なし',
      ),
    );
    expect(checkEntry(markdown)).toEqual([]);
  });

  it('(error) C2 を参照しない決定 → C2 を抜けとして返す', () => {
    const markdown = entry(decision('  - Add:\n      - 何か（C1, F1）'));
    expect(checkEntry(markdown)).toEqual(['01: Decision does not carry C2']);
  });

  it('(error) どの行も参照しない F3 → F3 を抜けとして返す', () => {
    const markdown = entry(
      decision('  - Add:\n      - 何か（C1, C2, F1）'),
      '- C1: 前提\n- C2: 制約',
      '- F1: 事実\n- F3: 事実',
    );
    expect(checkEntry(markdown)).toEqual(['01: F3 is not weighed']);
  });

  it('(happy) F のラベルを外した事実は、Decision に載らなくても通る', () => {
    const markdown = entry(
      decision('  - Add:\n      - 何か（C1, C2, F1）'),
      '- C1: 前提\n- C2: 制約',
      '- F1: 事実\n- 使わなかった事実',
    );
    expect(checkEntry(markdown)).toEqual([]);
  });

  it('(happy) Details のフェンス内の括弧は参照として数えない', () => {
    const markdown = entry(
      decision(
        '  - Add:\n      - 何か（C1, C2, F1）\n- Policy:\n  - Allowed:\n    - なし\n  - Forbidden:\n    - なし\n\n#### Details\n\n- 例\n  ```text\n  何か（C9, F9）\n  ```',
      ),
    );
    expect(checkEntry(markdown)).toEqual([]);
  });

  it('(error) C9 への参照 → 未知の番号として返す', () => {
    const markdown = entry(decision('  - Add:\n      - 何か（C1, C2, F1, C9）'));
    expect(checkEntry(markdown)).toEqual(['01: Decision refers to unknown C9']);
  });

  it('(error) F9 への参照 → 未知の番号として返す', () => {
    const markdown = entry(decision('  - Add:\n      - 何か（C1, C2, F1, F9）'));
    expect(checkEntry(markdown)).toEqual(['01: Decision refers to unknown F9']);
  });

  it('(error) 同じ番号が2回出る → 重複として返す', () => {
    const markdown = entry(
      decision(
        '  - Add:\n      - 何か（C1, F1）\n- Policy:\n  - Allowed:\n    - 何か（C1, C2）\n  - Forbidden:\n    - なし',
      ),
      '- C1: 前提\n- C1: 制約\n- C2: 制約',
    );
    expect(checkEntry(markdown)).toEqual(['01: C1 is used twice']);
  });

  it('(empty) Context の項目がない → 抜けは空', () => {
    const markdown = entry(decision('  - Add:\n      - 何か'), '', '');
    expect(checkEntry(markdown)).toEqual([]);
  });
  it('(happy) Sub の行が C を運ぶ → 抜けは空', () => {
    const markdown = entry(
      decision(
        '  - Add:\n      - 何か（C1, F1）\n- Sub: 追加の関心事\n  - Add:\n      - 何か（C2）\n- Policy:\n  - Allowed:\n    - なし\n  - Forbidden:\n    - なし',
      ),
    );
    expect(checkEntry(markdown)).toEqual([]);
  });
});

describe('checkEntry の Type', () => {
  const carried =
    '  - Add:\n      - 何か（C1, F1）\n- Policy:\n  - Allowed:\n    - 何か（C2）\n  - Forbidden:\n    - なし';
  const full = () => entry(decision(carried));

  it('(error) Type がない → Type is missing を返す', () => {
    expect(checkEntry(full().replace('Type: _Full_\n\n', ''))).toEqual(['01: Type is missing']);
  });

  it('(error) Type の値が違う → Type is not _Full_ or _Simple_ を返す', () => {
    expect(checkEntry(full().replace('Type: _Full_', 'Type: _Foo_'))).toEqual([
      '01: Type is not _Full_ or _Simple_: _Foo_',
    ]);
  });

  it('(error) Simple の Scope が書いてある → Simple Scope is not _omission_ を返す', () => {
    const markdown = entry(decision(carried), undefined, undefined, {
      details: '_omission_',
    }).replace('Type: _Full_', 'Type: _Simple_');
    expect(checkEntry(markdown)).toEqual(['01: Simple Scope is not _omission_']);
  });

  it('(error) Simple の Details が書いてある → Simple Details is not _omission_ を返す', () => {
    const markdown = entry(decision(carried), undefined, undefined, {
      scope: '_omission_',
    }).replace('Type: _Full_', 'Type: _Simple_');
    expect(checkEntry(markdown)).toEqual(['01: Simple Details is not _omission_']);
  });

  it('(error) Full の Scope が _omission_ → Full Scope is _omission_ を返す', () => {
    const markdown = entry(decision(carried), undefined, undefined, { scope: '_omission_' });
    expect(checkEntry(markdown)).toEqual(['01: Full Scope is _omission_']);
  });

  it('(error) Full の Details が _omission_ → Full Details is _omission_ を返す', () => {
    const markdown = entry(decision(carried), undefined, undefined, { details: '_omission_' });
    expect(checkEntry(markdown)).toEqual(['01: Full Details is _omission_']);
  });
});

describe('entrySkeleton の Type', () => {
  it('(happy) Full → Type: _Full_ と Scope/Details の骨組み', () => {
    const skeleton = entrySkeleton(1, '題名', 'Full');
    expect(skeleton).toContain('Type: _Full_');
    expect(skeleton).toContain('- In:');
    expect(skeleton).toContain('```text');
  });

  it('(happy) Simple → Type: _Simple_ と Scope/Details の _omission_', () => {
    const skeleton = entrySkeleton(1, '題名', 'Simple');
    expect(skeleton).toContain('Type: _Simple_');
    expect(skeleton).toContain('### Scope\n\n_omission_');
    expect(skeleton).toContain('#### Details\n\n_omission_');
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

describe('entryNumbers', () => {
  it('出現順に番号を返す', () => {
    const markdown = appendEntry(appendEntry(adrSkeleton(7), 2, '二'), 3, '三');
    expect(entryNumbers(markdown)).toEqual([1, 2, 3]);
  });
});

describe('setEntryType', () => {
  it('(happy) Full → Type 行と Scope/Details を Full の形にし、題名を変える', () => {
    const markdown = appendEntry(adrSkeleton(7, '一', 'Simple'), 2, '二', 'Simple');
    const next = setEntryType(markdown, 2, '新', 'Full');
    expect(next).toContain('## 02: 新\n\nType: _Full_');
    expect(next).toContain('- In:');
  });

  it('(happy) Simple → Type 行と Scope/Details を _omission_ にし、題名を変える', () => {
    const markdown = adrSkeleton(7, '一');
    const next = setEntryType(markdown, 1, '新', 'Simple');
    expect(next).toContain('## 01: 新\n\nType: _Simple_');
    expect(next).toContain('### Scope\n\n_omission_');
    expect(next).toContain('#### Details\n\n_omission_');
  });

  it('ない番号 → 投げる', () => {
    expect(() => setEntryType(adrSkeleton(7), 9, '新', 'Full')).toThrow(/entry not found/);
  });
});

describe('setEntryTitle', () => {
  it('指定番号の題名を置き換える', () => {
    const markdown = appendEntry(adrSkeleton(7), 2, '旧');
    const next = setEntryTitle(markdown, 2, '新');
    expect(next).toContain('## 02: 新');
    expect(next).not.toContain('旧');
    expect(next).toContain('## 01: <問い>');
  });

  it('ない番号 → 投げる', () => {
    expect(() => setEntryTitle(adrSkeleton(7), 9, '新')).toThrow(/entry not found/);
  });
});

describe('deleteEntry', () => {
  it('指定番号を削除し、残りを振り直す', () => {
    const markdown = appendEntry(appendEntry(adrSkeleton(7, '一'), 2, '二'), 3, '三');
    const next = deleteEntry(markdown, 2);
    expect(entryNumbers(next)).toEqual([1, 2]);
    expect(next).toContain('## 01: 一');
    expect(next).toContain('## 02: 三');
    expect(next).not.toContain('二');
  });

  it('ない番号 → 投げる', () => {
    expect(() => deleteEntry(adrSkeleton(7), 9)).toThrow(/entry not found/);
  });
});

describe('renumberEntries', () => {
  it('飛んだ番号を詰める', () => {
    const markdown = '# ADR 007\n\n## 01: 一\n\n## 03: 三\n';
    expect(entryNumbers(renumberEntries(markdown))).toEqual([1, 2]);
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
      const next = appendEntry(base, nextNo, '題名');
      expect(next).toContain(`## ${nn}: 題名`);
      expect(next).toContain(`\n\n## ${nn}: 題名`);
      expect(next.match(/^# ADR /gm) ?? []).toHaveLength(1);
      const lastSharp = next.split('\n').findLast((line) => line.startsWith('## '));
      expect(lastSharp).toBe(`## ${nn}: 題名`);
      expect(lastEntryNumber(next)).toBe(nextNo);
    }
  });

  it('エントリーのない markdown → ## 01: を足す', () => {
    const markdown = '# ADR 007\n';
    const next = appendEntry(markdown, 1, '題名');
    expect(next).toContain('## 01: 題名');
    expect(next).toContain('\n\n## 01: 題名');
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
    expect(headings).toEqual(['## 01: <問い>', '### Keywords', '### Code', '### External']);
    expect(skeleton).toContain('- `<キーワード>`');
    expect(skeleton).toContain('- Path: `');
    expect(skeleton).toContain('- Kind: `module` | `test` | `doc` | `config` | `artifact` | `dir`');
    expect(skeleton).toContain(
      '- Edge: `needs` | `names` | `mentions` | `checks` | `contains` | `defines` `',
    );
    expect(skeleton).toContain('- Name: `');
    expect(skeleton).toContain('- Kind: `env` | `contract` | `event` | `data` | `path` | `limit`');
    expect(skeleton).toContain('- Used by: `');
  });

  it('題名を渡すと見出しに入る', () => {
    expect(affectedEntrySkeleton(2, '題名')).toContain('## 02: 題名');
  });
});

describe('CLI', () => {
  const script = fileURLToPath(new URL('./index.mjs', import.meta.url));

  it('--add は開いたサイクルの adr.md に追記し、affected のファイルを作る', () => {
    const root = tempDir();
    const cyclesDir = join(root, 'cycles');
    const name = cycleDirName(15, '261010', 'main');
    mkdirSync(join(cyclesDir, name), { recursive: true });
    writeFileSync(join(cyclesDir, name, 'adr.md'), adrSkeleton(15, '一'));
    mkdirSync(join(cyclesDir, name, 'affected'), { recursive: true });
    writeFileSync(join(cyclesDir, name, 'affected', '01.md'), affectedEntrySkeleton(1, '一'));
    const done = spawnSync(process.execPath, [script, '--root', root, '--add', '二'], {
      encoding: 'utf8',
    });
    expect(done.status).toBe(0);
    const adrAfter = readFileSync(join(cyclesDir, name, 'adr.md'), 'utf8');
    const affectedAfter = readFileSync(join(cyclesDir, name, 'affected', '02.md'), 'utf8');
    expect(adrAfter).toContain('## 02: 二');
    expect(affectedAfter).toContain('## 02: 二');
    expect(adrAfter.match(/^# ADR /gm) ?? []).toHaveLength(1);
  });

  it('--add はサイクルがなければ題名付きで新規作成する', () => {
    const root = tempDir();
    const done = spawnSync(process.execPath, [script, '--root', root, '--add', '一'], {
      encoding: 'utf8',
    });
    expect(done.status).toBe(0);
    const names = readdirSync(join(root, 'cycles'));
    expect(names).toHaveLength(1);
    const leaf = join(join(root, 'cycles'), names[0]);
    expect(readFileSync(join(leaf, 'adr.md'), 'utf8')).toContain('## 01: 一');
    expect(readFileSync(join(leaf, 'affected', '01.md'), 'utf8')).toContain('## 01: 一');
  });

  it('--add は Simple では Type と omission を書く', () => {
    const root = tempDir();
    const cyclesDir = join(root, 'cycles');
    const name = cycleDirName(15, '261010', 'main');
    mkdirSync(join(cyclesDir, name), { recursive: true });
    writeFileSync(join(cyclesDir, name, 'adr.md'), adrSkeleton(15, '一'));
    mkdirSync(join(cyclesDir, name, 'affected'), { recursive: true });
    writeFileSync(join(cyclesDir, name, 'affected', '01.md'), affectedEntrySkeleton(1, '一'));
    const done = spawnSync(process.execPath, [script, '--root', root, '--add', '二', 'Simple'], {
      encoding: 'utf8',
    });
    expect(done.status).toBe(0);
    const adrAfter = readFileSync(join(cyclesDir, name, 'adr.md'), 'utf8');
    expect(adrAfter).toContain('## 02: 二');
    expect(adrAfter).toContain('Type: _Simple_');
    expect(adrAfter).toContain('### Scope\n\n_omission_');
    expect(adrAfter).toContain('#### Details\n\n_omission_');
    expect(readFileSync(join(cyclesDir, name, 'affected', '02.md'), 'utf8')).toContain('## 02: 二');
  });

  it('--delete は adr と affected から削除して振り直す', () => {
    const root = tempDir();
    const cyclesDir = join(root, 'cycles');
    const name = cycleDirName(15, '261010', 'main');
    mkdirSync(join(cyclesDir, name), { recursive: true });
    const adr = appendEntry(appendEntry(adrSkeleton(15, '一'), 2, '二'), 3, '三');
    writeFileSync(join(cyclesDir, name, 'adr.md'), adr);
    const affectedDir = join(cyclesDir, name, 'affected');
    mkdirSync(affectedDir, { recursive: true });
    writeFileSync(join(affectedDir, '01.md'), affectedEntrySkeleton(1, '一'));
    writeFileSync(join(affectedDir, '02.md'), affectedEntrySkeleton(2, '二'));
    writeFileSync(join(affectedDir, '03.md'), affectedEntrySkeleton(3, '三'));
    const done = spawnSync(process.execPath, [script, '--root', root, '--delete', '2'], {
      encoding: 'utf8',
    });
    expect(done.status).toBe(0);
    const adrAfter = readFileSync(join(cyclesDir, name, 'adr.md'), 'utf8');
    expect(adrAfter).toContain('## 01: 一');
    expect(adrAfter).toContain('## 02: 三');
    expect(adrAfter).not.toContain('二');
    expect(readFileSync(join(affectedDir, '01.md'), 'utf8')).toContain('## 01: 一');
    expect(readFileSync(join(affectedDir, '02.md'), 'utf8')).toContain('## 02: 三');
    expect(existsSync(join(affectedDir, '03.md'))).toBe(false);
  });

  it('--set は両ファイルの題名を置き換える', () => {
    const root = tempDir();
    const cyclesDir = join(root, 'cycles');
    const name = cycleDirName(15, '261010', 'main');
    mkdirSync(join(cyclesDir, name), { recursive: true });
    writeFileSync(join(cyclesDir, name, 'adr.md'), adrSkeleton(15, '旧'));
    mkdirSync(join(cyclesDir, name, 'affected'), { recursive: true });
    writeFileSync(join(cyclesDir, name, 'affected', '01.md'), affectedEntrySkeleton(1, '旧'));
    const done = spawnSync(process.execPath, [script, '--root', root, '--set', '1', '新'], {
      encoding: 'utf8',
    });
    expect(done.status).toBe(0);
    expect(readFileSync(join(cyclesDir, name, 'adr.md'), 'utf8')).toContain('## 01: 新');
    expect(readFileSync(join(cyclesDir, name, 'affected', '01.md'), 'utf8')).toContain('## 01: 新');
  });

  it('--set は Type なしでは Type 行を変えない', () => {
    const root = tempDir();
    const cyclesDir = join(root, 'cycles');
    const name = cycleDirName(15, '261010', 'main');
    mkdirSync(join(cyclesDir, name), { recursive: true });
    writeFileSync(join(cyclesDir, name, 'adr.md'), adrSkeleton(15, '旧', 'Simple'));
    mkdirSync(join(cyclesDir, name, 'affected'), { recursive: true });
    writeFileSync(join(cyclesDir, name, 'affected', '01.md'), affectedEntrySkeleton(1, '旧'));
    const done = spawnSync(process.execPath, [script, '--root', root, '--set', '1', '新'], {
      encoding: 'utf8',
    });
    expect(done.status).toBe(0);
    const adrAfter = readFileSync(join(cyclesDir, name, 'adr.md'), 'utf8');
    expect(adrAfter).toContain('## 01: 新');
    expect(adrAfter).toContain('Type: _Simple_');
    expect(adrAfter).toContain('### Scope\n\n_omission_');
  });

  it('--set は Type ありでは Type 行と本文を変える', () => {
    const root = tempDir();
    const cyclesDir = join(root, 'cycles');
    const name = cycleDirName(15, '261010', 'main');
    mkdirSync(join(cyclesDir, name), { recursive: true });
    writeFileSync(join(cyclesDir, name, 'adr.md'), adrSkeleton(15, '旧'));
    mkdirSync(join(cyclesDir, name, 'affected'), { recursive: true });
    writeFileSync(join(cyclesDir, name, 'affected', '01.md'), affectedEntrySkeleton(1, '旧'));
    const done = spawnSync(
      process.execPath,
      [script, '--root', root, '--set', '1', '新', 'Simple'],
      {
        encoding: 'utf8',
      },
    );
    expect(done.status).toBe(0);
    const adrAfter = readFileSync(join(cyclesDir, name, 'adr.md'), 'utf8');
    expect(adrAfter).toContain('## 01: 新');
    expect(adrAfter).toContain('Type: _Simple_');
    expect(adrAfter).toContain('### Scope\n\n_omission_');
    expect(adrAfter).toContain('#### Details\n\n_omission_');
    expect(readFileSync(join(cyclesDir, name, 'affected', '01.md'), 'utf8')).toContain('## 01: 新');
  });

  it('--check は不足がなければ通る', () => {
    const root = tempDir();
    const cyclesDir = join(root, 'cycles');
    const name = cycleDirName(15, '261010', 'main');
    mkdirSync(join(cyclesDir, name), { recursive: true });
    const adr = `# ADR 015\n\n## 01: 問い\n\nType: _Full_\n\n### Context\n\n- C1: 前提\n\n### Research & Trial\n\n- F1: 事実\n\n### Scope\n\n- In:\n  - format: 何か\n\n### Decision\n\n- Status:\n- Main: この関心事は、何がどうなるか\n  - Add:\n    - 何か（C1, F1）\n  - Update:\n    - なし\n  - Drop:\n    - なし\n- Policy:\n  - Allowed:\n    - なし\n  - Forbidden:\n    - なし\n\n### Definition\n\n- \`Unit.<name>\`(updated): 新しい行\n`;
    writeFileSync(join(cyclesDir, name, 'adr.md'), adr);
    const done = spawnSync(process.execPath, [script, '--root', root, '--check'], {
      encoding: 'utf8',
    });
    expect(done.status).toBe(0);
  });

  it('操作なしは理由付きで止まる', () => {
    const root = tempDir();
    const done = spawnSync(process.execPath, [script, '--root', root], { encoding: 'utf8' });
    expect(done.status).not.toBe(0);
    expect(`${done.stderr}${done.stdout}`).toMatch(/no operation/);
  });
});
