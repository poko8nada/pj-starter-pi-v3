import { describe, expect, it } from 'vitest';
import { parseRunRequest } from './run.ts';
import { aTypePolicy } from '../consult.fixture.ts';

// 面（引数の検証）だけを試す。サブエージェントの起動と worktree は consult.test.ts が runtime ごと見る。

describe('parseRunRequest', () => {
  it('role と task だけ → worktree も continue も無い依頼になる', () => {
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

  it('continue: false も渡せる（続きを使わない）', () => {
    const role = 'code';
    const task = 'x';
    expect(parseRunRequest({ role, task, continue: false })).toEqual({
      role,
      task,
      continue: false,
    });
  });

  it('role が無い → 使い方つきで投げる', () => {
    expect(() => parseRunRequest({ task: 'x' })).toThrow(/role must be a non-empty string/);
  });

  it('task が空 → 投げる', () => {
    expect(() => parseRunRequest({ role: 'review', task: '  ' })).toThrow(/task/);
  });

  it('worktree が空文字 → 投げる（暗黙に作らない）', () => {
    expect(() => parseRunRequest({ role: 'code', task: 'x', worktree: '' })).toThrow(/worktree/);
  });

  it('オブジェクトでない → 投げる', () => {
    expect(() => parseRunRequest('review')).toThrow(/not an object/);
  });

  it('input を渡しても引数として拾わない（面に無い）', () => {
    const role = 'review';
    const task = 'x';
    const request = parseRunRequest({ role, task, input: ['a.md'] });
    expect(request).toEqual({ role, task });
  });

  it('continue が真偽値でない → 既定（未指定）にする', () => {
    const request = parseRunRequest({ role: 'review', task: 'x', continue: 'yes' });
    expect(request.continue).toBeUndefined();
  });
});
