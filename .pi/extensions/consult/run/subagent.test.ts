import { describe, expect, it } from 'vitest';
import { subagentEnv, prepare, sessionFile } from './subagent.ts';
import type { TypePolicy } from '../policy/types.ts';
import type { Worktree } from './worktree.ts';

// 実行場所の決め方だけを試す。サブエージェントの起動は実際の pi が要るので扱わない。

const CONTEXT = { cwd: '/tmp/parent' } as const;

function policy(isolated: boolean): TypePolicy {
  return {
    name: isolated ? 'code' : 'review',
    models: [],
    tools: isolated ? ['read', 'edit'] : ['read'],
    isolated,
    paths: [],
    bash: [],
    continueByDefault: isolated,
    limits: { turns: 20, output: 20000 },
  };
}

const WORKTREE: Worktree = {
  id: '2-a',
  branch: 'consult/2-a',
  path: '/tmp/pi-consult/demo/2-a/wt',
  unitDir: '/tmp/pi-consult/demo/2-a',
};

describe('prepare', () => {
  it('隔離しないロール → ベースで走る（worktree は要らない）', () => {
    expect(prepare(CONTEXT, { type: 'review', task: 'x', policy: policy(false) })).toEqual({
      cwd: '/tmp/parent',
    });
  });

  it('隔離しないロールに worktree を渡す → その worktree で走る（レビューを直接送り込む道）', () => {
    const prepared = prepare(
      CONTEXT,
      { type: 'review', task: 'x', policy: policy(false) },
      WORKTREE,
    );
    expect(prepared.cwd).toBe(WORKTREE.path);
    expect(prepared.worktree).toBe(WORKTREE);
  });

  it('隔離するロール → worktree が要る', () => {
    const prepared = prepare(CONTEXT, { type: 'code', task: 'x', policy: policy(true) }, WORKTREE);
    expect(prepared.cwd).toBe(WORKTREE.path);
  });

  it('隔離するロールで worktree が無い → ベースで書かせずに投げる', () => {
    expect(() => prepare(CONTEXT, { type: 'code', task: 'x', policy: policy(true) })).toThrow(
      /needs a worktree/,
    );
  });
});

describe('subagentEnv', () => {
  it('メインエージェントが解決した上限と許可だけを載せる（サブエージェントは types.json を読まない）', () => {
    const env = subagentEnv({ ...policy(false), paths: ['cycles/*/plan/*.md'], bash: ['git'] });
    expect(env.CONSULT_TURNS).toBe('20');
    expect(env.CONSULT_POLICY).toBe('{"paths":["cycles/*/plan/*.md"],"bash":["git"]}');
  });

  it('上限 40 → CONSULT_TURNS は 40（値の振りを見る）', () => {
    const env = subagentEnv({
      ...policy(false),
      limits: { turns: 40, output: 8000 },
    });
    expect(env.CONSULT_TURNS).toBe('40');
  });
});

describe('sessionFile', () => {
  it('(worktree, ロール) ごとに 1 つ。同じパスを指すとその会話の続きになる', () => {
    expect(sessionFile(WORKTREE, 'code')).toBe('/tmp/pi-consult/demo/2-a/session-code');
    expect(sessionFile(WORKTREE, 'review')).toBe('/tmp/pi-consult/demo/2-a/session-review');
    // ロールが違えば別の会話になる（同じ worktree に別のロールを送っても混ざらない）
    expect(sessionFile(WORKTREE, 'code')).not.toBe(sessionFile(WORKTREE, 'review'));
    // worktree の外（入れ物の中）に置く。リポジトリを汚さない
    expect(sessionFile(WORKTREE, 'code').startsWith(WORKTREE.path)).toBe(false);
  });
});
