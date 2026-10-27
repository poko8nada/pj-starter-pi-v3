/**
 * thinking-scrub の設定。`settings.json` と 1 対 1。
 *
 * 壊れているときは投げずに broken で返す。入口が既定で動く旨と合わせて知らせる。
 */

export interface LiveTuning {
  readonly minThinking: number;
  readonly scanEvery: number;
  readonly tail: number;
  readonly maxAborts: number;
  readonly sampleChars: number;
}

export interface SentenceTuning {
  readonly minCycles: number;
  readonly minRunChars: number;
  readonly maxPeriodUnits: number;
}

export interface CharTuning {
  readonly minPeriod: number;
  readonly maxPeriod: number;
  readonly minRepeats: number;
  readonly minLength: number;
}

export interface Tuning {
  readonly live: LiveTuning;
  readonly sentence: SentenceTuning;
  readonly char: CharTuning;
}

export interface Settings extends Tuning {
  readonly enabled: boolean;
  readonly show: boolean;
}

export type SettingsRead =
  | { readonly kind: 'ok'; readonly settings: Settings }
  | { readonly kind: 'broken'; readonly reason: string };

export const SETTINGS_FILE = 'settings.json';

/** 既定の設定 */
export function defaultSettings(): Settings {
  return {
    enabled: true,
    show: true,
    live: { minThinking: 20_000, scanEvery: 2_000, tail: 20_000, maxAborts: 2, sampleChars: 200 },
    sentence: { minCycles: 3, minRunChars: 400, maxPeriodUnits: 64 },
    char: { minPeriod: 4, maxPeriod: 120, minRepeats: 3, minLength: 20 },
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function parseCount(value: unknown, label: string, min: number): number | string {
  if (typeof value !== 'number' || !Number.isInteger(value) || !Number.isFinite(value)) {
    return `thinking-scrub settings: ${label} must be an integer`;
  }
  if (value < min) {
    return `thinking-scrub settings: ${label} must be >= ${min}`;
  }
  return value;
}

function parseGroup(
  document: Record<string, unknown>,
  key: string,
): Record<string, unknown> | string {
  const value: unknown = document[key];
  if (value === undefined) {
    return {};
  }
  if (!isRecord(value)) {
    return `thinking-scrub settings: ${key} must be an object`;
  }
  return value;
}

function parseLive(raw: Record<string, unknown>, defaults: LiveTuning): LiveTuning | string {
  let minThinking = defaults.minThinking;
  let scanEvery = defaults.scanEvery;
  let tail = defaults.tail;
  let maxAborts = defaults.maxAborts;
  let sampleChars = defaults.sampleChars;
  const fields: { readonly key: string; readonly label: string; readonly min: number }[] = [
    { key: 'minThinking', label: 'live.minThinking', min: 1 },
    { key: 'scanEvery', label: 'live.scanEvery', min: 1 },
    { key: 'tail', label: 'live.tail', min: 1 },
    { key: 'maxAborts', label: 'live.maxAborts', min: 0 },
    { key: 'sampleChars', label: 'live.sampleChars', min: 1 },
  ];
  const parsed: Record<string, number> = {};
  for (const field of fields) {
    if (field.key in raw) {
      const value = parseCount(raw[field.key], field.label, field.min);
      if (typeof value === 'string') {
        return value;
      }
      parsed[field.key] = value;
    }
  }
  if (parsed['minThinking'] !== undefined) {
    minThinking = parsed['minThinking'] ?? minThinking;
  }
  if (parsed['scanEvery'] !== undefined) {
    scanEvery = parsed['scanEvery'] ?? scanEvery;
  }
  if (parsed['tail'] !== undefined) {
    tail = parsed['tail'] ?? tail;
  }
  if (parsed['maxAborts'] !== undefined) {
    maxAborts = parsed['maxAborts'] ?? maxAborts;
  }
  if (parsed['sampleChars'] !== undefined) {
    sampleChars = parsed['sampleChars'] ?? sampleChars;
  }
  if (scanEvery > tail) {
    return 'thinking-scrub settings: live.scanEvery must be <= live.tail';
  }
  return { minThinking, scanEvery, tail, maxAborts, sampleChars };
}

function parseSentence(
  raw: Record<string, unknown>,
  defaults: SentenceTuning,
): SentenceTuning | string {
  let minCycles = defaults.minCycles;
  let minRunChars = defaults.minRunChars;
  let maxPeriodUnits = defaults.maxPeriodUnits;
  if ('minCycles' in raw) {
    const parsed = parseCount(raw.minCycles, 'sentence.minCycles', 2);
    if (typeof parsed === 'string') {
      return parsed;
    }
    minCycles = parsed;
  }
  if ('minRunChars' in raw) {
    const parsed = parseCount(raw.minRunChars, 'sentence.minRunChars', 1);
    if (typeof parsed === 'string') {
      return parsed;
    }
    minRunChars = parsed;
  }
  if ('maxPeriodUnits' in raw) {
    const parsed = parseCount(raw.maxPeriodUnits, 'sentence.maxPeriodUnits', 1);
    if (typeof parsed === 'string') {
      return parsed;
    }
    maxPeriodUnits = parsed;
  }
  return { minCycles, minRunChars, maxPeriodUnits };
}

function parseChar(raw: Record<string, unknown>, defaults: CharTuning): CharTuning | string {
  let minPeriod = defaults.minPeriod;
  let maxPeriod = defaults.maxPeriod;
  let minRepeats = defaults.minRepeats;
  let minLength = defaults.minLength;
  if ('minPeriod' in raw) {
    const parsed = parseCount(raw.minPeriod, 'char.minPeriod', 1);
    if (typeof parsed === 'string') {
      return parsed;
    }
    minPeriod = parsed;
  }
  if ('maxPeriod' in raw) {
    const parsed = parseCount(raw.maxPeriod, 'char.maxPeriod', 1);
    if (typeof parsed === 'string') {
      return parsed;
    }
    maxPeriod = parsed;
  }
  if ('minRepeats' in raw) {
    const parsed = parseCount(raw.minRepeats, 'char.minRepeats', 2);
    if (typeof parsed === 'string') {
      return parsed;
    }
    minRepeats = parsed;
  }
  if ('minLength' in raw) {
    const parsed = parseCount(raw.minLength, 'char.minLength', 1);
    if (typeof parsed === 'string') {
      return parsed;
    }
    minLength = parsed;
  }
  if (minPeriod > maxPeriod) {
    return 'thinking-scrub settings: char.minPeriod must be <= char.maxPeriod';
  }
  return { minPeriod, maxPeriod, minRepeats, minLength };
}

function parseFlags(
  document: Record<string, unknown>,
): { enabled: boolean; show: boolean } | string {
  let enabled = true;
  let show = true;
  if ('enabled' in document) {
    const value: unknown = document.enabled;
    if (typeof value !== 'boolean') {
      return 'thinking-scrub settings: enabled must be a boolean';
    }
    enabled = value;
  }
  if ('show' in document) {
    const value: unknown = document.show;
    if (typeof value !== 'boolean') {
      return 'thinking-scrub settings: show must be a boolean';
    }
    show = value;
  }
  return { enabled, show };
}

/** 読んだ文字列を設定にする。型が違えば broken */
export function parseSettings(text: string): SettingsRead {
  let document: unknown;
  try {
    document = JSON.parse(text);
  } catch (error) {
    const detail = error instanceof Error ? error.message : String(error);
    return { kind: 'broken', reason: `thinking-scrub settings: not JSON (${detail})` };
  }
  if (!isRecord(document)) {
    return { kind: 'broken', reason: 'thinking-scrub settings: must be an object' };
  }
  const flags = parseFlags(document);
  if (typeof flags === 'string') {
    return { kind: 'broken', reason: flags };
  }
  const defaults = defaultSettings();
  const liveRaw = parseGroup(document, 'live');
  if (typeof liveRaw === 'string') {
    return { kind: 'broken', reason: liveRaw };
  }
  const sentenceRaw = parseGroup(document, 'sentence');
  if (typeof sentenceRaw === 'string') {
    return { kind: 'broken', reason: sentenceRaw };
  }
  const charRaw = parseGroup(document, 'char');
  if (typeof charRaw === 'string') {
    return { kind: 'broken', reason: charRaw };
  }
  const live = parseLive(liveRaw, defaults.live);
  if (typeof live === 'string') {
    return { kind: 'broken', reason: live };
  }
  const sentence = parseSentence(sentenceRaw, defaults.sentence);
  if (typeof sentence === 'string') {
    return { kind: 'broken', reason: sentence };
  }
  const char = parseChar(charRaw, defaults.char);
  if (typeof char === 'string') {
    return { kind: 'broken', reason: char };
  }
  return {
    kind: 'ok',
    settings: { enabled: flags.enabled, show: flags.show, live, sentence, char },
  };
}
