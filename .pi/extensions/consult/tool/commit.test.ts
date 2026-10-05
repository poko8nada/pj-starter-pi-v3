import { describe, expect, it } from 'vitest';
import { commitInWorktree, commitMessage, compose, parseCommitRequest } from './commit.ts';
import type { GitRun } from '../run/run.ts';

// worktree とリポジトリを実際に作る検査はここでは扱わない（`consult_worktree` の検査と、最後の親の `use` 検証が実物で見る）。
// ここは「3 つの結果」と「メッセージの型」と「引数の面」を、差し替えた git で試す。

/** 状態を持つ偽 git。呼ばれた引数を覚えて、決めた出力を返す */
function fakeGit(options: { status?: number; output?: string; head?: string; dirty?: boolean }) {
  const calls: string[][] = [];
  const git: GitRun = (args) => {
    calls.push([...args]);
    if (args[0] === 'status') {
      return { status: 0, stdout: options.dirty === true ? ' M a.ts\n' : '', stderr: '' };
    }
    if (args[0] === 'commit') {
      return {
        status: options.status ?? 0,
        stdout: options.output ?? '',
        stderr: options.output ?? '',
      };
    }
    if (args[0] === 'rev-parse') {
      return { status: 0, stdout: `${options.head ?? 'abc123'}\n`, stderr: '' };
    }
    return { status: 0, stdout: '', stderr: '' };
  };
  return { git, calls };
}

/** 変更のある worktree で、コミットが通る git */
function cleanGit(head = 'a1b2c3') {
  return fakeGit({ dirty: true, head });
}

describe('commitInWorktree', () => {
  it('変更のある worktree → committed: <hash>（そのハッシュが HEAD）', () => {
    const { git } = cleanGit('deadbee');
    expect(commitInWorktree(git, '2-a')).toEqual({ kind: 'committed', hash: 'deadbee' });
  });

  it('変更が無い worktree → no change（git は status しか見ない）', () => {
    const { git, calls } = fakeGit({ dirty: false });
    expect(commitInWorktree(git, '2-a')).toEqual({ kind: 'no-change' });
    expect(calls.map((args) => args[0])).toEqual(['status']);
  });

  it('フックが拒む → rejected とその出力。add した分は残す（reset しない）', () => {
    const { git, calls } = cleanGit();
    const rejected = fakeGit({ dirty: true, status: 1, output: 'hooks: tests failed' });
    const outcome = commitInWorktree(rejected.git, '2-a');
    expect(outcome).toEqual({ kind: 'rejected', output: 'hooks: tests failed' });
    // 戻す道（reset / checkout）を呼んでいないこと
    expect(rejected.calls.map((args) => args[0])).toEqual(['status', 'add', 'commit']);
    expect(commitInWorktree(git, '2-a').kind).toBe('committed');
    expect(calls.some((args) => args[0] === 'merge')).toBe(false);
  });

  it('同じ worktree で 2 回目 → no change（1 回目で全部入っている）', () => {
    const first = fakeGit({ dirty: true, head: 'one' });
    expect(commitInWorktree(first.git, '2-a').kind).toBe('committed');
    // 2 回目は変更が無い状態の git で呼ばれる
    const second = fakeGit({ dirty: false });
    expect(commitInWorktree(second.git, '2-a')).toEqual({ kind: 'no-change' });
  });

  it("メッセージは consult(<unit>): the child's work（引数で渡せない）", () => {
    const { git, calls } = cleanGit();
    commitInWorktree(git, '2-a');
    const commit = calls.find((args) => args[0] === 'commit');
    expect(commit?.[2]).toBe("consult(2-a): the child's work");
    expect(commitMessage('2-a')).toBe("consult(2-a): the child's work");
  });
});

describe('compose', () => {
  it('3 つの結果をそれぞれ 1 行にする', () => {
    expect(compose({ kind: 'no-change' })).toBe('no change');
    expect(compose({ kind: 'committed', hash: 'abc' })).toBe('committed: abc');
    expect(compose({ kind: 'rejected', output: 'ng' })).toBe('rejected: ng');
  });
});

describe('parseCommitRequest', () => {
  it('worktree だけを受ける', () => {
    expect(parseCommitRequest({ worktree: '2-a' })).toBe('2-a');
  });

  it('worktree が無い・空 → 使い方つきで投げる', () => {
    expect(() => parseCommitRequest({})).toThrow(/worktree is required/);
    expect(() => parseCommitRequest({ worktree: '  ' })).toThrow(/worktree is required/);
    expect(() => parseCommitRequest('2-a')).toThrow(/not an object/);
  });

  it('message を渡しても引数として拾わない（型は道具が作る）', () => {
    expect(parseCommitRequest({ worktree: '2-a', message: '好きな文' })).toBe('2-a');
  });
});
