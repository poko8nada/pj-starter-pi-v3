import { spawnSync } from 'node:child_process';
import { writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { beforeEach, describe, expect, it } from 'vitest';
import { tmpDir } from '../../../test/tmp.ts';
import {
  applyEvent,
  runPi,
  stateOf,
  reasonOf,
  watchdogDue,
  type RunResult,
  type RunState,
  spawnOptions,
  gitEnv,
  modelAttempts,
  readPayload,
  readPayloads,
  runForInputs,
  runWithFallback,
} from './run.ts';
import { finalTextFrom, parseEvents } from '../child/spec.ts';

// 子の起動は `.pi/test/pi` の偽で扱う。worktree は実際のリポジトリが要るので扱わない。
// ファイルを書くテストは `.pi/test/tmp.ts` の helper に置き場を寄せる。

/** git を差し替えて、コミットと ref 作りの判断だけを試す */

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
    ended: false,
  };
  /** モデルが動かなかった子。assistant のイベントは在るが、生成は 0 */
  const silent: RunResult = {
    stdout: '{"type":"message_end","message":{"role":"assistant","usage":{"output":0}}}\n',
    stderr: 'Warning: Model "x" not found for provider "commandcode". Using custom model id.\n',
    code: 0,
    aborted: false,
    ended: false,
  };
  const cancelled: RunResult = { stdout: '', stderr: '', code: 1, aborted: true, ended: false };

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
    ended: false,
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
  return { stdout, stderr: '', code: 0, aborted: false, ended: false, ...extra };
}

describe('spawnOptions', () => {
  it('子は detach して起こす（親が落ちても作業が残る）', () => {
    const options = spawnOptions('/tmp/x', {});
    expect(options.detached).toBe(true);
    expect(options.cwd).toBe('/tmp/x');
    expect(options.stdio).toEqual(['pipe', 'pipe', 'pipe']);
  });
});

describe('stateOf / reasonOf', () => {
  it('code 0 → done（理由は出さない）', () => {
    const run = combinedRun('x');
    expect(stateOf(run)).toBe('done');
    expect(reasonOf(run)).toBeUndefined();
  });

  it('止められた → aborted（上限の印より先に見る）', () => {
    const run = combinedRun('', { stopped: 'turn limit reached (1)', aborted: true });
    expect(stateOf(run)).toBe('aborted');
    expect(reasonOf(run)).toBe('stopped by the parent');
  });

  it('上限で止まった → turn-limit とその理由', () => {
    const run = combinedRun('', { stopped: 'turn limit reached (40)' });
    expect(stateOf(run)).toBe('turn-limit');
    expect(reasonOf(run)).toBe('turn limit reached (40)');
  });

  it('code が 0 でない → error。理由は stderr の最初の行', () => {
    const run = combinedRun('', { code: 1, stderr: '\n boom happened \nmore\n' });
    expect(stateOf(run)).toBe('error');
    expect(reasonOf(run)).toBe('boom happened');
  });

  it('code が 0 でないが stderr が空 → exit の番号を理由にする', () => {
    expect(reasonOf(combinedRun('', { code: 130 }))).toBe('exit 130');
  });
});

function makeWatchState(overrides: Partial<RunState> = {}): RunState {
  return {
    stdout: '',
    stderr: '',
    buffered: '',
    aborted: false,
    spent: { turns: 0, output: 0 },
    limits: { turns: 40, output: 60000 },
    lastOutputAt: 1000,
    ...overrides,
  };
}

describe('applyEvent', () => {
  it('agent_end のイベント → endedAt が入る', () => {
    const state = makeWatchState({ lastOutputAt: 1000 });
    applyEvent(state, { type: 'agent_end' }, 2000);
    expect(state.endedAt).toBe(2000);
    expect(state.lastOutputAt).toBe(2000);
  });

  it('agent_end の後に出力 → lastOutputAt が進む（endedAt は最初のまま）', () => {
    const state = makeWatchState({ lastOutputAt: 1000 });
    applyEvent(state, { type: 'agent_end' }, 2000);
    applyEvent(
      state,
      { type: 'message_end', message: { role: 'assistant', usage: { output: 1 } } },
      3000,
    );
    expect(state.endedAt).toBe(2000);
    expect(state.lastOutputAt).toBe(3000);
  });

  it('agent_end が来ない → endedAt は空のまま', () => {
    const state = makeWatchState({ lastOutputAt: 1000 });
    applyEvent(
      state,
      { type: 'message_end', message: { role: 'assistant', usage: { output: 1 } } },
      2000,
    );
    expect(state.endedAt).toBeUndefined();
    expect(state.lastOutputAt).toBe(2000);
  });

  it('壊れた行 → イベントとして扱わない', () => {
    const state = makeWatchState({ lastOutputAt: 1000 });
    applyEvent(state, 'not json', 2000);
    applyEvent(state, null, 2000);
    applyEvent(state, 42, 2000);
    expect(state.endedAt).toBeUndefined();
    expect(state.lastOutputAt).toBe(1000);
    expect(state.spent).toEqual({ turns: 0, output: 0 });
    expect(state.stopped).toBeUndefined();
  });

  it('上限で止まった後のイベント → 数えない', () => {
    const state = makeWatchState({
      limits: { turns: 1, output: 60000 },
      lastOutputAt: 1000,
    });
    applyEvent(
      state,
      { type: 'message_end', message: { role: 'assistant', usage: { output: 1 } } },
      2000,
    );
    expect(state.stopped).toBeUndefined();
    applyEvent(
      state,
      { type: 'message_end', message: { role: 'assistant', usage: { output: 1 } } },
      3000,
    );
    expect(state.stopped).toBe('turn limit reached (1)');
    const spent = { ...state.spent };
    applyEvent(state, { type: 'agent_end' }, 4000);
    expect(state.endedAt).toBeUndefined();
    expect(state.lastOutputAt).toBe(3000);
    expect(state.spent).toEqual(spent);
  });

  it('agent_end の後の出力は上限に数えない', () => {
    const state = makeWatchState({
      limits: { turns: 1, output: 60000 },
      lastOutputAt: 1000,
    });
    applyEvent(state, { type: 'agent_end' }, 2000);
    applyEvent(
      state,
      { type: 'message_end', message: { role: 'assistant', usage: { output: 1 } } },
      3000,
    );
    applyEvent(
      state,
      { type: 'message_end', message: { role: 'assistant', usage: { output: 1 } } },
      4000,
    );
    expect(state.endedAt).toBe(2000);
    expect(state.stopped).toBeUndefined();
    expect(state.lastOutputAt).toBe(4000);
    expect(state.spent).toEqual({ turns: 0, output: 0 });
  });
});

describe('watchdogDue', () => {
  it('猶予ちょうど → true', () => {
    expect(watchdogDue(1000, 1000, 1000 + 30000, 30000)).toBe(true);
  });

  it('猶予の前 → false', () => {
    expect(watchdogDue(1000, 1000, 1000 + 29999, 30000)).toBe(false);
  });

  it('猶予を過ぎたら → true', () => {
    expect(watchdogDue(1000, 1000, 1000 + 30001, 30000)).toBe(true);
  });

  it('agent_end が無ければ → false', () => {
    expect(watchdogDue(undefined, 1000, 1000 + 60000, 30000)).toBe(false);
  });

  it('出力が進めば猶予が伸びる', () => {
    expect(watchdogDue(1000, 2000, 2000 + 29999, 30000)).toBe(false);
    expect(watchdogDue(1000, 2000, 2000 + 30000, 30000)).toBe(true);
  });
});

describe('stateOf / reasonOf: ended', () => {
  it('ended: true の run → done（理由は出さない）', () => {
    const run = combinedRun('', { ended: true, code: 1 });
    expect(stateOf(run)).toBe('done');
    expect(reasonOf(run)).toBeUndefined();
  });

  it('aborted と ended が同時 → aborted を先に見る', () => {
    const run = combinedRun('', { aborted: true, ended: true });
    expect(stateOf(run)).toBe('aborted');
    expect(reasonOf(run)).toBe('stopped by the parent');
  });

  it('ended と stopped が同時 → ended が勝って done（理由なし）', () => {
    const run = combinedRun('', { ended: true, stopped: 'turn limit reached (40)', code: 1 });
    expect(stateOf(run)).toBe('done');
    expect(reasonOf(run)).toBeUndefined();
  });
});

function fakeEnv(mode: string): NodeJS.ProcessEnv {
  const fakeDir = join(process.cwd(), '.pi/test');
  return {
    ...process.env,
    PATH: `${fakeDir}:${process.env.PATH ?? ''}`,
    FAKE_PI_MODE: mode,
  };
}

describe('runPi: watchdog', () => {
  it('agent_end の後に眠る子 → 猶予の後に殺され、ended:true で done、最後の本文が取れる', async () => {
    const dir = tmpDir();
    const run = await runPi({
      piArgs: ['--mode', 'json'],
      stdin: 'task',
      cwd: dir,
      env: fakeEnv('sleep'),
      limits: { turns: 40, output: 60000 },
      watchdogMs: 100,
    });
    expect(run.ended).toBe(true);
    expect(stateOf(run)).toBe('done');
    expect(finalTextFrom(parseEvents(run.stdout))).toBe('fake report');
  });

  it('普通に終わる子 → 殺さず done', async () => {
    const dir = tmpDir();
    const run = await runPi({
      piArgs: ['--mode', 'json'],
      stdin: 'task',
      cwd: dir,
      env: fakeEnv('exit'),
      limits: { turns: 40, output: 60000 },
      watchdogMs: 100,
    });
    expect(run.ended).toBe(true);
    expect(stateOf(run)).toBe('done');
    expect(finalTextFrom(parseEvents(run.stdout))).toBe('fake report');
  });

  it('agent_end の後にもう1つイベント → 猶予の内にタイマーが戻り、本文を配達して done', async () => {
    const dir = tmpDir();
    const run = await runPi({
      piArgs: ['--mode', 'json'],
      stdin: 'task',
      cwd: dir,
      env: fakeEnv('extra'),
      limits: { turns: 40, output: 60000 },
      watchdogMs: 100,
    });
    expect(run.ended).toBe(true);
    expect(stateOf(run)).toBe('done');
    expect(run.stdout).toContain('extra');
  });

  it('猶予の前に親が cancel → aborted', async () => {
    const dir = tmpDir();
    const controller = new AbortController();
    const promise = runPi({
      piArgs: ['--mode', 'json'],
      stdin: 'task',
      cwd: dir,
      signal: controller.signal,
      env: fakeEnv('sleep'),
      limits: { turns: 40, output: 60000 },
      watchdogMs: 100,
    });
    setTimeout(() => {
      controller.abort();
    }, 20);
    const run = await promise;
    expect(run.aborted).toBe(true);
    expect(stateOf(run)).toBe('aborted');
  });

  it('pi の無い PATH → 起動できず error', async () => {
    const dir = tmpDir();
    const emptyBin = tmpDir();
    const run = await runPi({
      piArgs: ['--mode', 'json'],
      stdin: 'task',
      cwd: dir,
      env: { ...process.env, PATH: emptyBin },
      limits: { turns: 40, output: 60000 },
      watchdogMs: 100,
    });
    expect(stateOf(run)).toBe('error');
    expect(run.ended).toBe(false);
  });

  it('出し続ける子 → 初回猶予を越えても殺されない', async () => {
    const dir = tmpDir();
    const controller = new AbortController();
    let finished = false;
    const promise = runPi({
      piArgs: ['--mode', 'json'],
      stdin: 'task',
      cwd: dir,
      signal: controller.signal,
      env: fakeEnv('steady'),
      limits: { turns: 40, output: 60000 },
      watchdogMs: 100,
    }).then((run) => {
      finished = true;
      return run;
    });
    await new Promise<void>((resolve) => {
      setTimeout(() => {
        resolve();
      }, 350);
    });
    expect(finished).toBe(false);
    controller.abort();
    const run = await promise;
    expect(run.aborted).toBe(true);
    expect(run.ended).toBe(true);
    expect(stateOf(run)).toBe('aborted');
  });

  it('壊れた行を出し続ける子 → 静かにならず殺されない', async () => {
    const dir = tmpDir();
    const controller = new AbortController();
    let finished = false;
    const promise = runPi({
      piArgs: ['--mode', 'json'],
      stdin: 'task',
      cwd: dir,
      signal: controller.signal,
      env: fakeEnv('broken'),
      limits: { turns: 40, output: 60000 },
      watchdogMs: 100,
    }).then((run) => {
      finished = true;
      return run;
    });
    await new Promise<void>((resolve) => {
      setTimeout(() => {
        resolve();
      }, 250);
    });
    expect(finished).toBe(false);
    controller.abort();
    const run = await promise;
    expect(run.stdout).toContain('not json');
    expect(run.aborted).toBe(true);
  });

  it('agent_end 後の stderr → 猶予を延ばさず殺して done', async () => {
    const dir = tmpDir();
    const run = await runPi({
      piArgs: ['--mode', 'json'],
      stdin: 'task',
      cwd: dir,
      env: fakeEnv('stderr'),
      limits: { turns: 40, output: 60000 },
      watchdogMs: 100,
    });
    expect(run.ended).toBe(true);
    expect(stateOf(run)).toBe('done');
    expect(finalTextFrom(parseEvents(run.stdout))).toBe('fake report');
    expect(run.stderr).toContain('some warning noise');
  });

  it('FAKE_PI_TEXT → 最後の本文が差し替わる', async () => {
    const dir = tmpDir();
    const run = await runPi({
      piArgs: ['--mode', 'json'],
      stdin: 'task',
      cwd: dir,
      env: { ...fakeEnv('exit'), FAKE_PI_TEXT: 'custom body' },
      limits: { turns: 40, output: 60000 },
      watchdogMs: 100,
    });
    expect(finalTextFrom(parseEvents(run.stdout))).toBe('custom body');
  });

  it('FAKE_PI_MODE 未設定・不正 → exit 2（未設定は何も出さない）', () => {
    const fake = join(process.cwd(), '.pi/test/pi');
    const bareEnv: NodeJS.ProcessEnv = { ...process.env };
    delete bareEnv.FAKE_PI_MODE;
    delete bareEnv.FAKE_PI_TEXT;
    const unset = spawnSync(fake, [], { encoding: 'utf8', env: bareEnv });
    expect(unset.status).toBe(2);
    expect(unset.stdout).toBe('');
    const bogus = spawnSync(fake, [], {
      encoding: 'utf8',
      env: { ...bareEnv, FAKE_PI_MODE: 'bogus' },
    });
    expect(bogus.status).toBe(2);
  });

  it('watchdogMs 省略 → 既定のまま普通に終わる', async () => {
    const dir = tmpDir();
    const run = await runPi({
      piArgs: ['--mode', 'json'],
      stdin: 'task',
      cwd: dir,
      env: fakeEnv('exit'),
      limits: { turns: 40, output: 60000 },
    });
    expect(run.ended).toBe(true);
    expect(stateOf(run)).toBe('done');
  });
});
