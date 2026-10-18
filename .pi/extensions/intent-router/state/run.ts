/**
 * owner の発言1つ分の状態。途中判定は latest / earlier / streak / nudges を持つ。
 *
 * 状態は判別可能な union（`idle` / `armed`）。arm 前に来た物は捨てる。
 * 純関数の集まりで、`now` は引数で受ける。
 */

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
      readonly ownerNow: string;
      readonly choice: 'reply' | 'approve';
      readonly confidence: number;
      readonly candidate: ClassifierCandidate;
      readonly startedAt: number;
      readonly lastJudgedAt: number | null;
      readonly latest: readonly Action[];
      readonly earlier: readonly Action[];
      readonly assistantLast: string;
      readonly turns: number;
      readonly judgements: number;
      readonly streak: number;
      readonly nudges: number;
      readonly truncated: boolean;
    };

export type Armed = Extract<Run, { readonly kind: 'armed' }>;

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
  readonly ownerNow: string;
  readonly choice: 'reply' | 'approve';
  readonly confidence: number;
  readonly candidate: ClassifierCandidate;
  readonly now: number;
}): Run {
  return {
    kind: 'armed',
    ownerNow: input.ownerNow,
    choice: input.choice,
    confidence: input.confidence,
    candidate: input.candidate,
    startedAt: input.now,
    lastJudgedAt: null,
    latest: [],
    earlier: [],
    assistantLast: '',
    turns: 0,
    judgements: 0,
    streak: 0,
    nudges: 0,
    truncated: false,
  };
}

/** 記録に入れない的（秘密）は捨てる。latest に足す */
export function addAction(run: Armed, action: Action, limits: Settings['state']): Armed;
export function addAction(run: Run, action: Action, limits: Settings['state']): Run;
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
  const at = run.latest.findIndex(
    (item) => item.tool === action.tool && item.target === action.target,
  );
  if (at >= 0) {
    const found = run.latest[at];
    if (found === undefined) {
      return run;
    }
    const next = [...run.latest];
    next[at] = {
      turn: action.turn,
      tool: found.tool,
      target: found.target,
      result: action.result,
      attempts: found.attempts + 1,
      error: action.error,
    };
    return { ...run, latest: next };
  }
  return { ...run, latest: [...run.latest, action] };
}

/** latest を earlier へ送ってから 1 往復と数える */
export function noteTurn(run: Armed, text: string, limits: Settings['state']): Armed;
export function noteTurn(run: Run, text: string, limits: Settings['state']): Run;
export function noteTurn(run: Run, text: string, limits: Settings['state']): Run {
  if (run.kind !== 'armed') {
    return run;
  }
  const moved = [...run.earlier, ...run.latest];
  const maxActions = limits.maxActions;
  const truncated = run.truncated || moved.length > maxActions;
  const earlier = moved.length > maxActions ? moved.slice(moved.length - maxActions) : moved;
  return {
    ...run,
    earlier,
    latest: [],
    assistantLast: text.slice(0, limits.assistantChars),
    turns: run.turns + 1,
    truncated,
  };
}

export function countJudgement(run: Armed, now: number): Armed;
export function countJudgement(run: Run, now: number): Run;
export function countJudgement(run: Run, now: number): Run {
  if (run.kind !== 'armed') {
    return run;
  }
  return { ...run, judgements: run.judgements + 1, lastJudgedAt: now };
}

export function noteVerdict(run: Armed, unhelpful: boolean): Armed;
export function noteVerdict(run: Run, unhelpful: boolean): Run;
export function noteVerdict(run: Run, unhelpful: boolean): Run {
  if (run.kind !== 'armed') {
    return run;
  }
  return { ...run, streak: unhelpful ? run.streak + 1 : 0 };
}

export function nudge(run: Armed): Armed;
export function nudge(run: Run): Run;
export function nudge(run: Run): Run {
  if (run.kind !== 'armed') {
    return run;
  }
  return { ...run, nudges: run.nudges + 1 };
}
