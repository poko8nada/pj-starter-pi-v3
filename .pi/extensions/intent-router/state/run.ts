/**
 * owner の発言1つ分の状態。
 *
 * 状態は判別可能な union（`idle` / `armed`）。arm 前に来た物は捨てる。
 * 純関数の集まりで、`now` は引数で受ける。
 */

import type { Label } from '../ask/questions.ts';
import type { ClassifierCandidate, Settings } from '../settings/schema.ts';
import { isSecretTarget } from './payload.ts';

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

export function noteTurn(run: Run, text: string, limits: Settings['state']): Run {
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
