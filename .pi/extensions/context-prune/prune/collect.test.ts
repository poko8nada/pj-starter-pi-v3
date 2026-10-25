import { describe, expect, it } from 'vitest';
import { estimateTokens } from '@earendil-works/pi-coding-agent';
import type { SessionEntry } from '@earendil-works/pi-coding-agent';
import { piUsage } from '../../../../test/pi.fixture.ts';
import { collect, excerptOf, messageText, type EntryMessage } from './collect.ts';

function userEntry(id: string, text: string): SessionEntry {
  return {
    type: 'message',
    id,
    parentId: null,
    timestamp: new Date(1).toISOString(),
    message: { role: 'user', content: [{ type: 'text', text }], timestamp: 1 },
  };
}

function callEntry(
  id: string,
  callId: string,
  name: string,
  args: Record<string, string>,
): SessionEntry {
  return {
    type: 'message',
    id,
    parentId: null,
    timestamp: new Date(1).toISOString(),
    message: {
      role: 'assistant',
      content: [{ type: 'toolCall', id: callId, name, arguments: args }],
      api: 'openai-completions',
      provider: 'test',
      model: 'test-model',
      usage: piUsage(),
      stopReason: 'stop',
      timestamp: 1,
    },
  };
}

function resultEntry(id: string, callId: string, toolName: string, text: string): SessionEntry {
  return {
    type: 'message',
    id,
    parentId: null,
    timestamp: new Date(1).toISOString(),
    message: {
      role: 'toolResult',
      toolCallId: callId,
      toolName,
      content: [{ type: 'text', text }],
      isError: false,
      timestamp: 1,
    },
  };
}

function assistantEntry(id: string, text: string): SessionEntry {
  return {
    type: 'message',
    id,
    parentId: null,
    timestamp: new Date(1).toISOString(),
    message: {
      role: 'assistant',
      content: [{ type: 'text', text }],
      api: 'openai-completions',
      provider: 'test',
      model: 'test-model',
      usage: piUsage(),
      stopReason: 'stop',
      timestamp: 1,
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
  readonly toolName: string;
  readonly oldText: string;
  readonly recentTokens: number;
} {
  const toolName = 'read';
  const oldText = '古い結果の本文';
  const user = userEntry('e-user', '古い質問');
  const oldCall = callEntry('e-old-call', 'c-old', toolName, { path: 'old.txt' });
  const oldResult = resultEntry('e-old-result', 'c-old', toolName, oldText);
  const newCall = callEntry('e-new-call', 'c-new', toolName, { path: 'new.txt' });
  const newResult = resultEntry('e-new-result', 'c-new', toolName, '直近の結果の本文');
  const entries = [user, oldCall, oldResult, newCall, newResult];
  return {
    entries,
    oldId: oldResult.id,
    toolName,
    oldText,
    recentTokens: tokensOf(newCall) + tokensOf(newResult),
  };
}

describe('collect', () => {
  it('古い toolResult と直近の 1 件 → 候補は古い 1 件', () => {
    const { entries, oldId, toolName, oldText, recentTokens } = oldAndRecent();
    const collected = collect({ entries, recentTokens, done: new Set() });
    expect(collected.candidates).toHaveLength(1);
    expect(collected.candidates[0]?.id).toBe(oldId);
    expect(collected.candidates[0]?.toolName).toBe(toolName);
    expect(collected.candidates[0]?.chars).toBe(oldText.length);
  });

  it('直近の合計がちょうど recentTokens → 境目のエントリは直近に残る', () => {
    const toolName = 'read';
    const oldCall = callEntry('e-edge-call', 'c-edge', toolName, { path: 'edge.txt' });
    const oldResult = resultEntry('e-edge-result', 'c-edge', toolName, 'さらに古い結果');
    const mid = assistantEntry('e-mid', '途中の返答');
    const recent = assistantEntry('e-recent', '直近の返答');
    const entries = [oldCall, oldResult, mid, recent];
    const recentIds = [mid.id, recent.id];
    const collected = collect({
      entries,
      recentTokens: tokensOf(mid) + tokensOf(recent),
      done: new Set(),
    });
    expect(collected.candidates.map((candidate) => candidate.id)).toEqual([oldResult.id]);
    expect(collected.recent).toHaveLength(recentIds.length);
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
    const entries = [userEntry('e-q', '質問'), assistantEntry('e-a', '返答')];
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

  it('対応する toolCall が無い → args は空文字で候補には残る', () => {
    const toolName = 'bash';
    const orphan = resultEntry('e-orphan', 'c-missing', toolName, '呼び出しの無い結果');
    const collected = collect({ entries: [orphan], recentTokens: 0, done: new Set() });
    expect(collected.candidates).toHaveLength(1);
    expect(collected.candidates[0]?.args).toBe('');
  });

  it('引数が短い・ちょうど・長い → 短いとちょうどはそのまま、長いだけ切れる', () => {
    const toolName = 'read';
    const shortArgs = { text: 'x'.repeat(182) };
    const exactArgs = { text: 'x'.repeat(183) };
    const longArgs = { text: 'x'.repeat(184) };
    const short = callEntry('e-short', 'c-199', toolName, shortArgs);
    const shortResult = resultEntry('e-short-result', 'c-199', toolName, '短い');
    const exact = callEntry('e-exact', 'c-200', toolName, exactArgs);
    const exactResult = resultEntry('e-exact-result', 'c-200', toolName, 'ぴったり');
    const long = callEntry('e-long', 'c-201', toolName, longArgs);
    const longResult = resultEntry('e-long-result', 'c-201', toolName, '長い');
    const entries = [short, shortResult, exact, exactResult, long, longResult];
    const collected = collect({ entries, recentTokens: 0, done: new Set() });
    const byId = new Map(collected.candidates.map((candidate) => [candidate.id, candidate]));
    const shortRaw = `${toolName}(${JSON.stringify(shortArgs)})`;
    const exactRaw = `${toolName}(${JSON.stringify(exactArgs)})`;
    const longRaw = `${toolName}(${JSON.stringify(longArgs)})`;
    expect(byId.get(shortResult.id)?.args).toBe(shortRaw);
    expect(byId.get(exactResult.id)?.args).toBe(exactRaw);
    const longArgsText = byId.get(longResult.id)?.args ?? '';
    expect(longArgsText.length).toBeLessThan(longRaw.length);
    expect(longRaw.startsWith(longArgsText)).toBe(true);
    expect(longArgsText.length).toBe((byId.get(exactResult.id)?.args ?? '').length);
  });

  it('結果が空の text ブロック → chars 0 で候補に残る', () => {
    const toolName = 'read';
    const call = callEntry('e-call', 'c-empty', toolName, { path: 'empty.txt' });
    const empty: SessionEntry = {
      type: 'message',
      id: 'e-empty',
      parentId: null,
      timestamp: new Date(1).toISOString(),
      message: {
        role: 'toolResult',
        toolCallId: 'c-empty',
        toolName,
        content: [],
        isError: false,
        timestamp: 1,
      },
    };
    const big = assistantEntry('e-big', 'y'.repeat(1000));
    const collected = collect({ entries: [call, empty, big], recentTokens: 0, done: new Set() });
    expect(collected.candidates).toHaveLength(1);
    expect(collected.candidates[0]?.id).toBe(empty.id);
    expect(collected.candidates[0]?.chars).toBe(0);
  });
});

type AssistantContent = Extract<EntryMessage, { readonly role: 'assistant' }>['content'];

function assistantMessage(content: AssistantContent): EntryMessage {
  return {
    role: 'assistant',
    content,
    api: 'openai-completions',
    provider: 'test',
    model: 'test-model',
    usage: piUsage(),
    stopReason: 'stop',
    timestamp: 1,
  };
}

describe('messageText', () => {
  it('text 2 つと toolCall が混ざる → text だけを連結', () => {
    const first = 'hello ';
    const second = 'world';
    const message = assistantMessage([
      { type: 'text', text: first },
      { type: 'toolCall', id: 'c1', name: 'read', arguments: { path: 'a.txt' } },
      { type: 'text', text: second },
    ]);
    expect(messageText(message)).toBe(first + second);
  });

  it('text ブロックが無い → 空文字', () => {
    const message = assistantMessage([
      { type: 'toolCall', id: 'c1', name: 'read', arguments: { path: 'a.txt' } },
    ]);
    expect(messageText(message)).toBe('');
  });
});

describe('excerptOf', () => {
  it('長い文 → 先頭と末尾を残し注記を挟む', () => {
    const head = 500;
    const tail = 500;
    const text = 'a'.repeat(3000);
    const excerpt = excerptOf(text, head, tail);
    expect(excerpt.startsWith(text.slice(0, head))).toBe(true);
    expect(excerpt.endsWith(text.slice(text.length - tail))).toBe(true);
    expect(excerpt).toContain(String(text.length - head - tail));
    expect(excerpt.length).toBeLessThan(text.length);
  });

  it('1000 文字ちょうど → 注記なしで全文', () => {
    const head = 500;
    const tail = 500;
    const text = 'b'.repeat(head + tail);
    expect(excerptOf(text, head, tail)).toBe(text);
  });

  it('空 → 空', () => {
    const input = '';
    expect(excerptOf(input, 500, 500)).toBe(input);
  });

  it('候補の excerpt は結果の抜粋', () => {
    const { entries, recentTokens, oldText } = oldAndRecent();
    const collected = collect({ entries, recentTokens, done: new Set() });
    expect(collected.candidates[0]?.excerpt).toBe(oldText);
  });
});
