import { describe, expect, it } from 'vitest';
import {
  deleteRef,
  judgeRef,
  listConsultRefs,
  parseAction,
  parseRefs,
  runAction,
  type GitRun,
} from './refs.ts';

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

/** git の起動を記録する差し替え。何を呼ばれたかを見る */
function recordingGit(
  status: number,
  stdout: string,
  stderr = '',
): { run: GitRun; calls: string[][] } {
  const calls: string[][] = [];
  const run: GitRun = (args) => {
    calls.push([...args]);
    return { status, stdout, stderr };
  };
  return { run, calls };
}

describe('deleteRef', () => {
  it('git branch -D を呼び、消した名前を返す', () => {
    const { run, calls } = recordingGit(0, '');
    expect(deleteRef(run, 'consult/foo')).toEqual({ deleted: 'consult/foo' });
    expect(calls).toEqual([['branch', '-D', 'consult/foo']]);
  });

  it('git が失敗したら投げる', () => {
    const message = "error: branch 'consult/foo' not found.";
    expect(() => deleteRef(fakeGit(1, '', message), 'consult/foo')).toThrow(
      `refs: git が失敗した: ${message}`,
    );
  });
});

describe('runAction', () => {
  it('list は一覧を返す', () => {
    const run = fakeGit(0, `${HASH} refs/heads/consult/foo\n`);
    expect(runAction({ action: 'list' }, run)).toEqual({
      refs: [{ hash: HASH, name: 'consult/foo' }],
    });
  });

  it('list は git branch -D を呼ばない', () => {
    const { run, calls } = recordingGit(0, `${HASH} refs/heads/consult/foo\n`);
    runAction({ action: 'list' }, run);
    expect(calls).toEqual([
      ['for-each-ref', '--format=%(objectname) %(refname)', 'refs/heads/consult/'],
    ]);
  });

  it('delete は消して名前を返す', () => {
    const { run, calls } = recordingGit(0, '');
    expect(runAction({ action: 'delete', name: 'consult/foo' }, run)).toEqual({
      deleted: 'consult/foo',
    });
    expect(calls).toEqual([['branch', '-D', 'consult/foo']]);
  });

  it('delete は main を拒み、git を呼ばない', () => {
    const { run, calls } = recordingGit(0, '');
    expect(runAction({ action: 'delete', name: 'main' }, run)).toEqual({
      refused: 'consult/ で始まらない',
    });
    expect(calls).toEqual([]);
  });

  it('delete は consulting/x を拒む（前方一致の境目）', () => {
    expect(runAction({ action: 'delete', name: 'consulting/x' }, fakeGit(0, ''))).toEqual({
      refused: 'consult/ で始まらない',
    });
  });

  it('delete は空の名前を拒む', () => {
    expect(runAction({ action: 'delete', name: '' }, fakeGit(0, ''))).toEqual({
      refused: 'consult/ で始まらない',
    });
  });
});

describe('parseAction', () => {
  it('list だけなら通る', () => {
    expect(parseAction({ action: 'list' })).toEqual({ action: 'list' });
  });

  it('delete と name なら通る', () => {
    expect(parseAction({ action: 'delete', name: 'consult/foo' })).toEqual({
      action: 'delete',
      name: 'consult/foo',
    });
  });

  it('list に name があると投げる', () => {
    expect(() => parseAction({ action: 'list', name: 'consult/foo' })).toThrow(
      'refs: list に name は渡せない',
    );
  });

  it('delete で name が無いと投げる', () => {
    expect(() => parseAction({ action: 'delete' })).toThrow(
      'refs: delete には空でない name が要る',
    );
  });

  it('delete で name が空だと投げる', () => {
    expect(() => parseAction({ action: 'delete', name: '' })).toThrow(
      'refs: delete には空でない name が要る',
    );
  });

  it('知らない action は投げる', () => {
    expect(() => parseAction({ action: 'rm' })).toThrow('refs: 知らない action');
  });

  it('空の引数は投げる', () => {
    expect(() => parseAction({})).toThrow('refs: 知らない action');
  });

  it('オブジェクトでなければ投げる', () => {
    expect(() => parseAction(null)).toThrow('refs: 引数がオブジェクトではない');
  });
});
