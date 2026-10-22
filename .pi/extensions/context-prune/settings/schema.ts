/**
 * context-prune の設定。`settings.json` と 1 対 1。
 *
 * 書いていない欄は既定のまま。書いてある欄が知らないキー・範囲外・別の型なら broken。
 */

export interface ClassifierCandidate {
  readonly provider: string;
  readonly model: string;
}

export interface Settings {
  readonly enabled: boolean;
  readonly ratio: number;
  readonly recentTokens: number;
  readonly threshold: number;
  readonly maxQuestions: number;
  readonly rearmRatio: number;
  readonly marker: string;
  readonly classifier: {
    readonly models: readonly ClassifierCandidate[];
    readonly allowPaid: boolean;
  };
}

export type SettingsRead =
  | { readonly kind: 'ok'; readonly settings: Settings }
  | { readonly kind: 'broken'; readonly reason: string };

export const SETTINGS_FILE = 'settings.json';

/** 既定の設定 */
export function defaultSettings(): Settings {
  return {
    enabled: true,
    ratio: 0.5,
    recentTokens: 50000,
    threshold: 0.5,
    maxQuestions: 40,
    rearmRatio: 0.1,
    marker: '古いツール結果（{chars} 文字）を省略',
    classifier: {
      models: [
        { provider: 'opencode', model: 'jev-1.13-free' },
        { provider: 'openrouter', model: '~typesafe/jev-latest' },
      ],
      allowPaid: true,
    },
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function broken(reason: string): SettingsRead {
  return { kind: 'broken', reason: `context-prune settings: ${reason}` };
}

/** 整数かどうか（1 以上） */
function isPositiveInt(value: unknown): value is number {
  return typeof value === 'number' && Number.isInteger(value) && value >= 1;
}

/** 候補の 1 件を読む。だめなら理由を返す */
function parseCandidate(value: unknown): ClassifierCandidate | string {
  if (!isRecord(value)) {
    return 'classifier.models must be objects';
  }
  for (const key of Object.keys(value)) {
    if (key !== 'provider' && key !== 'model') {
      return `unknown key "${key}" in classifier.models`;
    }
  }
  if (typeof value['provider'] !== 'string' || value['provider'] === '') {
    return 'classifier.models[].provider must be a non-empty string';
  }
  if (typeof value['model'] !== 'string' || value['model'] === '') {
    return 'classifier.models[].model must be a non-empty string';
  }
  return { provider: value['provider'], model: value['model'] };
}

/** 分類器の上書きを読む。だめなら理由を返す */
function parseClassifier(
  value: unknown,
  base: Settings['classifier'],
): Settings['classifier'] | string {
  if (!isRecord(value)) {
    return 'classifier must be an object';
  }
  for (const key of Object.keys(value)) {
    if (key !== 'models' && key !== 'allowPaid') {
      return `unknown key "${key}" in classifier`;
    }
  }
  let models = base.models;
  if (value['models'] !== undefined) {
    if (!Array.isArray(value['models']) || value['models'].length === 0) {
      return 'classifier.models must have at least 1 entry';
    }
    const parsed: ClassifierCandidate[] = [];
    for (const entry of value['models']) {
      const candidate = parseCandidate(entry);
      if (typeof candidate === 'string') {
        return candidate;
      }
      parsed.push(candidate);
    }
    models = parsed;
  }
  let allowPaid = base.allowPaid;
  if (value['allowPaid'] !== undefined) {
    if (typeof value['allowPaid'] !== 'boolean') {
      return 'classifier.allowPaid must be a boolean';
    }
    allowPaid = value['allowPaid'];
  }
  return { models, allowPaid };
}

/** 数値の範囲を読む。だめなら理由を返す */
function parseRatio(value: unknown): number | string {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    return 'ratio must be a number';
  }
  if (value < 0.2 || value > 0.8) {
    return 'ratio must be between 0.2 and 0.8';
  }
  return value;
}

/** 0〜1 の割合を読む。だめなら理由を返す */
function parseThreshold(value: unknown): number | string {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    return 'threshold must be a number';
  }
  if (value < 0 || value > 1) {
    return 'threshold must be between 0 and 1';
  }
  return value;
}

/** 再発動の割合を読む。0 より大きく 1 未満 */
function parseRearmRatio(value: unknown): number | string {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    return 'rearmRatio must be a number';
  }
  if (value <= 0 || value >= 1) {
    return 'rearmRatio must be greater than 0 and less than 1';
  }
  return value;
}

/** 読んだ文書を既定に重ねる。だめなら理由を返す */
function overlaySettings(document: Record<string, unknown>, base: Settings): Settings | string {
  for (const key of Object.keys(document)) {
    if (
      key !== 'enabled' &&
      key !== 'ratio' &&
      key !== 'recentTokens' &&
      key !== 'threshold' &&
      key !== 'maxQuestions' &&
      key !== 'rearmRatio' &&
      key !== 'marker' &&
      key !== 'classifier'
    ) {
      return `unknown key "${key}"`;
    }
  }
  let settings: Settings = base;
  if (document['enabled'] !== undefined) {
    if (typeof document['enabled'] !== 'boolean') {
      return 'enabled must be a boolean';
    }
    settings = { ...settings, enabled: document['enabled'] };
  }
  if (document['ratio'] !== undefined) {
    const ratio = parseRatio(document['ratio']);
    if (typeof ratio === 'string') {
      return ratio;
    }
    settings = { ...settings, ratio };
  }
  if (document['recentTokens'] !== undefined) {
    if (!isPositiveInt(document['recentTokens'])) {
      return 'recentTokens must be an integer of 1 or more';
    }
    settings = { ...settings, recentTokens: document['recentTokens'] };
  }
  if (document['threshold'] !== undefined) {
    const threshold = parseThreshold(document['threshold']);
    if (typeof threshold === 'string') {
      return threshold;
    }
    settings = { ...settings, threshold };
  }
  if (document['maxQuestions'] !== undefined) {
    if (!isPositiveInt(document['maxQuestions'])) {
      return 'maxQuestions must be an integer of 1 or more';
    }
    settings = { ...settings, maxQuestions: document['maxQuestions'] };
  }
  if (document['rearmRatio'] !== undefined) {
    const rearmRatio = parseRearmRatio(document['rearmRatio']);
    if (typeof rearmRatio === 'string') {
      return rearmRatio;
    }
    settings = { ...settings, rearmRatio };
  }
  if (document['marker'] !== undefined) {
    if (typeof document['marker'] !== 'string' || document['marker'] === '') {
      return 'marker must be a non-empty string';
    }
    settings = { ...settings, marker: document['marker'] };
  }
  if (document['classifier'] !== undefined) {
    const classifier = parseClassifier(document['classifier'], base.classifier);
    if (typeof classifier === 'string') {
      return classifier;
    }
    settings = { ...settings, classifier };
  }
  return settings;
}

/** 読んだ文字列を設定にする。型が違えば broken */
export function parseSettings(text: string): SettingsRead {
  let document: unknown;
  try {
    document = JSON.parse(text);
  } catch (error) {
    const detail = error instanceof Error ? error.message : String(error);
    return broken(`not JSON (${detail})`);
  }
  if (!isRecord(document)) {
    return broken('must be an object');
  }
  const overlaid = overlaySettings(document, defaultSettings());
  if (typeof overlaid === 'string') {
    return broken(overlaid);
  }
  return { kind: 'ok', settings: overlaid };
}
