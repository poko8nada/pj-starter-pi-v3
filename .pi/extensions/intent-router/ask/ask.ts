/**
 * classifier の候補を順に試す口。
 *
 * 接続は pi の classifier に任せ、こちらは候補の順・費用の可視化・送る物の線だけ持つ。
 * `ask` の頭で `getAvailableOfType('classifier')` を引き、`candidatesFor` に渡す。
 * `only` は `findOfType` で引いた1つだけを試す（judge の使い回し）。
 */

import type { ExtensionContext } from '@earendil-works/pi-coding-agent';
import type { ClassifierCandidate, Settings } from '../settings/schema.ts';
import type { JsonObject, Usage } from '../state/run.ts';

export type Registry = ExtensionContext['modelRegistry'];
export type RegistryModel = Parameters<Registry['classify']>[0];
type RegistryResult = Awaited<ReturnType<Registry['classify']>>;
export type RegistryAnswer = RegistryResult['answers'][string];

/** ask の時間切れ。設定に置かず固定する */
const CLASSIFY_TIMEOUT_MS = 1500;

/** 自前の答え。SDK の答え（RegistryAnswer）から作る */
export type Answer =
  | {
      readonly type: 'choice';
      readonly choice: string;
      readonly probabilities: Readonly<Record<string, number>>;
      readonly confidence: number;
    }
  | { readonly type: 'score'; readonly score: number; readonly confidence: number };

/** choice の答えだけを返す。合わなければ undefined */
export function fromRegistryAnswer(raw: RegistryAnswer): Answer | undefined {
  if (raw.type !== 'choice') {
    return undefined;
  }
  if (typeof raw.choice !== 'string' || raw.choice === '') {
    return undefined;
  }
  if (typeof raw.confidence !== 'number' || !Number.isFinite(raw.confidence)) {
    return undefined;
  }
  return {
    type: 'choice',
    choice: raw.choice,
    probabilities: raw.probabilities,
    confidence: raw.confidence,
  };
}

export type AskOutcome =
  | {
      readonly kind: 'answered';
      readonly provider: string;
      readonly model: string;
      readonly answer: Answer;
      readonly usage: Usage;
      readonly latencyMs: number;
    }
  | {
      readonly kind: 'failed';
      readonly tried: readonly string[];
      readonly reason: string;
      readonly latencyMs: number;
    };

export interface ClassifierQuestion {
  readonly type: 'choice';
  readonly instructions: string;
  readonly criteria: Readonly<Record<string, string>>;
}

export interface AskRequest {
  readonly kind: 'choice';
  readonly state: JsonObject;
  /** 同じプロンプトの中では、route が選んだ候補を使い回す */
  readonly only?: ClassifierCandidate;
  readonly signal?: AbortSignal;
  /** 送る1問。呼び出し側が設定から組む */
  readonly questions: Readonly<Record<string, ClassifierQuestion>>;
}

export interface Ask {
  (request: AskRequest): Promise<AskOutcome>;
}

export interface BatchAskRequest {
  readonly state: JsonObject;
  readonly questions: Readonly<Record<string, ClassifierQuestion>>;
  readonly only?: ClassifierCandidate;
  readonly signal?: AbortSignal;
}

export type BatchAskOutcome =
  | {
      readonly kind: 'answered';
      readonly provider: string;
      readonly model: string;
      readonly answers: Readonly<Record<string, Answer>>;
      readonly usage: Usage;
      readonly latencyMs: number;
    }
  | {
      readonly kind: 'failed';
      readonly tried: readonly string[];
      readonly reason: string;
      readonly latencyMs: number;
    };

export interface BatchAsk {
  (request: BatchAskRequest): Promise<BatchAskOutcome>;
}

export interface ClassifierDeps {
  readonly registry: Registry;
  readonly settings: Settings;
  readonly notify: (message: string) => void;
  readonly now?: () => number;
  /** 時間切れの口。既定は `setTimeout`（試す側が偽の時計を挿せる） */
  readonly timer?: (ms: number, fire: () => void) => void;
}

/** 使う候補。カタログにある物だけ、`allowPaid: false` なら有料を外す。順は設定のまま */
export function candidatesFor(
  available: readonly RegistryModel[],
  settings: Settings,
): readonly RegistryModel[] {
  const found: RegistryModel[] = [];
  for (const candidate of settings.classifier.models) {
    const match = available.find(
      (model) => model.provider === candidate.provider && model.id === candidate.model,
    );
    if (match === undefined) {
      continue;
    }
    if (!settings.classifier.allowPaid && match.cost.input > 0) {
      continue;
    }
    found.push(match);
  }
  return found;
}

function nameOf(candidate: ClassifierCandidate): string {
  return `${candidate.provider}/${candidate.model}`;
}

function nameOfModel(model: RegistryModel): string {
  return `${model.provider}/${model.id}`;
}

function usageOf(result: RegistryResult): Usage {
  const usage = result.usage;
  if (usage === undefined) {
    return { input: 0, output: 0, cost: 0 };
  }
  return { input: usage.input, output: usage.output, cost: usage.cost.total };
}

function defaultTimer(ms: number, fire: () => void): void {
  const handle = setTimeout(fire, ms);
  void handle;
}

interface AbortArm {
  readonly signal: AbortSignal;
  readonly timedOut: () => boolean;
  readonly cleanup: () => void;
}

function armAbort(
  request: { readonly signal?: AbortSignal },
  timeoutMs: number,
  timer: (ms: number, fire: () => void) => void,
): AbortArm {
  const inner = new AbortController();
  let done = false;
  const onExternalAbort = (): void => {
    inner.abort();
  };
  if (request.signal?.aborted === true) {
    inner.abort();
  } else {
    request.signal?.addEventListener('abort', onExternalAbort, { once: true });
  }
  timer(timeoutMs, () => {
    done = true;
    inner.abort();
  });
  return {
    signal: inner.signal,
    timedOut: () => done,
    cleanup: () => {
      request.signal?.removeEventListener('abort', onExternalAbort);
    },
  };
}

interface Resolved {
  readonly models: readonly RegistryModel[];
  readonly reason: string | undefined;
}

async function resolveModels(
  registry: Registry,
  settings: Settings,
  only: ClassifierCandidate | undefined,
): Promise<Resolved> {
  if (only !== undefined) {
    const found = registry.findOfType('classifier', only.provider, only.model);
    if (found === undefined) {
      return { models: [], reason: `unknown classifier: ${nameOf(only)}` };
    }
    return { models: [found], reason: undefined };
  }
  const available = await registry.getAvailableOfType('classifier');
  const models = candidatesFor(available, settings);
  if (models.length === 0) {
    return { models, reason: 'no classifier available' };
  }
  return { models, reason: undefined };
}

type Attempt =
  | { readonly kind: 'answered'; readonly answer: Answer; readonly usage: Usage }
  | { readonly kind: 'miss'; readonly reason: string }
  | { readonly kind: 'error'; readonly reason: string }
  | { readonly kind: 'aborted' };

async function attemptModel(
  registry: Registry,
  request: AskRequest,
  model: RegistryModel,
  signal: AbortSignal,
): Promise<Attempt> {
  const keys = Object.keys(request.questions);
  const key = keys.length === 1 && keys[0] !== undefined ? keys[0] : undefined;
  if (key === undefined) {
    return { kind: 'miss', reason: 'one question expected' };
  }
  // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion -- 自前の JsonObject を SDK の state に渡す（値は state/payload.ts が JSON 値だけで組む）
  const state = request.state as unknown as Parameters<Registry['classify']>[1]['state'];
  const result = await registry.classify(
    model,
    { state, questions: request.questions },
    { signal },
  );
  if (result.stopReason === 'aborted') {
    return { kind: 'aborted' };
  }
  if (result.stopReason === 'error') {
    return {
      kind: 'error',
      reason: result.errorMessage ?? `classifier error from ${nameOfModel(model)}`,
    };
  }
  const raw = result.answers[key] as RegistryAnswer | undefined;
  const answer = raw === undefined ? undefined : fromRegistryAnswer(raw);
  if (answer === undefined) {
    return { kind: 'miss', reason: `unexpected answer shape from ${nameOfModel(model)}` };
  }
  return { kind: 'answered', answer, usage: usageOf(result) };
}

export function createAsk(deps: ClassifierDeps): Ask {
  const clock = deps.now ?? Date.now;
  const timer = deps.timer ?? defaultTimer;
  let paidNotified = false;

  return async (request: AskRequest): Promise<AskOutcome> => {
    const startedAt = clock();
    const timeoutMs = CLASSIFY_TIMEOUT_MS;
    const arm = armAbort(request, timeoutMs, timer);
    try {
      const resolved = await resolveModels(deps.registry, deps.settings, request.only);
      if (resolved.reason !== undefined) {
        return {
          kind: 'failed',
          tried: [],
          reason: resolved.reason,
          latencyMs: clock() - startedAt,
        };
      }
      const tried: string[] = [];
      let firstReason: string | undefined;
      for (const model of resolved.models) {
        tried.push(nameOfModel(model));
        // eslint-disable-next-line no-await-in-loop -- 候補は順に試し、答えた所で止める
        const attempt = await attemptModel(deps.registry, request, model, arm.signal);
        if (attempt.kind === 'answered') {
          if (model.cost.input > 0 && !paidNotified) {
            paidNotified = true;
            deps.notify(`intent-router: using paid classifier ${nameOfModel(model)}`);
          }
          return {
            kind: 'answered',
            provider: model.provider,
            model: model.id,
            answer: attempt.answer,
            usage: attempt.usage,
            latencyMs: clock() - startedAt,
          };
        }
        if (attempt.kind === 'aborted') {
          break;
        }
        if (firstReason === undefined) {
          firstReason = attempt.reason;
        }
        if (arm.signal.aborted) {
          break;
        }
      }
      if (arm.signal.aborted || arm.timedOut()) {
        if (arm.timedOut()) {
          return {
            kind: 'failed',
            tried,
            reason: `classify timeout after ${timeoutMs}ms`,
            latencyMs: clock() - startedAt,
          };
        }
        return {
          kind: 'failed',
          tried,
          reason: 'classify aborted',
          latencyMs: clock() - startedAt,
        };
      }
      return {
        kind: 'failed',
        tried,
        reason: firstReason ?? 'no classifier available',
        latencyMs: clock() - startedAt,
      };
    } finally {
      arm.cleanup();
    }
  };
}

type BatchAttempt =
  | {
      readonly kind: 'answered';
      readonly answers: Readonly<Record<string, Answer>>;
      readonly usage: Usage;
    }
  | { readonly kind: 'miss'; readonly reason: string }
  | { readonly kind: 'error'; readonly reason: string }
  | { readonly kind: 'aborted' };

async function attemptBatchModel(
  registry: Registry,
  request: BatchAskRequest,
  model: RegistryModel,
  signal: AbortSignal,
): Promise<BatchAttempt> {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion -- 自前の JsonObject を SDK の state に渡す
  const state = request.state as unknown as Parameters<Registry['classify']>[1]['state'];
  const result = await registry.classify(
    model,
    { state, questions: { ...request.questions } },
    { signal },
  );
  if (result.stopReason === 'aborted') {
    return { kind: 'aborted' };
  }
  if (result.stopReason === 'error') {
    return {
      kind: 'error',
      reason: result.errorMessage ?? 'classifier error from ' + nameOfModel(model),
    };
  }
  const answers: Record<string, Answer> = {};
  for (const key of Object.keys(request.questions)) {
    const raw = result.answers[key] as RegistryAnswer | undefined;
    const answer = raw === undefined ? undefined : fromRegistryAnswer(raw);
    if (answer === undefined) {
      return { kind: 'miss', reason: 'unexpected answer shape from ' + nameOfModel(model) };
    }
    answers[key] = answer;
  }
  return { kind: 'answered', answers, usage: usageOf(result) };
}

export function createBatchAsk(deps: ClassifierDeps): BatchAsk {
  const clock = deps.now ?? Date.now;
  const timer = deps.timer ?? defaultTimer;
  let paidNotified = false;

  return async (request: BatchAskRequest): Promise<BatchAskOutcome> => {
    const startedAt = clock();
    const timeoutMs = CLASSIFY_TIMEOUT_MS;
    const arm = armAbort({ signal: request.signal }, timeoutMs, timer);
    try {
      const resolved = await resolveModels(deps.registry, deps.settings, request.only);
      if (resolved.reason !== undefined) {
        return {
          kind: 'failed',
          tried: [],
          reason: resolved.reason,
          latencyMs: clock() - startedAt,
        };
      }
      const tried: string[] = [];
      let firstReason: string | undefined;
      for (const model of resolved.models) {
        tried.push(nameOfModel(model));
        // eslint-disable-next-line no-await-in-loop -- 候補は順に試し、答えた所で止める
        const attempt = await attemptBatchModel(deps.registry, request, model, arm.signal);
        if (attempt.kind === 'answered') {
          if (model.cost.input > 0 && !paidNotified) {
            paidNotified = true;
            deps.notify('intent-router: using paid classifier ' + nameOfModel(model));
          }
          return {
            kind: 'answered',
            provider: model.provider,
            model: model.id,
            answers: attempt.answers,
            usage: attempt.usage,
            latencyMs: clock() - startedAt,
          };
        }
        if (attempt.kind === 'aborted') {
          break;
        }
        if (firstReason === undefined) {
          firstReason = attempt.reason;
        }
        if (arm.signal.aborted) {
          break;
        }
      }
      if (arm.signal.aborted || arm.timedOut()) {
        if (arm.timedOut()) {
          return {
            kind: 'failed',
            tried,
            reason: 'classify timeout after ' + timeoutMs + 'ms',
            latencyMs: clock() - startedAt,
          };
        }
        return {
          kind: 'failed',
          tried,
          reason: 'classify aborted',
          latencyMs: clock() - startedAt,
        };
      }
      return {
        kind: 'failed',
        tried,
        reason: firstReason ?? 'no classifier available',
        latencyMs: clock() - startedAt,
      };
    } finally {
      arm.cleanup();
    }
  };
}
