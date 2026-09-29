import { spawnSync } from 'node:child_process';
import { writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { tmpDir } from '../../../../test/tmp.ts';
import { runGit } from './git-env.ts';
import {
  combineRuns,
  commitWorktree,
  gitEnv,
  installCommand,
  modelAttempts,
  readPayload,
  readPayloads,
  runForInputs,
  runWithFallback,
  type GitOutput,
  type RunResult,
} from './run.ts';
import { finalTextFrom, parseEvents, usageFrom } from '../child/spec.ts';
import { compose } from '../tool/render.ts';

// 子の起動と worktree は実際の pi とリポジトリが要るので扱わない。入力の読み取りと、候補の選び方（子を起動しない部分）を試す。
// ファイルを書くテストは `test/tmp.ts` の helper に置き場を寄せる。

/** git を差し替えて、コミットと ref 作りの判断だけを試す */
function recorder(overrides: Record<string, GitOutput> = {}) {
  const calls: string[][] = [];
  const git = (args: readonly string[]): GitOutput => {
    calls.push([...args]);
    const key = args[0] ?? '';
    return overrides[key] ?? { status: 0, stdout: '', stderr: '' };
  };
  return { git, calls };
}

describe('readPayload', () => {
  let dir = '';

  beforeEach(() => {
    dir = tmpDir();
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
    dir = tmpDir();
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
    dir = tmpDir();
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
      entry.ok ? finalTextFrom(parseEvents(entry.value.stdout)) : `failed: ${entry.error}`,
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

describe('gitEnv', () => {
  it('フックの GIT_* を落とす（cwd のリポジトリを見させる）', () => {
    const cleaned = gitEnv({ PATH: '/bin', GIT_INDEX_FILE: '/tmp/index', GIT_DIR: '/other' });
    expect(cleaned).toEqual({ PATH: '/bin' });
  });
});

describe('installCommand', () => {
  let dir = '';

  beforeEach(() => {
    dir = tmpDir();
  });

  it('`pnpm-lock.yaml` がある → `pnpm install --frozen-lockfile`', () => {
    writeFileSync(join(dir, 'pnpm-lock.yaml'), '');
    expect(installCommand(dir)).toEqual(['pnpm', 'install', '--frozen-lockfile']);
  });

  it('`package-lock.json` がある → `npm ci`', () => {
    writeFileSync(join(dir, 'package-lock.json'), '{}');
    expect(installCommand(dir)).toEqual(['npm', 'ci']);
  });

  it('どちらも無い → 何もしない', () => {
    expect(installCommand(dir)).toBeUndefined();
  });
});

describe('commitWorktree', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  const changed: GitOutput = { status: 0, stdout: ' M note.md\n', stderr: '' };

  it('変更あり → コミットされ、ブランチが返る', () => {
    const { git, calls } = recorder({
      status: changed,
      show: { status: 0, stdout: 'abc123 the child work\n note.md | 1 +\n', stderr: '' },
    });
    const outcome = commitWorktree('demo', git);
    expect(outcome.kind).toBe('committed');
    expect(outcome).toMatchObject({ ref: 'consult/demo' });
    expect(calls.map((args) => args[0])).toEqual(['status', 'add', 'commit', 'branch', 'show']);
    expect(calls[3]).toEqual(['branch', 'consult/demo', 'HEAD']);
  });

  it('変更なし → ブランチを作らない', () => {
    const { git, calls } = recorder();
    expect(commitWorktree('demo', git)).toEqual({ kind: 'no-change' });
    expect(calls.map((args) => args[0])).toEqual(['status']);
  });

  it('フックが落ちたらブランチを作らない', () => {
    const { git, calls } = recorder({
      status: changed,
      commit: { status: 1, stdout: '', stderr: 'lint failed' },
    });
    expect(commitWorktree('demo', git)).toEqual({ kind: 'failed', error: 'lint failed' });
    expect(calls.map((args) => args[0])).toEqual(['status', 'add', 'commit']);
  });

  it('継承した GIT_* を無視する（外の repo を指していても、自分の repo に書く）', () => {
    // 外の repo の代役。ここが書き換わったら、検査は外に届いている。
    const decoy = tmpDir();
    const mine = tmpDir();
    const home = tmpDir();
    runGit(decoy, home, ['init', '--quiet']);
    runGit(mine, home, ['init', '--quiet']);

    // フックが載せる形: 継承した GIT_* が、外の repo（decoy）を指している
    vi.stubEnv('GIT_DIR', join(decoy, '.git'));
    vi.stubEnv('GIT_WORK_TREE', decoy);

    runGit(mine, home, ['config', 'user.email', 'mine@example.com']);
    expect(runGit(mine, home, ['config', '--local', 'user.email']).stdout.trim()).toBe(
      'mine@example.com',
    );
    expect(runGit(decoy, home, ['config', '--local', 'user.email']).stdout.trim()).toBe('');

    // 裏取り: 置き場を決めない呼び方なら、同じ汚れで外の decoy に届く。この検査は空振りできない
    spawnSync('git', ['config', 'user.email', 'leaked@example.com'], {
      cwd: mine,
      encoding: 'utf8',
      env: process.env,
    });
    expect(runGit(decoy, home, ['config', '--local', 'user.email']).stdout.trim()).toBe(
      'leaked@example.com',
    );
  });
});

describe('runForInputs: 同期で投げるコールバック', () => {
  // コールバックが同期で投げても、その入力だけが {ok: false} になり、他の入力は走る。
  // 実演で踏んだ形（ガードを async でないコールバックに置いたら、入力の map がそこで止まった）。
  it('投げた入力だけが {ok: false} で、他の入力の子は走る', async () => {
    let started = 0;
    const results = await runForInputs(['', '中身'], (payload) => {
      if (payload === '') {
        throw new Error('空の入力');
      }
      started += 1;
      return Promise.resolve(`answer ${payload}`);
    });
    expect(results).toEqual([
      { ok: false, error: '空の入力' },
      { ok: true, value: 'answer 中身' },
    ]);
    expect(started).toBe(1);
  });

  it('全部が空なら、子は 1 体も走らない', async () => {
    let started = 0;
    const results = await runForInputs(['', '   '], (payload) => {
      if (payload.trim() === '') {
        throw new Error('空の入力');
      }
      started += 1;
      return Promise.resolve(`answer ${payload}`);
    });
    expect(results).toEqual([
      { ok: false, error: '空の入力' },
      { ok: false, error: '空の入力' },
    ]);
    expect(started).toBe(0);
  });
});

/** combineRuns に渡す 1 回分の結果 */
function combinedRun(stdout: string, extra: Partial<RunResult> = {}): RunResult {
  return { stdout, stderr: '', code: 0, aborted: false, ...extra };
}

/** message_end 1 つ分。使用量を足すのを見る */
function spentEvent(input: number, output: number): string {
  return [
    '{"type":"message_end","message":{"role":"assistant","usage":{"input":',
    input,
    ',"output":',
    output,
    '}}}',
    '\n',
  ].join('');
}

describe('combineRuns', () => {
  it('2 回走った使用量を 1 回分に足す', () => {
    const merged = combineRuns([combinedRun(spentEvent(10, 20)), combinedRun(spentEvent(3, 4))]);
    expect(usageFrom(parseEvents(merged.stdout))).toMatchObject({
      turns: 2,
      input: 13,
      output: 24,
    });
  });

  it('止まったのは最後の回だけ見る（続きが通れば打ち切りにしない）', () => {
    const stopped = combinedRun('', { stopped: 'turn limit reached (1)' });
    expect(combineRuns([stopped, combinedRun('')]).stopped).toBeUndefined();
    expect(combineRuns([combinedRun(''), stopped]).stopped).toBe('turn limit reached (1)');
  });

  it('1 回分はそのまま返す', () => {
    const only = combinedRun('x');
    expect(combineRuns([only])).toBe(only);
  });
});

describe('compose: 打ち切りの行', () => {
  const stopped: RunResult = {
    stdout:
      '{"type":"message_end","message":{"role":"assistant","content":[{"type":"text","text":"half"}],"usage":{"output":1}}}\n',
    stderr: '',
    code: 0,
    stopped: 'turn limit reached (2)',
    aborted: false,
  };

  it('回数と、続きを走らせたかを、打ち切りの行の隣に出す', () => {
    const body = compose(parseEvents(stopped.stdout), stopped, { attempts: 2, continued: true });
    expect(body).toContain('consult stopped early: turn limit reached (2)');
    expect(body).toContain('consult runs: 2');
    expect(body.indexOf('consult stopped early')).toBeLessThan(body.indexOf('consult runs:'));
  });

  it('上限で止まっていなければ、回数の行は出ない', () => {
    const finished: RunResult = { ...stopped, stopped: undefined };
    const body = compose(parseEvents(finished.stdout), finished, { attempts: 1, continued: false });
    expect(body).not.toContain('consult runs:');
  });
});
