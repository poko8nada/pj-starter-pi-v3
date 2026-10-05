/**
 * 会話の窓 — 直近の会話を、子に渡す文字列にする。
 *
 * 会話は pi のセッション（`ctx.sessionManager`）から取る。ここは純粋な整形だけを持つ。
 * 役割・本文・道具の引数と結果を1行ずつにし、直近 N 件だけを残す。長い発言は切る。
 * この拡張自身の道具（`ownToolName`）の呼び出しと結果は入れない（以前の判定が材料に混ざらない）。
 */

import type { MessageEndEvent } from '@earendil-works/pi-coding-agent';

/** pi の会話に出る1件。`message_end` が運ぶ物と同じ */
export type AgentMessage = MessageEndEvent['message'];

/** 会話の1件か。`role` を持つ物だけを会話として通す */
function isMessage(value: unknown): value is AgentMessage {
  const role = at(value, 'role');
  return role === 'user' || role === 'assistant' || role === 'toolResult';
}

/**
 * pi のセッションの entry から、子に渡す会話の1件を取り出す。
 *
 * `ctx.sessionManager.buildContextEntries()` が返すのは entry の並びで、会話は `type: "message"` の
 * 物だけ。他の entry（compaction、model の変更、custom など）は会話ではないので飛ばす。
 */
export function messagesFrom(entries: readonly unknown[]): AgentMessage[] {
  const messages: AgentMessage[] = [];
  for (const entry of entries) {
    if (at(entry, 'type') !== 'message') {
      continue;
    }
    const message = at(entry, 'message');
    if (isMessage(message)) {
      messages.push(message);
    }
  }
  return messages;
}

/** 子に渡す窓。`dropped` は落とした件数 */
export interface Window {
  readonly text: string;
  readonly dropped: number;
}

/** 1つの発言の上限（字）。超えた分は切り落とす */
export const MESSAGE_LIMIT = 4000;

/** 道具の結果の上限（字）。pi が既に切っている物にさらに掛ける */
export const RESULT_LIMIT = 2000;

/** 切った印。発言と結果のどちらにも付ける */
const TRUNCATED_MARK = '…(truncated)';

/** 長ければ切る。切ったことが分かるよう印を付ける */
function cut(text: string, limit: number): string {
  if (text.length <= limit) {
    return text;
  }
  return `${text.slice(0, limit)}\n${TRUNCATED_MARK}`;
}

/** オブジェクトからキーを引く。オブジェクトでなければ undefined。キャストを使わない */
function at(value: unknown, key: string): unknown {
  if (typeof value !== 'object' || value === null) {
    return undefined;
  }
  for (const [k, v] of Object.entries(value)) {
    if (k === key) {
      return v;
    }
  }
  return undefined;
}

/** 本文の部品からテキストを取る。テキストでなければ undefined */
function textOf(part: unknown): string | undefined {
  if (at(part, 'type') !== 'text') {
    return undefined;
  }
  const text = at(part, 'text');
  return typeof text === 'string' ? text : undefined;
}

/** メッセージの本文の部品を並べる。文字列の本文は1つのテキスト部品とみなす */
function partsOf(message: AgentMessage): readonly unknown[] {
  const content = at(message, 'content');
  if (typeof content === 'string') {
    return [{ type: 'text', text: content }];
  }
  if (Array.isArray(content)) {
    return content;
  }
  return [];
}

/** 道具の引数で窓に出すキー。`read` の `path`、`bash` の `command`、web の `queries` / `urls` */
const ARG_KEYS = ['path', 'command', 'queries', 'urls'] as const;

/** 道具の引数を1行にする。知っているキーがあれば `key=value` を並べ、無ければ JSON のまま */
function argsText(input: unknown): string {
  if (typeof input === 'object' && input !== null) {
    const picked: string[] = [];
    for (const key of ARG_KEYS) {
      const value = at(input, key);
      if (value === undefined) {
        continue;
      }
      picked.push(`${key}=${typeof value === 'string' ? value : JSON.stringify(value)}`);
    }
    if (picked.length > 0) {
      return picked.join(' ');
    }
  }
  try {
    return JSON.stringify(input) ?? '…(truncated)';
  } catch {
    return '…(truncated)';
  }
}

/** 描画に要る範囲。自分の道具の呼び出し id は、結果を除くのに使う */
interface Scope {
  readonly ownToolName: string;
  readonly ownIds: ReadonlySet<string>;
}

/** 自分の道具の呼び出し id を集める。描画とは別の純粋な1走査。窓に収まる分だけでなく全部を見る（窓外に落ちた呼び出しに対応する結果も除くため） */
function collectOwnIds(messages: readonly AgentMessage[], ownToolName: string): Set<string> {
  const ids = new Set<string>();
  for (const message of messages) {
    if (at(message, 'role') !== 'assistant') {
      continue;
    }
    for (const part of partsOf(message)) {
      if (at(part, 'type') !== 'toolCall' || at(part, 'name') !== ownToolName) {
        continue;
      }
      const id = at(part, 'id');
      if (typeof id === 'string') {
        ids.add(id);
      }
    }
  }
  return ids;
}

/** user の1件を描く。空の発言は出さない */
function renderUser(message: AgentMessage): string[] {
  const text = partsOf(message)
    .map((part) => textOf(part) ?? '')
    .join('\n');
  if (text.trim() === '') {
    return [];
  }
  return [`owner: ${cut(text, MESSAGE_LIMIT)}`];
}

/** assistant の部品1つを描く。考える分（thinking）は出さない */
function renderPart(part: unknown, scope: Scope): string | undefined {
  const text = textOf(part);
  if (text !== undefined) {
    if (text.trim() === '') {
      return undefined;
    }
    return `agent: ${cut(text, MESSAGE_LIMIT)}`;
  }
  if (at(part, 'type') !== 'toolCall') {
    return undefined;
  }
  const name = at(part, 'name');
  if (name === scope.ownToolName) {
    return undefined;
  }
  if (typeof name !== 'string') {
    return undefined;
  }
  return `agent: [tool: ${name}] ${cut(argsText(at(part, 'arguments')), MESSAGE_LIMIT)}`;
}

/** assistant の1件を描く */
function renderAssistant(message: AgentMessage, scope: Scope): string[] {
  const lines: string[] = [];
  for (const part of partsOf(message)) {
    const line = renderPart(part, scope);
    if (line !== undefined) {
      lines.push(line);
    }
  }
  return lines;
}

/** 道具の結果の1件を描く。自分の道具の物と、空の結果は出さない */
function renderResult(message: AgentMessage, scope: Scope): string[] {
  const name = at(message, 'toolName');
  if (name === scope.ownToolName) {
    return [];
  }
  const callId = at(message, 'toolCallId');
  if (typeof callId === 'string' && scope.ownIds.has(callId)) {
    return [];
  }
  if (typeof name !== 'string') {
    return [];
  }
  const text = partsOf(message)
    .map((part) => textOf(part) ?? '')
    .join('\n');
  if (text.trim() === '') {
    return [];
  }
  return [`agent: [tool: ${name}] result: ${cut(text, RESULT_LIMIT)}`];
}

/** 1件を描く。system や custom は会話ではないので出さない */
function renderMessage(message: AgentMessage, scope: Scope): string[] {
  const role = at(message, 'role');
  if (role === 'user') {
    return renderUser(message);
  }
  if (role === 'assistant') {
    return renderAssistant(message, scope);
  }
  if (role === 'toolResult') {
    return renderResult(message, scope);
  }
  return [];
}

/**
 * 直近 N 件を窓にする。落とした件数を `dropped` に返す。
 *
 * N が 0 以下・整数でないときは投げる。窓の取り方を誤った呼び出しを、空の窓と区別するため。
 */
export function windowFrom(
  messages: readonly AgentMessage[],
  count: number,
  ownToolName: string,
): Window {
  if (!Number.isInteger(count) || count <= 0) {
    throw new Error(`second-opinion: count must be a positive integer (got ${String(count)})`);
  }
  const kept = messages.slice(-count);
  const scope: Scope = { ownToolName, ownIds: collectOwnIds(messages, ownToolName) };
  const lines: string[] = [];
  for (const message of kept) {
    lines.push(...renderMessage(message, scope));
  }
  return { text: lines.join('\n'), dropped: messages.length - kept.length };
}
