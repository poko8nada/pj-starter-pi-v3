import { describe, expect, it } from 'vitest';
import { judgeRef, listConsultRefs, parseRefs, type GitRun } from './refs.ts';

const HASH = 'abc1234567890123456789012345678901234567';

/** git の起動の差し替え。返す出力と終了コードを決めておく */
function fakeGit(status: number, stdout: string, stderr = ''): GitRun {
  return () => ({ status, stdout, stderr });
}

describe('parseRefs', () => {
  it('2 列を一覧にする', () => {
    expect(parseRefs(`${HASH} consult/foo\n`)).toEqual([{ hash: HASH, name: 'consult/foo' }]);
  });

  it('空の出力は空の一覧', () => {
    expect(parseRefs('')).toEqual([]);
  });

  it('余分な空行と前後の空白を無視する', () => {
    expect(parseRefs(`\n  ${HASH} consult/foo  \n\n`)).toEqual([
      { hash: HASH, name: 'consult/foo' },
    ]);
  });

  it('refs/heads/ は落とさない', () => {
    expect(parseRefs(`${HASH} refs/heads/consult/foo\n`)).toEqual([
      { hash: HASH, name: 'refs/heads/consult/foo' },
    ]);
  });

  it('1 列なら投げる', () => {
    expect(() => parseRefs('abc123\n')).toThrow('refs: 2 列ではない行');
  });

  it('3 列なら投げる', () => {
    expect(() => parseRefs('abc123 consult/foo extra\n')).toThrow('refs: 2 列ではない行');
  });
});

describe('listConsultRefs', () => {
  it('consult の ref だけを、接頭辞を落として返す', () => {
    const run = fakeGit(0, `${HASH} refs/heads/consult/foo\ndef456 refs/heads/main\n`);
    expect(listConsultRefs(run)).toEqual([{ hash: HASH, name: 'consult/foo' }]);
  });

  it('空の出力なら空の一覧', () => {
    expect(listConsultRefs(fakeGit(0, ''))).toEqual([]);
  });

  it('git が失敗したら投げる', () => {
    expect(() => listConsultRefs(fakeGit(1, '', 'fatal: not a git repository'))).toThrow(
      'refs: git が失敗した: fatal: not a git repository',
    );
  });
});

describe('judgeRef', () => {
  it('consult/ で始まれば通す', () => {
    expect(judgeRef('consult/foo')).toEqual({ ok: true });
  });

  it('consult だけなら拒む', () => {
    expect(judgeRef('consult')).toEqual({ ok: false, reason: 'consult/ で始まらない' });
  });

  it('consulting/x は拒む（前方一致の境目）', () => {
    expect(judgeRef('consulting/x')).toEqual({ ok: false, reason: 'consult/ で始まらない' });
  });

  it('main は拒む', () => {
    expect(judgeRef('main')).toEqual({ ok: false, reason: 'consult/ で始まらない' });
  });

  it('空の名前は拒む', () => {
    expect(judgeRef('')).toEqual({ ok: false, reason: 'consult/ で始まらない' });
  });
});
