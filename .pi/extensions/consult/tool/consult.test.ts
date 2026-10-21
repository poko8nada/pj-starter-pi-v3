/**
 * consult 道具のバックグラウンドの面を、偽の API で確かめる。
 *
 * サブエージェントは起こさない。`createRuntime` に差し替えた `run` を渡し、完了のタイミングと届くメッセージを自分で決める。pi の `sendMessage` と slash command の `ctx.ui.notify` も記録する。
 * 記録の置き場は `placeFor(tmpDir(), tmpDir())` で作り、session は `'test-session'` を渡す
 * （`parseRun` が空の session を弾くため、既定の `''` は使わない）。
 */

import type { AgentToolResult } from '@earendil-works/pi-coding-agent';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  controlSubagent,
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
import { appendRun, readRuns } from '../run/log.ts';
import { placeFor, type Place } from '../run/place.ts';

/** テストの session。記録に書く側と、runtime に渡す側で同じ物を使う */
const SESSION = 'test-session';

// 道具の文脈は cwd だけ。ここは読み取り専用で、サブエージェントは差し替えた `run` が受けるので本体を見ない。
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

/** 走っている行を 1 本書く。pid が生きている間だけ述語は true */
function seedRunning(
  place: Place,
  extra: { session?: string; subagent?: string; pid?: number } = {},
) {
  appendRun(place, {
    session: extra.session ?? SESSION,
    subagent: extra.subagent ?? 'consult-9',
    role: 'review',
    pid: extra.pid ?? process.pid,
    started: Date.now(),
  });
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
    seedRunning(place, { subagent: 'consult-3' });

    const result = await startSubagent(runtime, { role: 'review', task: '判定する' });

    expect(textOf(result)).toContain('started: consult-4');
  });

  it('記録に consult-7 と consult-2 が混ざっている → 次は consult-8', async () => {
    const { pi } = fakePi();
    const { run: runner } = deferredRunner();
    const { runtime, place } = setup(pi, runner);
    seedRunning(place, { subagent: 'consult-7' });
    seedRunning(place, { subagent: 'consult-2' });

    const result = await startSubagent(runtime, { role: 'review', task: '判定する' });

    expect(textOf(result)).toContain('started: consult-8');
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
    appendRun(place, {
      session: SESSION,
      subagent: 'consult-5',
      role: 'review',
      pid: process.pid,
      started: Date.now() - 1000,
      ended: Date.now(),
      state: 'done',
      files: [],
      turns: 1,
      spend: '0.0001 usd',
    });

    const result = await startSubagent(runtime, { role: 'review', task: '判定する' });

    expect(textOf(result)).toContain('started: consult-6');
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
  it('サブエージェントの完了 → サブエージェントのテキスト・ref:・[consult] 行がメッセージに入る', async () => {
    const { pi, calls } = fakePi();
    const { run, resolvers } = deferredRunner();
    const { runtime } = setup(pi, run);
    await startSubagent(runtime, { role: 'review', task: '直す' });

    const outcome: ConsultOutcome = {
      text: 'the subagent text\n\nref: consult/code-1\n\n[consult] model-x / 3 turns / in 10 out 20',
      details: { type: 'review' },
    };
    resolvers[0]?.(outcome);
    await flush();

    expect(calls).toHaveLength(1);
    const message = calls[0]?.message;
    expect(message?.customType).toBe('consult');
    expect(message?.content).toContain('the subagent text');
    expect(message?.content).toContain('ref: consult/code-1');
    expect(message?.content).toContain('[consult]');
    expect(calls[0]?.options).toEqual({ triggerTurn: true, deliverAs: 'followUp' });
    expect(runtime.subagents.size).toBe(0);
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

  it('掴んでいないサブエージェント（記録だけ、pid 生存）→ kill がその pid で 1 回呼ばれ、cancelled: true', () => {
    const found = placeFor(tmpDir(), tmpDir());
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
    const found = placeFor(tmpDir(), tmpDir());
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
    const found = placeFor(tmpDir(), tmpDir());
    appendRun(found, {
      session: SESSION,
      subagent: 'consult-9',
      role: 'review',
      pid: process.pid,
      started: 1,
      ended: 2,
      state: 'done',
    });
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
  });

  it('記録に無い id → kill を呼ばず、理由を返す', () => {
    const kills: number[] = [];
    const outcome = controlSubagent(
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
    expect(outcome.text).toContain('no such subagent: consult-999');
  });

  it('別の session のサブエージェント → 止めず、理由を返す', () => {
    const found = placeFor(tmpDir(), tmpDir());
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

describe('音', () => {
  // 音そのもの（タイマー 1 本・述語で止まる・enabled）は `sound.test.ts` が見る。
  // ここでは runtime 側の組み立てだけを見る: サブエージェントが走り出したら音が始まる、と、述語がこの session のサブエージェントだけを見ること。

  it('サブエージェントを 1 体起こす → 音が始まる（述語はこの session の走行中だけを真にする）', async () => {
    vi.useFakeTimers();
    try {
      const { pi } = fakePi();
      const { run } = deferredRunner();
      const { runtime, place } = setup(pi, run);
      seedRunning(place);
      await startSubagent(runtime, { role: 'research', task: 'a' });

      expect(isSoundRunning()).toBe(true);
      await vi.advanceTimersByTimeAsync(SOUND_INTERVAL_MS);
      expect(beeps).toHaveLength(1);
    } finally {
      vi.useRealTimers();
    }
  });

  it('別の session のサブエージェントだけが走っている → 鳴らず、タイマーが消える', async () => {
    vi.useFakeTimers();
    try {
      const { pi } = fakePi();
      const { run } = deferredRunner();
      const { runtime, place } = setup(pi, run);
      seedRunning(place, { session: 'other-session' });
      await startSubagent(runtime, { role: 'review', task: 'a' });

      expect(isSoundRunning()).toBe(true);
      await vi.advanceTimersByTimeAsync(SOUND_INTERVAL_MS);
      expect(beeps).toHaveLength(0);
      expect(isSoundRunning()).toBe(false);
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

describe('controlSubagent: list', () => {
  it('サブエージェントが 0 体なら、そう言う（空文字を返さない）', () => {
    const outcome = controlSubagent(
      { action: 'list' },
      new Map(),
      placeFor(tmpDir(), tmpDir()),
      SESSION,
    );
    expect(outcome.text).toContain('no subagent is running');
  });

  it('知らせの文は consult_subagents: で始まる', () => {
    const outcome = controlSubagent(
      { action: 'list' },
      new Map(),
      placeFor(tmpDir(), tmpDir()),
      SESSION,
    );
    expect(outcome.text.startsWith('consult_subagents:')).toBe(true);
  });

  it('知らせの文はどの分岐でも consult_subagents: で始まる', () => {
    const controller = new AbortController();
    const held = new Map([
      ['consult-1', { id: 'consult-1', type: 'review', task: 'a', startedAt: 1, controller }],
    ]);
    const texts: string[] = [];
    texts.push(
      controlSubagent({ action: 'list' }, new Map(), placeFor(tmpDir(), tmpDir()), SESSION).text,
    );
    texts.push(
      controlSubagent(
        { action: 'cancel', id: 'consult-1' },
        held,
        placeFor(tmpDir(), tmpDir()),
        SESSION,
      ).text,
    );
    texts.push(
      controlSubagent(
        { action: 'cancel', id: 'consult-999' },
        new Map(),
        placeFor(tmpDir(), tmpDir()),
        SESSION,
      ).text,
    );
    const other = placeFor(tmpDir(), tmpDir());
    seedRunning(other, { session: 'other-session', pid: process.pid });
    texts.push(
      controlSubagent({ action: 'cancel', id: 'consult-9' }, new Map(), other, SESSION).text,
    );
    const done = placeFor(tmpDir(), tmpDir());
    appendRun(done, {
      session: SESSION,
      subagent: 'consult-9',
      role: 'review',
      pid: process.pid,
      started: 1,
      ended: 2,
      state: 'done',
    });
    texts.push(
      controlSubagent({ action: 'cancel', id: 'consult-9' }, new Map(), done, SESSION).text,
    );
    const lost = placeFor(tmpDir(), tmpDir());
    seedRunning(lost, { pid: 999_999 });
    texts.push(
      controlSubagent({ action: 'cancel', id: 'consult-9' }, new Map(), lost, SESSION).text,
    );
    const live = placeFor(tmpDir(), tmpDir());
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
  it('/consult-cancel に id が無ければ、使い方を出して止めない', async () => {
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

  it('/consult-status はサブエージェントが 0 体なら、そう言う', async () => {
    const { pi } = fakePi();
    const { run } = deferredRunner();
    const { runtime } = setup(pi, run);
    const { ctx, notices } = fakeCommandContext();
    await runtime.commands.status('', ctx);
    expect(notices[0]?.message).toContain('no subagent is running');
  });
});

describe('beginRun: token', () => {
  it('開始行に UUID の token が入り、終了行は token を持たない', async () => {
    const { pi } = fakePi();
    const pid = process.pid;
    const run: ConsultRunner = async (_ctx, _options, job) => {
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
    expect(start?.token).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/);
    expect(end?.ended).toBeDefined();
    expect(end?.token).toBeUndefined();
  });
});
