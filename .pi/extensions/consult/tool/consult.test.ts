/**
 * consult 道具のバックグラウンドの面を、偽の API で確かめる。
 *
 * 子は起こさない。`createRuntime` に差し替えた `run` を渡し、完了のタイミングと届くメッセージを自分で決める。pi の `sendMessage` と slash command の `ctx.ui.notify` も記録する。
 * 記録の置き場は `placeFor(tmpDir(), tmpDir())` で作り、session は `'test-session'` を渡す
 * （`parseRun` が空の session を弾くため、既定の `''` は使わない）。
 */

import { spawn } from 'node:child_process';
import type { AgentToolResult } from '@earendil-works/pi-coding-agent';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  controlChild,
  createRuntime,
  type CommandContext,
  type ConsultContext,
  type ConsultMessage,
  type ConsultOutcome,
  type ConsultRunner,
  type ConsultRuntime,
  type ConsultSendOptions,
  type PiFace,
} from './consult.ts';
import {
  SOUND_INTERVAL_MS,
  isSoundEnabled,
  isSoundRunning,
  setPlayer,
  setSoundEnabled,
  stopSound,
} from './sound.ts';
import { tmpDir } from '../../../../test/tmp.ts';
import { appendRun } from '../run/log.ts';
import { placeFor, type Place } from '../run/place.ts';

/** テストの session。記録に書く側と、runtime に渡す側で同じ物を使う */
const SESSION = 'test-session';

// 道具の文脈は cwd だけ。ここは読み取り専用で、子は差し替えた `run` が受けるので本体を見ない。
// 一時物を本体に作らない。読めない入力の検査は、本体 root に依存しないよう helper の置き場を指す。
const toolCtx: ConsultContext = { cwd: process.cwd() };

// テストでは afplay を起動しない。鳴らす所を記録する物に差し替え、鳴った回数だけを見る。
const beeps: string[] = [];
setPlayer(() => {
  beeps.push('tink');
});

beforeEach(() => {
  beeps.length = 0;
  setSoundEnabled(true);
});

afterEach(() => {
  stopSound();
  setSoundEnabled(true);
});

/** runtime と置き場を組む。session は `SESSION` */
function setup(
  pi: PiFace,
  run: ConsultRunner,
): { readonly runtime: ConsultRuntime; readonly place: Place } {
  const place = placeFor(tmpDir(), tmpDir());
  return { runtime: createRuntime(pi, place, run, undefined, () => SESSION), place };
}

/** 背景の then / catch / finally を、偽のタイマーの下でも流す */
async function settle(): Promise<void> {
  await Promise.resolve();
  await Promise.resolve();
  await Promise.resolve();
  await Promise.resolve();
  await Promise.resolve();
}

type RunParams = Parameters<ConsultRuntime['run']>[1];

function startChild(runtime: ConsultRuntime, params: RunParams) {
  return runtime.run('call', params, undefined, undefined, toolCtx);
}

/** 道具の戻り値の本文を取る */
function textOf(result: AgentToolResult<Record<string, unknown>>): string {
  const first = result.content[0];
  return first !== undefined && first.type === 'text' ? first.text : '';
}

/** sendMessage の呼び出しを記録する偽の pi */
function fakePi(): {
  pi: PiFace;
  calls: { message: ConsultMessage; options?: ConsultSendOptions }[];
} {
  const calls: { message: ConsultMessage; options?: ConsultSendOptions }[] = [];
  const pi: PiFace = {
    sendMessage: (message, options) => {
      calls.push({ message, options });
    },
  };
  return { pi, calls };
}

/** ui.notify を記録する偽のコマンド文脈 */
function fakeCommandContext(): {
  ctx: CommandContext;
  notices: { message: string; type?: 'info' | 'warning' | 'error' }[];
} {
  const notices: { message: string; type?: 'info' | 'warning' | 'error' }[] = [];
  const ctx: CommandContext = {
    ui: {
      notify: (message: string, type?: 'info' | 'warning' | 'error') => {
        notices.push({ message, type });
      },
    },
  };
  return { ctx, notices };
}

/** 完了をテストが決める子。signal と resolve を記録する */
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

/** 走っている行を 1 本書く。pid が生きている間だけ述語は true */
function seedRunning(place: Place, extra: { session?: string; child?: string; pid?: number } = {}) {
  appendRun(place, {
    session: extra.session ?? SESSION,
    child: extra.child ?? 'consult-9',
    role: 'review',
    pid: extra.pid ?? process.pid,
    started: Date.now(),
  });
}

describe('run', () => {
  it('review を 1 体起こす → id が返り、その時点で子は終わっていない', async () => {
    const { pi, calls } = fakePi();
    const { run: runner, signals, resolvers } = deferredRunner();
    const { runtime } = setup(pi, runner);

    const result = await startChild(runtime, { role: 'review', task: '判定する' });

    expect(textOf(result)).toContain('started: consult-1');
    expect(runtime.children.size).toBe(1);
    expect(signals).toHaveLength(1);
    expect(resolvers).toHaveLength(1);
    expect(calls).toHaveLength(0);
  });

  it('記録に consult-3 がある → 次の子は consult-4（reload で番号が戻らない）', async () => {
    const { pi } = fakePi();
    const { run: runner } = deferredRunner();
    const { runtime, place } = setup(pi, runner);
    seedRunning(place, { child: 'consult-3' });

    const result = await startChild(runtime, { role: 'review', task: '判定する' });

    expect(textOf(result)).toContain('started: consult-4');
  });

  it('記録に consult-7 と consult-2 が混ざっている → 次は consult-8', async () => {
    const { pi } = fakePi();
    const { run: runner } = deferredRunner();
    const { runtime, place } = setup(pi, runner);
    seedRunning(place, { child: 'consult-7' });
    seedRunning(place, { child: 'consult-2' });

    const result = await startChild(runtime, { role: 'review', task: '判定する' });

    expect(textOf(result)).toContain('started: consult-8');
  });

  it('別の session の consult-9 は数えない → この session の次は consult-1', async () => {
    const { pi } = fakePi();
    const { run: runner } = deferredRunner();
    const { runtime, place } = setup(pi, runner);
    seedRunning(place, { child: 'consult-9', session: 'other-session' });

    const result = await startChild(runtime, { role: 'review', task: '判定する' });

    expect(textOf(result)).toContain('started: consult-1');
  });

  it('同じ runtime で続けて 2 体 → consult-1、consult-2（記録に書かれる前に次を決める）', async () => {
    const { pi } = fakePi();
    const { run: runner } = deferredRunner();
    const { runtime } = setup(pi, runner);

    const first = await startChild(runtime, { role: 'review', task: '1 体目' });
    const second = await startChild(runtime, { role: 'review', task: '2 体目' });

    expect(textOf(first)).toContain('started: consult-1');
    expect(textOf(second)).toContain('started: consult-2');
  });

  it('終わった子の番号も数える → 次は consult-6', async () => {
    const { pi } = fakePi();
    const { run: runner } = deferredRunner();
    const { runtime, place } = setup(pi, runner);
    appendRun(place, {
      session: SESSION,
      child: 'consult-5',
      role: 'review',
      pid: process.pid,
      started: Date.now() - 1000,
      ended: Date.now(),
      state: 'done',
      files: [],
      turns: 1,
      spend: '0.0001 usd',
    });

    const result = await startChild(runtime, { role: 'review', task: '判定する' });

    expect(textOf(result)).toContain('started: consult-6');
  });

  it('書き込むロール（code）で worktree を省くと、子を起こさずに拒む', async () => {
    const { pi } = fakePi();
    const { run: runner, signals } = deferredRunner();
    const { runtime } = setup(pi, runner);

    await expect(startChild(runtime, { role: 'code', task: 'x' })).rejects.toThrow(
      /needs a worktree/,
    );
    expect(signals).toHaveLength(0);
    expect(runtime.children.size).toBe(0);
  });

  it('知らない worktree の id → 子を起こさずに拒む', async () => {
    const { pi } = fakePi();
    const { run: runner, signals } = deferredRunner();
    const { runtime } = setup(pi, runner);

    await expect(
      startChild(runtime, { role: 'code', task: 'x', worktree: 'no-such-unit' }),
    ).rejects.toThrow(/no such worktree/);
    expect(signals).toHaveLength(0);
    expect(runtime.children.size).toBe(0);
  });
});

describe('完了の通知', () => {
  it('子の完了 → 子のテキスト・ref:・[consult] 行がメッセージに入る', async () => {
    const { pi, calls } = fakePi();
    const { run, resolvers } = deferredRunner();
    const { runtime } = setup(pi, run);
    await startChild(runtime, { role: 'review', task: '直す' });

    const outcome: ConsultOutcome = {
      text: 'the child text\n\nref: consult/code-1\n\n[consult] model-x / 3 turns / in 10 out 20',
      details: { type: 'review' },
    };
    resolvers[0]?.(outcome);
    await flush();

    expect(calls).toHaveLength(1);
    const message = calls[0]?.message;
    expect(message?.customType).toBe('consult');
    expect(message?.content).toContain('the child text');
    expect(message?.content).toContain('ref: consult/code-1');
    expect(message?.content).toContain('[consult]');
    expect(calls[0]?.options).toEqual({ triggerTurn: true, deliverAs: 'followUp' });
    expect(runtime.children.size).toBe(0);
  });
});

describe('cancel', () => {
  it('/consult-cancel <id> → その id が止まる', async () => {
    const { pi } = fakePi();
    const { run, signals } = deferredRunner();
    const { runtime } = setup(pi, run);
    await startChild(runtime, { role: 'review', task: 'a' });

    const { ctx, notices } = fakeCommandContext();
    await runtime.commands.cancel('consult-1', ctx);

    expect(signals[0]?.aborted).toBe(true);
    expect(notices[0]?.message).toContain('cancelled consult-1');
  });

  it('/consult-cancel に知らない id → 理由を出して止めない', async () => {
    const { pi } = fakePi();
    const { run, signals } = deferredRunner();
    const { runtime } = setup(pi, run);
    await startChild(runtime, { role: 'review', task: 'a' });

    const { ctx, notices } = fakeCommandContext();
    await runtime.commands.cancel('consult-999', ctx);

    expect(notices[0]?.message).toContain('no such child: consult-999');
    expect(notices[0]?.type).toBe('error');
    expect(signals[0]?.aborted).toBe(false);
  });
});

describe('controlChild: cancel', () => {
  it('掴んでいる子 → abort で止まり、cancelled: true（kill は呼ばない）', () => {
    const kills: number[] = [];
    const controller = new AbortController();
    const children = new Map([
      ['consult-1', { id: 'consult-1', type: 'review', task: 'a', startedAt: 1, controller }],
    ]);
    const outcome = controlChild(
      { action: 'cancel', id: 'consult-1' },
      children,
      placeFor(tmpDir(), tmpDir()),
      SESSION,
      (pid) => {
        kills.push(pid);
      },
    );

    expect(controller.signal.aborted).toBe(true);
    expect(outcome.details).toMatchObject({ cancelled: true, id: 'consult-1' });
    expect(kills).toEqual([]);
  });

  it('掴んでいない子（記録だけ、pid 生存）→ kill がその pid で 1 回呼ばれ、cancelled: true', () => {
    const found = placeFor(tmpDir(), tmpDir());
    seedRunning(found, { pid: process.pid });
    const kills: number[] = [];
    const outcome = controlChild(
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

  it('pid が死んでいる子 → kill を呼ばず、止められない理由を返す', () => {
    const found = placeFor(tmpDir(), tmpDir());
    seedRunning(found, { pid: 999_999 });
    const kills: number[] = [];
    const outcome = controlChild(
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

  it('終わった子 → kill を呼ばず、理由を返す', () => {
    const found = placeFor(tmpDir(), tmpDir());
    appendRun(found, {
      session: SESSION,
      child: 'consult-9',
      role: 'review',
      pid: process.pid,
      started: 1,
      ended: 2,
      state: 'done',
    });
    const kills: number[] = [];
    const outcome = controlChild(
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
  });

  it('記録に無い id → kill を呼ばず、理由を返す', () => {
    const kills: number[] = [];
    const outcome = controlChild(
      { action: 'cancel', id: 'consult-999' },
      new Map(),
      placeFor(tmpDir(), tmpDir()),
      SESSION,
      (pid) => {
        kills.push(pid);
      },
    );

    expect(kills).toEqual([]);
    expect(outcome.details).toMatchObject({ cancelled: false });
    expect(outcome.text).toContain('no such child: consult-999');
  });

  it('別の session の子 → 止めず、理由を返す', () => {
    const found = placeFor(tmpDir(), tmpDir());
    seedRunning(found, { session: 'other-session', pid: process.pid });
    const kills: number[] = [];
    const outcome = controlChild(
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

describe('音', () => {
  it('子を 2 体走らせてもタイマーは 1 本 → 5 秒ごとに 1 音', async () => {
    vi.useFakeTimers();
    try {
      const { pi } = fakePi();
      const { run } = deferredRunner();
      const { runtime, place } = setup(pi, run);
      seedRunning(place);
      await startChild(runtime, { role: 'research', task: 'a' });
      await startChild(runtime, { role: 'review', task: 'b' });

      expect(isSoundRunning()).toBe(true);
      await vi.advanceTimersByTimeAsync(SOUND_INTERVAL_MS);
      expect(beeps).toHaveLength(1);
      await vi.advanceTimersByTimeAsync(SOUND_INTERVAL_MS);
      expect(beeps).toHaveLength(2);
    } finally {
      vi.useRealTimers();
    }
  });

  it('走っている子が居なくなると、次の tick で止まる（述語で止まる）', async () => {
    const proc = spawn(process.execPath, ['--eval', 'setInterval(() => {}, 1000)'], {
      stdio: 'ignore',
    });
    proc.unref();
    const pid = proc.pid ?? 0;
    expect(pid).toBeGreaterThan(0);
    vi.useFakeTimers();
    try {
      const { pi } = fakePi();
      const { run, resolvers } = deferredRunner();
      const { runtime, place } = setup(pi, run);
      seedRunning(place, { pid });
      await startChild(runtime, { role: 'review', task: 'a' });
      expect(isSoundRunning()).toBe(true);

      await vi.advanceTimersByTimeAsync(SOUND_INTERVAL_MS);
      expect(beeps).toHaveLength(1);

      for (const resolve of resolvers) {
        resolve({ text: 'done', details: {} });
      }
      await settle();
      expect(runtime.children.size).toBe(0);

      // 終わりの行が無く pid も死ぬ → 述語は false。次の tick で鳴らず、タイマーが消える
      proc.kill();
      await new Promise<void>((resolve) => {
        proc.on('exit', () => {
          resolve();
        });
      });
      await vi.advanceTimersByTimeAsync(SOUND_INTERVAL_MS);
      expect(beeps).toHaveLength(1);
      expect(isSoundRunning()).toBe(false);
    } finally {
      vi.useRealTimers();
      proc.kill();
    }
  });

  it('別の session の子だけが走っている → 鳴らず、タイマーが消える', async () => {
    vi.useFakeTimers();
    try {
      const { pi } = fakePi();
      const { run } = deferredRunner();
      const { runtime, place } = setup(pi, run);
      seedRunning(place, { session: 'other-session' });
      await startChild(runtime, { role: 'review', task: 'a' });

      expect(isSoundRunning()).toBe(true);
      await vi.advanceTimersByTimeAsync(SOUND_INTERVAL_MS);
      expect(beeps).toHaveLength(0);
      expect(isSoundRunning()).toBe(false);
    } finally {
      vi.useRealTimers();
    }
  });

  it('setSoundEnabled(false) → 子が走っていても鳴らない', async () => {
    vi.useFakeTimers();
    try {
      setSoundEnabled(false);
      const { pi } = fakePi();
      const { run } = deferredRunner();
      const { runtime, place } = setup(pi, run);
      seedRunning(place);
      await startChild(runtime, { role: 'review', task: 'a' });

      expect(isSoundRunning()).toBe(true);
      await vi.advanceTimersByTimeAsync(SOUND_INTERVAL_MS * 3);
      expect(beeps).toHaveLength(0);
    } finally {
      vi.useRealTimers();
    }
  });

  it('子が 0 体のまま 5 秒経つ → 鳴らない', async () => {
    vi.useFakeTimers();
    try {
      await vi.advanceTimersByTimeAsync(SOUND_INTERVAL_MS * 3);
      expect(isSoundRunning()).toBe(false);
      expect(beeps).toHaveLength(0);
    } finally {
      vi.useRealTimers();
    }
  });

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

    await runtime.commands.sound('nope', ctx);
    expect(notices.at(-1)?.type).toBe('error');
  });
});

describe('controlChild: list', () => {
  it('子が 0 体なら、そう言う（空文字を返さない）', () => {
    const outcome = controlChild(
      { action: 'list' },
      new Map(),
      placeFor(tmpDir(), tmpDir()),
      SESSION,
    );
    expect(outcome.text).toContain('no child is running');
  });
});

describe('commands: 引数と空の一覧', () => {
  it('/consult-cancel に id が無ければ、使い方を出して止めない', async () => {
    const { pi } = fakePi();
    const { run } = deferredRunner();
    const { runtime } = setup(pi, run);
    const { ctx, notices } = fakeCommandContext();
    await runtime.commands.cancel('', ctx);
    expect(notices[0]?.message).toContain('needs an id');
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

  it('/consult-status は子が 0 体なら、そう言う', async () => {
    const { pi } = fakePi();
    const { run } = deferredRunner();
    const { runtime } = setup(pi, run);
    const { ctx, notices } = fakeCommandContext();
    await runtime.commands.status('', ctx);
    expect(notices[0]?.message).toContain('no child is running');
  });
});
