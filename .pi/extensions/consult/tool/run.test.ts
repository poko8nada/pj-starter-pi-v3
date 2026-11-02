import { describe, expect, it } from 'vitest';
import { parseRunRequest } from './run.ts';
import { aTypePolicy } from '../consult.fixture.ts';

// 面（引数の検証）だけを試す。サブエージェントの起動と worktree は consult.test.ts が runtime ごと見る。

describe('parseRunRequest', () => {
  it('role と task だけ → worktree も continue もない依頼になる', () => {
    const role = aTypePolicy({ name: 'review' }).name;
    const task = '判定する';
    expect(parseRunRequest({ role, task })).toEqual({ role, task });
  });

  it('worktree と continue を渡せる', () => {
    const role = 'code';
    const task = 'x';
    const worktree = '2-a';
    expect(parseRunRequest({ role, task, worktree, continue: true })).toEqual({
      role,
      task,
      worktree,
      continue: true,
    });
  });

  it('task が空 → 投げる', () => {
    expect(() => parseRunRequest({ role: 'review', task: '  ' })).toThrow(/task/);
  });

  it('worktree が空文字 → 投げる（暗黙に作らない）', () => {
    expect(() => parseRunRequest({ role: 'code', task: 'x', worktree: '' })).toThrow(/worktree/);
  });
});
