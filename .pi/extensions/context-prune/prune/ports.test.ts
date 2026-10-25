import { writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import type { ExtensionContext } from '@earendil-works/pi-coding-agent';
import { tempDir } from '../../../../test/temp-dir.ts';
import { piUsage } from '../../../../test/pi-fixture.ts';
import { settingsJson } from '../../../../test/prune-fixture.ts';
import {
  createPorts,
  summarizationReserve,
  type ModelCell,
  type SummarizeWithUsage,
} from './ports.ts';
import type { JudgeRequest } from './judge.ts';

function settingsDirWith(document: Record<string, unknown>): string {
  const dir = tempDir();
  writeFileSync(join(dir, 'settings.json'), settingsJson(document));
  return dir;
}

function brokenDir(): string {
  const dir = tempDir();
  writeFileSync(join(dir, 'settings.json'), '{');
  return dir;
}

function judgeRequestOf(): JudgeRequest {
  return {
    state: { summary: '話題の要約', candidates: [] },
    questions: {
      keep_a: { type: 'choice', instructions: '関係あるか', criteria: { yes: 'ある', no: 'ない' } },
    },
  };
}

// 偽の registry を作る。使う口だけ持つ
type AuthFn = () => Promise<unknown>;
type AvailableFn = () => Promise<unknown>;
type ClassifyFn = (model: unknown, args: unknown) => Promise<unknown>;

function fakeCell(options: {
  readonly auth?: AuthFn;
  readonly available?: AvailableFn;
  readonly classify?: ClassifyFn;
  readonly withModel?: boolean;
}): ModelCell {
  const authImpl = options.auth;
  const availableImpl = options.available;
  const classifyImpl = options.classify;
  const apiKey = 'test-key';
  const registry = {
    getApiKeyAndHeaders:
      authImpl ?? (async () => ({ ok: true, apiKey, headers: { a: 'b', drop: null } })),
    getAvailableOfType:
      availableImpl ??
      (async () => [
        {
          provider: 'opencode',
          id: 'jev-1.13-free',
          cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
        },
      ]),
    classify:
      classifyImpl ??
      (async () => ({
        api: 'typesafe-system-one',
        provider: 'opencode',
        model: 'jev-1.13-free',
        answers: {
          keep_a: {
            type: 'choice',
            choice: 'yes',
            probabilities: { yes: 0.8, no: 0.2 },
            confidence: 0.9,
          },
        },
        usage: piUsage(),
        stopReason: 'stop',
        timestamp: 1,
      })),
  };
  // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion, typescript/no-unsafe-type-assertion -- modelRegistry の使う口だけ持つ偽物
  const typedRegistry = registry as unknown as ExtensionContext['modelRegistry'];
  if (options.withModel === false) {
    return { registry: typedRegistry, sessionId: 'session-1' };
  }
  const model = { provider: 'test', id: 'test-model', maxTokens: 8000, contextWindow: 200000 };
  // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion, typescript/no-unsafe-type-assertion -- 使うモデルの偽物
  const typedModel = model as unknown as ExtensionContext['model'];
  return { registry: typedRegistry, model: typedModel, sessionId: 'session-1' };
}

/** 偽の要約関数。引数を録り、出来た要約か例外を返す */
function summaryFake(
  captured: { args?: readonly unknown[] },
  outcome: { readonly text: string; readonly usage: ReturnType<typeof piUsage> } | Error,
): SummarizeWithUsage {
  return async (...args: Parameters<SummarizeWithUsage>) => {
    captured.args = args;
    if (outcome instanceof Error) {
      throw outcome;
    }
    return outcome;
  };
}

describe('summarize errors', () => {
  it('設定破損で failed、要約は呼ばない', async () => {
    const captured: { args?: readonly unknown[] } = {};
    const text = 'x';
    const ports = createPorts(
      fakeCell({}),
      brokenDir(),
      summaryFake(captured, { text, usage: piUsage() }),
    );
    expect((await ports.summarize([])).kind).toBe('failed');
    expect(captured.args).toBeUndefined();
  });

  it('registry かモデルが無くて failed', async () => {
    const ports = createPorts({}, settingsDirWith({}));
    expect((await ports.summarize([])).kind).toBe('failed');
    const noModel = fakeCell({ withModel: false });
    const ports2 = createPorts(noModel, settingsDirWith({}));
    expect((await ports2.summarize([])).kind).toBe('failed');
  });

  it('認証が取れなくて failed、理由は auth の error', async () => {
    const error = 'no key';
    const cell = fakeCell({ auth: async () => ({ ok: false, error }) });
    const ports = createPorts(cell, settingsDirWith({}));
    const outcome = await ports.summarize([]);
    expect(outcome).toEqual({ kind: 'failed', reason: error });
  });

  it('要約の関数が投げて failed', async () => {
    const message = 'summary boom';
    const ports = createPorts(
      fakeCell({}),
      settingsDirWith({}),
      summaryFake({}, new Error(message)),
    );
    const outcome = await ports.summarize([]);
    expect(outcome.kind).toBe('failed');
    if (outcome.kind !== 'failed') {
      throw new Error('must be failed');
    }
    expect(outcome.reason).toContain(message);
  });

  it('要約が空で failed', async () => {
    const ports = createPorts(
      fakeCell({}),
      settingsDirWith({}),
      summaryFake({}, { text: '   ', usage: piUsage() }),
    );
    const outcome = await ports.summarize([]);
    expect(outcome.kind).toBe('failed');
  });

  it('ok のとき要約と usage を返し、pi の要約関数にメッセージと session id を渡す', async () => {
    const captured: { args?: readonly unknown[] } = {};
    const summary = '本番の要約';
    const usage = piUsage();
    const ports = createPorts(
      fakeCell({}),
      settingsDirWith({}),
      summaryFake(captured, { text: summary, usage }),
    );
    const recent = [
      {
        role: 'user' as const,
        content: [{ type: 'text' as const, text: '最近の会話' }],
        timestamp: 1,
      },
    ];
    const outcome = await ports.summarize(recent);
    expect(outcome.kind).toBe('ok');
    if (outcome.kind !== 'ok') {
      throw new Error('must be ok');
    }
    expect(outcome.summary).toBe(summary);
    expect(outcome.usage).toEqual({
      input: usage.input,
      output: usage.output,
      cost: usage.cost.total,
    });
    const args = captured.args ?? [];
    expect(args[0]).toEqual(recent);
    const maxTokens = 8000;
    expect(args[2]).toBe(Math.ceil(maxTokens / 0.8));
    expect(args[3]).toBe('test-key');
    expect(args[4]).toEqual({ a: 'b' });
    const customInstructions = args[6];
    expect(typeof customInstructions).toBe('string');
    if (typeof customInstructions !== 'string') {
      throw new Error('customInstructions must be a string');
    }
    expect(customInstructions).toContain('English');
    expect(customInstructions).not.toMatch(/[぀-ヿ一-鿿]/);
    expect(args[13]).toBe('session-1');
  });
});

describe('summarizationReserve', () => {
  it('正の上限 → 上限を 0.8 で割って切り上げ', () => {
    const maxTokens = 101;
    const contextWindow = 1000;
    expect(summarizationReserve(maxTokens, contextWindow)).toBe(Math.ceil(maxTokens / 0.8));
  });

  it('0 の上限 → 文脈長で代替', () => {
    const maxTokens = 0;
    const contextWindow = 1001;
    expect(summarizationReserve(maxTokens, contextWindow)).toBe(Math.ceil(contextWindow / 0.8));
  });

  it('大きい上限と文脈長 → 上限を 0.8 で割って切り上げ', () => {
    const maxTokens = 8000;
    const contextWindow = 200000;
    expect(summarizationReserve(maxTokens, contextWindow)).toBe(Math.ceil(maxTokens / 0.8));
  });
});

describe('classify errors', () => {
  it('registry 無しで failed', async () => {
    const ports = createPorts({}, settingsDirWith({}));
    const outcome = await ports.classify(judgeRequestOf());
    expect(outcome.kind).toBe('failed');
  });

  it('getAvailableOfType の例外で failed', async () => {
    const cell = fakeCell({
      available: () => Promise.reject(new Error('list boom')),
    });
    const ports = createPorts(cell, settingsDirWith({}));
    const outcome = await ports.classify(judgeRequestOf());
    expect(outcome.kind).toBe('failed');
  });

  it('設定のモデルが 1 つも無いとき failed', async () => {
    const cell = fakeCell({
      available: async () => [],
    });
    const ports = createPorts(cell, settingsDirWith({}));
    const outcome = await ports.classify(judgeRequestOf());
    expect(outcome.kind).toBe('failed');
  });

  it('stopReason error で次の候補へ進む', async () => {
    const calls: string[] = [];
    const firstId = 'jev-1.13-free';
    const secondId = '~typesafe/jev-latest';
    // eslint-disable-next-line unicorn/consistent-function-scoping -- テストごとに available の中身を変える
    const available = async () => [
      {
        provider: 'opencode',
        id: firstId,
        cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
      },
      {
        provider: 'openrouter',
        id: secondId,
        cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
      },
    ];
    const classify = async (model: unknown, _args: unknown) => {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion, typescript/no-unsafe-type-assertion -- 偽物の分類器が渡す model の id だけ読む
      const typed = model as { readonly id: string };
      calls.push(typed.id);
      if (typed.id === firstId) {
        return {
          api: 'typesafe-system-one',
          provider: 'opencode',
          model: firstId,
          answers: {},
          stopReason: 'error',
          errorMessage: 'first boom',
          timestamp: 1,
        };
      }
      return {
        api: 'typesafe-system-one',
        provider: 'openrouter',
        model: secondId,
        answers: {
          keep_a: {
            type: 'choice',
            choice: 'yes',
            probabilities: { yes: 0.8, no: 0.2 },
            confidence: 0.9,
          },
        },
        usage: piUsage(),
        stopReason: 'stop',
        timestamp: 1,
      };
    };
    const cell = fakeCell({ available, classify });
    const ports = createPorts(cell, settingsDirWith({}));
    const outcome = await ports.classify(judgeRequestOf());
    expect(outcome.kind).toBe('ok');
    expect(calls).toEqual([firstId, secondId]);
  });

  it('aborted で止まる', async () => {
    const calls: string[] = [];
    const firstId = 'jev-1.13-free';
    const secondId = '~typesafe/jev-latest';
    // eslint-disable-next-line unicorn/consistent-function-scoping -- テストごとに available の中身を変える
    const available = async () => [
      {
        provider: 'opencode',
        id: firstId,
        cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
      },
      {
        provider: 'openrouter',
        id: secondId,
        cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
      },
    ];
    const classify = async (model: unknown, _args: unknown) => {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion, typescript/no-unsafe-type-assertion -- 偽物の分類器が渡す model の id だけ読む
      const typed = model as { readonly id: string };
      calls.push(typed.id);
      return {
        api: 'typesafe-system-one',
        provider: 'test',
        model: typed.id,
        answers: {},
        stopReason: 'aborted',
        timestamp: 1,
      };
    };
    const cell = fakeCell({ available, classify });
    const ports = createPorts(cell, settingsDirWith({}));
    const outcome = await ports.classify(judgeRequestOf());
    expect(outcome.kind).toBe('failed');
    expect(calls).toEqual([firstId]);
  });

  it('答えの形が違えば次の候補へ進む', async () => {
    const firstId = 'jev-1.13-free';
    const secondId = '~typesafe/jev-latest';
    // eslint-disable-next-line unicorn/consistent-function-scoping -- テストごとに available の中身を変える
    const available = async () => [
      {
        provider: 'opencode',
        id: firstId,
        cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
      },
      {
        provider: 'openrouter',
        id: secondId,
        cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
      },
    ];
    let count = 0;
    const classify = async (model: unknown, _args: unknown) => {
      count += 1;
      // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion, typescript/no-unsafe-type-assertion -- 偽物の分類器が渡す model の id だけ読む
      const typed = model as { readonly id: string };
      if (count === 1) {
        return {
          api: 'typesafe-system-one',
          provider: 'test',
          model: typed.id,
          answers: {
            keep_a: { type: 'score', score: 0.9 },
          },
          stopReason: 'stop',
          timestamp: 1,
        };
      }
      return {
        api: 'typesafe-system-one',
        provider: 'test',
        model: typed.id,
        answers: {
          keep_a: {
            type: 'choice',
            choice: 'yes',
            probabilities: { yes: 0.8, no: 0.2 },
            confidence: 0.9,
          },
        },
        usage: piUsage(),
        stopReason: 'stop',
        timestamp: 1,
      };
    };
    const cell = fakeCell({ available, classify });
    const ports = createPorts(cell, settingsDirWith({}));
    const outcome = await ports.classify(judgeRequestOf());
    expect(outcome.kind).toBe('ok');
    expect(count).toBe(2);
  });

  it('allowPaid false で有料しか無いとき failed', async () => {
    // eslint-disable-next-line unicorn/consistent-function-scoping -- テストごとに available の中身を変える
    const available = async () => [
      {
        provider: 'opencode',
        id: 'jev-1.13-free',
        cost: { input: 1, output: 0, cacheRead: 0, cacheWrite: 0 },
      },
    ];
    const cell = fakeCell({ available });
    const ports = createPorts(
      cell,
      settingsDirWith({
        classifier: {
          models: [{ provider: 'opencode', model: 'jev-1.13-free' }],
          allowPaid: false,
        },
      }),
    );
    const outcome = await ports.classify(judgeRequestOf());
    expect(outcome.kind).toBe('failed');
  });
});
