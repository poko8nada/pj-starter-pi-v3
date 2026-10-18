/**
 * `turn_end` で「もう答えられるか」を判定し、1回だけ止めて答えさせる。
 *
 * 道具を使った往復だけ判定する（道具0件なら何もログせず終える）。差し込みは
 * `{ entries: [custom_message] }` を返すだけで、`continue` は返さない。
 * 何もしない時は `undefined` を返す。
 */

import type { Ask, AskOutcome } from '../ask/ask.ts';
import type { LogRecord, OutcomeView } from '../record/recent.ts';
import type { Choice, Label } from '../ask/questions.ts';
import type { Settings } from '../settings/schema.ts';
import {
  addAction,
  countJudgement,
  fire,
  noteTurn,
  type FlagsPort,
  type JsonObject,
  type Run,
  type RunPort,
} from '../state/run.ts';
import { asInput, judgeState, toAction } from '../state/payload.ts';
import type { RouteCtx } from '../route/hook.ts';
import { decideJudge, due, stopMessage } from './decide.ts';

export interface JudgeToolResult {
  readonly toolName: string;
  readonly content: unknown;
  readonly isError?: boolean;
}

export interface JudgeTurnEvent {
  readonly turnIndex: number;
  readonly message: { readonly content: unknown };
  readonly toolResults: readonly JudgeToolResult[];
}

export interface JudgePiPort {
  on(
    event: 'turn_end',
    handler: (
      event: JudgeTurnEvent,
      ctx: RouteCtx,
    ) => Promise<
      | {
          readonly entries: readonly {
            readonly type: 'custom_message';
            readonly customType: string;
            readonly content: string;
            readonly display: boolean;
          }[];
        }
      | undefined
    >,
  ): void;
}

export interface JudgeDeps {
  readonly settings: Settings;
  readonly ask: Ask;
  readonly run: RunPort;
  readonly flags: FlagsPort;
  readonly log: (record: LogRecord) => void;
}

interface JudgeMessage {
  readonly entries: readonly {
    readonly type: 'custom_message';
    readonly customType: string;
    readonly content: string;
    readonly display: boolean;
  }[];
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/** 伝言の本文と道具の結果から文だけを抜く。画像は入れない */
function textOf(content: unknown): string {
  if (typeof content === 'string') {
    return content;
  }
  if (!Array.isArray(content)) {
    return '';
  }
  const parts: string[] = [];
  for (const block of content) {
    if (isRecord(block) && block['type'] === 'text' && typeof block['text'] === 'string') {
      parts.push(block['text']);
    }
  }
  return parts.join('\n');
}

/** 伝言の中の道具の呼び出し（`toolCall` の `name` と `arguments`）を順に抜く */
function toolInputsFrom(
  content: unknown,
): { readonly name: string; readonly input: Record<string, unknown> }[] {
  if (!Array.isArray(content)) {
    return [];
  }
  const out: { readonly name: string; readonly input: Record<string, unknown> }[] = [];
  for (const block of content) {
    if (isRecord(block) && block['type'] === 'toolCall' && typeof block['name'] === 'string') {
      out.push({ name: block['name'], input: asInput(block['arguments']) });
    }
  }
  return out;
}

type Armed = Extract<Run, { readonly kind: 'armed' }>;
type Answered = Extract<AskOutcome, { readonly kind: 'answered' }>;

interface JudgeLogInput {
  readonly prompt: string;
  readonly label: Label | Choice;
  readonly score: number | null;
  readonly confidence: number | null;
  readonly decision: 'fire' | 'hold';
  readonly stop: 'fired' | 'would' | 'none';
  readonly text: string | null;
  readonly turnIndex: number;
  readonly truncated: boolean;
  readonly outcome: AskOutcome;
}

function toOutcome(outcome: AskOutcome): OutcomeView {
  if (outcome.kind === 'answered') {
    return {
      kind: 'answered',
      provider: outcome.provider,
      model: outcome.model,
      stopReason: 'stop',
      usage: outcome.usage,
      latencyMs: outcome.latencyMs,
    };
  }
  return {
    kind: 'failed',
    reason: outcome.reason,
    tried: outcome.tried,
    latencyMs: outcome.latencyMs,
  };
}

function logJudge(deps: JudgeDeps, input: JudgeLogInput): void {
  deps.log({
    at: new Date().toISOString(),
    hook: 'judge',
    owner_prompt: input.prompt,
    label: input.label,
    score: input.score,
    confidence: input.confidence,
    thresholds: deps.settings.thresholds,
    decision: input.decision,
    shadow: deps.settings.judge.shadow,
    stop: input.stop,
    text: input.text,
    truncated: input.truncated,
    turn_index: input.turnIndex,
    outcome: toOutcome(input.outcome),
  });
}

/** 道具と伝言の文を state に足す。arm されていなければ undefined */
function recordTurn(deps: JudgeDeps, event: JudgeTurnEvent): Armed | undefined {
  let run: Run = deps.run.get();
  if (run.kind !== 'armed') {
    return undefined;
  }
  const calls = toolInputsFrom(event.message.content);
  const taken: number[] = [];
  for (const result of event.toolResults) {
    const at = calls.findIndex(
      (call, index) => !taken.includes(index) && call.name === result.toolName,
    );
    let input: Record<string, unknown> = {};
    if (at >= 0) {
      taken.push(at);
      input = calls[at]?.input ?? {};
    }
    run = addAction(
      run,
      toAction(
        event.turnIndex,
        result.toolName,
        input,
        textOf(result.content),
        result.isError ?? false,
        deps.settings.state.actionChars,
      ),
      deps.settings.state,
    );
  }
  run = noteTurn(run, textOf(event.message.content), deps.settings.state);
  deps.run.set(run);
  return run.kind === 'armed' ? run : undefined;
}

interface FireInput {
  readonly run: Armed;
  readonly outcome: Answered;
  readonly score: number;
  readonly confidence: number;
  readonly turnIndex: number;
  readonly truncated: boolean;
}

function settleFire(deps: JudgeDeps, input: FireInput): JudgeMessage | undefined {
  const { run, outcome, score, confidence, turnIndex, truncated } = input;
  const next = fire(run);
  deps.run.set(next);
  if (!deps.settings.stop.enabled) {
    logJudge(deps, {
      prompt: run.prompt,
      label: run.label,
      score,
      confidence,
      decision: 'fire',
      stop: 'none',
      text: null,
      turnIndex,
      truncated,
      outcome,
    });
    return undefined;
  }
  const text = stopMessage(deps.settings.stop.text, run.label);
  if (deps.settings.judge.shadow) {
    logJudge(deps, {
      prompt: run.prompt,
      label: run.label,
      score,
      confidence,
      decision: 'fire',
      stop: 'would',
      text,
      turnIndex,
      truncated,
      outcome,
    });
    return undefined;
  }
  logJudge(deps, {
    prompt: run.prompt,
    label: run.label,
    score,
    confidence,
    decision: 'fire',
    stop: 'fired',
    text,
    turnIndex,
    truncated,
    outcome,
  });
  return {
    entries: [
      {
        type: 'custom_message',
        customType: 'intent-stop',
        content: text,
        display: deps.settings.stop.display,
      },
    ],
  };
}

async function settleJudge(
  deps: JudgeDeps,
  run: Armed,
  turnIndex: number,
): Promise<JudgeMessage | undefined> {
  if (due(run, deps.settings, Date.now()).kind !== 'due') {
    return undefined;
  }
  const state: JsonObject = judgeState(run, deps.settings.budget.maxStateChars);
  const outcome = await deps.ask({ kind: 'score', state, only: run.candidate });
  const judged = countJudgement(run, Date.now());
  deps.run.set(judged);
  const truncated = state['truncated'] === true;
  if (outcome.kind === 'failed') {
    logJudge(deps, {
      prompt: run.prompt,
      label: run.label,
      score: null,
      confidence: null,
      decision: 'hold',
      stop: 'none',
      text: null,
      turnIndex,
      truncated,
      outcome,
    });
    return undefined;
  }
  const decision = decideJudge(outcome.answer, deps.settings.thresholds);
  if (decision.kind !== 'fire') {
    logJudge(deps, {
      prompt: run.prompt,
      label: run.label,
      score: decision.kind === 'skip' ? null : decision.score,
      confidence: decision.kind === 'skip' ? null : decision.confidence,
      decision: 'hold',
      stop: 'none',
      text: null,
      turnIndex,
      truncated,
      outcome,
    });
    return undefined;
  }
  return settleFire(deps, {
    run,
    outcome,
    score: decision.score,
    confidence: decision.confidence,
    turnIndex,
    truncated,
  });
}

export function registerJudge(pi: JudgePiPort, deps: JudgeDeps): void {
  pi.on('turn_end', async (event, _ctx) => {
    if (event.toolResults.length === 0) {
      return undefined;
    }
    if (!deps.flags.get().enabled) {
      return undefined;
    }
    if (!deps.settings.judge.enabled) {
      return undefined;
    }
    const run = recordTurn(deps, event);
    if (run === undefined) {
      return undefined;
    }
    return settleJudge(deps, run, event.turnIndex);
  });
}
