import { describe, expect, it } from 'vitest';
import type { CompactionResult, ExtensionContext } from '@earendil-works/pi-coding-agent';
import { createSummaryPorts, NO_MODEL_REASON, type SummaryCtx } from './ports.ts';
import { modelFake, preparedCompaction, registryFake } from '../test/prepared.fixture.ts';

const SESSION_ID = 'sess-1';
const OTHER_SESSION_ID = 'sess-9';
const API_KEY = 'k2';
const THINKING_LEVEL = 'medium';
const HEADERS = { keep: 'yes', drop: null };
const ENV = { E2: 'v' };

function signalOf(): AbortSignal {
  return new AbortController().signal;
}

function resultOf(): CompactionResult {
  return {
    summary: 'summary',
    firstKeptEntryId: 'kept-1',
    tokensBefore: 100,
    usage: undefined,
    details: { readFiles: [], modifiedFiles: [] },
  };
}

function sessionManagerOf(sessionId: string): ExtensionContext['sessionManager'] {
  const manager = { getSessionId: () => sessionId };
  // eslint-disable-next-line typescript/no-unsafe-type-assertion -- sessionManager の使う関数だけを持つ偽物
  return manager as unknown as ExtensionContext['sessionManager'];
}

function ctxOf(overrides: Partial<SummaryCtx>): SummaryCtx {
  return {
    model: modelFake(),
    modelRegistry: registryFake({ ok: true, apiKey: API_KEY }),
    thinkingLevel: THINKING_LEVEL,
    sessionManager: sessionManagerOf(SESSION_ID),
    compactFn: async () => resultOf(),
    ...overrides,
  };
}

describe('createSummaryPorts', () => {
  it('compactFn が結果を返せばその結果になる', async () => {
    const expected = resultOf();
    const ports = createSummaryPorts(ctxOf({ compactFn: async () => expected }));
    await expect(
      ports.compact({ preparation: preparedCompaction(), signal: signalOf() }),
    ).resolves.toEqual(expected);
  });

  it('compactFn に 12 引数が渡り null ヘッダが取り除かれる', async () => {
    const captured: (readonly unknown[])[] = [];
    const prepared = preparedCompaction();
    const signal = signalOf();
    const model = modelFake();
    const compactFn: SummaryCtx['compactFn'] = async (...args) => {
      captured.push(args);
      return resultOf();
    };
    const ports = createSummaryPorts(
      ctxOf({
        model,
        modelRegistry: registryFake({ ok: true, apiKey: API_KEY, headers: HEADERS, env: ENV }),
        sessionManager: sessionManagerOf(OTHER_SESSION_ID),
        compactFn,
      }),
    );
    await ports.compact({ preparation: prepared, signal });
    expect(captured).toEqual([
      [
        prepared,
        model,
        API_KEY,
        { keep: 'yes' },
        undefined,
        signal,
        THINKING_LEVEL,
        undefined,
        ENV,
        undefined,
        undefined,
        OTHER_SESSION_ID,
      ],
    ]);
  });

  it('getApiKeyAndHeaders が失敗すれば例外が投げられる', async () => {
    const ports = createSummaryPorts(
      ctxOf({ modelRegistry: registryFake({ ok: false, error: 'no key' }) }),
    );
    await expect(
      ports.compact({ preparation: preparedCompaction(), signal: signalOf() }),
    ).rejects.toThrow();
  });

  it('model が undefined なら例外が投げられる', () => {
    expect(() => createSummaryPorts(ctxOf({ model: undefined }))).toThrow(NO_MODEL_REASON);
  });
});
