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
    shadow: Type.Optional(Type.Boolean()),
    question: Type.Optional(ChoiceQuestionSchema),
    thresholds: Type.Optional(RouteThresholdsSchema),
    guides: Type.Optional(RouteGuidesSchema),
  },
  { additionalProperties: false },
);

const JudgeQuestionsSchema = Type.Object(
  {
    related: Type.Optional(VerdictQuestionSchema),
    answerable: Type.Optional(VerdictQuestionSchema),
  },
  { additionalProperties: false },
);

const JudgeStopSchema = Type.Object(
  {
    unrelated: Type.Optional(Type.Integer({ minimum: 1 })),
    maxNudges: Type.Optional(Type.Integer({ minimum: 0 })),
    nudge: Type.Optional(Type.String({ minLength: 1 })),
  },
  { additionalProperties: false },
);

const JudgeSchema = Type.Object(
  {
    shadow: Type.Optional(Type.Boolean()),
    minTurns: Type.Optional(Type.Integer({ minimum: 1 })),
    everyNTurns: Type.Optional(Type.Integer({ minimum: 1 })),
    maxJudgements: Type.Optional(Type.Integer({ minimum: 1 })),
    threshold: Type.Optional(Type.Number({ minimum: 0, maximum: 1 })),
    questions: Type.Optional(JudgeQuestionsSchema),
    stop: Type.Optional(JudgeStopSchema),
  },
  { additionalProperties: false },
);

const StateSchema = Type.Object(
  {
    maxActions: Type.Optional(Type.Integer({ minimum: 1 })),
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
    keepDays: Type.Optional(Type.Integer({ minimum: 1 })),
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
    route: Type.Optional(RouteSchema),
    judge: Type.Optional(JudgeSchema),
    state: Type.Optional(StateSchema),
    log: Type.Optional(LogSchema),
  },
  { additionalProperties: false },
);

export type ClassifierCandidate = Static<typeof CandidateSchema>;

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
  readonly route: {
    readonly shadow: boolean;
    readonly question: Question<Choice>;
    readonly thresholds: Readonly<Record<'reply' | 'approve', number>>;
    readonly guides: Readonly<Record<'reply' | 'approve', string>>;
  };
  readonly judge: {
    readonly shadow: boolean;
    readonly minTurns: number;
    readonly everyNTurns: number;
    readonly maxJudgements: number;
    readonly threshold: number;
    readonly questions: {
      readonly related: Question<Verdict>;
      readonly answerable: Question<Verdict>;
    };
    readonly stop: {
      readonly unrelated: number;
      readonly maxNudges: number;
      readonly nudge: string;
    };
  };
  readonly state: {
    readonly maxActions: number;
    readonly assistantChars: number;
    readonly includeTools: readonly string[];
    readonly textChars: number;
    readonly resultChars: number;
    readonly maxStateChars: number;
  };
  readonly log: { readonly keepDays: number };
};

export const SETTINGS_FILE = 'settings.json';

function fail(message: string): never {
  throw new Error(`intent-router settings: ${message}`);
}

function defaultRoute(): Settings['route'] {
  return {
    shadow: true,
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
    thresholds: { reply: 0.8, approve: 0.8 },
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
    shadow: true,
    minTurns: 2,
    everyNTurns: 1,
    maxJudgements: 12,
    threshold: 0.8,
    questions: {
      related: {
        instructions:
          'Is the information read in this round trip related to answering the owner message? Answer yes or no.',
        criteria: {
          yes: 'The findings in this round help answer the owner message',
          no: 'The findings in this round do not help answer the owner message',
        },
      },
      answerable: {
        instructions:
          'Can the owner message be answered from the related findings accumulated so far? Answer yes or no.',
        criteria: {
          yes: 'The accumulated related findings are enough to answer the owner message',
          no: 'The accumulated related findings are not enough to answer the owner message',
        },
      },
    },
    stop: {
      unrelated: 2,
      maxNudges: 1,
      nudge:
        'Enough has been investigated to answer. Stop investigating: no new tool calls. Answer the owner from what you have, and name anything you could not confirm.',
    },
  };
}

function defaultState(): Settings['state'] {
  return {
    maxActions: 12,
    assistantChars: 1000,
    includeTools: [
      'read',
      'write',
      'quick_edit',
      'target_edit',
      'bash',
      'grep',
      'web_search',
      'fetch_content',
      'source_check',
      'get_search_content',
      'codemode',
      'consult_run',
      'consult_subagents',
    ],
    textChars: 4000,
    resultChars: 300,
    maxStateChars: 24000,
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
    route: defaultRoute(),
    judge: defaultJudge(),
    state: defaultState(),
    log: { keepDays: 14 },
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
}

function mergeSettings(defaults: Settings, written: Written): Settings {
  const routeWritten = written.route;
  const judgeWritten = written.judge;
  const judgeQuestionsWritten = judgeWritten?.questions;
  assertJudgeQuestions(judgeQuestionsWritten);
  return {
    classifier: overlaid(defaults.classifier, written.classifier),
    route: {
      ...overlaid(defaults.route, routeWritten),
      question: overlaidQuestion(defaults.route.question, routeWritten?.question),
      thresholds: { ...defaults.route.thresholds, ...routeWritten?.thresholds },
      guides: { ...defaults.route.guides, ...routeWritten?.guides },
    },
    judge: {
      ...overlaid(defaults.judge, judgeWritten),
      maxJudgements: judgeWritten?.maxJudgements ?? defaults.judge.maxJudgements,
      threshold: judgeWritten?.threshold ?? defaults.judge.threshold,
      questions: {
        related: overlaidQuestion(defaults.judge.questions.related, judgeQuestionsWritten?.related),
        answerable: overlaidQuestion(
          defaults.judge.questions.answerable,
          judgeQuestionsWritten?.answerable,
        ),
      },
      stop: {
        ...overlaid(defaults.judge.stop, judgeWritten?.stop),
        unrelated: judgeWritten?.stop?.unrelated ?? defaults.judge.stop.unrelated,
        maxNudges: judgeWritten?.stop?.maxNudges ?? defaults.judge.stop.maxNudges,
        nudge: judgeWritten?.stop?.nudge ?? defaults.judge.stop.nudge,
      },
    },
    state: overlaid(defaults.state, written.state),
    log: overlaid(defaults.log, written.log),
  };
}

function assertJudgeQuestions(
  questions:
    | {
        readonly related?: {
          readonly instructions?: string;
          readonly criteria?: Partial<Record<'yes' | 'no', string>>;
        };
        readonly answerable?: {
          readonly instructions?: string;
          readonly criteria?: Partial<Record<'yes' | 'no', string>>;
        };
      }
    | undefined,
): void {
  if (questions?.related?.criteria !== undefined) {
    for (const key of ['yes', 'no'] as const) {
      if (questions.related.criteria[key] === undefined) {
        fail(
          `the config.judge.questions.related.criteria.${key} is required when criteria is written`,
        );
      }
    }
  }
  if (questions?.answerable?.criteria !== undefined) {
    for (const key of ['yes', 'no'] as const) {
      if (questions.answerable.criteria[key] === undefined) {
        fail(
          `the config.judge.questions.answerable.criteria.${key} is required when criteria is written`,
        );
      }
    }
  }
}
