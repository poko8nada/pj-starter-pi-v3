import { describe, expect, it } from 'vitest';
import { subagentEnv, prepare, sessionFile, runOneSubagent } from './subagent.ts';
import { aConsultOptions, aTypePolicy } from '../consult.fixture.ts';
import type { ModelEvent } from '../sub/spec.ts';
import { branchFor } from './worktree.ts';
import type { Worktree } from './worktree.ts';
import { createFakeSpawn, type FakeChild } from '../../../../test/child-process.fixture.ts';
import type { LaunchPorts, PiSpawnOptions } from './run.ts';

// 実行場所の決め方と、偽の起動経路で走らせる1体分の仕事を試す。本物の pi は起こさない。

const CONTEXT = { cwd: '/tmp/base', ui: { notify: () => {} } } as const;
const JOB_ID = 'consult-1';

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

const { spawn: fakeSpawn, children } = createFakeSpawn();

function launchWithCapture(env: NodeJS.ProcessEnv = {}): {
  readonly launch: LaunchPorts;
  readonly calls: Array<{
    readonly command: string;
    readonly args: readonly string[];
    readonly options: PiSpawnOptions;
  }>;
  readonly stdinTexts: string[];
} {
  const calls: Array<{
    command: string;
    args: readonly string[];
    options: PiSpawnOptions;
  }> = [];
  const stdinTexts: string[] = [];
  const launch: LaunchPorts = {
    spawn: (command, args, options) => {
      calls.push({ command, args: [...args], options });
      const child = fakeSpawn(command, args, options);
      const stdin = child.stdin;
      if (stdin !== null) {
        stdin.end = (text?: string) => {
          stdinTexts.push(text ?? '');
        };
      }
      return child;
    },
    spawnSync: () => {
      throw new Error('spawnSync is not used');
    },
    env,
  };
  return { launch, calls, stdinTexts };
}

/** `index` 番目の子が現れるまで待つ。現れなければ投げる（黙って飛ばさない） */
async function waitForChild(index: number): Promise<FakeChild> {
  const found = children.at(index);
  if (found !== undefined) {
    return found;
  }
  await new Promise((resolve) => setTimeout(resolve, 0));
  const grown = children.at(index);
  if (grown === undefined) {
    throw new Error(`child ${index} did not spawn`);
  }
  return grown;
}

describe('prepare', () => {
  it('隔離しないロール → ベースで走る（worktree は要らない）', () => {
    const options = aConsultOptions({ type: 'review', task: 'x', policy: policy(false) });
    expect(prepare(CONTEXT, options)).toEqual({
      cwd: '/tmp/base',
    });
  });

  it('隔離しないロールに worktree を渡す → その worktree で走る（レビューを直接送り込む経路）', () => {
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

  it('隔離するロールで worktree がない → ベースで書かせずに投げる', () => {
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

describe('runOneSubagent: token', () => {
  it('job の token が buildPiArgs の argv に --name で届く（取り違えない）', async () => {
    children.length = 0;
    const { launch, calls } = launchWithCapture();
    const optionsToken = 'options-token';
    const jobToken = 'job-token-1';
    const promise = runOneSubagent({
      ctx: CONTEXT,
      options: aConsultOptions({
        type: 'review',
        task: 'x',
        policy: policy(false),
        token: optionsToken,
      }),
      job: { task: 'x', token: jobToken, id: JOB_ID, signal: undefined },
      launch,
    });
    const child = children.at(-1);
    if (child === undefined) {
      throw new Error('runPi did not spawn');
    }
    child.emit('close', 0);
    await promise;
    const args = calls[0]?.args ?? [];
    const index = args.indexOf('--name');
    expect(index).toBeGreaterThan(-1);
    expect(args[index + 1]).toBe(jobToken);
    expect(args).not.toContain(optionsToken);
  });
});

describe('runOneSubagent: onModelEvent', () => {
  it('runPi に onModelEvent を渡し、model が undefined なら要求した候補で埋める', async () => {
    children.length = 0;
    const { launch } = launchWithCapture();
    const candidate = 'p/candidate';
    const received: ModelEvent[] = [];
    const promise = runOneSubagent({
      ctx: CONTEXT,
      options: aConsultOptions({
        type: 'review',
        task: 'x',
        policy: { ...policy(false), models: [candidate] },
      }),
      job: { task: 'x', token: 'job-token-1', id: JOB_ID, signal: undefined },
      hooks: { onModelEvent: (event) => received.push(event) },
      launch,
    });
    const child = children.at(-1);
    if (child === undefined) {
      throw new Error('runPi did not spawn');
    }
    const retry = {
      type: 'auto_retry_start',
      attempt: 1,
      maxAttempts: 3,
      delayMs: 2000,
      errorMessage: 'rate limited',
    };
    const message = {
      type: 'message_end',
      message: { role: 'assistant', content: [], usage: { input: 1, output: 1 } },
    };
    child.stdout.emit(
      'data',
      Buffer.from(`${JSON.stringify(retry)}\n${JSON.stringify(message)}\n`),
    );
    child.emit('close', 0);
    await promise;
    expect(received).toHaveLength(1);
    expect(received[0]?.model).toBe(candidate);
  });
});

describe('runOneSubagent: onFallback', () => {
  it('乗り換えを onFallback に渡す', async () => {
    children.length = 0;
    const { launch } = launchWithCapture();
    const next = 'p/next';
    const fallbacks: { requested: string | undefined }[] = [];
    const promise = runOneSubagent({
      ctx: CONTEXT,
      options: aConsultOptions({
        type: 'review',
        task: 'x',
        policy: { ...policy(false), models: ['p/candidate', next] },
      }),
      job: { task: 'x', token: 'job-token-1', id: JOB_ID, signal: undefined },
      hooks: { onFallback: (attempt) => fallbacks.push(attempt) },
      launch,
    });
    (await waitForChild(0)).emit('close', 0);
    (await waitForChild(1)).emit('close', 0);
    (await waitForChild(2)).emit('close', 0);
    await promise;
    expect(fallbacks).toEqual([{ requested: next }, { requested: undefined }]);
  });
});

describe('runOneSubagent: spawn', () => {
  it('pi を cwd・pipe の stdio で起こし、本文は stdin に流す', async () => {
    children.length = 0;
    const { launch, calls, stdinTexts } = launchWithCapture();
    const promise = runOneSubagent({
      ctx: CONTEXT,
      options: aConsultOptions({ type: 'review', task: 'x', policy: policy(false) }),
      job: { task: 'x', token: 'job-token-1', id: JOB_ID, signal: undefined },
      launch,
    });
    (await waitForChild(0)).emit('close', 0);
    await promise;
    expect(calls[0]?.command).toBe('pi');
    expect(calls[0]?.options.cwd).toBe(CONTEXT.cwd);
    expect(calls[0]?.options.stdio).toEqual(['pipe', 'pipe', 'pipe']);
    expect(calls[0]?.options.detached).toBe(true);
    expect(stdinTexts).toEqual(['x']);
  });
});

describe('runOneSubagent: env', () => {
  it('env: (happy) 決めた env と subagentEnv(policy) が合わさり、process.env を読まない', async () => {
    children.length = 0;
    process.env.PI_TEST_ONLY = 'x';
    try {
      const base = policy(false);
      const { launch, calls } = launchWithCapture({ KEEP: 'y', CONSULT_TURNS: 'lose' });
      const promise = runOneSubagent({
        ctx: CONTEXT,
        options: aConsultOptions({ type: 'review', task: 'x', policy: base }),
        job: { task: 'x', token: 'job-token-1', id: JOB_ID, signal: undefined },
        launch,
      });
      const child = children.at(-1);
      if (child === undefined) {
        throw new Error('runPi did not spawn');
      }
      child.emit('close', 0);
      await promise;
      const env = calls[0]?.options.env ?? {};
      expect(env.KEEP).toBe('y');
      expect(env.CONSULT_TURNS).toBe(String(base.limits.turns));
      expect('PI_TEST_ONLY' in env).toBe(false);
    } finally {
      delete process.env.PI_TEST_ONLY;
    }
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
    // worktree の外（入れものの中）に置く。リポジトリを汚さない
    expect(sessionFile(WORKTREE, codeRole).startsWith(WORKTREE.path)).toBe(false);
  });
});
