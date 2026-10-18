/**
 * `turn_end` で 2 問（`useful` / `new`）を 1 リクエストで聞き、効いていないと同じ判断が
 * 続いたら促しを 1 回だけ差し込む。
 *
 * 道具を使った往復だけ判定する（道具0件・`latest` 空なら何もログせず終える）。差し込みは
 * `{ entries: [custom_message] }` を返すだけで、`continue` は返さない。
 * 何もしない時は `undefined` を返す。
 * live（`flags.mode === 'live'`）の時だけ差し込み、shadow は記録だけ残す。
 */

import type { BatchAsk, BatchAskOutcome } from '../ask/ask.ts';
import type { IntentRecord } from '../record/recent.ts';
import type { Settings } from '../settings/schema.ts';
import {
  addAction,
  countJudgement,
  noteTurn,
  noteVerdict,
  nudge,
  type Armed,
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
  readonly log: (record: IntentRecord) => void;
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

type Answered = Extract<BatchAskOutcome, { readonly kind: 'answered' }>;

interface HoldInput {
  readonly run: Armed;
  readonly outcome: BatchAskOutcome;
  readonly turnIndex: number;
  readonly truncated: boolean;
  readonly verdicts: JudgeAnswers | undefined;
  readonly streak: number;
}

function logHold(deps: JudgeDeps, input: HoldInput): void {
  const answers = input.verdicts;
  deps.log({
    at: new Date().toISOString(),
    hook: 'judge',
    owner_now: input.run.ownerNow,
    agent_prev: null,
    choice: input.run.choice,
    confidence: answers === undefined ? null : answers.useful.confidence,
    threshold: deps.settings.judge.threshold,
    guide: null,
    verdicts:
      answers === undefined
        ? null
        : {
            useful: verdictOf(answers.useful),
            new: verdictOf(answers.new),
          },
    streak: input.streak,
    nudge: null,
    fired: false,
  });
}

function verdictOf(answer: { readonly type: string; readonly choice?: string }): 'yes' | 'no' {
  return answer.type === 'choice' && answer.choice === 'yes' ? 'yes' : 'no';
}

interface NudgeInput {
  readonly run: Armed;
  readonly outcome: Answered;
  readonly turnIndex: number;
  readonly truncated: boolean;
  readonly answers: JudgeAnswers;
  readonly streak: number;
}

function logNudge(
  deps: JudgeDeps,
  input: NudgeInput & { readonly text: string; readonly fired: boolean },
): void {
  deps.log({
    at: new Date().toISOString(),
    hook: 'judge',
    owner_now: input.run.ownerNow,
    agent_prev: null,
    choice: input.run.choice,
    confidence: input.answers.useful.confidence,
    threshold: deps.settings.judge.threshold,
    guide: null,
    verdicts: {
      useful: verdictOf(input.answers.useful),
      new: verdictOf(input.answers.new),
    },
    streak: input.streak,
    nudge: input.text,
    fired: input.fired,
  });
}

function settleNudge(deps: JudgeDeps, input: NudgeInput): JudgeMessage | undefined {
  const { run, turnIndex, truncated, answers, streak } = input;
  const nudged = nudge(run);
  deps.run.set(nudged);
  const text = nudgeText(deps.settings, run.choice);
  const live = deps.flags.get().mode === 'live';
  logNudge(deps, {
    run,
    outcome: input.outcome,
    turnIndex,
    truncated,
    answers,
    streak,
    text,
    fired: live,
  });
  void turnIndex;
  void truncated;
  if (!live) {
    return undefined;
  }
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
  return next;
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
    logHold(deps, {
      run,
      outcome,
      turnIndex,
      truncated,
      verdicts: undefined,
      streak: counted.streak,
    });
    return undefined;
  }
  const useful = outcome.answers[JUDGE_QUESTIONS.useful];
  const fresh = outcome.answers[JUDGE_QUESTIONS.new];
  if (useful === undefined || fresh === undefined) {
    finishTurn(deps, counted, messageText);
    logHold(deps, { run, outcome, turnIndex, truncated, verdicts: undefined, streak: 0 });
    return undefined;
  }
  const answers: JudgeAnswers = { useful, new: fresh };
  const decision = decideJudge(answers, deps.settings);
  if (decision.kind !== 'nudge') {
    if (decision.reason === 'helpful') {
      const cleared = noteVerdict(counted, false);
      deps.run.set(cleared);
      finishTurn(deps, cleared, messageText);
      logHold(deps, { run, outcome, turnIndex, truncated, verdicts: answers, streak: 0 });
    } else {
      finishTurn(deps, counted, messageText);
      logHold(deps, {
        run,
        outcome,
        turnIndex,
        truncated,
        verdicts: answers,
        streak: counted.streak,
      });
    }
    return undefined;
  }
  return settleUnhelpful(deps, { counted, outcome, turnIndex, messageText, truncated, answers });
}

function settleUnhelpful(
  deps: JudgeDeps,
  input: {
    readonly counted: Armed;
    readonly outcome: Answered;
    readonly turnIndex: number;
    readonly messageText: string;
    readonly truncated: boolean;
    readonly answers: JudgeAnswers;
  },
): JudgeMessage | undefined {
  const { counted, outcome, turnIndex, messageText, truncated, answers } = input;
  const withStreak = noteVerdict(counted, true);
  deps.run.set(withStreak);
  if (
    withStreak.streak < deps.settings.judge.stop.consecutive ||
    withStreak.nudges >= deps.settings.judge.stop.maxNudges
  ) {
    finishTurn(deps, withStreak, messageText);
    logHold(deps, {
      run: withStreak,
      outcome,
      turnIndex,
      truncated,
      verdicts: answers,
      streak: withStreak.streak,
    });
    return undefined;
  }
  finishTurn(deps, withStreak, messageText);
  const current = deps.run.get();
  if (current.kind !== 'armed') {
    logHold(deps, {
      run: withStreak,
      outcome,
      turnIndex,
      truncated,
      verdicts: answers,
      streak: withStreak.streak,
    });
    return undefined;
  }
  return settleNudge(deps, {
    run: current,
    outcome,
    turnIndex,
    truncated,
    answers,
    streak: withStreak.streak,
  });
}

export function registerJudge(pi: JudgePiPort, deps: JudgeDeps): void {
  pi.on('turn_end', async (event, _ctx) => {
    if (event.toolResults.length === 0) {
      return undefined;
    }
    const run = recordActions(deps, event);
    if (run === undefined) {
      return undefined;
    }
    return settleJudge(deps, run, event.turnIndex, textOf(event.message.content));
  });
}
