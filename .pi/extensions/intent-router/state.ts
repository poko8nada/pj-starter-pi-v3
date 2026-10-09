/**
 * owner の発言1つ分の状態と、jev に渡す state の組み立て。
 *
 * 状態は判別可能な union（`idle` / `armed`）。arm 前に来た物は捨てる。
 * 純関数の集まりで、`now` は引数で受ける。
 */

import type { ClassifierCandidate, Settings } from './settings.ts';
import type { Label } from './questions.ts';

export interface Usage {
  readonly input: number;
  readonly output: number;
  readonly cost: number;
}

export type JsonObject = Record<string, unknown>;

export interface Action {
  readonly turn: number;
  readonly tool: string;
  readonly target: string;
  readonly result: string;
  readonly attempts: number;
  readonly error: boolean;
}

export type Run =
  | { readonly kind: 'idle' }
  | {
      readonly kind: 'armed';
      readonly prompt: string;
      readonly label: Label;
      readonly confidence: number;
      readonly candidate: ClassifierCandidate;
      readonly startedAt: number;
      readonly lastJudgedAt: number | null;
      readonly actions: readonly Action[];
      readonly assistantLast: string;
      readonly turns: number;
      readonly judgements: number;
      readonly fires: number;
      readonly truncated: boolean;
    };

/** いまの状態の持ち主。hook と command はここを通して読み書きする */
export interface RunPort {
  readonly get: () => Run;
  readonly set: (next: Run) => void;
}

/** セッション中の on/off の持ち主 */
export interface FlagsPort {
  readonly get: () => { readonly enabled: boolean };
  readonly set: (next: { readonly enabled: boolean }) => void;
}

export function idleRun(): Run {
  return { kind: 'idle' };
}

export function arm(input: {
  readonly prompt: string;
  readonly label: Label;
  readonly confidence: number;
  readonly candidate: ClassifierCandidate;
  readonly now: number;
}): Run {
  return {
    kind: 'armed',
    prompt: input.prompt,
    label: input.label,
    confidence: input.confidence,
    candidate: input.candidate,
    startedAt: input.now,
    lastJudgedAt: null,
    actions: [],
    assistantLast: '',
    turns: 0,
    judgements: 0,
    fires: 0,
    truncated: false,
  };
}

/** 記録に入れない的（秘密）は捨てる */
export function addAction(run: Run, action: Action, limits: Settings['state']): Run {
  if (run.kind !== 'armed') {
    return run;
  }
  if (!limits.includeTools.includes(action.tool)) {
    return run;
  }
  if (isSecretTarget(action.target)) {
    return run;
  }
  const at = run.actions.findIndex(
    (item) => item.tool === action.tool && item.target === action.target,
  );
  if (at >= 0) {
    const found = run.actions[at];
    if (found === undefined) {
      return run;
    }
    const next = [...run.actions];
    next[at] = {
      turn: action.turn,
      tool: found.tool,
      target: found.target,
      result: action.result,
      attempts: found.attempts + 1,
      error: action.error,
    };
    return { ...run, actions: next };
  }
  if (run.actions.length >= limits.maxActions) {
    return { ...run, actions: [...run.actions.slice(1), action], truncated: true };
  }
  return { ...run, actions: [...run.actions, action] };
}

export function noteTurn(run: Run, text: string, limits: Settings['state'], now: number): Run {
  void now;
  if (run.kind !== 'armed') {
    return run;
  }
  return { ...run, assistantLast: text.slice(0, limits.assistantChars), turns: run.turns + 1 };
}

export function countJudgement(run: Run, now: number): Run {
  if (run.kind !== 'armed') {
    return run;
  }
  return { ...run, judgements: run.judgements + 1, lastJudgedAt: now };
}

export function fire(run: Run): Run {
  if (run.kind !== 'armed') {
    return run;
  }
  return { ...run, fires: run.fires + 1 };
}

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
