import { describe, expect, it } from 'vitest';
import { parseRunRequest } from './run.ts';

// 面（引数の検証）だけを試す。子の起動と worktree は consult.test.ts が runtime ごと見る。

describe('parseRunRequest', () => {
  it('role と task だけ → worktree も continue も無い依頼になる', () => {
    expect(parseRunRequest({ role: 'review', task: '判定する' })).toEqual({
      role: 'review',
      task: '判定する',
    });
  });

  it('worktree と continue を渡せる', () => {
    expect(parseRunRequest({ role: 'code', task: 'x', worktree: '2-a', continue: true })).toEqual({
      role: 'code',
      task: 'x',
      worktree: '2-a',
      continue: true,
    });
  });

  it('continue: false も渡せる（続きを使わない）', () => {
    expect(parseRunRequest({ role: 'code', task: 'x', continue: false })).toEqual({
      role: 'code',
      task: 'x',
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
    const request = parseRunRequest({ role: 'review', task: 'x', input: ['a.md'] });
    expect(request).toEqual({ role: 'review', task: 'x' });
  });

  it('continue が真偽値でない → 既定（未指定）にする', () => {
    const request = parseRunRequest({ role: 'review', task: 'x', continue: 'yes' });
    expect(request.continue).toBeUndefined();
  });
});
