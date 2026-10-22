import { describe, expect, it } from 'vitest';
import { estimateTokens } from '@earendil-works/pi-coding-agent';
import type { SessionEntry } from '@earendil-works/pi-coding-agent';
import { collect } from './collect.ts';

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

function callEntry(callId: string, name: string, args: Record<string, string>): SessionEntry {
  const ids = nextId();
  return {
    type: 'message',
    id: ids.id,
    parentId: ids.parentId,
    timestamp: new Date(seq).toISOString(),
    message: {
      role: 'assistant',
      content: [{ type: 'toolCall', id: callId, name, arguments: args }],
      api: 'openai-completions',
      provider: 'test',
      model: 'test-model',
      usage: usage(),
      stopReason: 'stop',
      timestamp: seq,
    },
  };
}

function resultEntry(callId: string, toolName: string, text: string): SessionEntry {
  const ids = nextId();
  return {
    type: 'message',
    id: ids.id,
    parentId: ids.parentId,
    timestamp: new Date(seq).toISOString(),
    message: {
      role: 'toolResult',
      toolCallId: callId,
      toolName,
      content: [{ type: 'text', text }],
      isError: false,
      timestamp: seq,
    },
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

function tokensOf(entry: SessionEntry): number {
  if (entry.type !== 'message') {
    return 0;
  }
  return estimateTokens(entry.message);
}

/** 古い結果 1 件と直近の結果 1 件を持つ並びを作る */
function oldAndRecent(): {
  readonly entries: readonly SessionEntry[];
  readonly oldId: string;
  readonly recentTokens: number;
} {
  const user = userEntry('古い質問');
  const oldCall = callEntry('c-old', 'read', { path: 'old.txt' });
  const oldResult = resultEntry('c-old', 'read', '古い結果の本文');
  const newCall = callEntry('c-new', 'read', { path: 'new.txt' });
  const newResult = resultEntry('c-new', 'read', '直近の結果の本文');
  const entries = [user, oldCall, oldResult, newCall, newResult];
  return {
    entries,
    oldId: oldResult.id,
    recentTokens: tokensOf(newCall) + tokensOf(newResult),
  };
}

describe('collect', () => {
  it('古い toolResult 1 件と直近の toolResult 1 件 → 候補は古い 1 件', () => {
    const { entries, oldId, recentTokens } = oldAndRecent();
    const collected = collect({ entries, recentTokens, done: new Set() });
    expect(collected.candidates).toHaveLength(1);
    expect(collected.candidates[0]?.id).toBe(oldId);
    expect(collected.candidates[0]?.toolName).toBe('read');
    expect(collected.candidates[0]?.chars).toBe('古い結果の本文'.length);
  });

  it('直近の合計がちょうど recentTokens → 境界のエントリは直近に残る', () => {
    const oldCall = callEntry('c-edge', 'read', { path: 'edge.txt' });
    const oldResult = resultEntry('c-edge', 'read', 'さらに古い結果');
    const mid = assistantEntry('途中の返答');
    const recent = assistantEntry('直近の返答');
    const entries = [oldCall, oldResult, mid, recent];
    const collected = collect({
      entries,
      recentTokens: tokensOf(mid) + tokensOf(recent),
      done: new Set(),
    });
    expect(collected.candidates.map((candidate) => candidate.id)).toEqual([oldResult.id]);
    expect(collected.recent).toHaveLength(2);
  });

  it('recent が直近 2 件を古い順に持ち、tokens が全件の合計', () => {
    const { entries, recentTokens } = oldAndRecent();
    const collected = collect({ entries, recentTokens, done: new Set() });
    expect(collected.recent).toHaveLength(2);
    const first = entries[3];
    const second = entries[4];
    if (first?.type !== 'message' || second?.type !== 'message') {
      throw new Error('entries must be messages');
    }
    expect(collected.recent[0]).toEqual(first.message);
    expect(collected.recent[1]).toEqual(second.message);
    let total = 0;
    for (const entry of entries) {
      total += tokensOf(entry);
    }
    expect(collected.tokens).toBe(total);
  });

  it('エントリが空 → 候補 0、tokens 0', () => {
    const collected = collect({ entries: [], recentTokens: 100, done: new Set() });
    expect(collected.candidates).toHaveLength(0);
    expect(collected.tokens).toBe(0);
  });

  it('古いエントリが user と assistant だけ → 候補 0', () => {
    const entries = [userEntry('質問'), assistantEntry('返答')];
    const collected = collect({ entries, recentTokens: 0, done: new Set() });
    expect(collected.candidates).toHaveLength(0);
  });

  it('done にある id は落ち、未知の id は他を変えない', () => {
    const { entries, oldId, recentTokens } = oldAndRecent();
    expect(collect({ entries, recentTokens, done: new Set([oldId]) }).candidates).toHaveLength(0);
    expect(
      collect({ entries, recentTokens, done: new Set(['unknown-id']) }).candidates,
    ).toHaveLength(1);
  });

  it('結果に対応する toolCall が無い → args は空文字で候補には残る', () => {
    const orphan = resultEntry('c-missing', 'bash', '呼び出しの無い結果');
    const collected = collect({ entries: [orphan], recentTokens: 0, done: new Set() });
    expect(collected.candidates).toHaveLength(1);
    expect(collected.candidates[0]?.args).toBe('');
  });

  it('引数の文字列が 199 / 200 / 201 文字 → 199 と 200 はそのまま、201 は 200 文字に切れる', () => {
    // `read({"text":"..."})` は 17 文字の頭に本文が付く。182 / 183 / 184 文字で 199 / 200 / 201 文字になる
    const short = callEntry('c-199', 'read', { text: 'x'.repeat(182) });
    const shortResult = resultEntry('c-199', 'read', '短い');
    const exact = callEntry('c-200', 'read', { text: 'x'.repeat(183) });
    const exactResult = resultEntry('c-200', 'read', 'ぴったり');
    const long = callEntry('c-201', 'read', { text: 'x'.repeat(184) });
    const longResult = resultEntry('c-201', 'read', '長い');
    const entries = [short, shortResult, exact, exactResult, long, longResult];
    const collected = collect({ entries, recentTokens: 0, done: new Set() });
    const byId = new Map(collected.candidates.map((candidate) => [candidate.id, candidate]));
    expect(byId.get(shortResult.id)?.args.length).toBe(199);
    expect(byId.get(exactResult.id)?.args.length).toBe(200);
    expect(byId.get(longResult.id)?.args.length).toBe(200);
  });

  it('結果が空の text ブロック → chars 0 で候補に残る', () => {
    // 空の結果は 0 トークンで境界を動かさないので、そのあとに大きい伝言を置いて古い側に残す
    const call = callEntry('c-empty', 'read', { path: 'empty.txt' });
    const ids = nextId();
    const empty: SessionEntry = {
      type: 'message',
      id: ids.id,
      parentId: ids.parentId,
      timestamp: new Date(seq).toISOString(),
      message: {
        role: 'toolResult',
        toolCallId: 'c-empty',
        toolName: 'read',
        content: [],
        isError: false,
        timestamp: seq,
      },
    };
    const big = assistantEntry('y'.repeat(1000));
    const collected = collect({ entries: [call, empty, big], recentTokens: 0, done: new Set() });
    expect(collected.candidates).toHaveLength(1);
    expect(collected.candidates[0]?.id).toBe(empty.id);
    expect(collected.candidates[0]?.chars).toBe(0);
  });
});
