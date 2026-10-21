import { describe, expect, it, vi } from 'vitest';
import { subagentEnv, prepare, sessionFile, runOneSubagent } from './subagent.ts';
import type { TypePolicy } from '../policy/types.ts';
import type { Worktree } from './worktree.ts';

// 実行場所の決め方だけを試す。サブエージェントの起動は実際の pi が要るので扱わない。

const CONTEXT = { cwd: '/tmp/base' } as const;

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
    expect(
      prepare(CONTEXT, { type: 'review', task: 'x', policy: policy(false), token: 'token-1' }),
    ).toEqual({
      cwd: '/tmp/base',
    });
  });

  it('隔離しないロールに worktree を渡す → その worktree で走る（レビューを直接送り込む道）', () => {
    const prepared = prepare(
      CONTEXT,
      { type: 'review', task: 'x', policy: policy(false), token: 'token-1' },
      WORKTREE,
    );
    expect(prepared.cwd).toBe(WORKTREE.path);
    expect(prepared.worktree).toBe(WORKTREE);
  });

  it('隔離するロール → worktree が要る', () => {
    const prepared = prepare(
      CONTEXT,
      { type: 'code', task: 'x', policy: policy(true), token: 'token-1' },
      WORKTREE,
    );
    expect(prepared.cwd).toBe(WORKTREE.path);
  });

  it('隔離するロールで worktree が無い → ベースで書かせずに投げる', () => {
    expect(() =>
      prepare(CONTEXT, { type: 'code', task: 'x', policy: policy(true), token: 'token-1' }),
    ).toThrow(/needs a worktree/);
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

const capturedPiArgs = vi.hoisted(() => [] as string[][]);

vi.mock('./run.ts', async (importOriginal: () => Promise<Record<string, unknown>>) => {
  const actual = await importOriginal();
  return {
    ...actual,
    runPi: async (options: { readonly piArgs: readonly string[] }) => {
      capturedPiArgs.push([...options.piArgs]);
      return { stdout: '', stderr: '', code: 0, aborted: false, ended: false };
    },
  };
});

describe('runOneSubagent: token', () => {
  it('job の token が buildPiArgs の argv に --name で届く（取り違えない）', async () => {
    capturedPiArgs.length = 0;
    await runOneSubagent(
      CONTEXT,
      { type: 'review', task: 'x', policy: policy(false), token: 'options-token' },
      { task: 'x', token: 'job-token-1', signal: undefined },
    );
    const args = capturedPiArgs[0] ?? [];
    const index = args.indexOf('--name');
    expect(index).toBeGreaterThan(-1);
    expect(args[index + 1]).toBe('job-token-1');
    expect(args).not.toContain('options-token');
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
