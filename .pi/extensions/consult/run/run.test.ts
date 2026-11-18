import { writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  applyEvent,
  installDependencies,
  runPi,
  runWithFallback,
  worktreeGit,
  type Git,
  type RunResult,
  type RunState,
} from './run.ts';
import type { ModelEvent } from '../sub/spec.ts';
import { aTypePolicy } from '../consult.fixture.ts';
import { createFakeSpawn } from '../../../../test/child-process.fixture.ts';
import { tempDir } from '../../../../test/temp-dir.ts';

// 乗り換えの判定だけを試す。実際の pi は起こさず、偽の runOnce がイベントの JSONL から結果を作る。

/** assistant の message_end を 1 つ作る */
function messageEnd(overrides: Record<string, unknown> = {}) {
  return {
    type: 'message_end',
    message: {
      role: 'assistant',
      content: [],
      usage: { input: 1, output: 1 },
      ...overrides,
    },
  };
}

/** イベントから実行結果を作る。終了コードは 0（JSON モードの失敗も 0 になる） */
function resultFor(events: unknown[], overrides: Partial<RunResult> = {}): RunResult {
  return {
    stdout: events.map((event) => JSON.stringify(event)).join('\n'),
    stderr: '',
    code: 0,
    aborted: false,
    ended: true,
    ...overrides,
  };
}

/** 候補ごとの結果を返し、呼ばれた候補を記録する runOnce */
function recorder(results: Map<string | undefined, RunResult>): {
  runOnce: (model: string | undefined) => Promise<RunResult>;
  calls: (string | undefined)[];
} {
  const calls: (string | undefined)[] = [];
  return {
    calls,
    runOnce: (model) => {
      calls.push(model);
      return Promise.resolve(results.get(model) ?? resultFor([]));
    },
  };
}

const { spawn: fakeSpawn, children } = createFakeSpawn();

/** イベントを 1 つずつ反映するための、まっさらな走行状態 */
function initialState(): RunState {
  return {
    stdout: '',
    stderr: '',
    buffered: '',
    aborted: false,
    spent: { turns: 0, output: 0 },
    limits: aTypePolicy().limits,
    lastOutputAt: 0,
  };
}

describe('applyEvent: lastModel', () => {
  it('assistant の message_end → そのモデルを lastModel に入れる', () => {
    const state = initialState();
    const event = messageEnd({ provider: 'p', model: 'm' });
    applyEvent(state, event, 1);
    expect(state.lastModel).toBe('p/m');
  });

  it('applyEvent: (happy) 直前の message_end のモデル → retry-start に model を載せる', () => {
    const state = initialState();
    applyEvent(state, messageEnd({ provider: 'p', model: 'm' }), 1);
    const event = {
      type: 'auto_retry_start',
      attempt: 1,
      maxAttempts: 3,
      delayMs: 2000,
      errorMessage: 'rate limited',
    };
    expect(applyEvent(state, event, 1)).toMatchObject({ kind: 'retry-start', model: 'p/m' });
  });
});

describe('runPi: onModelEvent', () => {
  it('runPi: (happy) auto_retry_start の行 → onModelEvent に retry-start', async () => {
    children.length = 0;
    const received: ModelEvent[] = [];
    const promise = runPi(
      {
        piArgs: [],
        stdin: '',
        cwd: '/tmp/base',
        env: {},
        limits: aTypePolicy().limits,
        onModelEvent: (event) => received.push(event),
      },
      fakeSpawn,
    );
    const child = children[0];
    if (child === undefined) {
      throw new Error('runPi did not spawn');
    }
    const message = messageEnd({ provider: 'p', model: 'm' });
    const retry = {
      type: 'auto_retry_start',
      attempt: 1,
      maxAttempts: 3,
      delayMs: 2000,
      errorMessage: 'rate limited',
    };
    child.stdout.emit(
      'data',
      Buffer.from(`${JSON.stringify(message)}\n${JSON.stringify(retry)}\n`),
    );
    child.emit('close', 0);

    const run = await promise;

    expect(run.code).toBe(0);
    expect(received).toHaveLength(1);
    expect(received[0]).toMatchObject({ kind: 'retry-start' });
  });
});

describe('runWithFallback: 生成が 0', () => {
  it('何も生成せずに終わる → 次の候補を試す', async () => {
    const success = resultFor([messageEnd()]);
    const { runOnce, calls } = recorder(
      new Map<string | undefined, RunResult>([
        ['a', resultFor([])],
        ['b', success],
      ]),
    );

    const run = await runWithFallback(['a', 'b'], runOnce);

    expect(calls).toEqual(['a', 'b']);
    expect(run).toBe(success);
  });
});

describe('runWithFallback: 末尾メッセージの失敗', () => {
  it('出力があり、最後がエラー → 次の候補を試す', async () => {
    const success = resultFor([messageEnd()]);
    const { runOnce, calls } = recorder(
      new Map<string | undefined, RunResult>([
        ['a', resultFor([messageEnd({ stopReason: 'error', errorMessage: 'boom' })])],
        ['b', success],
      ]),
    );

    const run = await runWithFallback(['a', 'b'], runOnce);

    expect(calls).toEqual(['a', 'b']);
    expect(run).toBe(success);
  });

  it('前のエラーがあり、最後が成功 → 乗り換えない', async () => {
    const first = resultFor([
      messageEnd({ stopReason: 'error', errorMessage: 'boom' }),
      messageEnd({ stopReason: 'stop' }),
    ]);
    const { runOnce, calls } = recorder(
      new Map<string | undefined, RunResult>([
        ['a', first],
        ['b', resultFor([messageEnd()])],
      ]),
    );

    const run = await runWithFallback(['a', 'b'], runOnce);

    expect(calls).toEqual(['a']);
    expect(run).toBe(first);
  });
});

describe('runWithFallback: onFallback', () => {
  it('乗り換え → 次の候補で呼ばれる', async () => {
    const { runOnce } = recorder(
      new Map<string | undefined, RunResult>([
        ['a', resultFor([])],
        ['b', resultFor([messageEnd()])],
      ]),
    );
    const fallbacks: { requested: string | undefined }[] = [];

    await runWithFallback(['a', 'b'], runOnce, (attempt) => {
      fallbacks.push(attempt);
    });

    expect(fallbacks).toEqual([{ requested: 'b' }]);
  });

  it('乗り換えない → 呼ばれない', async () => {
    const { runOnce } = recorder(
      new Map<string | undefined, RunResult>([
        ['a', resultFor([messageEnd()])],
        ['b', resultFor([messageEnd()])],
      ]),
    );
    const fallbacks: { requested: string | undefined }[] = [];

    await runWithFallback(['a', 'b'], runOnce, (attempt) => {
      fallbacks.push(attempt);
    });

    expect(fallbacks).toEqual([]);
  });
});

describe('runWithFallback: 乗り換えない場合', () => {
  it('中断 → 乗り換えない', async () => {
    const aborted = resultFor([], { aborted: true });
    const { runOnce, calls } = recorder(
      new Map<string | undefined, RunResult>([
        ['a', aborted],
        ['b', resultFor([messageEnd()])],
      ]),
    );

    const run = await runWithFallback(['a', 'b'], runOnce);

    expect(calls).toEqual(['a']);
    expect(run).toBe(aborted);
  });

  it('最後の試行 → そのまま返す', async () => {
    const last = resultFor([]);
    const { runOnce, calls } = recorder(
      new Map<string | undefined, RunResult>([[undefined, last]]),
    );

    const run = await runWithFallback([], runOnce);

    expect(calls).toEqual([undefined]);
    expect(run).toBe(last);
  });

  it('ターン上限（stopped） → 乗り換えない', async () => {
    const stopped = resultFor([], { stopped: 'turn limit reached (40)' });
    const { runOnce, calls } = recorder(
      new Map<string | undefined, RunResult>([
        ['a', stopped],
        ['b', resultFor([messageEnd()])],
      ]),
    );

    const run = await runWithFallback(['a', 'b'], runOnce);

    expect(calls).toEqual(['a']);
    expect(run).toBe(stopped);
  });
});

/** pnpm の lockfile だけある directory。`installCommand` が pnpm を選ぶ前提 */
function dirWithLockfile(): string {
  const dir = tempDir();
  writeFileSync(join(dir, 'pnpm-lock.yaml'), '');
  return dir;
}

describe('installDependencies', () => {
  it('install: (happy) pnpm-lock.yaml のある directory → pnpm install --frozen-lockfile を1回走らせ、ok を返す', () => {
    const dir = dirWithLockfile();
    const calls: Array<{ command: string; args: readonly string[]; cwd: string }> = [];
    const outcome = installDependencies(dir, (command, args, options) => {
      calls.push({ command, args, cwd: options.cwd });
      return { status: 0, stdout: '', stderr: '' };
    });
    expect(calls).toEqual([{ command: 'pnpm', args: ['install', '--frozen-lockfile'], cwd: dir }]);
    expect(outcome).toEqual({ kind: 'ok', command: 'pnpm install --frozen-lockfile' });
  });

  it('install: (error) status 1 → failed を返し、stderr を error に入れる', () => {
    const dir = dirWithLockfile();
    const outcome = installDependencies(dir, () => ({ status: 1, stdout: '', stderr: 'boom' }));
    expect(outcome).toEqual({
      kind: 'failed',
      command: 'pnpm install --frozen-lockfile',
      error: 'boom',
    });
  });
});

describe('worktreeGit', () => {
  it('worktreeGit: (happy) 渡した git をその path と args で呼ぶ → 結果をそのまま返す', () => {
    const path = '/tmp/wt-entry';
    const args: readonly string[] = ['status', '--porcelain'];
    const output = { status: 0, stdout: 'porcelain-out', stderr: '' };
    const calls: Array<{ cwd: string; args: readonly string[] }> = [];
    const git: Git = (cwd, gitArgs) => {
      calls.push({ cwd, args: gitArgs });
      return output;
    };
    const result = worktreeGit(path, git)(args);
    expect(calls).toEqual([{ cwd: path, args }]);
    expect(result).toEqual(output);
  });
});
