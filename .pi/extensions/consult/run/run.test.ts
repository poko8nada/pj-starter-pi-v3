import type { EventEmitter } from 'node:events';
import { describe, expect, it, vi } from 'vitest';
import { applyEvent, runPi, runWithFallback, type RunResult, type RunState } from './run.ts';
import type { ModelEvent } from '../sub/spec.ts';
import { aTypePolicy } from '../consult.fixture.ts';

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

/** spawn が返す偽の子プロセス。stdout と close をテストが動かす */
interface FakeChild {
  readonly stdout: EventEmitter;
  readonly stderr: EventEmitter;
  readonly stdin: { end(text: string): void };
  readonly pid: number;
  readonly killed: boolean;
  kill(signal: string): void;
  emit(event: string, ...args: unknown[]): boolean;
}

const spawnedChildren = vi.hoisted(() => [] as FakeChild[]);

vi.mock('node:child_process', async (importOriginal: () => Promise<Record<string, unknown>>) => {
  const actual = await importOriginal();
  const { EventEmitter: Emitter } = await import('node:events');
  class FakeChildProcess extends Emitter {
    readonly stdout = new Emitter();
    readonly stderr = new Emitter();
    readonly stdin = { end: () => {} };
    readonly pid = 123;
    killed = false;
    kill() {
      this.killed = true;
    }
  }
  return {
    ...actual,
    spawn: () => {
      const child = new FakeChildProcess();
      spawnedChildren.push(child);
      return child;
    },
  };
});

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

  it('auto_retry_start → retry-start を返す', () => {
    const state = initialState();
    applyEvent(state, messageEnd({ provider: 'p', model: 'm' }), 1);
    const event = {
      type: 'auto_retry_start',
      attempt: 1,
      maxAttempts: 3,
      delayMs: 2000,
      errorMessage: 'rate limited',
    };
    expect(applyEvent(state, event, 1)).toEqual({
      kind: 'retry-start',
      model: 'p/m',
      attempt: 1,
      maxAttempts: 3,
      delayMs: 2000,
      error: 'rate limited',
    });
  });
});

describe('runPi: onModelEvent', () => {
  it('再試行のイベントを onModelEvent に流す', async () => {
    spawnedChildren.length = 0;
    const received: ModelEvent[] = [];
    const promise = runPi({
      piArgs: [],
      stdin: '',
      cwd: '/tmp/base',
      env: {},
      limits: aTypePolicy().limits,
      onModelEvent: (event) => received.push(event),
    });
    const child = spawnedChildren[0];
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
    expect(received).toEqual([
      {
        kind: 'retry-start',
        model: 'p/m',
        attempt: 1,
        maxAttempts: 3,
        delayMs: 2000,
        error: 'rate limited',
      },
    ]);
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
