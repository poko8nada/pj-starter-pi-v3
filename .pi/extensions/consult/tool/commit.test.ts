import { describe, expect, it } from 'vitest';
import { commitInWorktree, commitMessage, compose, parseCommitRequest } from './commit.ts';
import type { GitRun } from '../run/run.ts';

// worktree とリポジトリを実際に作る検査はここでは扱わない（`consult_worktree` の検査と、最後のメインエージェントの `use` 検証が実物で見る）。
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
  it('変更のある worktree → committed と、そのハッシュが HEAD', () => {
    const id = '2-a';
    const head = 'deadbee';
    const { git } = cleanGit(head);
    expect(commitInWorktree(git, id)).toEqual({ kind: 'committed', hash: head });
  });

  it('変更が無い → no change（git は status しか見ない）', () => {
    const id = '2-a';
    const { git, calls } = fakeGit({ dirty: false });
    expect(commitInWorktree(git, id)).toEqual({ kind: 'no-change' });
    expect(calls.map((args) => args[0])).toEqual(['status']);
  });

  it('フックが拒む → rejected と出力。add した分は残す（reset しない）', () => {
    const id = '2-a';
    const { git, calls } = cleanGit();
    const output = 'hooks: tests failed';
    const rejected = fakeGit({ dirty: true, status: 1, output });
    const outcome = commitInWorktree(rejected.git, id);
    expect(outcome).toEqual({ kind: 'rejected', output });
    // 戻す道（reset / checkout）を呼んでいないこと
    expect(rejected.calls.map((args) => args[0])).toEqual(['status', 'add', 'commit']);
    expect(commitInWorktree(git, id).kind).toBe('committed');
    expect(calls.some((args) => args[0] === 'merge')).toBe(false);
  });

  it('メッセージは commitMessage から取る（引数で渡せない）', () => {
    const id = '2-a';
    const { git, calls } = cleanGit();
    commitInWorktree(git, id);
    const commit = calls.find((args) => args[0] === 'commit');
    expect(commit?.[2]).toBe(commitMessage(id));
  });
});

describe('compose', () => {
  it('3 つの結果をそれぞれ 1 行にする', () => {
    const hash = 'abc';
    const output = 'ng';
    expect(compose({ kind: 'no-change' })).toBe('no change');
    expect(compose({ kind: 'committed', hash })).toBe(`committed: ${hash}`);
    expect(compose({ kind: 'rejected', output })).toBe(`rejected: ${output}`);
  });
});

describe('parseCommitRequest', () => {
  it('worktree だけを受ける', () => {
    const worktree = '2-a';
    expect(parseCommitRequest({ worktree })).toBe(worktree);
  });

  it('worktree が無い・空 → 使い方つきで投げる', () => {
    expect(() => parseCommitRequest({})).toThrow(/worktree is required/);
    expect(() => parseCommitRequest({ worktree: '  ' })).toThrow(/worktree is required/);
    expect(() => parseCommitRequest('2-a')).toThrow(/not an object/);
  });

  it('message を渡しても引数として拾わない（型は道具が作る）', () => {
    const worktree = '2-a';
    expect(parseCommitRequest({ worktree, message: '好きな文' })).toBe(worktree);
  });
});
