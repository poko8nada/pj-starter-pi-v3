import { describe, expect, it, vi } from 'vitest';
import { subagentEnv, prepare, sessionFile, runOneSubagent } from './subagent.ts';
import { aConsultOptions, aTypePolicy } from '../consult.fixture.ts';
import { branchFor } from './worktree.ts';
import type { Worktree } from './worktree.ts';

// 実行場所の決め方だけを試す。サブエージェントの起動は実際の pi が要るので扱わない。

const CONTEXT = { cwd: '/tmp/base' } as const;

function policy(isolated: boolean) {
  return aTypePolicy({
    name: isolated ? 'code' : 'review',
    tools: isolated ? ['read', 'edit'] : ['read'],
    isolated,
    continueByDefault: isolated,
  });
}

const UNIT_ID = '2-a';

const WORKTREE: Worktree = {
  id: UNIT_ID,
  branch: branchFor(UNIT_ID),
  path: `/tmp/pi-consult/demo/${UNIT_ID}/wt`,
  unitDir: `/tmp/pi-consult/demo/${UNIT_ID}`,
};

describe('prepare', () => {
  it('隔離しないロール → ベースで走る（worktree は要らない）', () => {
    const options = aConsultOptions({ type: 'review', task: 'x', policy: policy(false) });
    expect(prepare(CONTEXT, options)).toEqual({
      cwd: '/tmp/base',
    });
  });

  it('隔離しないロールに worktree を渡す → その worktree で走る（レビューを直接送り込む道）', () => {
    const options = aConsultOptions({ type: 'review', task: 'x', policy: policy(false) });
    const prepared = prepare(CONTEXT, options, WORKTREE);
    expect(prepared.cwd).toBe(WORKTREE.path);
    expect(prepared.worktree).toBe(WORKTREE);
  });

  it('隔離するロール → worktree が要る', () => {
    const options = aConsultOptions({ type: 'code', task: 'x', policy: policy(true) });
    const prepared = prepare(CONTEXT, options, WORKTREE);
    expect(prepared.cwd).toBe(WORKTREE.path);
  });

  it('隔離するロールで worktree が無い → ベースで書かせずに投げる', () => {
    const options = aConsultOptions({ type: 'code', task: 'x', policy: policy(true) });
    expect(() => prepare(CONTEXT, options)).toThrow(/needs a worktree/);
  });
});

describe('subagentEnv', () => {
  it('メインエージェントが解決した上限と許可だけを載せる（サブエージェントは types.json を読まない）', () => {
    const base = policy(false);
    const paths = ['cycles/*/plan/*.md'];
    const bash = ['git'];
    const env = subagentEnv({ ...base, paths, bash });
    expect(env.CONSULT_TURNS).toBe(String(base.limits.turns));
    expect(env.CONSULT_POLICY).toBe(JSON.stringify({ paths, bash }));
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
    const optionsToken = 'options-token';
    const jobToken = 'job-token-1';
    capturedPiArgs.length = 0;
    await runOneSubagent(
      CONTEXT,
      aConsultOptions({ type: 'review', task: 'x', policy: policy(false), token: optionsToken }),
      { task: 'x', token: jobToken, signal: undefined },
    );
    const args = capturedPiArgs[0] ?? [];
    const index = args.indexOf('--name');
    expect(index).toBeGreaterThan(-1);
    expect(args[index + 1]).toBe(jobToken);
    expect(args).not.toContain(optionsToken);
  });
});

describe('sessionFile', () => {
  it('(worktree, ロール) ごとに 1 つ。同じパスを指すとその会話の続きになる', () => {
    const codeRole = 'code';
    const reviewRole = 'review';
    expect(sessionFile(WORKTREE, codeRole)).toBe(`${WORKTREE.unitDir}/session-${codeRole}`);
    expect(sessionFile(WORKTREE, reviewRole)).toBe(`${WORKTREE.unitDir}/session-${reviewRole}`);
    // ロールが違えば別の会話になる（同じ worktree に別のロールを送っても混ざらない）
    expect(sessionFile(WORKTREE, codeRole)).not.toBe(sessionFile(WORKTREE, reviewRole));
    // worktree の外（入れ物の中）に置く。リポジトリを汚さない
    expect(sessionFile(WORKTREE, codeRole).startsWith(WORKTREE.path)).toBe(false);
  });
});
