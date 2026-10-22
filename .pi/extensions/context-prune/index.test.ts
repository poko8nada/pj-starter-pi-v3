import { writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  estimateTokens,
  type BoundaryResult,
  type ContextUsage,
  type ExtensionContext,
  type SessionEntry,
} from '@earendil-works/pi-coding-agent';
import { tmpDir } from '../../../test/tmp.ts';
import { CUSTOM_TYPE, isPrunePass } from './entry/data.ts';
import { createWiring, registerPrune, type PiPort, type PruneCtx } from './index.ts';
import type { PassPorts } from './prune/run.ts';

let seq = 0;

function usage() {
  return {
    input: 1,
    output: 1,
    cacheRead: 0,
    cacheWrite: 0,
    totalTokens: 2,
    cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0, total: 0 },
  };
}

function nextId(): { readonly id: string; readonly parentId: string | null } {
  seq += 1;
  return { id: `e${seq}`, parentId: seq > 1 ? `e${seq - 1}` : null };
}

function assistantCall(callId: string): SessionEntry {
  const ids = nextId();
  return {
    type: 'message',
    id: ids.id,
    parentId: ids.parentId,
    timestamp: new Date(seq).toISOString(),
    message: {
      role: 'assistant',
      content: [{ type: 'toolCall', id: callId, name: 'read', arguments: { path: 'a.txt' } }],
      api: 'openai-completions',
      provider: 'test',
      model: 'test-model',
      usage: usage(),
      stopReason: 'stop',
      timestamp: seq,
    },
  };
}

function toolResult(callId: string, text: string): SessionEntry {
  const ids = nextId();
  return {
    type: 'message',
    id: ids.id,
    parentId: ids.parentId,
    timestamp: new Date(seq).toISOString(),
    message: {
      role: 'toolResult',
      toolCallId: callId,
      toolName: 'read',
      content: [{ type: 'text', text }],
      isError: false,
      timestamp: seq,
    },
  };
}

function assistantText(text: string): SessionEntry {
  const ids = nextId();
  return {
    type: 'message',
    id: ids.id,
    parentId: ids.parentId,
    timestamp: new Date(seq).toISOString(),
    message: {
      role: 'assistant',
      content: [{ type: 'text', text }],
      api: 'openai-completions',
      provider: 'test',
      model: 'test-model',
      usage: usage(),
      stopReason: 'stop',
      timestamp: seq,
    },
  };
}

function customPass(dropped: { readonly id: string; readonly chars: number }[]): SessionEntry {
  const ids = nextId();
  let chars = 0;
  for (const drop of dropped) {
    chars += drop.chars;
  }
  return {
    type: 'custom',
    id: ids.id,
    parentId: ids.parentId,
    timestamp: new Date(seq).toISOString(),
    customType: CUSTOM_TYPE,
    data: {
      at: 1000,
      tokensBefore: 60000,
      summary: 'テストの要約',
      dropped: [...dropped],
      droppedChars: chars,
      kept: 0,
      latencyMs: 1200,
      usage: undefined,
    },
  };
}

function tokensOf(entry: SessionEntry): number {
  if (entry.type !== 'message') {
    return 0;
  }
  return estimateTokens(entry.message);
}

function settingsDirWith(document: Record<string, unknown>): string {
  const dir = tmpDir();
  writeFileSync(join(dir, 'settings.json'), JSON.stringify(document));
  return dir;
}

function fakeCtx(
  branch: readonly SessionEntry[],
  contextUsage: ContextUsage | undefined,
  notified: string[],
): PruneCtx {
  const manager = { getBranch: () => [...branch] };
  return {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion -- 枝だけ返す偽物を作る
    sessionManager: manager as unknown as ExtensionContext['sessionManager'],
    getContextUsage: () => contextUsage,
    ui: {
      notify: (message: string) => {
        notified.push(message);
      },
    },
  };
}

function fakePi(): {
  readonly pi: PiPort;
  readonly events: string[];
  readonly handlers: Map<
    string,
    (event: unknown, ctx: PruneCtx) => Promise<BoundaryResult | undefined>
  >;
  readonly commands: Map<string, (args: string, ctx: PruneCtx) => Promise<void>>;
  readonly renderers: string[];
  readonly appended: { readonly customType: string; readonly data: unknown }[];
} {
  const events: string[] = [];
  const handlers = new Map<
    string,
    (event: unknown, ctx: PruneCtx) => Promise<BoundaryResult | undefined>
  >();
  const commands = new Map<string, (args: string, ctx: PruneCtx) => Promise<void>>();
  const renderers: string[] = [];
  const appended: { customType: string; data: unknown }[] = [];
  const pi: PiPort = {
    on: (event, handler) => {
      events.push(event);
      handlers.set(event, handler);
    },
    registerCommand: (name, options) => {
      commands.set(name, options.handler);
    },
    registerEntryRenderer: (customType, _renderer) => {
      renderers.push(customType);
    },
    appendEntry: (customType, data) => {
      appended.push({ customType, data });
    },
  };
  return { pi, events, handlers, commands, renderers, appended };
}

function fakePorts(
  summary: string,
  yes: number,
): PassPorts & { readonly calls: { classify: number } } {
  const calls = { classify: 0 };
  const answersOf = (
    request: Parameters<PassPorts['classify']>[0],
  ): Record<string, { type: string; probabilities: Record<string, number> }> => {
    const answers: Record<string, { type: string; probabilities: Record<string, number> }> = {};
    for (const key of Object.keys(request.questions)) {
      answers[key] = { type: 'choice', probabilities: { yes } };
    }
    return answers;
  };
  return {
    calls,
    summarize: () => Promise.resolve({ kind: 'ok', summary, usage: undefined }),
    classify: (request) => {
      calls.classify += 1;
      return Promise.resolve({ kind: 'ok', answers: answersOf(request) });
    },
  };
}

/** 古い結果と直近の伝言を持つ枝を作る。recentTokens は直近だけが残る値 */
function oldAndRecent(): {
  readonly branch: readonly SessionEntry[];
  readonly oldResult: SessionEntry;
  readonly recentTokens: number;
} {
  const call = assistantCall('c-old');
  const oldResult = toolResult('c-old', '古い結果');
  const recent = assistantText('直近の返答');
  return { branch: [call, oldResult, recent], oldResult, recentTokens: tokensOf(recent) };
}

describe('registerPrune', () => {
  it('turn_end、agent_before_settle、prune コマンド、1 つの renderer', () => {
    const fake = fakePi();
    registerPrune(fake.pi, { settingsDir: settingsDirWith({}), ports: fakePorts('要約', 0) });
    expect(fake.events).toEqual(['turn_end', 'agent_before_settle']);
    expect([...fake.commands.keys()]).toEqual(['prune']);
    expect(fake.renderers).toEqual([CUSTOM_TYPE]);
  });
});

describe('onTurnEnd', () => {
  it('gate が below-ratio（枝にパスが無い）→ undefined', async () => {
    const fake = fakePi();
    const { branch, recentTokens } = oldAndRecent();
    const wiring = createWiring(fake.pi, {
      settingsDir: settingsDirWith({ recentTokens }),
      ports: fakePorts('テストの要約', 0),
      now: () => 1000,
    });
    const notified: string[] = [];
    // 初回は走って lastTokens が残る。2 回目は割合未満で休む
    await wiring.onTurnEnd(
      fakeCtx(branch, { tokens: 1500, contextWindow: 2000, percent: 75 }, notified),
    );
    await wiring.flush();
    expect(fake.appended).toHaveLength(1);
    const outcome = await wiring.onTurnEnd(
      fakeCtx(branch, { tokens: 100, contextWindow: 2000, percent: 5 }, notified),
    );
    expect(outcome).toBeUndefined();
    expect(wiring.getStatus().running).toBe(false);
    await wiring.flush();
    expect(fake.appended).toHaveLength(1);
  });

  it('turn_end が裏のパスを始め、flush のあと appendEntry が 1 回', async () => {
    const fake = fakePi();
    const { branch, oldResult, recentTokens } = oldAndRecent();
    const wiring = createWiring(fake.pi, {
      settingsDir: settingsDirWith({ recentTokens }),
      ports: fakePorts('テストの要約', 0),
      now: () => 1000,
    });
    const notified: string[] = [];
    const outcome = await wiring.onTurnEnd(
      fakeCtx(branch, { tokens: 1500, contextWindow: 2000, percent: 75 }, notified),
    );
    expect(outcome).toBeUndefined();
    expect(wiring.getStatus().running).toBe(true);
    await wiring.flush();
    expect(fake.appended).toHaveLength(1);
    const first = fake.appended[0];
    expect(first?.customType).toBe(CUSTOM_TYPE);
    if (first === undefined || !isPrunePass(first.data)) {
      throw new Error('appended must be a prune pass');
    }
    expect(first.data.summary).toBe('テストの要約');
    expect(first.data.at).toBe(1000);
    expect(first.data.dropped).toEqual([{ id: oldResult.id, chars: '古い結果'.length }]);
  });

  it('走っている間の now → 通知に running、appendEntry は増えない', async () => {
    const fake = fakePi();
    const { branch, recentTokens } = oldAndRecent();
    let release: (() => void) | undefined;
    const gate = new Promise<void>((resolve) => {
      release = resolve;
    });
    const ports: PassPorts = {
      summarize: async () => {
        await gate;
        return { kind: 'ok', summary: '遅い要約', usage: undefined };
      },
      classify: (request) => {
        const answers: Record<string, { type: string; probabilities: Record<string, number> }> = {};
        for (const key of Object.keys(request.questions)) {
          answers[key] = { type: 'choice', probabilities: { yes: 0 } };
        }
        return Promise.resolve({ kind: 'ok', answers });
      },
    };
    const wiring = createWiring(fake.pi, {
      settingsDir: settingsDirWith({ recentTokens }),
      ports,
    });
    const notified: string[] = [];
    const ctx = fakeCtx(branch, { tokens: 1500, contextWindow: 2000, percent: 75 }, notified);
    await wiring.onTurnEnd(ctx);
    expect(wiring.getStatus().running).toBe(true);
    await wiring.onCommand('now', ctx);
    expect(notified.some((line) => line.includes('running'))).toBe(true);
    expect(fake.appended).toHaveLength(0);
    release?.();
    await wiring.flush();
    expect(fake.appended).toHaveLength(1);
  });

  it('設定が壊れている → 2 回の turn_end で通知が 1 回だけ', async () => {
    const fake = fakePi();
    const dir = tmpDir();
    writeFileSync(join(dir, 'settings.json'), '{');
    const wiring = createWiring(fake.pi, {
      settingsDir: dir,
      ports: fakePorts('要約', 0),
    });
    const notified: string[] = [];
    const { branch } = oldAndRecent();
    const ctx = fakeCtx(branch, { tokens: 1500, contextWindow: 2000, percent: 75 }, notified);
    await wiring.onTurnEnd(ctx);
    await wiring.onTurnEnd(ctx);
    expect(notified).toHaveLength(1);
  });

  it('getContextUsage() が undefined → 何も始まらない', async () => {
    const fake = fakePi();
    const { branch, recentTokens } = oldAndRecent();
    const wiring = createWiring(fake.pi, {
      settingsDir: settingsDirWith({ recentTokens }),
      ports: fakePorts('要約', 0),
    });
    const outcome = await wiring.onTurnEnd(fakeCtx(branch, undefined, []));
    expect(outcome).toBeUndefined();
    expect(wiring.getStatus().running).toBe(false);
    await wiring.flush();
    expect(fake.appended).toHaveLength(0);
  });
});

describe('onBeforeSettle', () => {
  it('パスが積まれた枝 → context_edit を返す。同じ境界の 2 回目は undefined', async () => {
    const fake = fakePi();
    const result = toolResult('c-drop', '落とす結果');
    const branch: readonly SessionEntry[] = [
      result,
      customPass([{ id: result.id, chars: '落とす結果'.length }]),
    ];
    const wiring = createWiring(fake.pi, {
      settingsDir: settingsDirWith({}),
      ports: fakePorts('要約', 0),
    });
    const ctx = fakeCtx(branch, { tokens: 1500, contextWindow: 2000, percent: 75 }, []);
    const first = await wiring.onBeforeSettle(ctx);
    expect(first?.entries).toHaveLength(1);
    expect(first?.entries?.[0]).toMatchObject({
      type: 'context_edit',
      targetId: result.id,
    });
    const second = await wiring.onBeforeSettle(ctx);
    expect(second).toBeUndefined();
  });
});

function evolvingHarness(options: {
  readonly summary: string;
  readonly yes: number;
  readonly classifyFails?: boolean;
}): {
  readonly branch: SessionEntry[];
  readonly appended: { readonly customType: string; readonly data: unknown }[];
  readonly notified: string[];
  readonly ctx: PruneCtx;
  readonly pi: PiPort;
  readonly ports: PassPorts;
} {
  const branch: SessionEntry[] = [];
  const appended: { customType: string; data: unknown }[] = [];
  const notified: string[] = [];
  const ports: PassPorts = {
    summarize: () => Promise.resolve({ kind: 'ok', summary: options.summary, usage: undefined }),
    classify: (request) => {
      if (options.classifyFails === true) {
        return Promise.resolve({ kind: 'failed', reason: 'classifier boom' });
      }
      const answers: Record<string, { type: string; probabilities: Record<string, number> }> = {};
      for (const key of Object.keys(request.questions)) {
        answers[key] = { type: 'choice', probabilities: { yes: options.yes } };
      }
      return Promise.resolve({ kind: 'ok', answers });
    },
  };
  const pi: PiPort = {
    on: () => undefined,
    registerCommand: () => undefined,
    registerEntryRenderer: () => undefined,
    appendEntry: (customType, data) => {
      appended.push({ customType, data });
      const ids = nextId();
      branch.push({
        type: 'custom',
        id: ids.id,
        parentId: ids.parentId,
        timestamp: new Date(seq).toISOString(),
        customType,
        data,
      });
    },
  };
  const manager = { getBranch: () => [...branch] };
  const ctx: PruneCtx = {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion -- 枝だけ返す偽物を作る
    sessionManager: manager as unknown as ExtensionContext['sessionManager'],
    getContextUsage: () => ({ tokens: 1500, contextWindow: 2000, percent: 75 }),
    ui: {
      notify: (message: string) => {
        notified.push(message);
      },
    },
  };
  return { branch, appended, notified, ctx, pi, ports };
}

describe('integration', () => {
  const RESULT_TEXT = '落とす結果の本文';

  function readyHarness(overrides?: { readonly classifyFails?: boolean }): {
    readonly harness: ReturnType<typeof evolvingHarness>;
    readonly result: SessionEntry;
    readonly wiring: ReturnType<typeof createWiring>;
  } {
    const harness = evolvingHarness({
      summary: 'テストの要約',
      yes: 0,
      classifyFails: overrides?.classifyFails,
    });
    const call = assistantCall('c-old');
    const result = toolResult('c-old', RESULT_TEXT);
    const recent = assistantText('直近の返答');
    harness.branch.push(call, result, recent);
    const wiring = createWiring(harness.pi, {
      settingsDir: settingsDirWith({ recentTokens: tokensOf(recent) }),
      ports: harness.ports,
      now: () => 1000,
    });
    return { harness, result, wiring };
  }

  it('1 パス後に appendEntry が 1 回、customType が context-prune', async () => {
    const { harness, wiring } = readyHarness();
    const first = await wiring.onTurnEnd(harness.ctx);
    expect(first).toBeUndefined();
    await wiring.flush();
    expect(harness.appended).toHaveLength(1);
    expect(harness.appended[0]?.customType).toBe(CUSTOM_TYPE);
  });

  it('次の境界で context_edit が 1 件、targetId が落とした結果の id', async () => {
    const { harness, result, wiring } = readyHarness();
    await wiring.onTurnEnd(harness.ctx);
    await wiring.flush();
    const second = await wiring.onTurnEnd(harness.ctx);
    expect(second?.entries).toHaveLength(1);
    expect(second?.entries?.[0]).toMatchObject({
      type: 'context_edit',
      targetId: result.id,
      replacement: {
        content: [{ type: 'text', text: `古いツール結果（${RESULT_TEXT.length} 文字）を省略` }],
      },
    });
  });

  it('同じ境界の 2 回目 → entries が空', async () => {
    const { harness, wiring } = readyHarness();
    await wiring.onTurnEnd(harness.ctx);
    await wiring.flush();
    await wiring.onTurnEnd(harness.ctx);
    expect(await wiring.onTurnEnd(harness.ctx)).toBeUndefined();
  });

  it('agent_before_settle → 同じ context_edit', async () => {
    const { harness, result, wiring } = readyHarness();
    await wiring.onTurnEnd(harness.ctx);
    await wiring.flush();
    const settled = await wiring.onBeforeSettle(harness.ctx);
    expect(settled?.entries).toHaveLength(1);
    expect(settled?.entries?.[0]).toMatchObject({
      type: 'context_edit',
      targetId: result.id,
    });
  });

  it('classify が失敗する → appendEntry されず、failures が 1', async () => {
    const { harness, wiring } = readyHarness({ classifyFails: true });
    await wiring.onTurnEnd(harness.ctx);
    await wiring.flush();
    expect(harness.appended).toHaveLength(0);
    expect(wiring.getStatus().failures).toBe(1);
  });

  it('文脈に効いたあとの境界 → entries が空', async () => {
    const { harness, result, wiring } = readyHarness();
    await wiring.onTurnEnd(harness.ctx);
    await wiring.flush();
    await wiring.onTurnEnd(harness.ctx);
    const ids = nextId();
    harness.branch.push({
      type: 'context_edit',
      id: ids.id,
      parentId: ids.parentId,
      timestamp: new Date(seq).toISOString(),
      targetId: result.id,
      replacement: {
        content: [{ type: 'text', text: `古いツール結果（${RESULT_TEXT.length} 文字）を省略` }],
      },
    });
    expect(await wiring.onTurnEnd(harness.ctx)).toBeUndefined();
  });
});
