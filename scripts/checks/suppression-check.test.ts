/**
 * `scripts/checks/suppression-check.mjs` の検出・照合・呼び出しの入口を試す。
 *
 * 検出は文字列を `findSuppressions` に渡し、収集と照合は共有の `fakeRoot()` と
 * `writeFile`・`writeJson` で作った一時ツリーで試す。入口は子プロセスで試す。
 */

import { spawnSync } from 'node:child_process';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { fakeRoot, writeFile, writeJson } from '../../test/scripts.fixture.ts';
import {
  collectFiles,
  findAll,
  findSuppressions,
  hasReason,
  judge,
  loadAllow,
} from './suppression-check.mjs';

describe('suppression-check scan', () => {
  it('scan: boundary 文字列の中の // と指令 → コメントとして読まず、報告しない', () => {
    const out = findSuppressions(
      'a.ts',
      'const s = "// eslint-disable-next-line max-params -- x";\n',
    );
    expect(out).toEqual([]);
  });

  it('scan: boundary テンプレート文字列の中の指令 → 報告しない', () => {
    const out = findSuppressions(
      'a.ts',
      'const s = `// eslint-disable-next-line max-params -- x`;\n',
    );
    expect(out).toEqual([]);
  });

  it('scan: boundary ブロックコメントが行をまたぐ → 開始行で 1 件', () => {
    const out = findSuppressions(
      'a.ts',
      '/* eslint-disable max-params -- x\nstill comment */\ncode\n',
    );
    expect(out).toHaveLength(1);
    expect(out[0]?.line).toBe(1);
    expect(out[0]?.directive).toBe('eslint-disable');
  });

  it('scan: boundary 閉じない引用符 → 行末で code に戻り、次の行のコメントを読む', () => {
    const out = findSuppressions(
      'a.ts',
      "const s = 'oops\n// eslint-disable-next-line max-params -- x\ncode\n",
    );
    expect(out).toHaveLength(1);
    expect(out[0]?.line).toBe(2);
  });

  it('scan: boundary 正規表現の中の // の後ろに指令がない → 報告しない', () => {
    const out = findSuppressions('a.ts', 'const re = /ab//cd/;\n');
    expect(out).toEqual([]);
  });
});

describe('suppression-check directive', () => {
  it('directive: happy oxlint の 3 形 → scope が block、line、next-line', () => {
    const block = findSuppressions('a.ts', '// oxlint-disable max-params -- x\n');
    const line = findSuppressions('a.ts', '// oxlint-disable-line max-params -- x\n');
    const next = findSuppressions('a.ts', '// oxlint-disable-next-line max-params -- x\n');
    expect(block[0]?.scope).toBe('block');
    expect(line[0]?.scope).toBe('line');
    expect(next[0]?.scope).toBe('next-line');
    expect(block[0]?.tool).toBe('oxlint');
    expect(line[0]?.tool).toBe('oxlint');
    expect(next[0]?.tool).toBe('oxlint');
  });

  it('directive: happy eslint の綴り → tool が eslint', () => {
    const out = findSuppressions('a.ts', '// eslint-disable-next-line max-params -- x\n');
    expect(out).toHaveLength(1);
    expect(out[0]?.tool).toBe('eslint');
    expect(out[0]?.directive).toBe('eslint-disable-next-line');
  });

  it('directive: happy biome の 3 形 → tool が biome、scope が next-line、file、block', () => {
    const next = findSuppressions('a.ts', '// biome-ignore lint/style/useConst: reason\n');
    const file = findSuppressions('a.ts', '// biome-ignore-all lint/style/useConst: reason\n');
    const block = findSuppressions('a.ts', '// biome-ignore-start lint/style/useConst: reason\n');
    expect(next[0]?.tool).toBe('biome');
    expect(next[0]?.scope).toBe('next-line');
    expect(file[0]?.tool).toBe('biome');
    expect(file[0]?.scope).toBe('file');
    expect(block[0]?.tool).toBe('biome');
    expect(block[0]?.scope).toBe('block');
  });

  it('directive: happy @ts-expect-error、@ts-ignore、@ts-nocheck → rules が空', () => {
    for (const directive of ['@ts-expect-error', '@ts-ignore', '@ts-nocheck']) {
      const out = findSuppressions('a.ts', `// ${directive}\n`);
      expect(out).toHaveLength(1);
      expect(out[0]?.tool).toBe('tsc');
      expect(out[0]?.rules).toEqual([]);
    }
  });

  it('directive: boundary -enable と -end → 記録に残らない', () => {
    expect(findSuppressions('a.ts', '// oxlint-enable max-params\n')).toEqual([]);
    expect(findSuppressions('a.ts', '// eslint-enable max-params\n')).toEqual([]);
    expect(findSuppressions('a.ts', '// biome-ignore-end lint/style/useConst: reason\n')).toEqual(
      [],
    );
  });

  it('directive: boundary コメント本文の途中の語 → 記録に残らない', () => {
    const out = findSuppressions('a.ts', '// please use eslint-disable-next-line here\n');
    expect(out).toEqual([]);
  });
});

describe('suppression-check rules', () => {
  it('rules: happy カンマ区切り → 2 つの名前', () => {
    const out = findSuppressions(
      'a.ts',
      '// eslint-disable-next-line max-params, no-await-in-loop -- x\n',
    );
    expect(out[0]?.rules).toEqual(['max-params', 'no-await-in-loop']);
  });

  it('rules: happy -- の理由 → 理由を除いた名前', () => {
    const out = findSuppressions(
      'a.ts',
      '// eslint-disable-next-line max-params -- this is reason\n',
    );
    expect(out[0]?.rules).toEqual(['max-params']);
  });

  it('rules: happy biome の (値) → 値付きの名前', () => {
    const out = findSuppressions('a.ts', '// biome-ignore lint/style/useConst(value): reason\n');
    expect(out[0]?.rules).toEqual(['lint/style/useConst']);
  });

  it('rules: empty ルール名を省く → 空の配列', () => {
    const out = findSuppressions('a.ts', '// eslint-disable-next-line\n');
    expect(out).toHaveLength(1);
    expect(out[0]?.rules).toEqual([]);
  });
});

describe('suppression-check collect', () => {
  it('collect: happy 8 拡張子 → すべて集まる', () => {
    const root = fakeRoot();
    for (const name of ['a.js', 'b.jsx', 'c.ts', 'd.tsx', 'e.mts', 'f.cts', 'g.mjs', 'h.cjs']) {
      writeFile(root, name);
    }
    const out = collectFiles(root);
    expect(out).toHaveLength(8);
    expect(out).toContain('a.js');
    expect(out).toContain('h.cjs');
  });

  it('collect: happy .pi の中 → 集まる', () => {
    const root = fakeRoot();
    writeFile(root, '.pi/x.ts', 'ok\n');
    expect(collectFiles(root)).toContain('.pi/x.ts');
  });

  it('collect: boundary 生成物 → 飛ばす', () => {
    const root = fakeRoot();
    writeFile(root, 'node_modules/a.ts', 'ok\n');
    writeFile(root, 'dist/a.ts', 'ok\n');
    writeFile(root, '.next/a.ts', 'ok\n');
    writeFile(root, '.git/a.ts', 'ok\n');
    writeFile(root, 'keep.ts', 'ok\n');
    const out = collectFiles(root);
    expect(out).toEqual(['keep.ts']);
  });

  it('collect: empty md と json → 集めない', () => {
    const root = fakeRoot();
    writeFile(root, 'a.md', '# hi\n');
    writeFile(root, 'a.json', '{}\n');
    expect(collectFiles(root)).toEqual([]);
  });

  it('collect: happy findAll は (file, line) の順に並べる', () => {
    const root = fakeRoot();
    writeFile(root, 'b.ts', '// eslint-disable-next-line max-params -- x\n');
    writeFile(root, 'a.ts', 'ok\n// eslint-disable-next-line max-params -- x\n');
    const out = findAll(root);
    expect(out.map((s) => `${s.file}:${s.line}`)).toEqual(['a.ts:2', 'b.ts:1']);
    expect(out[0]?.before).toBe('ok');
  });
});

describe('suppression-check config', () => {
  it('config: happy 正しい形 → 読める', () => {
    const root = fakeRoot();
    writeJson(root, 'scripts/checks/suppression-check.json', {
      allow: [{ path: 'src/*.ts', rules: ['max-params'] }],
    });
    expect(loadAllow(root)).toEqual([{ path: 'src/*.ts', rules: ['max-params'] }]);
  });

  it('config: empty 設定がない → 許可なし', () => {
    expect(loadAllow(fakeRoot())).toEqual([]);
  });

  it('config: error allow 以外の鍵 → 理由を持つエラー', () => {
    const root = fakeRoot();
    writeJson(root, 'scripts/checks/suppression-check.json', { allow: [], extra: 1 });
    expect(reasonOf(() => loadAllow(root)).length).toBeGreaterThan(0);
  });

  it('config: error rules が空 → 理由を持つエラー', () => {
    const root = fakeRoot();
    writeJson(root, 'scripts/checks/suppression-check.json', {
      allow: [{ path: 'src/*.ts', rules: [] }],
    });
    expect(reasonOf(() => loadAllow(root)).length).toBeGreaterThan(0);
  });

  it('config: error JSON でない → 理由を持つエラー', () => {
    const root = fakeRoot();
    writeFile(root, 'scripts/checks/suppression-check.json', '{not json');
    expect(reasonOf(() => loadAllow(root)).length).toBeGreaterThan(0);
  });
});

describe('suppression-check match', () => {
  it('match: happy glob が一致し Reason がある → allowed', () => {
    const record = findSuppressions('src/a.ts', '// eslint-disable-next-line max-params -- x\n')[0];
    const out = judge({ ...record, file: 'src/a.ts', before: '// Reason: owner approved' }, [
      { path: 'src/*.ts', rules: ['max-params'] },
    ]);
    expect(out.kind).toBe('allowed');
  });

  it('match: boundary **/*.{ts,tsx} は .pi/x.ts に当たらない → not-listed', () => {
    const record = findSuppressions('.pi/x.ts', '// eslint-disable-next-line max-params -- x\n')[0];
    const out = judge({ ...record, file: '.pi/x.ts', before: '// Reason: owner approved' }, [
      { path: '**/*.{ts,tsx}', rules: ['max-params'] },
    ]);
    expect(out.kind).toBe('not-listed');
  });

  it('match: happy **/.*/**/*.{ts,tsx} は .pi/x.ts に当たる → allowed', () => {
    const record = findSuppressions('.pi/x.ts', '// eslint-disable-next-line max-params -- x\n')[0];
    const out = judge({ ...record, file: '.pi/x.ts', before: '// Reason: owner approved' }, [
      { path: '**/.*/**/*.{ts,tsx}', rules: ['max-params'] },
    ]);
    expect(out.kind).toBe('allowed');
  });

  it('match: happy .*.{ts,tsx} は .foo.ts に当たる → allowed', () => {
    const record = findSuppressions('.foo.ts', '// eslint-disable-next-line max-params -- x\n')[0];
    const out = judge({ ...record, file: '.foo.ts', before: '// Reason: owner approved' }, [
      { path: '.*.{ts,tsx}', rules: ['max-params'] },
    ]);
    expect(out.kind).toBe('allowed');
  });

  it('match: happy ルール名のすべてを含む → allowed', () => {
    const record = findSuppressions(
      'a.ts',
      '// eslint-disable-next-line max-params, no-await-in-loop -- x\n',
    )[0];
    const out = judge({ ...record, file: 'a.ts', before: '// Reason: owner approved' }, [
      { path: 'a.ts', rules: ['max-params', 'no-await-in-loop', 'other'] },
    ]);
    expect(out.kind).toBe('allowed');
  });

  it('match: boundary ルール名の 1 つが欠ける → not-listed', () => {
    const record = findSuppressions(
      'a.ts',
      '// eslint-disable-next-line max-params, no-await-in-loop -- x\n',
    )[0];
    const out = judge({ ...record, file: 'a.ts', before: '// Reason: owner approved' }, [
      { path: 'a.ts', rules: ['max-params'] },
    ]);
    expect(out.kind).toBe('not-listed');
  });

  it('match: boundary 項目は当たるが Reason がない → no-reason', () => {
    const record = findSuppressions('a.ts', '// eslint-disable-next-line max-params -- x\n')[0];
    const out = judge({ ...record, file: 'a.ts', before: 'const x = 1;' }, [
      { path: 'a.ts', rules: ['max-params'] },
    ]);
    expect(out.kind).toBe('no-reason');
  });

  it('match: happy ルール名を持たない抑制を指令の名前で → allowed', () => {
    const record = findSuppressions('a.ts', '// eslint-disable\n')[0];
    const tsc = findSuppressions('a.ts', '// @ts-expect-error\n')[0];
    const out = judge({ ...record, file: 'a.ts', before: '// Reason: owner approved' }, [
      { path: 'a.ts', rules: ['eslint-disable'] },
    ]);
    const tout = judge({ ...tsc, file: 'a.ts', before: '// Reason: owner approved' }, [
      { path: 'a.ts', rules: ['@ts-expect-error'] },
    ]);
    expect(out.kind).toBe('allowed');
    expect(tout.kind).toBe('allowed');
  });
});

describe('suppression-check reason', () => {
  it('reason: happy 直前の 1 行 → Reason がある', () => {
    expect(hasReason('// Reason: owner approved')).toBe(true);
  });

  it('reason: boundary 行の途中 → Reason がない', () => {
    expect(hasReason('code // Reason: owner approved')).toBe(false);
  });

  it('reason: boundary 空白以外の文字がない → Reason がない', () => {
    expect(hasReason('// Reason:   ')).toBe(false);
  });
});

const SCRIPT = join(process.cwd(), 'scripts', 'checks', 'suppression-check.mjs');

function runCli(
  root: string,
  args: readonly string[],
): { status: number; stdout: string; stderr: string } {
  const result = spawnSync('node', [SCRIPT, ...args], { encoding: 'utf8', cwd: root });
  return { status: result.status ?? -1, stdout: result.stdout ?? '', stderr: result.stderr ?? '' };
}

function writeAllow(root: string, entries: unknown): void {
  writeJson(root, join('scripts', 'checks', 'suppression-check.json'), { allow: entries });
}

function writeAllowedTree(root: string): void {
  writeAllow(root, [{ path: 'a.ts', rules: ['max-params'] }]);
  writeFile(
    root,
    'a.ts',
    '// Reason: owner approved\n// eslint-disable-next-line max-params -- x\n',
  );
}

function writeViolationTree(root: string): void {
  writeAllow(root, []);
  writeFile(root, 'a.ts', '// eslint-disable-next-line max-params -- x\n');
}

function reasonOf(fn: () => unknown): string {
  try {
    fn();
  } catch (error) {
    if (error instanceof Error) {
      return error.message;
    }
    return '';
  }
  return '';
}

const HEADER_1 =
  'suppression-check: Report to the owner. A suppressed rule is a bypass unless the whitelist and the Reason line allow it.';
const HEADER_2 = 'suppression-check: Fix the code, or ask the owner to allow it.';

describe('suppression-check cli', () => {
  it('cli: error 知らない --flag → exit 1 と stderr', () => {
    for (const flag of ['--unknown', '--report=x', '--']) {
      const root = fakeRoot();
      writeAllow(root, []);
      const out = runCli(root, [flag]);
      expect(out.status).toBe(1);
      expect(out.stderr).toContain('suppression-check: unknown argument');
    }
  });

  it('cli: boundary 対象外の拡張子 → 飛ばす', () => {
    const root = fakeRoot();
    writeAllow(root, []);
    writeFile(root, 'a.md', '// eslint-disable-next-line max-params -- x\n');
    const out = runCli(root, ['a.md']);
    expect(out.status).toBe(0);
    expect(out.stdout).toContain('0 files');
  });

  it('cli: boundary 存在しないパス → 飛ばす', () => {
    const root = fakeRoot();
    writeAllow(root, []);
    const out = runCli(root, ['missing.ts']);
    expect(out.status).toBe(0);
    expect(out.stdout).toContain('0 files');
  });

  it('cli: error ディレクトリのパス → exit 1 と stderr', () => {
    const root = fakeRoot();
    writeAllow(root, []);
    writeFile(root, 'sub/a.ts', 'ok\n');
    const out = runCli(root, ['sub']);
    expect(out.status).toBe(1);
    expect(out.stderr).toContain('not a file');
  });

  it('cli: happy パスなし → 全体を集める', () => {
    const root = fakeRoot();
    writeViolationTree(root);
    const out = runCli(root, []);
    expect(out.status).toBe(1);
    expect(out.stdout).toContain('a.ts:1:');
  });
});

describe('suppression-check display', () => {
  it('display: happy ホワイトリストにない → not allowed の行と件数、exit 1', () => {
    const root = fakeRoot();
    writeViolationTree(root);
    const out = runCli(root, ['a.ts']);
    expect(out.status).toBe(1);
    expect(out.stdout).toContain(HEADER_1);
    expect(out.stdout).toContain(HEADER_2);
    expect(out.stdout).toContain(
      'a.ts:1: eslint-disable-next-line [eslint] max-params not allowed',
    );
    expect(out.stdout).toContain('suppression-check: 1 files, 1 violations, 0 allowed.');
  });

  it('display: happy 項目は当たるが Reason がない → no Reason line の行と件数、exit 1', () => {
    const root = fakeRoot();
    writeAllow(root, [{ path: 'a.ts', rules: ['max-params'] }]);
    writeFile(root, 'a.ts', 'const x = 1;\n// eslint-disable-next-line max-params -- x\n');
    const out = runCli(root, ['a.ts']);
    expect(out.status).toBe(1);
    expect(out.stdout).toContain('no Reason line: add // Reason: above');
    expect(out.stdout).toContain('suppression-check: 1 files, 1 violations, 0 allowed.');
  });

  it('display: happy すべて許可 → No findings. と件数、exit 0', () => {
    const root = fakeRoot();
    writeAllowedTree(root);
    const out = runCli(root, ['a.ts']);
    expect(out.status).toBe(0);
    expect(out.stdout).toContain('No findings.');
    expect(out.stdout).toContain('suppression-check: 1 files, 0 violations, 1 allowed.');
  });

  it('display: empty 抑制なし → No findings. と件数', () => {
    const root = fakeRoot();
    writeAllow(root, []);
    writeFile(root, 'a.ts', 'const x = 1;\n');
    const out = runCli(root, ['a.ts']);
    expect(out.status).toBe(0);
    expect(out.stdout).toContain('No findings.');
    expect(out.stdout).toContain('suppression-check: 1 files, 0 violations, 0 allowed.');
  });

  it('display: happy ルールなし → all と書く', () => {
    const root = fakeRoot();
    writeAllow(root, []);
    writeFile(root, 'a.ts', '// @ts-expect-error\n');
    const out = runCli(root, ['a.ts']);
    expect(out.status).toBe(1);
    expect(out.stdout).toContain('a.ts:1: @ts-expect-error [tsc] all not allowed');
  });

  it('display: happy --report で許可済み → allowed の行', () => {
    const root = fakeRoot();
    writeAllowedTree(root);
    const out = runCli(root, ['--report', 'a.ts']);
    expect(out.status).toBe(0);
    expect(out.stdout).toContain('a.ts:2: eslint-disable-next-line [eslint] max-params allowed');
  });

  it('display: error 設定が壊れている → stderr と exit 1', () => {
    const root = fakeRoot();
    writeFile(root, join('scripts', 'checks', 'suppression-check.json'), '{not json');
    writeFile(root, 'a.ts', 'const x = 1;\n');
    const out = runCli(root, ['a.ts']);
    expect(out.status).toBe(1);
    expect(out.stderr).toContain('suppression-check:');
  });
});
