/**
 * `before_agent_start` で owner の発言を分け、質問なら「編集せず調べろ」を1回だけ差し込む。
 *
 * 差し込みは戻り値の `message` で届ける（`sendMessage` は使わない）。何もしない時は
 * `undefined` を返す。聞く前にやめた場合（off・`/` 始まり）は ask せず行も作らない。
 */

import { basename } from 'node:path';
import type { Answer, Ask, AskOutcome } from '../classifier.ts';
import type { LogRecord, OutcomeView } from '../log.ts';
import type { Label } from '../questions.ts';
import type { Settings, Thresholds } from '../settings.ts';
import { arm, idleRun, routeState, type FlagsPort, type RunPort } from '../state.ts';

export type RouteDecision =
  | { readonly kind: 'act'; readonly label: Label; readonly confidence: number }
  | { readonly kind: 'idle'; readonly label: Label; readonly confidence: number }
  | { readonly kind: 'skip'; readonly reason: string };

function toLabel(choice: string): Label | undefined {
  if (choice === 'question') {
    return 'question';
  }
  if (choice === 'design') {
    return 'design';
  }
  if (choice === 'verify') {
    return 'verify';
  }
  if (choice === 'permission') {
    return 'permission';
  }
  if (choice === 'chat') {
    return 'chat';
  }
  if (choice === 'unknown') {
    return 'unknown';
  }
  return undefined;
}

/** 閾値は `>=`。actOn に無いラベルは idle */
export function decideRoute(
  answer: Answer,
  thresholds: Thresholds,
  actOn: readonly Label[],
  idleOn: readonly Label[],
): RouteDecision {
  if (answer.type !== 'choice') {
    return { kind: 'skip', reason: 'expected a choice answer' };
  }
  const label = toLabel(answer.choice);
  if (label === undefined) {
    return { kind: 'skip', reason: `unknown label: ${answer.choice}` };
  }
  if (actOn.includes(label)) {
    if (answer.confidence >= thresholds.routeConfidence) {
      return { kind: 'act', label, confidence: answer.confidence };
    }
    return { kind: 'idle', label, confidence: answer.confidence };
  }
  if (idleOn.includes(label)) {
    return { kind: 'idle', label, confidence: answer.confidence };
  }
  return { kind: 'skip', reason: `unknown label: ${answer.choice}` };
}

/** `{prompt}` と `{label}` を埋める。抜粋は改行を潰して 40 字まで */
export function guideMessage(template: string, label: Label, prompt: string): string {
  const excerpt = prompt.replace(/\s*\r?\n\s*/g, ' ').slice(0, 40);
  return template.split('{label}').join(label).split('{prompt}').join(excerpt);
}

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
    logRoute(deps, {
      prompt,
      label: decision.kind === 'skip' ? null : decision.label,
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
