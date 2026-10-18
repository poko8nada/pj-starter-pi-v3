/**
 * `turn_end` で 2 問（`useful` / `new`）を 1 リクエストで聞き、効いていないと同じ判断が
 * 続いたら促しを 1 回だけ差し込む。
 *
 * 道具を使った往復だけ判定する（道具0件・`latest` 空なら何もログせず終える）。差し込みは
 * `{ entries: [custom_message] }` を返すだけで、`continue` は返さない。
 * 何もしない時は `undefined` を返す。
 */

import type { BatchAsk, BatchAskOutcome } from '../ask/ask.ts';
import type { LogRecord, OutcomeView } from '../record/recent.ts';
import type { Settings } from '../settings/schema.ts';
import {
  addAction,
  countJudgement,
  noteTurn,
  noteVerdict,
  nudge,
  type FlagsPort,
  type JsonObject,
  type Run,
  type RunPort,
} from '../state/run.ts';
import { asInput, judgePayload, toAction } from '../state/payload.ts';
import type { RouteCtx } from '../route/hook.ts';
import { decideJudge, due, nudgeText, type JudgeAnswers } from './decide.ts';
import { JUDGE_QUESTIONS } from '../ask/questions.ts';

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
  readonly askBatch: BatchAsk;
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
type Answered = Extract<BatchAskOutcome, { readonly kind: 'answered' }>;

interface JudgeLogInput {
  readonly prompt: string;
  readonly choice: 'reply' | 'approve';
  readonly decision: 'fire' | 'hold';
  readonly stop: 'fired' | 'would' | 'none';
  readonly text: string | null;
  readonly turnIndex: number;
  readonly truncated: boolean;
  readonly outcome: BatchAskOutcome;
}

function toOutcome(outcome: BatchAskOutcome): OutcomeView {
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
    label: input.choice,
    score: null,
    confidence: null,
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

/** 道具の結果を latest に足す。arm されていなければ undefined */
function recordActions(deps: JudgeDeps, event: JudgeTurnEvent): Armed | undefined {
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
        deps.settings.state.resultChars,
      ),
      deps.settings.state,
    );
  }
  deps.run.set(run);
  return run.kind === 'armed' ? run : undefined;
}

function finishTurn(deps: JudgeDeps, run: Armed, text: string): Armed {
  const next = noteTurn(run, text, deps.settings.state);
  deps.run.set(next);
  return next.kind === 'armed' ? next : run;
}

interface NudgeInput {
  readonly run: Armed;
  readonly outcome: Answered;
  readonly turnIndex: number;
  readonly truncated: boolean;
}

function settleNudge(deps: JudgeDeps, input: NudgeInput): JudgeMessage | undefined {
  const { run, outcome, turnIndex, truncated } = input;
  const nudged = nudge(run);
  deps.run.set(nudged);
  const text = nudgeText(deps.settings, run.choice);
  if (deps.settings.judge.shadow) {
    logJudge(deps, {
      prompt: run.ownerNow,
      choice: run.choice,
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
    prompt: run.ownerNow,
    choice: run.choice,
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
        display: true,
      },
    ],
  };
}

interface HoldInput {
  readonly run: Armed;
  readonly outcome: BatchAskOutcome;
  readonly turnIndex: number;
  readonly truncated: boolean;
}

function settleHold(deps: JudgeDeps, input: HoldInput): undefined {
  logJudge(deps, {
    prompt: input.run.ownerNow,
    choice: input.run.choice,
    decision: 'hold',
    stop: 'none',
    text: null,
    turnIndex: input.turnIndex,
    truncated: input.truncated,
    outcome: input.outcome,
  });
  return undefined;
}

interface Asked {
  readonly outcome: BatchAskOutcome;
  readonly truncated: boolean;
}

async function askTwoQuestions(deps: JudgeDeps, run: Armed): Promise<Asked> {
  const { payload, truncated } = judgePayload(run, deps.settings);
  const outcome = await deps.askBatch({
    // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion -- JudgePayload は JSON 値だけで組む
    state: payload as unknown as JsonObject,
    questions: {
      [JUDGE_QUESTIONS.useful]: {
        type: 'choice',
        instructions: deps.settings.judge.questions.useful.instructions,
        criteria: { ...deps.settings.judge.questions.useful.criteria },
      },
      [JUDGE_QUESTIONS.new]: {
        type: 'choice',
        instructions: deps.settings.judge.questions.new.instructions,
        criteria: { ...deps.settings.judge.questions.new.criteria },
      },
    },
    only: run.candidate,
  });
  return { outcome, truncated };
}

async function settleJudge(
  deps: JudgeDeps,
  run: Armed,
  turnIndex: number,
  messageText: string,
): Promise<JudgeMessage | undefined> {
  if (run.latest.length === 0) {
    finishTurn(deps, run, messageText);
    return undefined;
  }
  if (due(run, deps.settings, Date.now()).kind !== 'due') {
    finishTurn(deps, run, messageText);
    return undefined;
  }
  const { outcome, truncated } = await askTwoQuestions(deps, run);
  return settleAnswered(deps, { run, outcome, turnIndex, messageText, truncated });
}

function settleAnswered(
  deps: JudgeDeps,
  input: {
    readonly run: Armed;
    readonly outcome: BatchAskOutcome;
    readonly turnIndex: number;
    readonly messageText: string;
    readonly truncated: boolean;
  },
): JudgeMessage | undefined {
  const { run, outcome, turnIndex, messageText, truncated } = input;
  const counted = countJudgement(run, Date.now());
  deps.run.set(counted);
  if (outcome.kind === 'failed') {
    finishTurn(deps, counted, messageText);
    logJudge(deps, {
      prompt: run.ownerNow,
      choice: run.choice,
      decision: 'hold',
      stop: 'none',
      text: null,
      turnIndex,
      truncated,
      outcome,
    });
    return undefined;
  }
  const useful = outcome.answers[JUDGE_QUESTIONS.useful];
  const fresh = outcome.answers[JUDGE_QUESTIONS.new];
  if (useful === undefined || fresh === undefined) {
    finishTurn(deps, counted, messageText);
    settleHold(deps, { run, outcome, turnIndex, truncated });
    return undefined;
  }
  const answers: JudgeAnswers = { useful, new: fresh };
  const decision = decideJudge(answers, deps.settings);
  if (decision.kind !== 'nudge') {
    if (decision.reason === 'helpful') {
      const cleared = noteVerdict(counted, false);
      deps.run.set(cleared);
      finishTurn(deps, cleared, messageText);
    } else {
      finishTurn(deps, counted, messageText);
    }
    settleHold(deps, { run, outcome, turnIndex, truncated });
    return undefined;
  }
  return settleUnhelpful(deps, { counted, outcome, turnIndex, messageText, truncated });
}

function settleUnhelpful(
  deps: JudgeDeps,
  input: {
    readonly counted: Armed;
    readonly outcome: Answered;
    readonly turnIndex: number;
    readonly messageText: string;
    readonly truncated: boolean;
  },
): JudgeMessage | undefined {
  const { counted, outcome, turnIndex, messageText, truncated } = input;
  const withStreak = noteVerdict(counted, true);
  deps.run.set(withStreak);
  if (
    withStreak.streak < deps.settings.judge.stop.consecutive ||
    withStreak.nudges >= deps.settings.judge.stop.maxNudges
  ) {
    finishTurn(deps, withStreak, messageText);
    settleHold(deps, { run: counted, outcome, turnIndex, truncated });
    return undefined;
  }
  finishTurn(deps, withStreak, messageText);
  const current = deps.run.get();
  if (current.kind !== 'armed') {
    settleHold(deps, { run: counted, outcome, turnIndex, truncated });
    return undefined;
  }
  return settleNudge(deps, { run: current, outcome, turnIndex, truncated });
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
    const run = recordActions(deps, event);
    if (run === undefined) {
      return undefined;
    }
    return settleJudge(deps, run, event.turnIndex, textOf(event.message.content));
  });
}
