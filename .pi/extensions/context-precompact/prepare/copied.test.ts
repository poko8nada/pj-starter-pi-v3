import { describe, expect, it } from 'vitest';
import { sessionEntryToContextMessages } from '@earendil-works/pi-coding-agent';
import type { SessionEntry } from '@earendil-works/pi-coding-agent';
import { prepareFromProjection } from './copied.ts';
import type { CompactionSettings, ProjectedEntry } from './types.ts';

const TURNS = 3;

let seq = 0;

function nextId(): { readonly id: string; readonly parentId: string | null } {
  seq += 1;
  return { id: `e${seq}`, parentId: seq > 1 ? `e${seq - 1}` : null };
}

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

function userEntry(text: string): SessionEntry {
  const ids = nextId();
  return {
    type: 'message',
    id: ids.id,
    parentId: ids.parentId,
    timestamp: new Date(seq).toISOString(),
    message: { role: 'user', content: [{ type: 'text', text }], timestamp: seq },
  };
}

function assistantEntry(text: string): SessionEntry {
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

function toolCallEntry(callId: string, name: string, path: string): SessionEntry {
  const ids = nextId();
  return {
    type: 'message',
    id: ids.id,
    parentId: ids.parentId,
    timestamp: new Date(seq).toISOString(),
    message: {
      role: 'assistant',
      content: [{ type: 'toolCall', id: callId, name, arguments: { path } }],
      api: 'openai-completions',
      provider: 'test',
      model: 'test-model',
      usage: usage(),
      stopReason: 'stop',
      timestamp: seq,
    },
  };
}

function compactionEntry(
  summary: string,
  opts: { readonly fromHook?: boolean; readonly readFiles?: readonly string[] } = {},
): SessionEntry {
  const ids = nextId();
  return {
    type: 'compaction',
    id: ids.id,
    parentId: ids.parentId,
    timestamp: new Date(seq).toISOString(),
    summary,
    firstKeptEntryId: 'kept',
    tokensBefore: 100,
    details:
      opts.readFiles !== undefined
        ? { readFiles: [...opts.readFiles], modifiedFiles: [] }
        : undefined,
    fromHook: opts.fromHook,
  };
}

function project(entries: readonly SessionEntry[]): ProjectedEntry[] {
  return entries.map((sourceEntry) => ({
    sourceEntry,
    messages: [...sessionEntryToContextMessages(sourceEntry)] as ProjectedEntry['messages'],
  }));
}

function settingsOf(keepRecentTokens: number): CompactionSettings {
  return { enabled: true, reserveTokens: 16_384, keepRecentTokens };
}

/** user/assistant を交互に `TURNS` 回並べた 6 件を作る。1 件は約 1000 トークン */
function threeTurns(): SessionEntry[] {
  const entries: SessionEntry[] = [];
  for (let turn = 0; turn < TURNS; turn++) {
    entries.push(userEntry(`u${turn}-${'x'.repeat(4000)}`));
    entries.push(assistantEntry(`a${turn}-${'y'.repeat(4000)}`));
  }
  return entries;
}

describe('prepareFromProjection', () => {
  it('工場の 3 ターンと小さい keep → 期待の entry が firstKept で要約対象が空でない', () => {
    const pathEntries = threeTurns();
    const projectedEntries = project(pathEntries);
    const prepared = prepareFromProjection({
      projectedEntries,
      pathEntries,
      settings: settingsOf(1500),
      tokensBefore: 6000,
    });
    expect(prepared).toBeDefined();
    expect(prepared?.firstKeptEntryId).toBe(pathEntries[4]?.id);
    expect(prepared?.messagesToSummarize.length).toBeGreaterThan(0);
  });

  it('最後が compaction → undefined', () => {
    const pathEntries = [...threeTurns(), compactionEntry('prev')];
    const projectedEntries = project(pathEntries);
    expect(
      prepareFromProjection({
        projectedEntries,
        pathEntries,
        settings: settingsOf(1500),
        tokensBefore: 6000,
      }),
    ).toBeUndefined();
  });

  it('メッセージが 1 件も無い → undefined', () => {
    const only = userEntry('質問');
    const projectedEntries: ProjectedEntry[] = [{ sourceEntry: only, messages: [] }];
    expect(
      prepareFromProjection({
        projectedEntries,
        pathEntries: [only],
        settings: settingsOf(1500),
        tokensBefore: 100,
      }),
    ).toBeUndefined();
  });

  it('1 つの user 区間が keep を超える → split で turnPrefix が空でない', () => {
    const user = userEntry(`q-${'x'.repeat(400)}`);
    const big = assistantEntry(`b-${'y'.repeat(8000)}`);
    const pathEntries = [user, big];
    const projectedEntries = project(pathEntries);
    const prepared = prepareFromProjection({
      projectedEntries,
      pathEntries,
      settings: settingsOf(500),
      tokensBefore: 3000,
    });
    expect(prepared?.isSplitTurn).toBe(true);
    expect(prepared?.turnPrefixMessages.length).toBeGreaterThan(0);
  });

  it('前回の compaction がある → previousSummary がその summary', () => {
    const prev = compactionEntry('前のまとめ');
    const rest = threeTurns();
    const pathEntries = [prev, ...rest];
    const projectedEntries = project(pathEntries);
    const prepared = prepareFromProjection({
      projectedEntries,
      pathEntries,
      settings: settingsOf(1500),
      tokensBefore: 6000,
    });
    expect(prepared?.previousSummary).toBe('前のまとめ');
  });

  it('read tool call → fileOps.read に path', () => {
    const call = toolCallEntry('c-read', 'read', 'r.ts');
    const pathEntries = [
      call,
      userEntry(`u-${'x'.repeat(4000)}`),
      assistantEntry(`a-${'y'.repeat(4000)}`),
    ];
    const projectedEntries = project(pathEntries);
    const prepared = prepareFromProjection({
      projectedEntries,
      pathEntries,
      settings: settingsOf(1500),
      tokensBefore: 3000,
    });
    expect(prepared?.fileOps.read.has('r.ts')).toBe(true);
  });

  it('edit tool call → fileOps.edited に path', () => {
    const call = toolCallEntry('c-edit', 'edit', 'e.ts');
    const pathEntries = [
      call,
      userEntry(`u-${'x'.repeat(4000)}`),
      assistantEntry(`a-${'y'.repeat(4000)}`),
    ];
    const projectedEntries = project(pathEntries);
    const prepared = prepareFromProjection({
      projectedEntries,
      pathEntries,
      settings: settingsOf(1500),
      tokensBefore: 3000,
    });
    expect(prepared?.fileOps.edited.has('e.ts')).toBe(true);
  });

  it('write tool call → fileOps.written に path', () => {
    const call = toolCallEntry('c-write', 'write', 'w.ts');
    const pathEntries = [
      call,
      userEntry(`u-${'x'.repeat(4000)}`),
      assistantEntry(`a-${'y'.repeat(4000)}`),
    ];
    const projectedEntries = project(pathEntries);
    const prepared = prepareFromProjection({
      projectedEntries,
      pathEntries,
      settings: settingsOf(1500),
      tokensBefore: 3000,
    });
    expect(prepared?.fileOps.written.has('w.ts')).toBe(true);
  });

  it('前回の Pi 生成 compaction の details.readFiles → fileOps.read に path', () => {
    const prev = compactionEntry('prev', { readFiles: ['prev.ts'] });
    const rest = threeTurns();
    const pathEntries = [prev, ...rest];
    const projectedEntries = project(pathEntries);
    const prepared = prepareFromProjection({
      projectedEntries,
      pathEntries,
      settings: settingsOf(1500),
      tokensBefore: 6000,
    });
    expect(prepared?.fileOps.read.has('prev.ts')).toBe(true);
  });
});
