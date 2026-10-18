/**
 * `before_agent_start` で owner の発言を 3 択で分け、reply / approve なら guide を1回だけ差し込む。
 *
 * 差し込みは戻り値の `message` で届ける。何もしない時は `undefined` を返す。
 * 聞く前にやめた場合（off・`/` 始まり）は ask せず行も作らない。
 */

import type { Ask, AskOutcome } from '../ask/ask.ts';
import type { Choice } from '../ask/questions.ts';
import type { LogRecord, OutcomeView } from '../record/recent.ts';
import type { Settings } from '../settings/schema.ts';
import { arm, idleRun, type FlagsPort, type JsonObject, type RunPort } from '../state/run.ts';
import { routePayload } from '../state/payload.ts';
import { decideRoute, guideText, type RouteDecision } from './decide.ts';
import { ROUTE_QUESTION } from '../ask/questions.ts';

export interface RouteCtx {
  readonly cwd: string;
  readonly agentPrev?: string;
}

export interface RoutePiPort {
  on(
    event: 'before_agent_start',
    handler: (
      event: { readonly prompt: string; readonly images?: readonly unknown[] },
      ctx: RouteCtx,
    ) => Promise<
      | {
          readonly message: {
            readonly customType: string;
            readonly content: string;
            readonly display: boolean;
          };
        }
      | undefined
    >,
  ): void;
}

export interface RouteDeps {
  readonly settings: Settings;
  readonly ask: Ask;
  readonly run: RunPort;
  readonly flags: FlagsPort;
  readonly log: (record: LogRecord) => void;
}

interface RouteLogInput {
  readonly prompt: string;
  readonly choice: Choice | null;
  readonly confidence: number | null;
  readonly probabilities: Readonly<Record<string, number>>;
  readonly decision: 'act' | 'idle' | 'skip';
  readonly guide: 'fired' | 'would' | 'none';
  readonly text: string | null;
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

function toChoiceOrNull(choice: string): Choice | null {
  if (choice === 'reply' || choice === 'approve' || choice === 'other') {
    return choice;
  }
  return null;
}

function logRoute(deps: RouteDeps, input: RouteLogInput): void {
  deps.log({
    at: new Date().toISOString(),
    hook: 'route',
    owner_prompt: input.prompt,
    label: input.choice,
    confidence: input.confidence,
    probabilities: input.probabilities,
    thresholds: deps.settings.thresholds,
    decision: input.decision,
    shadow: deps.settings.route.shadow,
    guide: input.guide,
    text: input.text,
    truncated: input.prompt.length > deps.settings.state.textChars,
    outcome: toOutcome(input.outcome),
  });
}

type Answered = Extract<AskOutcome, { readonly kind: 'answered' }>;

interface RouteMessage {
  readonly message: {
    readonly customType: string;
    readonly content: string;
    readonly display: boolean;
  };
}

interface ActInput {
  readonly prompt: string;
  readonly outcome: Answered;
  readonly decision: Extract<RouteDecision, { readonly kind: 'act' }>;
  readonly probabilities: Readonly<Record<string, number>>;
}

function settleAct(deps: RouteDeps, input: ActInput): RouteMessage | undefined {
  const { prompt, outcome, decision, probabilities } = input;
  deps.run.set(
    arm({
      prompt,
      label: decision.choice,
      confidence: decision.confidence,
      candidate: { provider: outcome.provider, model: outcome.model },
      now: Date.now(),
    }),
  );
  const text = guideText(deps.settings, decision.choice);
  if (deps.settings.route.shadow) {
    logRoute(deps, {
      prompt,
      choice: decision.choice,
      confidence: decision.confidence,
      probabilities,
      decision: 'act',
      guide: 'would',
      text,
      outcome,
    });
    return undefined;
  }
  logRoute(deps, {
    prompt,
    choice: decision.choice,
    confidence: decision.confidence,
    probabilities,
    decision: 'act',
    guide: 'fired',
    text,
    outcome,
  });
  return {
    message: { customType: 'intent-guide', content: text, display: true },
  };
}

function settleRoute(
  deps: RouteDeps,
  prompt: string,
  outcome: AskOutcome,
): RouteMessage | undefined {
  if (outcome.kind === 'failed') {
    deps.run.set(idleRun());
    logRoute(deps, {
      prompt,
      choice: null,
      confidence: null,
      probabilities: {},
      decision: 'idle',
      guide: 'none',
      text: null,
      outcome,
    });
    return undefined;
  }
  const answer = outcome.answer;
  const decision = decideRoute(answer, deps.settings);
  const probabilities = answer.type === 'choice' ? answer.probabilities : {};
  if (decision.kind !== 'act') {
    deps.run.set(idleRun());
    const skipChoice = answer.type === 'choice' ? toChoiceOrNull(answer.choice) : null;
    logRoute(deps, {
      prompt,
      choice: decision.kind === 'skip' ? skipChoice : decision.choice,
      confidence: decision.kind === 'skip' ? null : decision.confidence,
      probabilities,
      decision: decision.kind === 'skip' ? 'skip' : 'idle',
      guide: 'none',
      text: null,
      outcome,
    });
    return undefined;
  }
  return settleAct(deps, { prompt, outcome, decision, probabilities });
}

export function registerRoute(pi: RoutePiPort, deps: RouteDeps): void {
  pi.on('before_agent_start', async (event, ctx) => {
    if (!deps.flags.get().enabled) {
      return undefined;
    }
    if (event.prompt.startsWith('/')) {
      return undefined;
    }
    const agentPrev = ctx.agentPrev ?? '';
    const payload = routePayload(event.prompt, agentPrev, deps.settings);
    const outcome = await deps.ask({
      kind: 'choice',
      // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion -- RoutePayload は JSON 値だけで組む
      state: payload as unknown as JsonObject,
      questions: {
        [ROUTE_QUESTION]: {
          type: 'choice',
          instructions: deps.settings.route.question.instructions,
          criteria: { ...deps.settings.route.question.criteria },
        },
      },
    });
    return settleRoute(deps, event.prompt, outcome);
  });
}
