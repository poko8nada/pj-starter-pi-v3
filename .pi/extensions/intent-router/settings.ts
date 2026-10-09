/**
 * intent-router の設定。既定はコード、上書きは `settings.json` の部分だけ。
 *
 * 書いていない欄は既定のまま（欠けは誤りではない）。書いてある欄が知らないキー・
 * 範囲外・別の型なら投げる（打ち間違いを黙って無視しない）。
 */

import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import type { Label } from './questions.ts';
import { LABELS } from './questions.ts';

export interface ClassifierCandidate {
  readonly provider: string;
  readonly model: string;
}

export interface Thresholds {
  readonly routeConfidence: number;
  readonly judgeConfidence: number;
  readonly judgeScore: number;
}

export interface Settings {
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
  readonly guide: {
    readonly enabled: boolean;
    readonly display: boolean;
    readonly text: string;
  };
  readonly stop: {
    readonly enabled: boolean;
    readonly display: boolean;
    readonly text: string;
  };
  readonly state: {
    readonly maxActions: number;
    readonly actionChars: number;
    readonly assistantChars: number;
    readonly includeTools: readonly string[];
  };
  readonly log: { readonly dir: string; readonly keepDays: number };
}

export const SETTINGS_FILE = 'settings.json';

function fail(message: string): never {
  throw new Error(`intent-router settings: ${message}`);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function asRecord(value: unknown, where: string): Record<string, unknown> {
  if (!isRecord(value)) {
    fail(`${where} must be an object`);
  }
  return value;
}

function asBoolean(value: unknown, where: string): boolean {
  if (typeof value !== 'boolean') {
    fail(`${where} must be true or false`);
  }
  return value;
}

function asNonEmptyString(value: unknown, where: string): string {
  if (typeof value !== 'string' || value.trim() === '') {
    fail(`${where} must be a non-empty string`);
  }
  return value;
}

function asString(value: unknown, where: string): string {
  if (typeof value !== 'string') {
    fail(`${where} must be a string`);
  }
  return value;
}

function asNumber(value: unknown, where: string): number {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    fail(`${where} must be a number`);
  }
  return value;
}

function asUnitInterval(value: unknown, where: string): number {
  const n = asNumber(value, where);
  if (n < 0 || n > 1) {
    fail(`${where} must be between 0 and 1`);
  }
  return n;
}

function asScoreRange(value: unknown, where: string): number {
  const n = asNumber(value, where);
  if (n < 0 || n > 2) {
    fail(`${where} must be between 0 and 2`);
  }
  return n;
}

function asPositiveInteger(value: unknown, where: string): number {
  if (typeof value !== 'number' || !Number.isFinite(value) || !Number.isInteger(value)) {
    fail(`${where} must be an integer`);
  }
  if (value <= 0) {
    fail(`${where} must be a positive number`);
  }
  return value;
}

function asNonNegativeInteger(value: unknown, where: string): number {
  if (typeof value !== 'number' || !Number.isFinite(value) || !Number.isInteger(value)) {
    fail(`${where} must be an integer`);
  }
  if (value < 0) {
    fail(`${where} must be a non-negative integer`);
  }
  return value;
}

function asStringArray(value: unknown, where: string): string[] {
  if (!Array.isArray(value)) {
    fail(`${where} must be an array`);
  }
  return value.map((item, index) => asString(item, `${where}[${index}]`));
}

function asLabel(value: unknown, where: string): Label {
  if (value === 'question') {
    return 'question';
  }
  if (value === 'design') {
    return 'design';
  }
  if (value === 'verify') {
    return 'verify';
  }
  if (value === 'permission') {
    return 'permission';
  }
  if (value === 'chat') {
    return 'chat';
  }
  if (value === 'unknown') {
    return 'unknown';
  }
  fail(`${where} must be one of ${LABELS.join(', ')}`);
  return 'unknown';
}

function asLabelArray(value: unknown, where: string): Label[] {
  if (!Array.isArray(value)) {
    fail(`${where} must be an array`);
  }
  return value.map((item, index) => asLabel(item, `${where}[${index}]`));
}

function checkNoUnknownKeys(
  raw: Record<string, unknown>,
  known: readonly string[],
  where: string,
): void {
  for (const key of Object.keys(raw)) {
    if (!known.includes(key)) {
      fail(`${where} has an unknown key: ${key}`);
    }
  }
}

const TOP_KEYS = [
  'classifier',
  'budget',
  'thresholds',
  'route',
  'judge',
  'guide',
  'stop',
  'state',
  'log',
] as const;

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

function parseCandidate(value: unknown, where: string): ClassifierCandidate {
  const raw = asRecord(value, where);
  checkNoUnknownKeys(raw, ['provider', 'model'], where);
  return {
    provider: asNonEmptyString(raw.provider, `${where}.provider`),
    model: asNonEmptyString(raw.model, `${where}.model`),
  };
}

function parseClassifier(value: unknown, base: Settings['classifier']): Settings['classifier'] {
  const raw = asRecord(value, 'classifier');
  checkNoUnknownKeys(raw, ['models', 'allowPaid'], 'classifier');
  let models = base.models;
  if (raw.models !== undefined) {
    if (!Array.isArray(raw.models)) {
      fail('classifier.models must be an array');
    }
    const parsed = raw.models.map((item, index) =>
      parseCandidate(item, `classifier.models[${index}]`),
    );
    if (parsed.length === 0) {
      fail('classifier.models must not be empty');
    }
    models = parsed;
  }
  const allowPaid =
    raw.allowPaid === undefined ? base.allowPaid : asBoolean(raw.allowPaid, 'classifier.allowPaid');
  return { models, allowPaid };
}

function parseBudget(value: unknown, base: Settings['budget']): Settings['budget'] {
  const raw = asRecord(value, 'budget');
  checkNoUnknownKeys(
    raw,
    ['maxJudgementsPerPrompt', 'maxStateChars', 'minIntervalMs', 'timeoutMs'],
    'budget',
  );
  return {
    maxJudgementsPerPrompt:
      raw.maxJudgementsPerPrompt === undefined
        ? base.maxJudgementsPerPrompt
        : asPositiveInteger(raw.maxJudgementsPerPrompt, 'budget.maxJudgementsPerPrompt'),
    maxStateChars:
      raw.maxStateChars === undefined
        ? base.maxStateChars
        : asPositiveInteger(raw.maxStateChars, 'budget.maxStateChars'),
    minIntervalMs:
      raw.minIntervalMs === undefined
        ? base.minIntervalMs
        : asNonNegativeInteger(raw.minIntervalMs, 'budget.minIntervalMs'),
    timeoutMs:
      raw.timeoutMs === undefined
        ? base.timeoutMs
        : asPositiveInteger(raw.timeoutMs, 'budget.timeoutMs'),
  };
}

function parseThresholds(value: unknown, base: Settings['thresholds']): Settings['thresholds'] {
  const raw = asRecord(value, 'thresholds');
  checkNoUnknownKeys(raw, ['routeConfidence', 'judgeConfidence', 'judgeScore'], 'thresholds');
  return {
    routeConfidence:
      raw.routeConfidence === undefined
        ? base.routeConfidence
        : asUnitInterval(raw.routeConfidence, 'thresholds.routeConfidence'),
    judgeConfidence:
      raw.judgeConfidence === undefined
        ? base.judgeConfidence
        : asUnitInterval(raw.judgeConfidence, 'thresholds.judgeConfidence'),
    judgeScore:
      raw.judgeScore === undefined
        ? base.judgeScore
        : asScoreRange(raw.judgeScore, 'thresholds.judgeScore'),
  };
}

function parseRoute(value: unknown, base: Settings['route']): Settings['route'] {
  const raw = asRecord(value, 'route');
  checkNoUnknownKeys(raw, ['enabled', 'shadow', 'actOn', 'idleOn'], 'route');
  return {
    enabled: raw.enabled === undefined ? base.enabled : asBoolean(raw.enabled, 'route.enabled'),
    shadow: raw.shadow === undefined ? base.shadow : asBoolean(raw.shadow, 'route.shadow'),
    actOn: raw.actOn === undefined ? base.actOn : asLabelArray(raw.actOn, 'route.actOn'),
    idleOn: raw.idleOn === undefined ? base.idleOn : asLabelArray(raw.idleOn, 'route.idleOn'),
  };
}

function parseJudge(value: unknown, base: Settings['judge']): Settings['judge'] {
  const raw = asRecord(value, 'judge');
  checkNoUnknownKeys(raw, ['enabled', 'shadow', 'minTurns', 'everyNTurns', 'maxFires'], 'judge');
  return {
    enabled: raw.enabled === undefined ? base.enabled : asBoolean(raw.enabled, 'judge.enabled'),
    shadow: raw.shadow === undefined ? base.shadow : asBoolean(raw.shadow, 'judge.shadow'),
    minTurns:
      raw.minTurns === undefined
        ? base.minTurns
        : asPositiveInteger(raw.minTurns, 'judge.minTurns'),
    everyNTurns:
      raw.everyNTurns === undefined
        ? base.everyNTurns
        : asPositiveInteger(raw.everyNTurns, 'judge.everyNTurns'),
    maxFires:
      raw.maxFires === undefined
        ? base.maxFires
        : asPositiveInteger(raw.maxFires, 'judge.maxFires'),
  };
}

function parseGuide(value: unknown, base: Settings['guide']): Settings['guide'] {
  const raw = asRecord(value, 'guide');
  checkNoUnknownKeys(raw, ['enabled', 'display', 'text'], 'guide');
  return {
    enabled: raw.enabled === undefined ? base.enabled : asBoolean(raw.enabled, 'guide.enabled'),
    display: raw.display === undefined ? base.display : asBoolean(raw.display, 'guide.display'),
    text: raw.text === undefined ? base.text : asNonEmptyString(raw.text, 'guide.text'),
  };
}

function parseStop(value: unknown, base: Settings['stop']): Settings['stop'] {
  const raw = asRecord(value, 'stop');
  checkNoUnknownKeys(raw, ['enabled', 'display', 'text'], 'stop');
  return {
    enabled: raw.enabled === undefined ? base.enabled : asBoolean(raw.enabled, 'stop.enabled'),
    display: raw.display === undefined ? base.display : asBoolean(raw.display, 'stop.display'),
    text: raw.text === undefined ? base.text : asNonEmptyString(raw.text, 'stop.text'),
  };
}

function parseState(value: unknown, base: Settings['state']): Settings['state'] {
  const raw = asRecord(value, 'state');
  checkNoUnknownKeys(raw, ['maxActions', 'actionChars', 'assistantChars', 'includeTools'], 'state');
  return {
    maxActions:
      raw.maxActions === undefined
        ? base.maxActions
        : asPositiveInteger(raw.maxActions, 'state.maxActions'),
    actionChars:
      raw.actionChars === undefined
        ? base.actionChars
        : asPositiveInteger(raw.actionChars, 'state.actionChars'),
    assistantChars:
      raw.assistantChars === undefined
        ? base.assistantChars
        : asPositiveInteger(raw.assistantChars, 'state.assistantChars'),
    includeTools:
      raw.includeTools === undefined
        ? base.includeTools
        : asStringArray(raw.includeTools, 'state.includeTools'),
  };
}

function parseLog(value: unknown, base: Settings['log']): Settings['log'] {
  const raw = asRecord(value, 'log');
  checkNoUnknownKeys(raw, ['dir', 'keepDays'], 'log');
  return {
    dir: raw.dir === undefined ? base.dir : asNonEmptyString(raw.dir, 'log.dir'),
    keepDays:
      raw.keepDays === undefined ? base.keepDays : asPositiveInteger(raw.keepDays, 'log.keepDays'),
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
  const raw = asRecord(document, 'the config');
  checkNoUnknownKeys(raw, TOP_KEYS, 'the config');
  return {
    classifier:
      raw.classifier === undefined
        ? defaults.classifier
        : parseClassifier(raw.classifier, defaults.classifier),
    budget: raw.budget === undefined ? defaults.budget : parseBudget(raw.budget, defaults.budget),
    thresholds:
      raw.thresholds === undefined
        ? defaults.thresholds
        : parseThresholds(raw.thresholds, defaults.thresholds),
    route: raw.route === undefined ? defaults.route : parseRoute(raw.route, defaults.route),
    judge: raw.judge === undefined ? defaults.judge : parseJudge(raw.judge, defaults.judge),
    guide: raw.guide === undefined ? defaults.guide : parseGuide(raw.guide, defaults.guide),
    stop: raw.stop === undefined ? defaults.stop : parseStop(raw.stop, defaults.stop),
    state: raw.state === undefined ? defaults.state : parseState(raw.state, defaults.state),
    log: raw.log === undefined ? defaults.log : parseLog(raw.log, defaults.log),
  };
}

function errorCode(error: unknown): string | undefined {
  if (typeof error === 'object' && error !== null && 'code' in error) {
    const code = (error as { code?: unknown }).code;
    return typeof code === 'string' ? code : undefined;
  }
  return undefined;
}

/** `<dir>/settings.json` を読む。無ければ既定、読めて壊れていれば投げる */
export function readSettings(dir: string, defaults: Settings): Settings {
  const file = join(dir, SETTINGS_FILE);
  let text: string;
  try {
    text = readFileSync(file, 'utf8');
  } catch (error) {
    if (errorCode(error) === 'ENOENT') {
      return defaults;
    }
    const detail = error instanceof Error ? error.message : String(error);
    throw new Error(`intent-router settings: could not read ${file} (${detail})`, { cause: error });
  }
  return parseSettings(text, defaults);
}
