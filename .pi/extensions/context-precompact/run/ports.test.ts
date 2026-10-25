import { describe, expect, it } from 'vitest';
import type { CompactionResult, ExtensionContext } from '@earendil-works/pi-coding-agent';
import { createSummaryPorts, type SummaryCtx } from './ports.ts';
import type { PreparedCompaction } from '../prepare/types.ts';

function preparedOf(): PreparedCompaction {
  return {
    firstKeptEntryId: 'kept-1',
    messagesToSummarize: [],
    turnPrefixMessages: [],
    isSplitTurn: false,
    tokensBefore: 100,
    previousSummary: undefined,
    fileOps: { read: new Set(), written: new Set(), edited: new Set() },
    settings: { enabled: true, reserveTokens: 16_384, keepRecentTokens: 2000 },
  };
}

function resultOf(): CompactionResult {
  return {
    summary: 'まとめ',
    firstKeptEntryId: 'kept-1',
    tokensBefore: 100,
    usage: undefined,
    details: { readFiles: [], modifiedFiles: [] },
  };
}

function modelOf() {
  const model = { provider: 'test', id: 'm1', maxTokens: 8000, contextWindow: 200_000 };
  // eslint-disable-next-line typescript/no-unsafe-type-assertion -- 使うモデルの偽物
  return model as unknown as ExtensionContext['model'];
}

function registryOf(auth: unknown): ExtensionContext['modelRegistry'] {
  const registry = {
    getApiKeyAndHeaders: async () => auth,
  };
  // eslint-disable-next-line typescript/no-unsafe-type-assertion -- modelRegistry の使う口だけ持つ偽物
  return registry as unknown as ExtensionContext['modelRegistry'];
}

function sessionManagerOf(sessionId: string): ExtensionContext['sessionManager'] {
  const manager = { getSessionId: () => sessionId };
  // eslint-disable-next-line typescript/no-unsafe-type-assertion -- sessionManager の使う口だけ持つ偽物
  return manager as unknown as ExtensionContext['sessionManager'];
}

describe('createSummaryPorts', () => {
  it('compactFn が結果を返す → その結果', async () => {
    const expected = resultOf();
    const compactFn: SummaryCtx['compactFn'] = async () => expected;
    const ctx: SummaryCtx = {
      model: modelOf(),
      modelRegistry: registryOf({ ok: true, apiKey: 'k', headers: { a: 'b' }, env: { E: '1' } }),
      thinkingLevel: 'medium',
      sessionManager: sessionManagerOf('sess-1'),
      compactFn,
    };
    const ports = createSummaryPorts(ctx);
    const signal = AbortSignal.timeout(1000);
    await expect(ports.compact({ preparation: preparedOf(), signal })).resolves.toEqual(expected);
  });

  it('compactFn に 12 引数が渡り、null header は落ちる', async () => {
    const captured: { readonly args: readonly unknown[] }[] = [];
    const prepared = preparedOf();
    const signal = AbortSignal.timeout(1000);
    const model = modelOf();
    const compactFn: SummaryCtx['compactFn'] = async (
      ...args: Parameters<SummaryCtx['compactFn']>
    ) => {
      captured.push({ args });
      return resultOf();
    };
    const ctx: SummaryCtx = {
      model,
      modelRegistry: registryOf({
        ok: true,
        apiKey: 'k2',
        headers: { keep: 'yes', drop: null },
        env: { E2: 'v' },
      }),
      thinkingLevel: 'medium',
      sessionManager: sessionManagerOf('sess-9'),
      compactFn,
    };
    const ports = createSummaryPorts(ctx);
    await ports.compact({ preparation: prepared, signal });
    expect(captured).toHaveLength(1);
    const args = captured[0]?.args ?? [];
    expect(args[0]).toEqual(prepared);
    expect(args[1]).toBe(model);
    expect(args[2]).toBe('k2');
    expect(args[3]).toEqual({ keep: 'yes' });
    expect(args[4]).toBeUndefined();
    expect(args[5]).toBe(signal);
    expect(args[6]).toBe('medium');
    expect(args[7]).toBeUndefined();
    expect(args[8]).toEqual({ E2: 'v' });
    expect(args[9]).toBeUndefined();
    expect(args[10]).toBeUndefined();
    expect(args[11]).toBe('sess-9');
  });

  it('getApiKeyAndHeaders が失敗 → throw', async () => {
    const failing: SummaryCtx['compactFn'] = async () => resultOf();
    const ctx: SummaryCtx = {
      model: modelOf(),
      modelRegistry: registryOf({ ok: false, error: 'no key' }),
      thinkingLevel: 'medium',
      sessionManager: sessionManagerOf('sess-1'),
      compactFn: failing,
    };
    const ports = createSummaryPorts(ctx);
    await expect(
      ports.compact({ preparation: preparedOf(), signal: AbortSignal.timeout(1000) }),
    ).rejects.toThrow();
  });

  it('model が undefined → throw', () => {
    const unused: SummaryCtx['compactFn'] = async () => resultOf();
    const ctx: SummaryCtx = {
      model: undefined,
      modelRegistry: registryOf({ ok: true, apiKey: 'k' }),
      thinkingLevel: 'medium',
      sessionManager: sessionManagerOf('sess-1'),
      compactFn: unused,
    };
    expect(() => createSummaryPorts(ctx)).toThrow();
  });
});
