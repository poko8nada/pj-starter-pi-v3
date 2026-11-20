/**
 * `scripts/checks/suppression-check.mjs` の検出器を試す。
 *
 * 文字列を `findSuppressions` に渡し、記録の有無と中身を見る。
 * 収集は共有の `fakeRoot()` と `writeFile` で作った一時ツリーで試す。
 */

import { describe, expect, it } from 'vitest';
import { fakeRoot, writeFile } from '../../test/scripts.fixture.ts';
import { collectFiles, findAll, findSuppressions } from './suppression-check.mjs';

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
    expect(file[0]?.scope).toBe('file');
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
