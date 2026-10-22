/**
 * 候補の収集。末尾からトークンを足して直近を切り分け、古い toolResult を候補にする。
 *
 * 直近は送る文脈に残し、古い結果だけを判定にかける。生の記録は消さない。
 */

import { estimateTokens } from '@earendil-works/pi-coding-agent';
import type { SessionEntry } from '@earendil-works/pi-coding-agent';
import { assistantText } from './summarize.ts';

export type EntryMessage = Extract<SessionEntry, { readonly type: 'message' }>['message'];

export interface Candidate {
  readonly id: string;
  readonly toolName: string;
  readonly args: string;
  readonly chars: number;
}

export interface CollectInput {
  readonly entries: readonly SessionEntry[];
  readonly recentTokens: number;
  readonly done: ReadonlySet<string>;
}

export interface Collected {
  readonly recent: readonly EntryMessage[];
  readonly candidates: readonly Candidate[];
  readonly tokens: number;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/** 1 エントリの推定トークン。伝言以外は 0 */
function tokensOf(entry: SessionEntry): number {
  if (entry.type !== 'message') {
    return 0;
  }
  return estimateTokens(entry.message);
}

/** 結果の本文（text ブロックの合計）の文字数。抜き出しは assistantText に任せる */
function charsOf(message: EntryMessage): number {
  return assistantText(message).length;
}

/** toolCallId から `name(引数)` の文を作る表。引数は JSON にして 200 文字で切る */
function callTexts(entries: readonly SessionEntry[]): Map<string, string> {
  const calls = new Map<string, string>();
  for (const entry of entries) {
    if (entry.type !== 'message') {
      continue;
    }
    const message = entry.message;
    if (!('content' in message) || !Array.isArray(message.content)) {
      continue;
    }
    for (const block of message.content) {
      if (!isRecord(block) || block['type'] !== 'toolCall') {
        continue;
      }
      if (typeof block['id'] !== 'string' || typeof block['name'] !== 'string') {
        continue;
      }
      if (calls.has(block['id'])) {
        continue;
      }
      const argsJson = JSON.stringify(block['arguments'] ?? {});
      const raw = `${block['name']}(${argsJson})`;
      calls.set(block['id'], raw.length > 200 ? raw.slice(0, 200) : raw);
    }
  }
  return calls;
}

/** 直近の伝言列と古い結果の候補を分ける */
export function collect(input: CollectInput): Collected {
  const perEntry = input.entries.map(tokensOf);
  let tokens = 0;
  for (const count of perEntry) {
    tokens += count;
  }
  const recent: EntryMessage[] = [];
  const recentIds = new Set<string>();
  let acc = 0;
  for (let index = input.entries.length - 1; index >= 0; index -= 1) {
    const entry = input.entries[index];
    if (entry === undefined || entry.type !== 'message') {
      continue;
    }
    const count = perEntry[index] ?? 0;
    if (acc + count > input.recentTokens) {
      break;
    }
    acc += count;
    recent.unshift(entry.message);
    recentIds.add(entry.id);
  }
  const calls = callTexts(input.entries);
  const candidates: Candidate[] = [];
  for (const entry of input.entries) {
    if (entry.type !== 'message' || recentIds.has(entry.id) || input.done.has(entry.id)) {
      continue;
    }
    const message = entry.message;
    if (message.role !== 'toolResult') {
      continue;
    }
    candidates.push({
      id: entry.id,
      toolName: message.toolName,
      args: calls.get(message.toolCallId) ?? '',
      chars: charsOf(message),
    });
  }
  return { recent, candidates, tokens };
}
