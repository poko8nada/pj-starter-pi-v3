/**
 * consult 道具のバックグラウンドの面を、偽の API で確かめる。
 *
 * 子は起こさない。`createRuntime` に差し替えた `run` を渡し、完了のタイミングと届くメッセージを自分で決める。pi の `sendMessage` と slash command の `ctx.ui.notify` も記録する。
 */

import type { AgentToolResult } from '@earendil-works/pi-coding-agent';
import { describe, expect, it } from 'vitest';
import {
  createRuntime,
  USAGE,
  type CommandContext,
  type ConsultContext,
  type ConsultMessage,
  type ConsultOutcome,
  type ConsultRunner,
  type ConsultRuntime,
  type ConsultSendOptions,
  type PiFace,
} from './consult.ts';

// 道具の文脈は cwd だけ。ここは読み取り専用で、子は差し替えた `run` が受けるので本体を見ない。
// 一時物を作らないテストなので `test/tmp.ts` は通さない（書くテストは helper を通す）。
const toolCtx: ConsultContext = { cwd: process.cwd() };

type CallParams = Parameters<ConsultRuntime['execute']>[1];

function call(runtime: ConsultRuntime, params: CallParams) {
  return runtime.execute('call', params, undefined, undefined, toolCtx);
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
  signals: AbortSignal[];
  resolvers: ((outcome: ConsultOutcome) => void)[];
} {
  const signals: AbortSignal[] = [];
  const resolvers: ((outcome: ConsultOutcome) => void)[] = [];
  const run: ConsultRunner = (_ctx, _options, _consultation, signal) => {
    signals.push(signal);
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

describe('start', () => {
  it('start（type: review, task: …）→ id が返り、その時点で子は終わっていない', async () => {
    const { pi, calls } = fakePi();
    const { run, signals, resolvers } = deferredRunner();
    const runtime = createRuntime(pi, run);

    const result = await call(runtime, { type: 'review', task: '判定する' });

    expect(textOf(result)).toContain('started: consult-1');
    expect(runtime.children.size).toBe(1);
    expect(signals).toHaveLength(1);
    expect(resolvers).toHaveLength(1);
    expect(calls).toHaveLength(0);
  });

  it('入力が読めなければ、子を起こさずに拒む', async () => {
    const { pi } = fakePi();
    const { run, signals } = deferredRunner();
    const runtime = createRuntime(pi, run);

    await expect(
      call(runtime, { type: 'review', task: 'x', input: ['missing.md'] }),
    ).rejects.toThrow(/could not read the input file/);
    expect(signals).toHaveLength(0);
    expect(runtime.children.size).toBe(0);
  });
});

describe('完了の通知', () => {
  it('子の完了 → 子のテキスト・ref:・[consult] 行がメッセージに入る', async () => {
    const { pi, calls } = fakePi();
    const { run, resolvers } = deferredRunner();
    const runtime = createRuntime(pi, run);
    await call(runtime, { type: 'code', task: '直す' });

    const outcome: ConsultOutcome = {
      text: 'the child text\n\nref: consult/code-1\n\n[consult] model-x / 3 turns / in 10 out 20',
      details: { type: 'code' },
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

describe('list', () => {
  it('2 体走っている → 走っている子だけが返る', async () => {
    const { pi } = fakePi();
    const { run, resolvers } = deferredRunner();
    const runtime = createRuntime(pi, run);
    await call(runtime, { type: 'research', task: 'a' });
    await call(runtime, { type: 'review', task: 'b' });

    resolvers[0]?.({ text: 'done', details: {} });
    await flush();

    const result = await call(runtime, { action: 'list' });
    const text = textOf(result);
    expect(text).toContain('consult-2');
    expect(text).not.toContain('consult-1');
  });

  it('0 体 → 空の一覧', async () => {
    const { pi } = fakePi();
    const { run } = deferredRunner();
    const runtime = createRuntime(pi, run);

    const result = await call(runtime, { action: 'list' });
    expect(textOf(result)).toContain('no child is running');
  });
});

describe('cancel', () => {
  it('知らない id → 拒む', async () => {
    const { pi } = fakePi();
    const { run } = deferredRunner();
    const runtime = createRuntime(pi, run);

    const result = await call(runtime, { action: 'cancel', id: 'consult-999' });
    expect(textOf(result)).toContain('no such child: consult-999');
  });

  it('/consult-cancel <id> → その id が止まる', async () => {
    const { pi } = fakePi();
    const { run, signals } = deferredRunner();
    const runtime = createRuntime(pi, run);
    await call(runtime, { type: 'code', task: 'a' });

    const { ctx, notices } = fakeCommandContext();
    await runtime.commands.cancel('consult-1', ctx);

    expect(signals[0]?.aborted).toBe(true);
    expect(notices[0]?.message).toContain('cancelled consult-1');
  });

  it('/consult-cancel に知らない id → 理由を出して止めない', async () => {
    const { pi } = fakePi();
    const { run, signals } = deferredRunner();
    const runtime = createRuntime(pi, run);
    await call(runtime, { type: 'code', task: 'a' });

    const { ctx, notices } = fakeCommandContext();
    await runtime.commands.cancel('consult-999', ctx);

    expect(notices[0]?.message).toContain('no such child: consult-999');
    expect(notices[0]?.type).toBe('error');
    expect(signals[0]?.aborted).toBe(false);
  });
});

describe('知らない action', () => {
  it('action が知らない値 → 使い方を出して拒む', async () => {
    const { pi } = fakePi();
    const { run } = deferredRunner();
    const runtime = createRuntime(pi, run);

    await expect(call(runtime, { action: 'nope' })).rejects.toThrow(USAGE);
  });
});
