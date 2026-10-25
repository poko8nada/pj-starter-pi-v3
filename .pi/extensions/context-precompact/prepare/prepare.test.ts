import { describe, expect, it } from 'vitest';
import { sessionEntryToContextMessages } from '@earendil-works/pi-coding-agent';
import type { SessionEntry } from '@earendil-works/pi-coding-agent';
import { prepare } from './prepare.ts';
import type { PrepareInput, ProjectedEntry } from './types.ts';
import { defaultSettings } from '../settings/schema.ts';

let seq = 1000;

function nextId(): { readonly id: string; readonly parentId: string | null } {
  seq += 1;
  return { id: `p${seq}`, parentId: seq > 1001 ? `p${seq - 1}` : null };
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

function hookCompaction(details: unknown): SessionEntry {
  const ids = nextId();
  return {
    type: 'compaction',
    id: ids.id,
    parentId: ids.parentId,
    timestamp: new Date(seq).toISOString(),
    summary: 'hook prev',
    firstKeptEntryId: 'kept',
    tokensBefore: 100,
    details,
    fromHook: true,
  };
}

function plainCompaction(): SessionEntry {
  const ids = nextId();
  return {
    type: 'compaction',
    id: ids.id,
    parentId: ids.parentId,
    timestamp: new Date(seq).toISOString(),
    summary: 'plain prev',
    firstKeptEntryId: 'kept',
    tokensBefore: 100,
    details: undefined,
    fromHook: undefined,
  };
}

function project(entries: readonly SessionEntry[]): ProjectedEntry[] {
  return entries.map((sourceEntry) => ({
    sourceEntry,
    messages: [...sessionEntryToContextMessages(sourceEntry)] as ProjectedEntry['messages'],
  }));
}

function threeTurns(): SessionEntry[] {
  const entries: SessionEntry[] = [];
  for (let turn = 0; turn < 3; turn++) {
    entries.push(userEntry(`u${turn}-${'x'.repeat(4000)}`));
    entries.push(assistantEntry(`a${turn}-${'y'.repeat(4000)}`));
  }
  return entries;
}

function makeInput(
  branch: readonly SessionEntry[],
  overrides: Partial<PrepareInput> = {},
): PrepareInput {
  return {
    projectedEntries: project(branch),
    branch,
    tokensBefore: 6000,
    settings: { ...defaultSettings(), keepRecentTokens: 1500 },
    piEnabled: true,
    sessionId: 's1',
    ...overrides,
  };
}

describe('prepare', () => {
  it('前回の fromHook の details → read に a.ts、edited に b.ts', () => {
    const prev = hookCompaction({ readFiles: ['a.ts'], modifiedFiles: ['b.ts'] });
    const branch = [prev, ...threeTurns()];
    const prepared = prepare(makeInput(branch));
    expect(prepared).toBeDefined();
    expect(prepared?.compaction.fileOps.read.has('a.ts')).toBe(true);
    expect(prepared?.compaction.fileOps.edited.has('b.ts')).toBe(true);
  });

  it('fromHook が無い前回 → 追加の merge は無い', () => {
    const prev = plainCompaction();
    const branch = [prev, ...threeTurns()];
    const prepared = prepare(makeInput(branch));
    expect(prepared).toBeDefined();
    expect(prepared?.compaction.fileOps.read.size).toBe(0);
    expect(prepared?.compaction.fileOps.edited.size).toBe(0);
    expect(prepared?.compaction.fileOps.written.size).toBe(0);
  });

  it('details が配列でない → 投げずに無視する', () => {
    const prev = hookCompaction({ readFiles: 'a.ts', modifiedFiles: 123 });
    const branch = [prev, ...threeTurns()];
    expect(() => prepare(makeInput(branch))).not.toThrow();
    const prepared = prepare(makeInput(branch));
    expect(prepared?.compaction.fileOps.read.size).toBe(0);
    expect(prepared?.compaction.fileOps.edited.size).toBe(0);
  });

  it('enabled が false → undefined', () => {
    const branch = threeTurns();
    expect(
      prepare(
        makeInput(branch, {
          settings: { ...defaultSettings(), keepRecentTokens: 1500, enabled: false },
        }),
      ),
    ).toBeUndefined();
  });

  it('piEnabled が false → undefined', () => {
    const branch = threeTurns();
    expect(prepare(makeInput(branch, { piEnabled: false }))).toBeUndefined();
  });
});
