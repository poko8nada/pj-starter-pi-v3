/* eslint-disable eslint/max-lines -- 旧道と新道の移行中のため。slices 3-5 で旧を落として480以下に戻す */
/**
 * intent-router の設定。既定はコード、上書きは `settings.json` の部分だけ。
 *
 * 書いていない欄は既定のまま（欠けは誤りではない）。書いてある欄が知らないキー・
 * 範囲外・別の型なら投げる（打ち間違いを黙って無視しない）。
 *
 * 形は typebox のスキーマが 1 つの言い方。スキーマと型（`Static`）が同じ所から出るので、
 * 検証と型が食い違わない。未知のキーはスキーマ（`Type.Object` は追加の欄を許さない）が弾く。
 */

import { Check, Errors } from 'typebox/value';
import { Type, type Static } from 'typebox';
import type { Label } from '../ask/questions.ts';
import { CHOICES, LABELS } from '../ask/questions.ts';

/** ラベル。`questions.ts` の一覧と同じ所から出る（増やしたらここも増える） */
const LabelSchema = Type.Union(LABELS.map((label) => Type.Literal(label)));
const ChoiceSchema = Type.Union(CHOICES.map((choice) => Type.Literal(choice)));
const VerdictSchema = Type.Union(['yes', 'no'].map((v) => Type.Literal(v)));

const CandidateSchema = Type.Object(
  {
    provider: Type.String({ minLength: 1 }),
    model: Type.String({ minLength: 1 }),
  },
  { additionalProperties: false },
);

const ClassifierSchema = Type.Object(
  {
    models: Type.Optional(Type.Array(CandidateSchema, { minItems: 1 })),
    allowPaid: Type.Optional(Type.Boolean()),
  },
  { additionalProperties: false },
);

const BudgetSchema = Type.Object(
  {
    maxJudgementsPerPrompt: Type.Optional(Type.Integer({ minimum: 1 })),
    maxStateChars: Type.Optional(Type.Integer({ minimum: 1 })),
    minIntervalMs: Type.Optional(Type.Integer({ minimum: 0 })),
    timeoutMs: Type.Optional(Type.Integer({ minimum: 1 })),
  },
  { additionalProperties: false },
);

const ThresholdsSchema = Type.Object(
  {
    routeConfidence: Type.Optional(Type.Number({ minimum: 0, maximum: 1 })),
    judgeConfidence: Type.Optional(Type.Number({ minimum: 0, maximum: 1 })),
    judgeScore: Type.Optional(Type.Number({ minimum: 0, maximum: 2 })),
  },
  { additionalProperties: false },
);

const ChoiceQuestionSchema = Type.Object(
  {
    instructions: Type.Optional(Type.String({ minLength: 1 })),
    criteria: Type.Optional(
      Type.Object(
        {
          reply: Type.Optional(Type.String({ minLength: 1 })),
          approve: Type.Optional(Type.String({ minLength: 1 })),
          other: Type.Optional(Type.String({ minLength: 1 })),
        },
        { additionalProperties: false },
      ),
    ),
  },
  { additionalProperties: false },
);

const VerdictQuestionSchema = Type.Object(
  {
    instructions: Type.Optional(Type.String({ minLength: 1 })),
    criteria: Type.Optional(
      Type.Object(
        {
          yes: Type.Optional(Type.String({ minLength: 1 })),
          no: Type.Optional(Type.String({ minLength: 1 })),
        },
        { additionalProperties: false },
      ),
    ),
  },
  { additionalProperties: false },
);

const RouteThresholdsSchema = Type.Object(
  {
    reply: Type.Optional(Type.Number({ minimum: 0, maximum: 1 })),
    approve: Type.Optional(Type.Number({ minimum: 0, maximum: 1 })),
  },
  { additionalProperties: false },
);

const RouteGuidesSchema = Type.Object(
  {
    reply: Type.Optional(Type.String({ minLength: 1 })),
    approve: Type.Optional(Type.String({ minLength: 1 })),
  },
  { additionalProperties: false },
);

const RouteSchema = Type.Object(
  {
    enabled: Type.Optional(Type.Boolean()),
    shadow: Type.Optional(Type.Boolean()),
    actOn: Type.Optional(Type.Array(LabelSchema)),
    idleOn: Type.Optional(Type.Array(LabelSchema)),
    question: Type.Optional(ChoiceQuestionSchema),
    thresholds: Type.Optional(RouteThresholdsSchema),
    guides: Type.Optional(RouteGuidesSchema),
  },
  { additionalProperties: false },
);

const JudgeQuestionsSchema = Type.Object(
  {
    useful: Type.Optional(VerdictQuestionSchema),
    new: Type.Optional(VerdictQuestionSchema),
  },
  { additionalProperties: false },
);

const JudgeStopSchema = Type.Object(
  {
    consecutive: Type.Optional(Type.Integer({ minimum: 1 })),
    maxNudges: Type.Optional(Type.Integer({ minimum: 0 })),
    nudges: Type.Optional(RouteGuidesSchema),
    enabled: Type.Optional(Type.Boolean()),
    display: Type.Optional(Type.Boolean()),
    text: Type.Optional(Type.String({ minLength: 1 })),
  },
  { additionalProperties: false },
);

const JudgeSchema = Type.Object(
  {
    enabled: Type.Optional(Type.Boolean()),
    shadow: Type.Optional(Type.Boolean()),
    minTurns: Type.Optional(Type.Integer({ minimum: 1 })),
    everyNTurns: Type.Optional(Type.Integer({ minimum: 1 })),
    maxFires: Type.Optional(Type.Integer({ minimum: 1 })),
    maxJudgements: Type.Optional(Type.Integer({ minimum: 1 })),
    threshold: Type.Optional(Type.Number({ minimum: 0, maximum: 1 })),
    questions: Type.Optional(JudgeQuestionsSchema),
    stop: Type.Optional(JudgeStopSchema),
  },
  { additionalProperties: false },
);

const GuideSchema = Type.Object(
  {
    enabled: Type.Optional(Type.Boolean()),
    display: Type.Optional(Type.Boolean()),
    text: Type.Optional(Type.String({ minLength: 1 })),
  },
  { additionalProperties: false },
);

const StopSchema = Type.Object(
  {
    enabled: Type.Optional(Type.Boolean()),
    display: Type.Optional(Type.Boolean()),
    text: Type.Optional(Type.String({ minLength: 1 })),
  },
  { additionalProperties: false },
);

const StateSchema = Type.Object(
  {
    maxActions: Type.Optional(Type.Integer({ minimum: 1 })),
    actionChars: Type.Optional(Type.Integer({ minimum: 1 })),
    assistantChars: Type.Optional(Type.Integer({ minimum: 1 })),
    includeTools: Type.Optional(Type.Array(Type.String({ minLength: 1 }))),
    textChars: Type.Optional(Type.Integer({ minimum: 1 })),
    resultChars: Type.Optional(Type.Integer({ minimum: 1 })),
    maxStateChars: Type.Optional(Type.Integer({ minimum: 1 })),
  },
  { additionalProperties: false },
);

const LogSchema = Type.Object(
  {
    dir: Type.Optional(Type.String({ minLength: 1 })),
    keepDays: Type.Optional(Type.Integer({ minimum: 1 })),
  },
  { additionalProperties: false },
);

const RecordSchema = Type.Object(
  {
    recent: Type.Optional(Type.Integer({ minimum: 1 })),
  },
  { additionalProperties: false },
);

/**
 * 設定ファイルの形。欄は全部 Optional（書かれていない欄は既定のまま）。
 *
 * `additionalProperties: false` は打ち間替えのキーを弾く（書いていない欄は既定のままで、知らないキーは誤り）。
 */
const SettingsSchema = Type.Object(
  {
    classifier: Type.Optional(ClassifierSchema),
    budget: Type.Optional(BudgetSchema),
    thresholds: Type.Optional(ThresholdsSchema),
    route: Type.Optional(RouteSchema),
    judge: Type.Optional(JudgeSchema),
    guide: Type.Optional(GuideSchema),
    stop: Type.Optional(StopSchema),
    state: Type.Optional(StateSchema),
    log: Type.Optional(LogSchema),
    record: Type.Optional(RecordSchema),
  },
  { additionalProperties: false },
);

export type ClassifierCandidate = Static<typeof CandidateSchema>;
/** 設定ファイルに書かれた形（3 つとも Optional）。スキーマから出る */
export type WrittenThresholds = Static<typeof ThresholdsSchema>;
/** 既定に重ねた後の形（3 つとも埋まっている） */
export type Thresholds = {
  readonly routeConfidence: number;
  readonly judgeConfidence: number;
  readonly judgeScore: number;
};

export type Choice = 'reply' | 'approve' | 'other';
export type Verdict = 'yes' | 'no';

export interface Question<K extends string> {
  readonly instructions: string;
  readonly criteria: Readonly<Record<K, string>>;
}

export type Settings = {
  readonly classifier: {
    readonly models: readonly ClassifierCandidate[];
    readonly allowPaid: boolean;
  };
  readonly budget: {
    readonly maxJudgementsPerPrompt: number;
    readonly maxStateChars: number;
    readonly minIntervalMs: number;
    readonly timeoutMs: number;
  };
  readonly thresholds: Thresholds;
  readonly route: {
    readonly enabled: boolean;
    readonly shadow: boolean;
    readonly actOn: readonly Label[];
    readonly idleOn: readonly Label[];
    readonly question: Question<Choice>;
    readonly thresholds: Readonly<Record<'reply' | 'approve', number>>;
    readonly guides: Readonly<Record<'reply' | 'approve', string>>;
  };
  readonly judge: {
    readonly enabled: boolean;
    readonly shadow: boolean;
    readonly minTurns: number;
    readonly everyNTurns: number;
    readonly maxFires: number;
    readonly maxJudgements: number;
    readonly threshold: number;
    readonly questions: {
      readonly useful: Question<Verdict>;
      readonly new: Question<Verdict>;
    };
    readonly stop: {
      readonly consecutive: number;
      readonly maxNudges: number;
      readonly nudges: Readonly<Record<'reply' | 'approve', string>>;
      readonly enabled: boolean;
      readonly display: boolean;
      readonly text: string;
    };
  };
  readonly guide: { readonly enabled: boolean; readonly display: boolean; readonly text: string };
  readonly stop: { readonly enabled: boolean; readonly display: boolean; readonly text: string };
  readonly state: {
    readonly maxActions: number;
    readonly actionChars: number;
    readonly assistantChars: number;
    readonly includeTools: readonly string[];
    readonly textChars: number;
    readonly resultChars: number;
    readonly maxStateChars: number;
  };
  readonly log: { readonly dir: string; readonly keepDays: number };
  readonly record: { readonly recent: number };
};

export const SETTINGS_FILE = 'settings.json';

function fail(message: string): never {
  throw new Error(`intent-router settings: ${message}`);
}

function defaultRoute(): Settings['route'] {
  return {
    enabled: true,
    shadow: true,
    actOn: ['question', 'design', 'verify'],
    idleOn: ['permission', 'chat', 'unknown'],
    question: {
      instructions: 'Classify the owner message into exactly one intent: reply, approve, or other.',
      criteria: {
        reply:
          'The owner asks for an explanation, an answer, or information. The owner wants a reply, not an edit',
        approve:
          'The owner approves a proposal, a plan, or the previous agent action. The owner allows the agent to proceed',
        other: 'Anything else that is neither a request for a reply nor an approval',
      },
    },
    thresholds: { reply: 0.8, approve: 0.9 },
    guides: {
      reply:
        'Re: {prompt} — the owner wants an answer, not an edit. Do not edit, write, delete, or commit anything. Investigate only what the answer needs, then answer.',
      approve:
        'Approved: {prompt} — the owner approved the proposal or previous action. Proceed with the approved change and report the result.',
    },
  };
}

function defaultJudge(): Settings['judge'] {
  return {
    enabled: true,
    shadow: true,
    minTurns: 2,
    everyNTurns: 1,
    maxFires: 1,
    maxJudgements: 12,
    threshold: 0.9,
    questions: {
      useful: {
        instructions:
          'Is the latest investigation useful for answering the owner message? Answer yes or no.',
        criteria: {
          yes: 'The latest findings help answer the owner message',
          no: 'The latest findings do not help answer the owner message',
        },
      },
      new: {
        instructions:
          'Did the latest investigation obtain new facts compared to the earlier investigation? Answer yes or no.',
        criteria: {
          yes: 'The latest findings contain new facts not seen in the earlier investigation',
          no: 'The latest findings contain no new facts beyond the earlier investigation',
        },
      },
    },
    stop: {
      consecutive: 2,
      maxNudges: 1,
      nudges: {
        reply:
          'Enough has been investigated to answer. Stop investigating: no new tool calls. Answer the owner from what you have, and name anything you could not confirm.',
        approve:
          'Enough has been investigated for the approved change. Stop investigating: no new tool calls. Proceed with the approved change from what you have.',
      },
      enabled: true,
      display: true,
      text: 'Enough has been investigated to answer. Stop investigating: no new tool calls. Answer the owner from what you have, and name anything you could not confirm.',
    },
  };
}

function defaultState(): Settings['state'] {
  return {
    maxActions: 12,
    actionChars: 300,
    assistantChars: 500,
    includeTools: [
      'read',
      'bash',
      'grep',
      'find',
      'ls',
      'write',
      'edit',
      'web_search',
      'consult_run',
    ],
    textChars: 2000,
    resultChars: 300,
    maxStateChars: 12000,
  };
}

export function defaultSettings(): Settings {
  return {
    classifier: {
      models: [
        { provider: 'opencode', model: 'jev-1.13-free' },
        { provider: 'openrouter', model: '~typesafe/jev-latest' },
      ],
      allowPaid: true,
    },
    budget: {
      maxJudgementsPerPrompt: 12,
      maxStateChars: 12000,
      minIntervalMs: 400,
      timeoutMs: 1500,
    },
    thresholds: {
      routeConfidence: 0.5,
      judgeConfidence: 0.5,
      judgeScore: 1.5,
    },
    route: defaultRoute(),
    judge: defaultJudge(),
    guide: {
      enabled: true,
      display: true,
      text: 'Re: {prompt} — kind: {label}. The owner wants an answer, not an edit. Do not edit, write, delete, or commit anything. Investigate only what the answer needs, then answer.',
    },
    stop: {
      enabled: true,
      display: true,
      text: 'Enough has been investigated to answer. Stop investigating: no new tool calls. Answer the owner from what you have, and name anything you could not confirm.',
    },
    state: defaultState(),
    log: {
      dir: '.pi/extensions/intent-router/logs',
      keepDays: 14,
    },
    record: { recent: 50 },
  };
}

/** 書かれた欄だけ既定に重ねる。JSON に `undefined` は無いので、書かれていない欄は base のまま */
function overlaid<T>(base: T, written: unknown): T {
  if (written === undefined || typeof written !== 'object' || written === null) {
    return base;
  }
  return { ...base, ...(written as Partial<T>) };
}

function overlaidQuestion<K extends string>(
  base: Question<K>,
  written:
    | { readonly instructions?: string; readonly criteria?: Partial<Record<K, string>> }
    | undefined,
): Question<K> {
  if (written === undefined) {
    return base;
  }
  return {
    instructions: written.instructions ?? base.instructions,
    criteria: { ...base.criteria, ...written.criteria },
  };
}

/** 設定の本文に書かれている欄だけを既定に重ねる。知らないキー・範囲外・別の型は投げる */
export function parseSettings(text: string, defaults: Settings): Settings {
  let document: unknown;
  try {
    document = JSON.parse(text);
  } catch (error) {
    const detail = error instanceof Error ? error.message : String(error);
    fail(`the config is not valid JSON (${detail})`);
  }
  if (!Check(SettingsSchema, document)) {
    const first = Errors(SettingsSchema, document)[0];
    const at =
      first === undefined
        ? 'the config'
        : `the config.${first.instancePath.replaceAll('/', '.').replace(/^\./, '')}`;
    fail(
      `${at} ${first?.message ?? 'does not match the schema'} (got ${JSON.stringify(document)})`,
    );
  }
  const written = document;
  assertNewShape(written);
  return mergeSettings(defaults, written);
}

type Written = Static<typeof SettingsSchema>;

function assertNewShape(written: Written): void {
  const routeWritten = written.route;
  const judgeWritten = written.judge;
  if (routeWritten?.question?.criteria !== undefined) {
    const criteria = routeWritten.question.criteria;
    for (const key of ['reply', 'approve', 'other'] as const) {
      if (criteria[key] === undefined) {
        fail(`the config.route.question.criteria.${key} is required when criteria is written`);
      }
    }
  }
  if (routeWritten?.thresholds !== undefined) {
    for (const key of ['reply', 'approve'] as const) {
      const value = routeWritten.thresholds[key];
      if (value !== undefined && (typeof value !== 'number' || value < 0 || value > 1)) {
        fail(`the config.route.thresholds.${key} must be between 0 and 1`);
      }
    }
  }
  if (routeWritten?.guides !== undefined) {
    for (const key of ['reply', 'approve'] as const) {
      if (routeWritten.guides[key] === undefined) {
        fail(`the config.route.guides.${key} is required when guides is written`);
      }
    }
  }
  const judgeQuestionsWritten = judgeWritten?.questions;
  if (judgeQuestionsWritten?.useful?.criteria !== undefined) {
    for (const key of ['yes', 'no'] as const) {
      if (judgeQuestionsWritten.useful.criteria[key] === undefined) {
        fail(
          `the config.judge.questions.useful.criteria.${key} is required when criteria is written`,
        );
      }
    }
  }
  if (judgeQuestionsWritten?.new?.criteria !== undefined) {
    for (const key of ['yes', 'no'] as const) {
      if (judgeQuestionsWritten.new.criteria[key] === undefined) {
        fail(`the config.judge.questions.new.criteria.${key} is required when criteria is written`);
      }
    }
  }
}

function mergeSettings(defaults: Settings, written: Written): Settings {
  const routeWritten = written.route;
  const judgeWritten = written.judge;
  const stateWritten = written.state;
  const judgeQuestionsWritten = judgeWritten?.questions;
  const baseRoute = defaults.route;
  const baseJudge = defaults.judge;
  return {
    classifier: overlaid(defaults.classifier, written.classifier),
    budget: overlaid(defaults.budget, written.budget),
    thresholds: overlaid(defaults.thresholds, written.thresholds),
    route: {
      ...overlaid(baseRoute, routeWritten),
      question: overlaidQuestion(baseRoute.question, routeWritten?.question),
      thresholds: { ...baseRoute.thresholds, ...routeWritten?.thresholds },
      guides: { ...baseRoute.guides, ...routeWritten?.guides },
    },
    judge: {
      ...overlaid(baseJudge, judgeWritten),
      maxJudgements: judgeWritten?.maxJudgements ?? baseJudge.maxJudgements,
      threshold: judgeWritten?.threshold ?? baseJudge.threshold,
      questions: {
        useful: overlaidQuestion(baseJudge.questions.useful, judgeQuestionsWritten?.useful),
        new: overlaidQuestion(baseJudge.questions.new, judgeQuestionsWritten?.new),
      },
      stop: {
        ...overlaid(baseJudge.stop, judgeWritten?.stop),
        consecutive: judgeWritten?.stop?.consecutive ?? baseJudge.stop.consecutive,
        maxNudges: judgeWritten?.stop?.maxNudges ?? baseJudge.stop.maxNudges,
        nudges: { ...baseJudge.stop.nudges, ...judgeWritten?.stop?.nudges },
      },
    },
    guide: overlaid(defaults.guide, written.guide),
    stop: overlaid(defaults.stop, written.stop),
    state: overlaid(defaults.state, stateWritten),
    log: overlaid(defaults.log, written.log),
    record: overlaid(defaults.record, written.record),
  };
}

// 旧道との対応を保つための参照。消さない。
void ChoiceSchema;
void VerdictSchema;
