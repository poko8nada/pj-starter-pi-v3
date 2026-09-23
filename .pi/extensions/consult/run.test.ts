import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { modelAttempts, readPayload, runWithFallback, type RunResult } from './run.ts';

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
