/**
 * セッション entry の工場。テストの前提データを 1 箇所に置く。
 *
 * 実行しても外へ出ない。ファイルを直接動かしても何も走らない。
 */
import { sessionEntryToContextMessages, type SessionEntry } from '@earendil-works/pi-coding-agent';
import type { ProjectedEntry } from '../prepare/types.ts';

/** 1 メッセージの本文。約 1000 トークンになる長さ */
const TURN_TEXT = 'x'.repeat(4_000);

export interface CompactionOptions {
  readonly fromHook?: boolean;
  readonly firstKeptEntryId?: string;
  readonly details?: unknown;
}

export interface SessionFixture {
  readonly user: (text: string) => SessionEntry;
  readonly assistant: (text: string) => SessionEntry;
  readonly toolCall: (name: string, path: string) => SessionEntry;
  readonly compaction: (summary: string, options?: CompactionOptions) => SessionEntry;
  readonly project: (entries: readonly SessionEntry[]) => ProjectedEntry[];
  readonly turns: (count: number) => SessionEntry[];
}

interface Ids {
  readonly id: string;
  readonly parentId: string | null;
}

function llmUsage() {
  return {
    input: 1,
    output: 1,
    cacheRead: 0,
    cacheWrite: 0,
    totalTokens: 2,
    cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0, total: 0 },
  };
}

function userEntry(ids: Ids, at: number, text: string): SessionEntry {
  return {
    type: 'message',
    id: ids.id,
    parentId: ids.parentId,
    timestamp: new Date(at).toISOString(),
    message: { role: 'user', content: [{ type: 'text', text }], timestamp: at },
  };
}

function assistantEntry(ids: Ids, at: number, text: string): SessionEntry {
  return {
    type: 'message',
    id: ids.id,
    parentId: ids.parentId,
    timestamp: new Date(at).toISOString(),
    message: {
      role: 'assistant',
      content: [{ type: 'text', text }],
      api: 'openai-completions',
      provider: 'test',
      model: 'test-model',
      usage: llmUsage(),
      stopReason: 'stop',
      timestamp: at,
    },
  };
}

function toolCallEntry(ids: Ids, at: number, name: string, path: string): SessionEntry {
  return {
    type: 'message',
    id: ids.id,
    parentId: ids.parentId,
    timestamp: new Date(at).toISOString(),
    message: {
      role: 'assistant',
      content: [{ type: 'toolCall', id: `call-${at}`, name, arguments: { path } }],
      api: 'openai-completions',
      provider: 'test',
      model: 'test-model',
      usage: llmUsage(),
      stopReason: 'stop',
      timestamp: at,
    },
  };
}

function compactionEntry(
  ids: Ids,
  at: number,
  summary: string,
  options: CompactionOptions & { readonly firstKeptEntryId: string },
): SessionEntry {
  return {
    type: 'compaction',
    id: ids.id,
    parentId: ids.parentId,
    timestamp: new Date(at).toISOString(),
    summary,
    firstKeptEntryId: options.firstKeptEntryId,
    tokensBefore: 100,
    details: options.details,
    fromHook: options.fromHook,
  };
}

/** entry を projection の形にする */
export function projectEntries(entries: readonly SessionEntry[]): ProjectedEntry[] {
  return entries.map((sourceEntry) => ({
    sourceEntry,
    messages: [...sessionEntryToContextMessages(sourceEntry)] as ProjectedEntry['messages'],
  }));
}

/** entry を作る工場。id は作った順の連番 */
export function createSessionFixture(): SessionFixture {
  let seq = 0;
  let latest = '';

  function nextIds(): Ids {
    seq += 1;
    const id = `f${seq}`;
    const parentId = seq > 1 ? `f${seq - 1}` : null;
    latest = id;
    return { id, parentId };
  }

  const user = (text: string): SessionEntry => userEntry(nextIds(), seq, text);
  const assistant = (text: string): SessionEntry => assistantEntry(nextIds(), seq, text);
  const toolCall = (name: string, path: string): SessionEntry =>
    toolCallEntry(nextIds(), seq, name, path);
  const compaction = (summary: string, options: CompactionOptions = {}): SessionEntry => {
    const firstKeptEntryId = options.firstKeptEntryId ?? latest;
    return compactionEntry(nextIds(), seq, summary, {
      ...options,
      firstKeptEntryId,
    });
  };
  return {
    user,
    assistant,
    toolCall,
    compaction,
    project: projectEntries,
    turns: (count) => {
      const entries: SessionEntry[] = [];
      for (let turn = 0; turn < count; turn++) {
        entries.push(user(TURN_TEXT), assistant(TURN_TEXT));
      }
      return entries;
    },
  };
}
