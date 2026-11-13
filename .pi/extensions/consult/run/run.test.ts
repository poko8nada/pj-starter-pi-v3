import { describe, expect, it } from 'vitest';
import { runWithFallback, type RunResult } from './run.ts';

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
