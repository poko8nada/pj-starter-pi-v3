/**
 * `before_agent_start` で owner の発言を 3 択で分け、reply / approve なら guide を1回だけ差し込む。
 *
 * 差し込みは戻り値の `message` で届ける。何もしない時は `undefined` を返す。
 * 聞く前にやめた場合（`/` 始まり）は ask せず記録も残さない。
 * live（`flags.mode === 'live'`）の時だけ差し込み、shadow は記録だけ残す。
 */

import type { Ask, AskOutcome } from '../ask/ask.ts';
import type { Choice } from '../ask/questions.ts';
import type { IntentRecord } from '../record/recent.ts';
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
  readonly log: (record: IntentRecord) => void;
}

interface RouteLogInput {
  readonly ownerNow: string;
  readonly agentPrev: string;
  readonly choice: Choice | null;
  readonly confidence: number | null;
  readonly threshold: number | null;
  readonly guide: string | null;
  readonly fired: boolean;
  readonly stateChars: number;
  readonly truncated: boolean;
}

function logRoute(deps: RouteDeps, input: RouteLogInput): void {
  deps.log({
    at: new Date().toISOString(),
    hook: 'route',
    owner_now: input.ownerNow,
    agent_prev: input.agentPrev,
    choice: input.choice,
    confidence: input.confidence,
    threshold: input.threshold,
    guide: input.guide,
    verdicts: null,
    streak: null,
    nudge: null,
    fired: input.fired,
    state_chars: input.stateChars,
    truncated: input.truncated,
  });
}

function toChoiceOrNull(choice: string): Choice | null {
  if (choice === 'reply' || choice === 'approve' || choice === 'other') {
    return choice;
  }
  return null;
}

function thresholdOf(settings: Settings, choice: Choice): number | null {
  if (choice === 'other') {
    return null;
  }
  return settings.route.thresholds[choice];
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
  readonly ownerNow: string;
  readonly agentPrev: string;
  readonly outcome: Answered;
  readonly decision: Extract<RouteDecision, { readonly kind: 'act' }>;
  readonly stateChars: number;
  readonly truncated: boolean;
}

function settleAct(deps: RouteDeps, input: ActInput): RouteMessage | undefined {
  const { ownerNow, agentPrev, outcome, decision, stateChars, truncated } = input;
  deps.run.set(
    arm({
      ownerNow,
      choice: decision.choice,
      confidence: decision.confidence,
      candidate: { provider: outcome.provider, model: outcome.model },
      now: Date.now(),
    }),
  );
  const text = guideText(deps.settings, decision.choice, ownerNow);
  const live = deps.flags.get().mode === 'live';
  logRoute(deps, {
    ownerNow,
    agentPrev,
    choice: decision.choice,
    confidence: decision.confidence,
    threshold: thresholdOf(deps.settings, decision.choice),
    guide: text,
    fired: live,
    stateChars,
    truncated,
  });
  if (!live) {
    return undefined;
  }
  return {
    message: { customType: 'intent-guide', content: text, display: true },
  };
}

interface RouteSettleInput {
  readonly ownerNow: string;
  readonly agentPrev: string;
  readonly stateChars: number;
  readonly truncated: boolean;
  readonly outcome: AskOutcome;
}

function settleRoute(deps: RouteDeps, input: RouteSettleInput): RouteMessage | undefined {
  const { ownerNow, agentPrev, stateChars, truncated, outcome } = input;
  if (outcome.kind === 'failed') {
    deps.run.set(idleRun());
    logRoute(deps, {
      ownerNow,
      agentPrev,
      choice: null,
      confidence: null,
      threshold: null,
      guide: null,
      fired: false,
      stateChars,
      truncated,
    });
    return undefined;
  }
  const answer = outcome.answer;
  const decision = decideRoute(answer, deps.settings);
  if (decision.kind !== 'act') {
    deps.run.set(idleRun());
    const skipChoice = answer.type === 'choice' ? toChoiceOrNull(answer.choice) : null;
    logRoute(deps, {
      ownerNow,
      agentPrev,
      choice: decision.kind === 'skip' ? skipChoice : decision.choice,
      confidence: decision.kind === 'skip' ? null : decision.confidence,
      threshold: decision.kind === 'skip' ? null : thresholdOf(deps.settings, decision.choice),
      guide: null,
      fired: false,
      stateChars,
      truncated,
    });
    return undefined;
  }
  return settleAct(deps, { ownerNow, agentPrev, outcome, decision, stateChars, truncated });
}

export function registerRoute(pi: RoutePiPort, deps: RouteDeps): void {
  pi.on('before_agent_start', async (event, ctx) => {
    if (event.prompt.startsWith('/')) {
      return undefined;
    }
    const agentPrev = ctx.agentPrev ?? '';
    const { payload, truncated } = routePayload(event.prompt, agentPrev, deps.settings);
    const stateChars = JSON.stringify(payload).length;
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
    return settleRoute(deps, { ownerNow: event.prompt, agentPrev, stateChars, truncated, outcome });
  });
}
