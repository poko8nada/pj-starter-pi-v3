/**
 * consult 道具のバックグラウンドの面を、偽の API で確かめる。
 *
 * サブエージェントは起こさない。`createRuntime` に差し替えた `run` を渡し、完了のタイミングと届くメッセージを自分で決める。pi の `sendMessage` と slash command の `ctx.ui.notify` も記録する。
 * 記録の保存場所は `placeFor(tempDir(), tempDir())` で作り、session は `'test-session'` を渡す
 * （`parseRun` が空の session を弾くため、既定の `''` は使わない）。
 */

import type { AgentToolResult } from '@earendil-works/pi-coding-agent';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  controlSubagent,
  createRuntime,
  modelNotifier,
  type CommandContext,
  type ConsultContext,
  type ConsultOutcome,
  type ConsultRunner,
  type ConsultRuntime,
  type PiFace,
} from './consult.ts';
import { isSoundEnabled, setSoundEnabled } from './sound.ts';
import { tempDir } from '../../../../test/temp-dir.ts';
import { aPiFace, aPlace, aRunRecord, START_TOKEN } from '../consult.fixture.ts';
import { appendRun, readRuns, type CheckRecord, type RunRecord } from '../run/log.ts';
import { type PsRun } from '../run/proc.ts';
import { placeFor, type Place } from '../run/place.ts';
import type { SubagentHooks, SubagentJob } from '../run/subagent.ts';
import type { ConsultOptions } from '../sub/spec.ts';

/** テストの session。記録に書く側と、runtime に渡す側で同じものを使う */
const SESSION = 'test-session';

/** consult() が runOneSubagent に渡した hooks */
const capturedHooks = vi.hoisted(() => [] as SubagentHooks[]);

vi.mock('../run/subagent.ts', async (importOriginal: () => Promise<Record<string, unknown>>) => {
  const actual = await importOriginal();
  return {
    ...actual,
    runOneSubagent: async (
      _ctx: ConsultContext,
      _options: ConsultOptions,
      _job: SubagentJob,
      hooks?: SubagentHooks,
    ) => {
      if (hooks !== undefined) {
        capturedHooks.push(hooks);
      }
      return { run: { stdout: '', stderr: '', code: 0, aborted: false, ended: true } };
    },
  };
});

// 道具の文脈は cwd と通知の窓口だけ。ここは読み取り専用で、サブエージェントは差し替えた `run` が受けるので本体を見ない。
// 一時ものを本体に作らない。読めない入力の検査は、本体 root に依存しないよう helper の保存場所を指す。
const toolCtx: ConsultContext = { cwd: process.cwd(), ui: { notify: () => {} } };

beforeEach(() => {
  setSoundEnabled(true);
});

afterEach(() => {
  setSoundEnabled(true);
});

/** runtime と保存場所を組む。session は `SESSION`。`check` を渡すと生死の照合を差し替えられる */
function setup(
  pi: PiFace,
  run: ConsultRunner,
  check?: CheckRecord,
  psRun?: PsRun,
): { readonly runtime: ConsultRuntime; readonly place: Place } {
  const place = aPlace();
  return {
    runtime: createRuntime(pi, place, run, () => SESSION, check, psRun),
    place,
  };
}

type RunParams = Parameters<ConsultRuntime['run']>[1];

function startSubagent(runtime: ConsultRuntime, params: RunParams) {
  return runtime.run('call', params, undefined, undefined, toolCtx);
}

/** 道具の戻り値の本文を取る */
function textOf(result: AgentToolResult<Record<string, unknown>>): string {
  const first = result.content[0];
  return first !== undefined && first.type === 'text' ? first.text : '';
}

/** sendMessage の呼び出しを記録する偽の pi */
function fakePi(): Pick<ReturnType<typeof aPiFace>, 'pi' | 'calls'> {
  const made = aPiFace();
  return { pi: made.pi, calls: made.calls };
}

/** ui.notify を記録する偽の consult 文脈。通知だけを見る */
function fakeConsultContext(): {
  ctx: ConsultContext;
  notices: { message: string; type?: 'info' | 'warning' | 'error' }[];
} {
  const notices: { message: string; type?: 'info' | 'warning' | 'error' }[] = [];
  const ctx: ConsultContext = {
    cwd: '/tmp/base',
    ui: {
      notify: (message: string, type?: 'info' | 'warning' | 'error') => {
        notices.push({ message, type });
      },
    },
  };
  return { ctx, notices };
}

/** ui.notify を記録する偽のコマンド文脈。通知の記録は consult 文脈と同じ形を使う */
function fakeCommandContext(): {
  ctx: CommandContext;
  notices: { message: string; type?: 'info' | 'warning' | 'error' }[];
} {
  const { ctx, notices } = fakeConsultContext();
  return { ctx: { ui: ctx.ui }, notices };
}

/** 完了をテストが決めるサブエージェント。signal と resolve を記録する */
function deferredRunner(): {
  run: ConsultRunner;
  signals: (AbortSignal | undefined)[];
  resolvers: ((outcome: ConsultOutcome) => void)[];
} {
  const signals: (AbortSignal | undefined)[] = [];
  const resolvers: ((outcome: ConsultOutcome) => void)[] = [];
  const run: ConsultRunner = (_ctx, _options, job) => {
    signals.push(job.signal);
    return new Promise<ConsultOutcome>((resolve) => {
      resolvers.push(resolve);
    });
  };
  return { run, signals, resolvers };
}

/** 背景の then / catch / finally を流す */
function flush(): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, 0);
  });
}

/** 走っている行を 1 本書く。pid が生きている間だけ述語は true。`extra` で終わりの欄も足せる */
function seedRunning(place: Place, extra: Partial<RunRecord> = {}) {
  appendRun(
    place,
    aRunRecord({
      session: extra.session ?? SESSION,
      subagent: extra.subagent ?? 'consult-9',
      pid: extra.pid ?? process.pid,
      started: extra.started ?? Date.now(),
      ...extra,
    }),
  );
}

describe('run', () => {
  it('review を 1 体起こす → id が返り、その時点でサブエージェントは終わっていない', async () => {
    const { pi, calls } = fakePi();
    const { run: runner, signals, resolvers } = deferredRunner();
    const { runtime } = setup(pi, runner);

    const result = await startSubagent(runtime, { role: 'review', task: '判定する' });

    expect(textOf(result)).toContain('started: consult-1');
    expect(runtime.subagents.size).toBe(1);
    expect(signals).toHaveLength(1);
    expect(resolvers).toHaveLength(1);
    expect(calls).toHaveLength(0);
  });

  it('記録に consult-3 がある → 次のサブエージェントは consult-4（reload で番号が戻らない）', async () => {
    const { pi } = fakePi();
    const { run: runner } = deferredRunner();
    const { runtime, place } = setup(pi, runner);
    const seedNum = 3;
    const expectedNum = seedNum + 1;
    seedRunning(place, { subagent: `consult-${seedNum}` });

    const result = await startSubagent(runtime, { role: 'review', task: '判定する' });

    expect(textOf(result)).toContain(`started: consult-${expectedNum}`);
  });

  it('記録に consult-7 と consult-2 が混ざっている → 次は consult-8', async () => {
    const { pi } = fakePi();
    const { run: runner } = deferredRunner();
    const { runtime, place } = setup(pi, runner);
    const high = 7;
    const low = 2;
    const expectedNum = high + 1;
    seedRunning(place, { subagent: `consult-${high}` });
    seedRunning(place, { subagent: `consult-${low}` });

    const result = await startSubagent(runtime, { role: 'review', task: '判定する' });

    expect(textOf(result)).toContain(`started: consult-${expectedNum}`);
  });

  it('別の session の consult-9 は数えない → この session の次は consult-1', async () => {
    const { pi } = fakePi();
    const { run: runner } = deferredRunner();
    const { runtime, place } = setup(pi, runner);
    seedRunning(place, { subagent: 'consult-9', session: 'other-session' });

    const result = await startSubagent(runtime, { role: 'review', task: '判定する' });

    expect(textOf(result)).toContain('started: consult-1');
  });

  it('同じ runtime で続けて 2 体 → consult-1、consult-2（記録に書かれる前に次を決める）', async () => {
    const { pi } = fakePi();
    const { run: runner } = deferredRunner();
    const { runtime } = setup(pi, runner);

    const first = await startSubagent(runtime, { role: 'review', task: '1 体目' });
    const second = await startSubagent(runtime, { role: 'review', task: '2 体目' });

    expect(textOf(first)).toContain('started: consult-1');
    expect(textOf(second)).toContain('started: consult-2');
  });

  it('終わったサブエージェントの番号も数える → 次は consult-6', async () => {
    const { pi } = fakePi();
    const { run: runner } = deferredRunner();
    const { runtime, place } = setup(pi, runner);
    const seedNum = 5;
    const expectedNum = seedNum + 1;
    appendRun(
      place,
      aRunRecord({
        session: SESSION,
        subagent: `consult-${seedNum}`,
        pid: process.pid,
        started: Date.now() - 1000,
        ended: Date.now(),
        state: 'done',
        files: [],
        turns: 1,
        spend: '0.0001 usd',
      }),
    );

    const result = await startSubagent(runtime, { role: 'review', task: '判定する' });

    expect(textOf(result)).toContain(`started: consult-${expectedNum}`);
  });

  it('書き込むロール（code）で worktree を省くと、サブエージェントを起こさずに拒む', async () => {
    const { pi } = fakePi();
    const { run: runner, signals } = deferredRunner();
    const { runtime } = setup(pi, runner);

    await expect(startSubagent(runtime, { role: 'code', task: 'x' })).rejects.toThrow(
      /needs a worktree/,
    );
    expect(signals).toHaveLength(0);
    expect(runtime.subagents.size).toBe(0);
  });

  it('知らない worktree の id → サブエージェントを起こさずに拒む', async () => {
    const { pi } = fakePi();
    const { run: runner, signals } = deferredRunner();
    const { runtime } = setup(pi, runner);

    await expect(
      startSubagent(runtime, { role: 'code', task: 'x', worktree: 'no-such-unit' }),
    ).rejects.toThrow(/no such worktree/);
    expect(signals).toHaveLength(0);
    expect(runtime.subagents.size).toBe(0);
  });
});

describe('完了の通知', () => {
  it('サブエージェントの完了 → pi.sendMessage は呼ばれず、記録に本文と token の 1 行が増える', async () => {
    const { pi, calls } = fakePi();
    let resolveOutcome!: (outcome: ConsultOutcome) => void;
    const run: ConsultRunner = (_ctx, _options, job) => {
      job.onStarted?.(process.pid);
      return new Promise<ConsultOutcome>((resolve) => {
        resolveOutcome = resolve;
      });
    };
    const { runtime, place } = setup(pi, run);
    await startSubagent(runtime, { role: 'review', task: '直す' });

    const body = 'the subagent text';
    const ref = 'ref: consult/code-1';
    const outcome: ConsultOutcome = {
      text: `${body}\n\n${ref}\n\n[consult] model-x / 3 turns / in 10 out 20`,
      details: { type: 'review' },
    };
    resolveOutcome(outcome);
    await flush();

    expect(calls).toHaveLength(0);
    expect(runtime.subagents.size).toBe(0);
    const records = readRuns(place, { session: SESSION });
    expect(records).toHaveLength(2);
    const done = records[1];
    expect(done?.notice).toContain(body);
    expect(done?.notice).toContain(ref);
    expect(done?.notice).toContain('[consult]');
    expect(typeof done?.token).toBe('string');
    expect(done?.token).toBe(records[0]?.token);
  });

  it('runner が投げる → 記録に 1 行、notice に失敗の本文。pi.sendMessage は呼ばれない', async () => {
    const { pi, calls } = fakePi();
    const reason = new Error('boom');
    // eslint-disable-next-line unicorn/consistent-function-scoping -- テストごとに runner を変える
    const run: ConsultRunner = (_ctx, _options, job) => {
      job.onStarted?.(process.pid);
      return Promise.reject(reason);
    };
    const { runtime, place } = setup(pi, run);
    await startSubagent(runtime, { role: 'review', task: '直す' });
    await flush();

    expect(calls).toHaveLength(0);
    const records = readRuns(place, { session: SESSION });
    expect(records).toHaveLength(2);
    expect(records[1]?.notice).toContain(reason.message);
  });
});

describe('cancel', () => {
  it('/consult-cancel <id> → その id が止まる', async () => {
    const { pi } = fakePi();
    const { run, signals } = deferredRunner();
    const { runtime } = setup(pi, run);
    await startSubagent(runtime, { role: 'review', task: 'a' });

    const { ctx, notices } = fakeCommandContext();
    await runtime.commands.cancel('consult-1', ctx);

    expect(signals[0]?.aborted).toBe(true);
    expect(notices[0]?.message).toContain('cancelled consult-1');
  });

  it('/consult-cancel に知らない id → 理由を出して止めない', async () => {
    const { pi } = fakePi();
    const { run, signals } = deferredRunner();
    const { runtime } = setup(pi, run);
    await startSubagent(runtime, { role: 'review', task: 'a' });

    const { ctx, notices } = fakeCommandContext();
    await runtime.commands.cancel('consult-999', ctx);

    expect(notices[0]?.message).toContain('no such subagent: consult-999');
    expect(notices[0]?.type).toBe('error');
    expect(signals[0]?.aborted).toBe(false);
  });
});

describe('controlSubagent: cancel', () => {
  it('掴んでいるサブエージェント → abort で止まり、cancelled: true（kill は呼ばない）', () => {
    const kills: number[] = [];
    const controller = new AbortController();
    const subagents = new Map([
      ['consult-1', { id: 'consult-1', type: 'review', task: 'a', startedAt: 1, controller }],
    ]);
    const outcome = controlSubagent(
      { action: 'cancel', id: 'consult-1' },
      subagents,
      placeFor(tempDir(), tempDir()),
      SESSION,
      (pid) => {
        kills.push(pid);
      },
    );

    expect(controller.signal.aborted).toBe(true);
    expect(outcome.details).toMatchObject({ cancelled: true, id: 'consult-1' });
    expect(kills).toEqual([]);
  });

  it('掴んでいないサブエージェント（記録だけ、pid 生存）→ kill がその pid で 1 回呼ばれ、cancelled: true', () => {
    const found = placeFor(tempDir(), tempDir());
    seedRunning(found, { pid: process.pid });
    const kills: number[] = [];
    const outcome = controlSubagent(
      { action: 'cancel', id: 'consult-9' },
      new Map(),
      found,
      SESSION,
      (pid) => {
        kills.push(pid);
      },
    );

    expect(kills).toEqual([process.pid]);
    expect(outcome.details).toMatchObject({ cancelled: true, id: 'consult-9' });
    expect(outcome.text).toContain('cancelled consult-9');
  });

  it('pid が死んでいるサブエージェント → kill を呼ばず、止められない理由を返す', () => {
    const found = placeFor(tempDir(), tempDir());
    seedRunning(found, { pid: 999_999 });
    const kills: number[] = [];
    const outcome = controlSubagent(
      { action: 'cancel', id: 'consult-9' },
      new Map(),
      found,
      SESSION,
      (pid) => {
        kills.push(pid);
      },
    );

    expect(kills).toEqual([]);
    expect(outcome.details).toMatchObject({ cancelled: false });
    expect(outcome.text).toContain('lost');
  });

  it('終わったサブエージェント → kill を呼ばず、理由を返す', () => {
    const found = placeFor(tempDir(), tempDir());
    const id = 'consult-9';
    appendRun(
      found,
      aRunRecord({
        session: SESSION,
        subagent: id,
        pid: process.pid,
        started: 1,
        ended: 2,
        state: 'done',
      }),
    );
    const kills: number[] = [];
    const outcome = controlSubagent({ action: 'cancel', id }, new Map(), found, SESSION, (pid) => {
      kills.push(pid);
    });

    expect(kills).toEqual([]);
    expect(outcome.details).toMatchObject({ cancelled: false });
  });

  it('記録にない id → kill を呼ばず、理由を返す', () => {
    const id = 'consult-999';
    const kills: number[] = [];
    const outcome = controlSubagent(
      { action: 'cancel', id },
      new Map(),
      placeFor(tempDir(), tempDir()),
      SESSION,
      (pid) => {
        kills.push(pid);
      },
    );

    expect(kills).toEqual([]);
    expect(outcome.details).toMatchObject({ cancelled: false });
    expect(outcome.text).toContain(`no such subagent: ${id}`);
  });

  it('別の session のサブエージェント → 止めず、理由を返す', () => {
    const found = placeFor(tempDir(), tempDir());
    seedRunning(found, { session: 'other-session', pid: process.pid });
    const kills: number[] = [];
    const outcome = controlSubagent(
      { action: 'cancel', id: 'consult-9' },
      new Map(),
      found,
      SESSION,
      (pid) => {
        kills.push(pid);
      },
    );

    expect(kills).toEqual([]);
    expect(outcome.details).toMatchObject({ cancelled: false });
    expect(outcome.text).toContain('another session');
  });
});

describe('controlSubagent: cancel (startToken)', () => {
  it('開始行だけ（startToken 付き）の停止は check に従う（running → kill、ended → kill しない）', () => {
    const found = placeFor(tempDir(), tempDir());
    const id = 'consult-9';
    const startToken = START_TOKEN;
    appendRun(
      found,
      aRunRecord({ session: SESSION, subagent: id, pid: 11, started: 1, startToken }),
    );
    const killsRunning: number[] = [];
    const outcomeRunning = controlSubagent(
      { action: 'cancel', id },
      new Map(),
      found,
      SESSION,
      (pid) => {
        killsRunning.push(pid);
      },
      () => 'running',
    );
    expect(killsRunning).toEqual([11]);
    expect(outcomeRunning.details).toMatchObject({ cancelled: true });
    const killsEnded: number[] = [];
    const outcomeEnded = controlSubagent(
      { action: 'cancel', id },
      new Map(),
      found,
      SESSION,
      (pid) => {
        killsEnded.push(pid);
      },
      () => 'ended',
    );
    expect(killsEnded).toEqual([]);
    expect(outcomeEnded.details).toMatchObject({ cancelled: false });
  });

  it('開始行だけ（startToken 付き）+ check が unknown の停止 → kill する（走っている側）', () => {
    const found = placeFor(tempDir(), tempDir());
    const id = 'consult-9';
    const startToken = START_TOKEN;
    appendRun(
      found,
      aRunRecord({ session: SESSION, subagent: id, pid: 11, started: 1, startToken }),
    );
    const kills: number[] = [];
    const outcome = controlSubagent(
      { action: 'cancel', id },
      new Map(),
      found,
      SESSION,
      (pid) => {
        kills.push(pid);
      },
      () => 'unknown',
    );
    expect(kills).toEqual([11]);
    expect(outcome.details).toMatchObject({ cancelled: true });
  });
});

describe('modelNotifier: retry-start', () => {
  it('warning で 1 回出す', () => {
    const { ctx, notices } = fakeConsultContext();
    const { onModelEvent } = modelNotifier(ctx, 'consult-1');
    const attempt = 1;
    const maxAttempts = 3;

    onModelEvent({
      kind: 'retry-start',
      model: 'p/m',
      attempt,
      maxAttempts,
      delayMs: 2000,
      error: 'rate limited',
    });

    expect(notices).toHaveLength(1);
    expect(notices[0]?.type).toBe('warning');
    expect(notices[0]?.message).toContain(`retry ${attempt}/${maxAttempts}`);
  });
});

describe('modelNotifier: retry-end', () => {
  it('retry-start が覚えた maxAttempts を分母に使い、warning で出す', () => {
    const { ctx, notices } = fakeConsultContext();
    const { onModelEvent } = modelNotifier(ctx, 'consult-1');
    const attempt = 1;
    const maxAttempts = 3;
    const success = true;

    onModelEvent({
      kind: 'retry-start',
      model: 'p/m',
      attempt,
      maxAttempts,
      delayMs: 2000,
      error: 'rate limited',
    });
    onModelEvent({ kind: 'retry-end', model: 'p/m', attempt, success });

    expect(notices).toHaveLength(2);
    expect(notices[1]?.type).toBe('warning');
    expect(notices[1]?.message).toContain(`retry ${attempt}/${maxAttempts} ok`);
  });
});

describe('modelNotifier: 乗り換え', () => {
  it('warning で 1 回出す', () => {
    const { ctx, notices } = fakeConsultContext();
    const { onFallback } = modelNotifier(ctx, 'consult-1');
    const next = 'p/b';

    onFallback({ requested: next });

    expect(notices).toHaveLength(1);
    expect(notices[0]?.type).toBe('warning');
    expect(notices[0]?.message).toContain(`→ ${next}`);
  });

  it('requested が undefined → → main', () => {
    const { ctx, notices } = fakeConsultContext();
    const { onFallback } = modelNotifier(ctx, 'consult-1');

    onFallback({ requested: undefined });

    expect(notices[0]?.message).toContain('→ main');
  });

  it('model が undefined → (model unknown) を含む', () => {
    const { ctx, notices } = fakeConsultContext();
    const { onModelEvent } = modelNotifier(ctx, 'consult-1');

    onModelEvent({
      kind: 'retry-start',
      model: undefined,
      attempt: 1,
      maxAttempts: 3,
      delayMs: 2000,
      error: 'rate limited',
    });

    expect(notices[0]?.message).toContain('(model unknown)');
  });

  it('start を見ていない retry-end → 何も出さない', () => {
    const { ctx, notices } = fakeConsultContext();
    const { onModelEvent } = modelNotifier(ctx, 'consult-1');

    onModelEvent({ kind: 'retry-end', model: 'p/m', attempt: 1, success: true });

    expect(notices).toEqual([]);
  });
});

describe('consult: 通知の配線', () => {
  it('modelNotifier の 2 つのコールバックを runOneSubagent の hooks に渡す', async () => {
    capturedHooks.length = 0;
    const { pi } = fakePi();
    const { ctx, notices } = fakeConsultContext();
    const runtime = createRuntime(pi, placeFor(tempDir(), tempDir()), undefined, () => SESSION);

    await runtime.run('call', { role: 'review', task: 'x' }, undefined, undefined, ctx);
    await flush();

    const hooks = capturedHooks.at(-1);
    if (hooks === undefined) {
      throw new Error('runOneSubagent was not called');
    }
    const attempt = 1;
    const maxAttempts = 3;
    const next = 'p/b';
    hooks.onModelEvent?.({
      kind: 'retry-start',
      model: 'p/m',
      attempt,
      maxAttempts,
      delayMs: 2000,
      error: 'rate limited',
    });
    hooks.onFallback?.({ requested: next });

    expect(
      notices.some(
        (notice) =>
          notice.type === 'warning' && notice.message.includes(`retry ${attempt}/${maxAttempts}`),
      ),
    ).toBe(true);
    expect(
      notices.some((notice) => notice.type === 'warning' && notice.message.includes(`→ ${next}`)),
    ).toBe(true);
  });
});

describe('status', () => {
  it('走っている記録が 2 件 → 1 回の通知に 2 行、info で出す', async () => {
    const { pi } = fakePi();
    const { run } = deferredRunner();
    const { runtime, place } = setup(pi, run);
    seedRunning(place, { subagent: 'consult-1' });
    seedRunning(place, { subagent: 'consult-2' });
    const { ctx, notices } = fakeCommandContext();

    await runtime.commands.status('', ctx);

    expect(notices).toHaveLength(1);
    expect(notices[0]?.type).toBe('info');
    const lines = notices[0]?.message.split('\n') ?? [];
    expect(lines).toHaveLength(2);
    expect(lines[0]).toContain('consult-1');
    expect(lines[1]).toContain('consult-2');
  });

  it('走っている記録がない → no subagents running in this session を info で出す', async () => {
    const { pi } = fakePi();
    const { run } = deferredRunner();
    const { runtime } = setup(pi, run);
    const { ctx, notices } = fakeCommandContext();

    await runtime.commands.status('', ctx);

    expect(notices).toEqual([{ message: 'no subagents running in this session', type: 'info' }]);
  });

  it('同じ subagent の開始行と終わりの行 → 走っているものとして出さない', async () => {
    const { pi } = fakePi();
    const { run } = deferredRunner();
    const { runtime, place } = setup(pi, run);
    seedRunning(place, { subagent: 'consult-1', started: 1000 });
    seedRunning(place, { subagent: 'consult-1', started: 2000, ended: 3000, state: 'done' });
    const { ctx, notices } = fakeCommandContext();

    await runtime.commands.status('', ctx);

    expect(notices[0]?.message).toBe('no subagents running in this session');
  });

  it('終わった記録だけ → no subagents running in this session を出す', async () => {
    const { pi } = fakePi();
    const { run } = deferredRunner();
    const { runtime, place } = setup(pi, run);
    seedRunning(place, { subagent: 'consult-1', ended: Date.now(), state: 'done' });
    const { ctx, notices } = fakeCommandContext();

    await runtime.commands.status('', ctx);

    expect(notices[0]?.message).toBe('no subagents running in this session');
  });

  it('別セッションの走っている記録 → 出さない', async () => {
    const { pi } = fakePi();
    const { run } = deferredRunner();
    const { runtime, place } = setup(pi, run);
    seedRunning(place, { subagent: 'consult-9', session: 'other-session' });
    const { ctx, notices } = fakeCommandContext();

    await runtime.commands.status('', ctx);

    expect(notices[0]?.message).toBe('no subagents running in this session');
  });
});

describe('音', () => {
  it('/consult-sound → 状態を出し、on / off を切り替える', async () => {
    const { pi } = fakePi();
    const { run } = deferredRunner();
    const { runtime } = setup(pi, run);
    const { ctx, notices } = fakeCommandContext();

    await runtime.commands.sound('', ctx);
    expect(notices.at(-1)?.message).toContain('is on');
    expect(isSoundEnabled()).toBe(true);

    await runtime.commands.sound('off', ctx);
    expect(isSoundEnabled()).toBe(false);

    await runtime.commands.sound('on', ctx);
    expect(isSoundEnabled()).toBe(true);
  });
});

describe('controlSubagent: list', () => {
  it('サブエージェントが 0 体なら、そう言う（空文字を返さない）', () => {
    const outcome = controlSubagent(
      { action: 'list' },
      new Map(),
      placeFor(tempDir(), tempDir()),
      SESSION,
    );
    expect(outcome.text).toContain('no subagent is running');
  });

  it('知らせの文はどの分岐でも consult_subagents: で始まる', () => {
    const controller = new AbortController();
    const held = new Map([
      ['consult-1', { id: 'consult-1', type: 'review', task: 'a', startedAt: 1, controller }],
    ]);
    const texts: string[] = [];
    texts.push(
      controlSubagent({ action: 'list' }, new Map(), placeFor(tempDir(), tempDir()), SESSION).text,
    );
    texts.push(
      controlSubagent(
        { action: 'cancel', id: 'consult-1' },
        held,
        placeFor(tempDir(), tempDir()),
        SESSION,
      ).text,
    );
    texts.push(
      controlSubagent(
        { action: 'cancel', id: 'consult-999' },
        new Map(),
        placeFor(tempDir(), tempDir()),
        SESSION,
      ).text,
    );
    const other = placeFor(tempDir(), tempDir());
    seedRunning(other, { session: 'other-session', pid: process.pid });
    texts.push(
      controlSubagent({ action: 'cancel', id: 'consult-9' }, new Map(), other, SESSION).text,
    );
    const done = placeFor(tempDir(), tempDir());
    const doneId = 'consult-9';
    appendRun(
      done,
      aRunRecord({
        session: SESSION,
        subagent: doneId,
        pid: process.pid,
        started: 1,
        ended: 2,
        state: 'done',
      }),
    );
    texts.push(controlSubagent({ action: 'cancel', id: doneId }, new Map(), done, SESSION).text);
    const lost = placeFor(tempDir(), tempDir());
    seedRunning(lost, { pid: 999_999 });
    texts.push(
      controlSubagent({ action: 'cancel', id: 'consult-9' }, new Map(), lost, SESSION).text,
    );
    const live = placeFor(tempDir(), tempDir());
    seedRunning(live, { pid: process.pid });
    texts.push(
      controlSubagent({ action: 'cancel', id: 'consult-9' }, new Map(), live, SESSION, () => {})
        .text,
    );
    expect(texts).toHaveLength(7);
    for (const text of texts) {
      expect(text.startsWith('consult_subagents:')).toBe(true);
    }
  });
});

describe('commands: 引数と空の一覧', () => {
  it('/consult-cancel に id がなければ、使い方を出して止めない', async () => {
    const { pi } = fakePi();
    const { run } = deferredRunner();
    const { runtime } = setup(pi, run);
    const { ctx, notices } = fakeCommandContext();
    await runtime.commands.cancel('', ctx);
    expect(notices[0]?.message).toContain('needs an id');
    expect(notices[0]?.message.startsWith('consult_subagents:')).toBe(true);
    expect(notices[0]?.type).toBe('error');
  });

  it('/consult-sound に不正な引数 → 使い方を出す', async () => {
    const { pi } = fakePi();
    const { run } = deferredRunner();
    const { runtime } = setup(pi, run);
    const { ctx, notices } = fakeCommandContext();
    await runtime.commands.sound('nope', ctx);
    expect(notices[0]?.message).toContain('usage');
    expect(notices[0]?.type).toBe('error');
  });
});

describe('beginRun: startToken', () => {
  it('onStarted の開始行 → startToken が readStartToken の値と一致する（ps の偽物で固定）', async () => {
    const { pi } = fakePi();
    const pid = 4242;
    const fixed = START_TOKEN;
    let called = 0;
    const psRun: PsRun = (args) => {
      called += 1;
      expect(args).toContain('-p');
      expect(args).toContain(String(pid));
      expect(args).toContain('-o');
      expect(args).toContain('lstart=');
      return { status: 0, stdout: `${fixed}\n`, stderr: '' };
    };
    const run: ConsultRunner = async (_ctx, _options, job) => {
      job.onStarted?.(pid);
      return { text: 'done', details: {}, report: undefined };
    };
    const { runtime, place } = setup(pi, run, undefined, psRun);
    await startSubagent(runtime, { role: 'review', task: '調べる' });
    await flush();
    expect(called).toBe(1);
    const records = readRuns(place, { session: SESSION });
    expect(records).toHaveLength(2);
    expect(records[0]?.startToken).toBe(fixed);
    expect(typeof records[0]?.token).toBe('string');
  });

  it('onStarted で ps が読めない → startToken なしの開始行になる', async () => {
    const { pi } = fakePi();
    const pid = 4242;
    const run: ConsultRunner = async (_ctx, _options, job) => {
      job.onStarted?.(pid);
      return { text: 'done', details: {}, report: undefined };
    };
    const gone = { status: 1 as const, stdout: '', stderr: '' };
    const psRun: PsRun = () => gone;
    const { runtime, place } = setup(pi, run, undefined, psRun);
    await startSubagent(runtime, { role: 'review', task: '調べる' });
    await flush();
    const records = readRuns(place, { session: SESSION });
    expect(records).toHaveLength(2);
    expect(records[0]?.startToken).toBeUndefined();
    expect(typeof records[0]?.token).toBe('string');
  });
});

describe('beginRun: token', () => {
  it('完了の行は開始行と同じ token を持つ', async () => {
    const { pi } = fakePi();
    const pid = process.pid;
    const seen: { optionsToken?: string; jobToken?: string } = {};
    const run: ConsultRunner = async (_ctx, options, job) => {
      seen.optionsToken = options.token;
      seen.jobToken = job.token;
      job.onStarted?.(pid);
      return { text: 'done', details: {}, report: undefined };
    };
    const { runtime, place } = setup(pi, run);
    await startSubagent(runtime, { role: 'review', task: '調べる' });
    await flush();
    const records = readRuns(place, { session: SESSION });
    expect(records).toHaveLength(2);
    const start = records[0];
    const end = records[1];
    expect(start?.ended).toBeUndefined();
    expect(typeof start?.token).toBe('string');
    expect(seen.optionsToken).toBe(start?.token);
    expect(seen.jobToken).toBe(start?.token);
    expect(end?.ended).toBeDefined();
    expect(end?.token).toBe(start?.token);
  });
});
