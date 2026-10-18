/**
 * Jev に渡す state の組み立て。
 */

import type { Action, JsonObject, Run } from './run.ts';

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
  actionChars: number,
): Action {
  const raw = isError ? `error: ${resultText}` : resultText;
  return {
    turn,
    tool,
    target: targetOf(tool, asInput(input)),
    result: raw.slice(0, actionChars),
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

export function judgeState(run: Run, maxChars: number): JsonObject {
  if (run.kind !== 'armed') {
    return { owner_prompt: '', investigation: [], truncated: false };
  }
  const base: JsonObject = {
    owner_prompt: run.prompt.slice(0, 2000),
    label: run.label,
    confidence: run.confidence,
    assistant_last: run.assistantLast,
    turns: run.turns,
    truncated: run.truncated,
    investigation: [],
  };
  const views = run.actions.map(actionView);
  const kept: JsonObject[] = [];
  let truncated = run.truncated;
  for (const view of views) {
    const next = [...kept, view];
    const size = JSON.stringify({ ...base, investigation: next }).length;
    if (size > maxChars) {
      truncated = true;
      break;
    }
    kept.push(view);
  }
  if (kept.length < views.length) {
    truncated = true;
  }
  return { ...base, investigation: kept, truncated };
}

export function routeState(prompt: string, cwdBase: string, hasImages: boolean): JsonObject {
  return {
    owner_prompt: prompt.slice(0, 2000),
    cwd_basename: cwdBase,
    has_images: hasImages,
  };
}
