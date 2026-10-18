/**
 * `before_agent_start` で owner の発言を分け、質問なら「編集せず調べろ」を1回だけ差し込む。
 *
 * 差し込みは戻り値の `message` で届ける（`sendMessage` は使わない）。何もしない時は
 * `undefined` を返す。聞く前にやめた場合（off・`/` 始まり）は ask せず行も作らない。
 */

import { basename } from 'node:path';
import type { Ask, AskOutcome } from '../ask/ask.ts';
import type { LogRecord, OutcomeView } from '../record/recent.ts';
import type { Label } from '../ask/questions.ts';
import type { Settings } from '../settings/schema.ts';
import { arm, idleRun, type FlagsPort, type RunPort } from '../state/run.ts';
import { routeState } from '../state/payload.ts';
import { decideRoute, guideMessage, type RouteDecision } from './decide.ts';

export interface RouteCtx {
  readonly cwd: string;
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
  readonly label: Label | null;
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

function toLabelOrNull(choice: string): Label | null {
  if (
    choice === 'question' ||
    choice === 'design' ||
    choice === 'verify' ||
    choice === 'permission' ||
    choice === 'chat' ||
    choice === 'unknown'
  ) {
    return choice;
  }
  return null;
}

function logRoute(deps: RouteDeps, input: RouteLogInput): void {
  deps.log({
    at: new Date().toISOString(),
    hook: 'route',
    owner_prompt: input.prompt,
    label: input.label,
    confidence: input.confidence,
    probabilities: input.probabilities,
    thresholds: deps.settings.thresholds,
    decision: input.decision,
    shadow: deps.settings.route.shadow,
    guide: input.guide,
    text: input.text,
    truncated: input.prompt.length > 2000,
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
      label: decision.label,
      confidence: decision.confidence,
      candidate: { provider: outcome.provider, model: outcome.model },
      now: Date.now(),
    }),
  );
  if (!deps.settings.guide.enabled) {
    logRoute(deps, {
      prompt,
      label: decision.label,
      confidence: decision.confidence,
      probabilities,
      decision: 'act',
      guide: 'none',
      text: null,
      outcome,
    });
    return undefined;
  }
  const text = guideMessage(deps.settings.guide.text, decision.label, prompt);
  if (deps.settings.route.shadow) {
    logRoute(deps, {
      prompt,
      label: decision.label,
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
    label: decision.label,
    confidence: decision.confidence,
    probabilities,
    decision: 'act',
    guide: 'fired',
    text,
    outcome,
  });
  return {
    message: { customType: 'intent-guide', content: text, display: deps.settings.guide.display },
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
      label: null,
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
  const decision = decideRoute(
    answer,
    deps.settings.thresholds,
    deps.settings.route.actOn,
    deps.settings.route.idleOn,
  );
  const probabilities = answer.type === 'choice' ? answer.probabilities : {};
  if (decision.kind !== 'act') {
    deps.run.set(idleRun());
    const skipLabel = answer.type === 'choice' ? toLabelOrNull(answer.choice) : null;
    logRoute(deps, {
      prompt,
      label: decision.kind === 'skip' ? skipLabel : decision.label,
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
    if (!deps.settings.route.enabled) {
      return undefined;
    }
    if (event.prompt.startsWith('/')) {
      return undefined;
    }
    const hasImages = (event.images?.length ?? 0) > 0;
    const state = routeState(event.prompt, basename(ctx.cwd), hasImages);
    const outcome = await deps.ask({ kind: 'choice', state });
    return settleRoute(deps, event.prompt, outcome);
  });
}
