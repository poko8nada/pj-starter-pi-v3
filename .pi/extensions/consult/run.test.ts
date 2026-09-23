import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import {
  modelAttempts,
  readPayloads,
  readPayload,
  runForInputs,
  runWithFallback,
  type RunResult,
} from './run.ts';
import { finalTextFrom, parseEvents } from './spec.ts';

// 子の起動と worktree は実際の pi とリポジトリが要るので扱わない。
// 入力の読み取りと、候補の選び方（子を起動しない部分）を試す。

describe('readPayload', () => {
  let dir = '';

  beforeEach(() => {
    dir = mkdtempSync(join(tmpdir(), 'consult-test-'));
  });

  afterEach(() => {
    rmSync(dir, { recursive: true, force: true });
  });

  it('相対パスは cwd から読む', () => {
    writeFileSync(join(dir, 'note.md'), '本文');
    expect(readPayload('note.md', dir)).toBe('本文');
  });

  it('絶対パスはそのまま読む', () => {
    const file = join(dir, 'note.md');
    writeFileSync(file, '本文');
    expect(readPayload(file, dir)).toBe('本文');
  });

  it('存在しないパスは例外にする（無言で空の子を走らせない）', () => {
    const attempt = () => readPayload('missing.md', dir);
    expect(attempt).toThrow(/could not read the input file/);
    expect(attempt).toThrow(join(dir, 'missing.md'));
  });

  it('ディレクトリは例外にする', () => {
    expect(() => readPayload(dir, dir)).toThrow(/could not read the input file/);
  });
});

describe('modelAttempts', () => {
  it('候補 2 つ → 試行は 3 つ（最後は親と同じ）', () => {
    expect(modelAttempts(['a/1', 'b/2'])).toEqual(['a/1', 'b/2', undefined]);
  });

  it('候補 0 つ → 試行は 1 つ（親と同じ）', () => {
    expect(modelAttempts([])).toEqual([undefined]);
  });
});

describe('runWithFallback', () => {
  /** モデルが動いた子の結果（成功・失敗の両方に使う） */
  const spoke: RunResult = {
    stdout: '{"type":"message_end","message":{"role":"assistant","usage":{"output":10}}}\n',
    stderr: '',
    code: 0,
    aborted: false,
  };
  /** モデルが動かなかった子。assistant のイベントは在るが、生成は 0 */
  const silent: RunResult = {
    stdout: '{"type":"message_end","message":{"role":"assistant","usage":{"output":0}}}\n',
    stderr: 'Warning: Model "x" not found for provider "commandcode". Using custom model id.\n',
    code: 0,
    aborted: false,
  };
  const cancelled: RunResult = { stdout: '', stderr: '', code: 1, aborted: true };

  it('1 番目が生成すれば 1 回で終わる', async () => {
    const tried: (string | undefined)[] = [];
    const run = await runWithFallback(['a/1', 'b/2'], async (model) => {
      tried.push(model);
      return spoke;
    });
    expect(tried).toEqual(['a/1']);
    expect(run).toBe(spoke);
  });

  it('何も生成せずに終わったら次の候補でやり直す', async () => {
    const tried: (string | undefined)[] = [];
    await runWithFallback(['a/1', 'b/2'], async (model) => {
      tried.push(model);
      return model === 'a/1' ? silent : spoke;
    });
    expect(tried).toEqual(['a/1', 'b/2']);
  });

  it('候補を使い切ったら `--model` なしで走る', async () => {
    const tried: (string | undefined)[] = [];
    const run = await runWithFallback(['a/1'], async (model) => {
      tried.push(model);
      return silent;
    });
    expect(tried).toEqual(['a/1', undefined]);
    expect(run).toBe(silent);
  });

  it('生成してから失敗したら乗り換えない（タスクの問題）', async () => {
    const tried: (string | undefined)[] = [];
    const failed: RunResult = { ...spoke, code: 1, stderr: 'the task failed' };
    const run = await runWithFallback(['a/1', 'b/2'], async (model) => {
      tried.push(model);
      return failed;
    });
    expect(tried).toEqual(['a/1']);
    expect(run).toBe(failed);
  });

  it('中断されたら乗り換えない', async () => {
    const tried: (string | undefined)[] = [];
    const run = await runWithFallback(['a/1', 'b/2'], async (model) => {
      tried.push(model);
      return cancelled;
    });
    expect(tried).toEqual(['a/1']);
    expect(run).toBe(cancelled);
  });
});

describe('readPayloads', () => {
  let dir = '';

  beforeEach(() => {
    dir = mkdtempSync(join(tmpdir(), 'consult-test-'));
  });

  afterEach(() => {
    rmSync(dir, { recursive: true, force: true });
  });

  it('1 つでも読めなければ投げる（子を起動する前に落とす）', () => {
    writeFileSync(join(dir, 'a.md'), 'A');
    expect(() => readPayloads(['a.md', 'missing.md'], dir)).toThrow(
      /could not read the input file/,
    );
  });
});

describe('runForInputs', () => {
  let dir = '';

  beforeEach(() => {
    dir = mkdtempSync(join(tmpdir(), 'consult-test-'));
  });

  afterEach(() => {
    rmSync(dir, { recursive: true, force: true });
  });

  /** 喋った子の結果 */
  const spoke: RunResult = {
    stdout: '{"type":"message_end","message":{"role":"assistant","usage":{"output":10}}}\n',
    stderr: '',
    code: 0,
    aborted: false,
  };

  it('入力 1 つ → 1 体、結果も 1 つ', async () => {
    writeFileSync(join(dir, 'a.md'), 'A');
    const payloads = readPayloads(['a.md'], dir);
    const tried: (string | undefined)[] = [];
    const results = await runForInputs(payloads, async (payload) => {
      tried.push(payload);
      return spoke;
    });
    expect(tried).toEqual(['A']);
    expect(results).toHaveLength(1);
    expect(results[0]?.ok).toBe(true);
  });

  it('入力 2 つ → 2 体、結果は入力の順に並ぶ', async () => {
    writeFileSync(join(dir, 'a.md'), 'A');
    writeFileSync(join(dir, 'b.md'), 'B');
    const payloads = readPayloads(['a.md', 'b.md'], dir);
    // 子ごとに違う本文を返させる（応答が入力と取り違わっていないかを見る）
    const results = await runForInputs(payloads, async (payload) => ({
      ...spoke,
      stdout: `{"type":"message_end","message":{"role":"assistant","usage":{"output":10},"content":[{"type":"text","text":"answer ${payload}"}]}}\n`,
    }));
    const answered = results.map((entry) =>
      entry.ok ? finalTextFrom(parseEvents(entry.run.stdout)) : `failed: ${entry.error}`,
    );
    expect(answered).toEqual(['answer A', 'answer B']);
  });

  it('1 体が例外を投げても、その 1 つだけが失敗として残る', async () => {
    const results = await runForInputs(['A', 'B', 'C'], async (payload) => {
      if (payload === 'B') {
        throw new Error('spawn failed');
      }
      return spoke;
    });
    expect(results.map((entry) => (entry.ok ? 'ok' : entry.error))).toEqual([
      'ok',
      'spawn failed',
      'ok',
    ]);
  });
});
