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
import { LABELS } from '../ask/questions.ts';

/** ラベル。`questions.ts` の一覧と同じ所から出る（増やしたらここも増える） */
const LabelSchema = Type.Union(LABELS.map((label) => Type.Literal(label)));

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

const RouteSchema = Type.Object(
  {
    enabled: Type.Optional(Type.Boolean()),
    shadow: Type.Optional(Type.Boolean()),
    actOn: Type.Optional(Type.Array(LabelSchema)),
    idleOn: Type.Optional(Type.Array(LabelSchema)),
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
  };
  readonly judge: {
    readonly enabled: boolean;
    readonly shadow: boolean;
    readonly minTurns: number;
    readonly everyNTurns: number;
    readonly maxFires: number;
  };
  readonly guide: { readonly enabled: boolean; readonly display: boolean; readonly text: string };
  readonly stop: { readonly enabled: boolean; readonly display: boolean; readonly text: string };
  readonly state: {
    readonly maxActions: number;
    readonly actionChars: number;
    readonly assistantChars: number;
    readonly includeTools: readonly string[];
  };
  readonly log: { readonly dir: string; readonly keepDays: number };
};

export const SETTINGS_FILE = 'settings.json';

function fail(message: string): never {
  throw new Error(`intent-router settings: ${message}`);
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
    route: {
      enabled: true,
      shadow: true,
      actOn: ['question', 'design', 'verify'],
      idleOn: ['permission', 'chat', 'unknown'],
    },
    judge: {
      enabled: true,
      shadow: true,
      minTurns: 2,
      everyNTurns: 1,
      maxFires: 1,
    },
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
    state: {
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
    },
    log: {
      dir: '.pi/extensions/intent-router/logs',
      keepDays: 14,
    },
  };
}

/** 書かれた欄だけ既定に重ねる。JSON に `undefined` は無いので、書かれていない欄は base のまま */
function overlaid<T>(base: T, written: Partial<T> | undefined): T {
  if (written === undefined) {
    return base;
  }
  return { ...base, ...written };
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
  return {
    classifier: overlaid(defaults.classifier, written.classifier),
    budget: overlaid(defaults.budget, written.budget),
    thresholds: overlaid(defaults.thresholds, written.thresholds),
    route: overlaid(defaults.route, written.route),
    judge: overlaid(defaults.judge, written.judge),
    guide: overlaid(defaults.guide, written.guide),
    stop: overlaid(defaults.stop, written.stop),
    state: overlaid(defaults.state, written.state),
    log: overlaid(defaults.log, written.log),
  };
}
