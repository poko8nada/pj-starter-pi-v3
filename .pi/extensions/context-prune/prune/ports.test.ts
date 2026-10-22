import { writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import type { ExtensionContext } from '@earendil-works/pi-coding-agent';
import { tmpDir } from '../../../../test/tmp.ts';
import { createPorts, type ModelCell } from './ports.ts';
import type { JudgeRequest } from './judge.ts';

function settingsDirWith(document: Record<string, unknown>): string {
  const dir = tmpDir();
  writeFileSync(join(dir, 'settings.json'), JSON.stringify(document));
  return dir;
}

function brokenDir(): string {
  const dir = tmpDir();
  writeFileSync(join(dir, 'settings.json'), '{');
  return dir;
}

function testUsage() {
  return {
    input: 3,
    output: 5,
    cacheRead: 0,
    cacheWrite: 0,
    totalTokens: 8,
    cost: { input: 3, output: 5, cacheRead: 0, cacheWrite: 0, total: 8 },
  };
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
type CompleteFn = (model: unknown, context: unknown, opts: unknown) => Promise<unknown>;
type AvailableFn = () => Promise<unknown>;
type ClassifyFn = (model: unknown, args: unknown) => Promise<unknown>;

function fakeCell(options: {
  readonly complete?: CompleteFn;
  readonly available?: AvailableFn;
  readonly classify?: ClassifyFn;
  readonly withModel?: boolean;
}): ModelCell {
  const completeImpl = options.complete;
  const availableImpl = options.available;
  const classifyImpl = options.classify;
  const registry = {
    complete:
      completeImpl ??
      (async () => ({
        role: 'assistant',
        content: [{ type: 'text', text: '本番の要約' }],
        api: 'openai-completions',
        provider: 'test',
        model: 'test-model',
        usage: testUsage(),
        stopReason: 'stop',
        timestamp: 1,
      })),
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
        usage: testUsage(),
        stopReason: 'stop',
        timestamp: 1,
      })),
  };
  // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion, typescript/no-unsafe-type-assertion -- modelRegistry の使う口だけ持つ偽物
  const typedRegistry = registry as unknown as ExtensionContext['modelRegistry'];
  if (options.withModel === false) {
    return { registry: typedRegistry };
  }
  const model = { provider: 'test', id: 'test-model' };
  // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion, typescript/no-unsafe-type-assertion -- 使うモデルの偽物
  const typedModel = model as unknown as ExtensionContext['model'];
  return { registry: typedRegistry, model: typedModel };
}

describe('summarize errors', () => {
  it('設定破損で failed', async () => {
    const ports = createPorts(fakeCell({}), brokenDir());
    const outcome = await ports.summarize('最近の会話');
    expect(outcome.kind).toBe('failed');
  });

  it('registry かモデルが無くて failed', async () => {
    const empty: ModelCell = {};
    const ports = createPorts(empty, settingsDirWith({}));
    expect((await ports.summarize('最近の会話')).kind).toBe('failed');
    const noModel = fakeCell({ withModel: false });
    const ports2 = createPorts(noModel, settingsDirWith({}));
    expect((await ports2.summarize('最近の会話')).kind).toBe('failed');
  });

  it('complete が投げて failed', async () => {
    const cell = fakeCell({
      complete: async () => {
        throw new Error('complete boom');
      },
    });
    const ports = createPorts(cell, settingsDirWith({}));
    const outcome = await ports.summarize('最近の会話');
    expect(outcome.kind).toBe('failed');
    if (outcome.kind === 'failed') {
      expect(outcome.reason).toContain('complete boom');
    }
  });

  it('要約が空で failed', async () => {
    const cell = fakeCell({
      complete: async () => ({
        role: 'assistant',
        content: [{ type: 'text', text: '   ' }],
        api: 'openai-completions',
        provider: 'test',
        model: 'test-model',
        usage: testUsage(),
        stopReason: 'stop',
        timestamp: 1,
      }),
    });
    const ports = createPorts(cell, settingsDirWith({}));
    const outcome = await ports.summarize('最近の会話');
    expect(outcome.kind).toBe('failed');
    if (outcome.kind === 'failed') {
      expect(outcome.reason).toContain('summary');
    }
  });

  it('ok のとき usage が写る', async () => {
    const cell = fakeCell({});
    const ports = createPorts(cell, settingsDirWith({}));
    const outcome = await ports.summarize('最近の会話');
    expect(outcome.kind).toBe('ok');
    if (outcome.kind !== 'ok') {
      throw new Error('must be ok');
    }
    expect(outcome.summary).toBe('本番の要約');
    expect(outcome.usage).toEqual({ input: 3, output: 5, cost: 8 });
  });
});

describe('classify errors', () => {
  it('registry 無しで failed', async () => {
    const ports = createPorts({}, settingsDirWith({}));
    const outcome = await ports.classify(judgeRequestOf());
    expect(outcome.kind).toBe('failed');
  });

  it('getAvailableOfType の例外で failed', async () => {
    // getAvailableOfType が reject したら failed になる
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
    // eslint-disable-next-line unicorn/consistent-function-scoping -- テストごとに available の中身を変える
    const available = async () => [
      {
        provider: 'opencode',
        id: 'jev-1.13-free',
        cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
      },
      {
        provider: 'openrouter',
        id: '~typesafe/jev-latest',
        cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
      },
    ];
    const classify = async (model: unknown, _args: unknown) => {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion, typescript/no-unsafe-type-assertion -- 偽物の分類器が渡す model の id だけ読む
      const typed = model as { readonly id: string };
      calls.push(typed.id);
      if (typed.id === 'jev-1.13-free') {
        return {
          api: 'typesafe-system-one',
          provider: 'opencode',
          model: 'jev-1.13-free',
          answers: {},
          stopReason: 'error',
          errorMessage: 'first boom',
          timestamp: 1,
        };
      }
      return {
        api: 'typesafe-system-one',
        provider: 'openrouter',
        model: '~typesafe/jev-latest',
        answers: {
          keep_a: {
            type: 'choice',
            choice: 'yes',
            probabilities: { yes: 0.8, no: 0.2 },
            confidence: 0.9,
          },
        },
        usage: testUsage(),
        stopReason: 'stop',
        timestamp: 1,
      };
    };
    const cell = fakeCell({ available, classify });
    const ports = createPorts(cell, settingsDirWith({}));
    const outcome = await ports.classify(judgeRequestOf());
    expect(outcome.kind).toBe('ok');
    expect(calls).toEqual(['jev-1.13-free', '~typesafe/jev-latest']);
  });

  it('aborted で止まる', async () => {
    const calls: string[] = [];
    // eslint-disable-next-line unicorn/consistent-function-scoping -- テストごとに available の中身を変える
    const available = async () => [
      {
        provider: 'opencode',
        id: 'jev-1.13-free',
        cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
      },
      {
        provider: 'openrouter',
        id: '~typesafe/jev-latest',
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
    expect(calls).toEqual(['jev-1.13-free']);
  });

  it('答えの形が違えば次の候補へ進む', async () => {
    // eslint-disable-next-line unicorn/consistent-function-scoping -- テストごとに available の中身を変える
    const available = async () => [
      {
        provider: 'opencode',
        id: 'jev-1.13-free',
        cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
      },
      {
        provider: 'openrouter',
        id: '~typesafe/jev-latest',
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
        usage: testUsage(),
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
