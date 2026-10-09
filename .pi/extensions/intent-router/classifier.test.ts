import { describe, expect, it } from 'vitest';
import {
  candidatesFor,
  createAsk,
  type AskRequest,
  type Registry,
  type RegistryAnswer,
  type RegistryModel,
} from './classifier.ts';
import { defaultSettings, type Settings } from './settings.ts';

type RegistryResultOf = Awaited<ReturnType<Registry['classify']>>;

function model(provider: string, id: string, inputCost: number): RegistryModel {
  return {
    id,
    name: id,
    api: 'typesafe-system-one',
    provider,
    baseUrl: '',
    input: ['text'],
    cost: { input: inputCost, output: 0, cacheRead: 0, cacheWrite: 0 },
    type: 'classifier',
    contextWindow: 10000,
  };
}

function usage() {
  return {
    input: 10,
    output: 0,
    cacheRead: 0,
    cacheWrite: 0,
    totalTokens: 10,
    cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0, total: 0 },
  };
}

function choiceResult(provider: string, id: string, choice: string): RegistryResultOf {
  const answer: RegistryAnswer = {
    type: 'choice',
    choice,
    probabilities: { [choice]: 0.9 },
    confidence: 0.9,
  };
  return {
    api: 'typesafe-system-one',
    provider,
    model: id,
    answers: { route: answer },
    usage: usage(),
    stopReason: 'stop',
    timestamp: 1,
  };
}

function scoreResult(provider: string, id: string, score: number): RegistryResultOf {
  const answer: RegistryAnswer = { type: 'score', score, confidence: 0.8 };
  return {
    api: 'typesafe-system-one',
    provider,
    model: id,
    answers: { judge: answer },
    usage: usage(),
    stopReason: 'stop',
    timestamp: 1,
  };
}

function errorResult(provider: string, id: string, message: string): RegistryResultOf {
  return {
    api: 'typesafe-system-one',
    provider,
    model: id,
    answers: {},
    stopReason: 'error',
    errorMessage: message,
    timestamp: 1,
  };
}

function abortedResult(provider: string, id: string): RegistryResultOf {
  return {
    api: 'typesafe-system-one',
    provider,
    model: id,
    answers: {},
    stopReason: 'aborted',
    timestamp: 1,
  };
}

interface FakeRegistry {
  readonly available: readonly RegistryModel[];
  readonly queue: RegistryResultOf[];
  readonly calls: RegistryModel[];
  readonly registry: Registry;
}

function fakeRegistry(
  available: readonly RegistryModel[],
  queue: RegistryResultOf[],
): FakeRegistry {
  const calls: RegistryModel[] = [];
  const registry = {
    async getAvailableOfType(): Promise<readonly RegistryModel[]> {
      return available;
    },
    findOfType(_type: string, provider: string, modelId: string): RegistryModel | undefined {
      return available.find((item) => item.provider === provider && item.id === modelId);
    },
    async classify(
      target: RegistryModel,
      _context: unknown,
      options?: { readonly signal?: AbortSignal },
    ): Promise<RegistryResultOf> {
      calls.push(target);
      if (options?.signal?.aborted === true) {
        return abortedResult(target.provider, target.id);
      }
      const next = queue.shift();
      if (next === undefined) {
        return errorResult(target.provider, target.id, 'empty queue');
      }
      return next;
    },
  };
  return {
    available,
    queue,
    calls,
    // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion -- 偽物は使う3口だけ持つ
    registry: registry as unknown as Registry,
  };
}

function settingsWith(models: Settings['classifier']['models'], allowPaid: boolean): Settings {
  const base = defaultSettings();
  return { ...base, classifier: { models, allowPaid } };
}

function choiceAsk(state: Record<string, unknown> = { owner_prompt: 'hi' }): AskRequest {
  return { kind: 'choice', state };
}

describe('createAsk', () => {
  it('1つ目の候補で choice が返る → answered で候補と答えと usage が入る', async () => {
    const free = model('opencode', 'jev-1.13-free', 0);
    const paid = model('openrouter', '~typesafe/jev-latest', 1);
    const fake = fakeRegistry([free, paid], [choiceResult('opencode', 'jev-1.13-free', 'design')]);
    const notified: string[] = [];
    const ask = createAsk({
      registry: fake.registry,
      settings: defaultSettings(),
      notify: (message) => {
        notified.push(message);
      },
    });
    const outcome = await ask(choiceAsk());
    expect(outcome.kind).toBe('answered');
    if (outcome.kind !== 'answered') {
      return;
    }
    expect(outcome.provider).toBe('opencode');
    expect(outcome.model).toBe('jev-1.13-free');
    expect(outcome.answer).toMatchObject({ type: 'choice', choice: 'design' });
    expect(outcome.usage.input).toBe(10);
    expect(typeof outcome.latencyMs).toBe('number');
    expect(notified).toEqual([]);
  });

  it('score を聞いて score が返る → answer.score が 1.8', async () => {
    const free = model('opencode', 'jev-1.13-free', 0);
    const fake = fakeRegistry([free], [scoreResult('opencode', 'jev-1.13-free', 1.8)]);
    const ask = createAsk({
      registry: fake.registry,
      settings: defaultSettings(),
      notify: () => {},
    });
    const outcome = await ask({ kind: 'score', state: { owner_prompt: 'hi' } });
    expect(outcome.kind).toBe('answered');
    if (outcome.kind !== 'answered') {
      return;
    }
    expect(outcome.answer).toMatchObject({ type: 'score', score: 1.8 });
  });

  it('1つ目が error、2つ目が答え → answered（2件試した）', async () => {
    const free = model('opencode', 'jev-1.13-free', 0);
    const paid = model('openrouter', '~typesafe/jev-latest', 1);
    const fake = fakeRegistry(
      [free, paid],
      [
        errorResult('opencode', 'jev-1.13-free', 'boom'),
        choiceResult('openrouter', '~typesafe/jev-latest', 'design'),
      ],
    );
    const ask = createAsk({
      registry: fake.registry,
      settings: defaultSettings(),
      notify: () => {},
    });
    const outcome = await ask(choiceAsk());
    expect(outcome.kind).toBe('answered');
    expect(fake.calls).toHaveLength(2);
  });

  it('全部 error → failed で tried が2件、reason に1つ目の理由', async () => {
    const free = model('opencode', 'jev-1.13-free', 0);
    const paid = model('openrouter', '~typesafe/jev-latest', 1);
    const fake = fakeRegistry(
      [free, paid],
      [
        errorResult('opencode', 'jev-1.13-free', 'first-boom'),
        errorResult('openrouter', '~typesafe/jev-latest', 'second'),
      ],
    );
    const ask = createAsk({
      registry: fake.registry,
      settings: defaultSettings(),
      notify: () => {},
    });
    const outcome = await ask(choiceAsk());
    expect(outcome.kind).toBe('failed');
    if (outcome.kind !== 'failed') {
      return;
    }
    expect(outcome.tried).toHaveLength(2);
    expect(outcome.reason).toContain('first-boom');
  });

  it('choice を聞いて score が返る → failed で tried が2件', async () => {
    const free = model('opencode', 'jev-1.13-free', 0);
    const paid = model('openrouter', '~typesafe/jev-latest', 1);
    const fake = fakeRegistry(
      [free, paid],
      [
        scoreResult('opencode', 'jev-1.13-free', 1.8),
        scoreResult('openrouter', '~typesafe/jev-latest', 1.8),
      ],
    );
    const ask = createAsk({
      registry: fake.registry,
      settings: defaultSettings(),
      notify: () => {},
    });
    const outcome = await ask(choiceAsk());
    expect(outcome.kind).toBe('failed');
    if (outcome.kind !== 'failed') {
      return;
    }
    expect(outcome.tried).toHaveLength(2);
  });

  it('外部から abort → failed で reason が aborted', async () => {
    const free = model('opencode', 'jev-1.13-free', 0);
    const fake = fakeRegistry([free], [choiceResult('opencode', 'jev-1.13-free', 'design')]);
    const ask = createAsk({
      registry: fake.registry,
      settings: defaultSettings(),
      notify: () => {},
    });
    const controller = new AbortController();
    controller.abort();
    const outcome = await ask({
      kind: 'choice',
      state: { owner_prompt: 'hi' },
      signal: controller.signal,
    });
    expect(outcome.kind).toBe('failed');
    if (outcome.kind !== 'failed') {
      return;
    }
    expect(outcome.reason).toMatch(/aborted/);
  });

  it('偽の timer がすぐ fire → failed で reason が timeout', async () => {
    const free = model('opencode', 'jev-1.13-free', 0);
    const fake = fakeRegistry([free], [choiceResult('opencode', 'jev-1.13-free', 'design')]);
    const ask = createAsk({
      registry: fake.registry,
      settings: defaultSettings(),
      notify: () => {},
      timer: (_ms, fire) => {
        fire();
      },
    });
    const outcome = await ask(choiceAsk());
    expect(outcome.kind).toBe('failed');
    if (outcome.kind !== 'failed') {
      return;
    }
    expect(outcome.reason).toMatch(/timeout/);
  });

  it('only を渡すとその候補だけを試す（無ければ failed）', async () => {
    const free = model('opencode', 'jev-1.13-free', 0);
    const paid = model('openrouter', '~typesafe/jev-latest', 1);
    const fake = fakeRegistry(
      [free, paid],
      [choiceResult('openrouter', '~typesafe/jev-latest', 'design')],
    );
    const ask = createAsk({
      registry: fake.registry,
      settings: defaultSettings(),
      notify: () => {},
    });
    const outcome = await ask({
      kind: 'choice',
      state: { owner_prompt: 'hi' },
      only: { provider: 'openrouter', model: '~typesafe/jev-latest' },
    });
    expect(outcome.kind).toBe('answered');
    expect(fake.calls).toHaveLength(1);
    expect(fake.calls[0]?.id).toBe('~typesafe/jev-latest');

    const missing = await ask({
      kind: 'choice',
      state: { owner_prompt: 'hi' },
      only: { provider: 'nope', model: 'nothing' },
    });
    expect(missing.kind).toBe('failed');
  });

  it('無料が無く有料だけ（allowPaid: false）→ failed で tried が空', async () => {
    const paid = model('openrouter', '~typesafe/jev-latest', 1);
    const fake = fakeRegistry(
      [paid],
      [choiceResult('openrouter', '~typesafe/jev-latest', 'design')],
    );
    const ask = createAsk({
      registry: fake.registry,
      settings: settingsWith([{ provider: 'openrouter', model: '~typesafe/jev-latest' }], false),
      notify: () => {},
    });
    const outcome = await ask(choiceAsk());
    expect(outcome.kind).toBe('failed');
    if (outcome.kind !== 'failed') {
      return;
    }
    expect(outcome.tried).toEqual([]);
  });

  it('有料で答えた時だけ notify が1行1回（2回目の ask では呼ばれない）', async () => {
    const paid = model('openrouter', 'paid-only', 1);
    const fake = fakeRegistry(
      [paid],
      [
        choiceResult('openrouter', 'paid-only', 'design'),
        choiceResult('openrouter', 'paid-only', 'design'),
      ],
    );
    const notified: string[] = [];
    const ask = createAsk({
      registry: fake.registry,
      settings: settingsWith([{ provider: 'openrouter', model: 'paid-only' }], true),
      notify: (message) => {
        notified.push(message);
      },
    });
    await ask(choiceAsk());
    await ask(choiceAsk());
    expect(notified).toHaveLength(1);
    expect(notified[0]).toMatch(/paid/);
  });
});

describe('candidatesFor', () => {
  it('カタログに無い候補を落とし、残りの順を設定のまま保つ', () => {
    const b = model('p', 'b', 0);
    const a = model('p', 'a', 0);
    const settings = settingsWith(
      [
        { provider: 'p', model: 'missing' },
        { provider: 'p', model: 'b' },
        { provider: 'p', model: 'a' },
      ],
      true,
    );
    expect(candidatesFor([a, b], settings).map((item) => item.id)).toEqual(['b', 'a']);
  });

  it('allowPaid: false で有料だけを落とし、無料は残す', () => {
    const free = model('p', 'free', 0);
    const paid = model('p', 'paid', 5);
    const settings = settingsWith(
      [
        { provider: 'p', model: 'free' },
        { provider: 'p', model: 'paid' },
      ],
      false,
    );
    expect(candidatesFor([free, paid], settings).map((item) => item.id)).toEqual(['free']);
  });
});
