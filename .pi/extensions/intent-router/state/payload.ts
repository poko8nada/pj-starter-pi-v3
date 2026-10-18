/**
 * Jev に渡す state の組み立て。
 */

import type { Action, JsonObject, Run } from './run.ts';
import type { Settings } from '../settings/schema.ts';

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export function asInput(value: unknown): Record<string, unknown> {
  if (isRecord(value)) {
    return value;
  }
  return {};
}

function asText(value: unknown): string {
  return typeof value === 'string' ? value : '';
}

export function targetOf(tool: string, input: Record<string, unknown>): string {
  switch (tool) {
    case 'read':
    case 'write':
    case 'edit':
    case 'ls':
      return asText(input['path']);
    case 'bash':
      return asText(input['command']).split(/\s+/).at(0) ?? '';
    case 'grep':
    case 'find':
      return asText(input['pattern'] !== undefined ? input['pattern'] : input['path']);
    case 'consult_run':
      return asText(input['role']);
    case 'web_search':
      return asText(input['query']);
    default:
      return '';
  }
}

export function isSecretTarget(target: string): boolean {
  if (target === '') {
    return false;
  }
  if (target.includes('.env')) {
    return true;
  }
  if (target === '~/.pi' || target.startsWith('~/.pi/')) {
    return true;
  }
  const base = target.split('/').at(-1) ?? target;
  if (base.includes('id_rsa') || base.includes('id_ed25519')) {
    return true;
  }
  if (base.endsWith('.pem') || base.endsWith('.key')) {
    return true;
  }
  return false;
}

// eslint-disable-next-line max-params -- plan の I/O（turn, tool, input, result, error, 上限の6つ）
export function toAction(
  turn: number,
  tool: string,
  input: unknown,
  resultText: string,
  isError: boolean,
  resultChars: number,
): Action {
  const raw = isError ? `error: ${resultText}` : resultText;
  return {
    turn,
    tool,
    target: targetOf(tool, asInput(input)),
    result: raw.slice(0, resultChars),
    attempts: 1,
    error: isError,
  };
}

/** data-URL の画像を落とす。base64 の塊は送らない */
function stripImages(text: string): string {
  return text.replace(/data:image\/[^;]+;base64,[A-Za-z0-9+/=]+/g, '[image omitted]');
}

function actionView(action: Action): JsonObject {
  return {
    turn: action.turn,
    tool: action.tool,
    target: action.target,
    result: stripImages(action.result),
    attempts: action.attempts,
    error: action.error,
  };
}

export interface JudgePayload {
  readonly owner_now: string;
  readonly agent_text: string;
  readonly latest: readonly JsonObject[];
  readonly earlier: readonly JsonObject[];
}

export function judgePayload(
  run: Run,
  settings: Settings,
): { readonly payload: JudgePayload; readonly truncated: boolean } {
  if (run.kind !== 'armed') {
    return {
      payload: { owner_now: '', agent_text: '', latest: [], earlier: [] },
      truncated: false,
    };
  }
  const limit = settings.state.textChars;
  const maxChars = settings.state.maxStateChars;
  const latest = run.latest.map(actionView);
  let earlier = run.earlier.map(actionView);
  let truncated = run.truncated;
  const base = {
    owner_now: run.ownerNow.slice(0, limit),
    agent_text: run.assistantLast,
  };
  const sizeOf = (earlierViews: readonly JsonObject[]): number =>
    JSON.stringify({ ...base, latest, earlier: earlierViews }).length;
  while (earlier.length > 0 && sizeOf(earlier) > maxChars) {
    earlier = earlier.slice(1);
    truncated = true;
  }
  if (sizeOf(earlier) > maxChars) {
    truncated = true;
  }
  return { payload: { ...base, latest, earlier }, truncated };
}

export interface RoutePayload {
  readonly owner_now: string;
  readonly agent_prev: string;
}

export function routePayload(prompt: string, agentPrev: string, settings: Settings): RoutePayload {
  const limit = settings.state.textChars;
  return {
    owner_now: prompt.slice(0, limit),
    agent_prev: agentPrev.slice(0, limit),
  };
}

/** セッションの最後のエージェント発言の文を抜く。画像は入れない */
export function lastAssistantText(entries: readonly unknown[], maxChars: number): string {
  for (let index = entries.length - 1; index >= 0; index -= 1) {
    const entry = entries[index];
    const { role, content } = splitEntry(entry);
    if (role !== 'assistant' && role !== 'agent') {
      continue;
    }
    const text = textOfEntry(content);
    if (text !== '') {
      return stripImages(text).slice(0, maxChars);
    }
  }
  return '';
}

function splitEntry(entry: unknown): { readonly role: unknown; readonly content: unknown } {
  if (typeof entry !== 'object' || entry === null || Array.isArray(entry)) {
    return { role: undefined, content: undefined };
  }
  // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion -- SessionEntry の形を narrow に読む
  const record = entry as Record<string, unknown>;
  const inner = record['message'];
  if (typeof inner === 'object' && inner !== null && !Array.isArray(inner)) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion -- message の中を読む
    const message = inner as Record<string, unknown>;
    return { role: message['role'], content: message['content'] };
  }
  return { role: record['role'], content: record['content'] };
}

function textOfEntry(content: unknown): string {
  if (typeof content === 'string') {
    return content;
  }
  if (!Array.isArray(content)) {
    return '';
  }
  const parts: string[] = [];
  for (const block of content) {
    if (typeof block !== 'object' || block === null || Array.isArray(block)) {
      continue;
    }
    // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion -- content の block を読む
    const record = block as Record<string, unknown>;
    if (record['type'] === 'text' && typeof record['text'] === 'string') {
      parts.push(record['text']);
    }
  }
  return parts.join('\n');
}
