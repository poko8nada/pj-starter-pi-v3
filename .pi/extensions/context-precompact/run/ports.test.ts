import { describe, expect, it } from 'vitest';
import type { CompactionResult, ExtensionContext } from '@earendil-works/pi-coding-agent';
import { createSummaryPorts, NO_MODEL_REASON, type SummaryCtx } from './ports.ts';
import type { PreparedCompaction } from '../prepare/types.ts';
import { RESERVE_TOKENS } from '../settings/constants.ts';

const SESSION_ID = 'sess-1';
const OTHER_SESSION_ID = 'sess-9';
const API_KEY = 'k2';
const THINKING_LEVEL = 'medium';
const HEADERS = { keep: 'yes', drop: null };
const ENV = { E2: 'v' };

function signalOf(): AbortSignal {
  return new AbortController().signal;
}

function preparedOf(): PreparedCompaction {
  return {
    firstKeptEntryId: 'kept-1',
    messagesToSummarize: [],
    turnPrefixMessages: [],
    isSplitTurn: false,
    tokensBefore: 100,
    previousSummary: undefined,
    fileOps: { read: new Set(), written: new Set(), edited: new Set() },
    settings: { enabled: true, reserveTokens: RESERVE_TOKENS, keepRecentTokens: 2000 },
  };
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

function modelOf(): ExtensionContext['model'] {
  const model = { provider: 'test', id: 'm1', maxTokens: 8000, contextWindow: 200_000 };
  // eslint-disable-next-line typescript/no-unsafe-type-assertion -- 使うモデルの偽物
  return model as unknown as ExtensionContext['model'];
}

function registryOf(auth: unknown): ExtensionContext['modelRegistry'] {
  const registry = { getApiKeyAndHeaders: async () => auth };
  // eslint-disable-next-line typescript/no-unsafe-type-assertion -- modelRegistry の使う口だけ持つ偽物
  return registry as unknown as ExtensionContext['modelRegistry'];
}

function sessionManagerOf(sessionId: string): ExtensionContext['sessionManager'] {
  const manager = { getSessionId: () => sessionId };
  // eslint-disable-next-line typescript/no-unsafe-type-assertion -- sessionManager の使う口だけ持つ偽物
  return manager as unknown as ExtensionContext['sessionManager'];
}

function ctxOf(overrides: Partial<SummaryCtx>): SummaryCtx {
  return {
    model: modelOf(),
    modelRegistry: registryOf({ ok: true, apiKey: API_KEY }),
    thinkingLevel: THINKING_LEVEL,
    sessionManager: sessionManagerOf(SESSION_ID),
    compactFn: async () => resultOf(),
    ...overrides,
  };
}

describe('createSummaryPorts', () => {
  it('compactFn が結果を返す → その結果', async () => {
    const expected = resultOf();
    const ports = createSummaryPorts(ctxOf({ compactFn: async () => expected }));
    await expect(ports.compact({ preparation: preparedOf(), signal: signalOf() })).resolves.toEqual(
      expected,
    );
  });

  it('compactFn に 12 引数が渡り、null header は落ちる', async () => {
    const captured: (readonly unknown[])[] = [];
    const prepared = preparedOf();
    const signal = signalOf();
    const model = modelOf();
    const compactFn: SummaryCtx['compactFn'] = async (...args) => {
      captured.push(args);
      return resultOf();
    };
    const ports = createSummaryPorts(
      ctxOf({
        model,
        modelRegistry: registryOf({ ok: true, apiKey: API_KEY, headers: HEADERS, env: ENV }),
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

  it('getApiKeyAndHeaders が失敗 → throw', async () => {
    const ports = createSummaryPorts(
      ctxOf({ modelRegistry: registryOf({ ok: false, error: 'no key' }) }),
    );
    await expect(
      ports.compact({ preparation: preparedOf(), signal: signalOf() }),
    ).rejects.toThrow();
  });

  it('model が undefined → throw', () => {
    expect(() => createSummaryPorts(ctxOf({ model: undefined }))).toThrow(NO_MODEL_REASON);
  });
});
