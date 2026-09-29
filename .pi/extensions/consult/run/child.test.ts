import { describe, expect, it } from 'vitest';
import { prepare, sessionFile } from './child.ts';
import type { TypePolicy } from '../policy/types.ts';
import type { Worktree } from './worktree.ts';

// 実行場所の決め方だけを試す。子の起動は実際の pi が要るので扱わない。

const CONTEXT = { cwd: '/tmp/parent' } as const;

function policy(readOnly: boolean): TypePolicy {
  return {
    name: readOnly ? 'review' : 'code',
    models: [],
    tools: readOnly ? ['read'] : ['read', 'edit'],
    readOnly,
    continueByDefault: !readOnly,
    limits: { turns: 20, output: 20000 },
  };
}

const WORKTREE: Worktree = {
  id: '2-a',
  branch: 'consult/2-a',
  path: '/tmp/pi-consult/demo/2-a/wt',
  root: '/tmp/pi-consult/demo/2-a',
};

describe('prepare', () => {
  it('読むだけのロール → 親の木で走る（worktree は要らない）', () => {
    expect(prepare(CONTEXT, { type: 'review', task: 'x', policy: policy(true) })).toEqual({
      cwd: '/tmp/parent',
    });
  });

  it('読むだけのロールに worktree を渡す → その worktree で走る（レビューを直接送り込む道）', () => {
    const prepared = prepare(
      CONTEXT,
      { type: 'review', task: 'x', policy: policy(true) },
      WORKTREE,
    );
    expect(prepared.cwd).toBe(WORKTREE.path);
    expect(prepared.worktree).toBe(WORKTREE);
  });

  it('書き込むロール → worktree が要る', () => {
    const prepared = prepare(CONTEXT, { type: 'code', task: 'x', policy: policy(false) }, WORKTREE);
    expect(prepared.cwd).toBe(WORKTREE.path);
  });

  it('書き込むロールで worktree が無い → 親の木で書かせずに投げる', () => {
    expect(() => prepare(CONTEXT, { type: 'code', task: 'x', policy: policy(false) })).toThrow(
      /needs a worktree/,
    );
  });
});

describe('sessionFile', () => {
  it('worktree ごとに 1 つ。同じパスを指すとその会話の続きになる', () => {
    expect(sessionFile(WORKTREE)).toBe('/tmp/pi-consult/demo/2-a/session');
    // worktree の外（入れ物の中）に置く。リポジトリを汚さない
    expect(sessionFile(WORKTREE).startsWith(WORKTREE.path)).toBe(false);
  });
});
