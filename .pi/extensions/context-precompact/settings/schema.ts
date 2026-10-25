/**
 * context-precompact の設定。`settings.json` と 1 対 1。
 *
 * 書いていない欄は既定のまま。書いてある欄が知らないキー・範囲外・別の型なら broken。
 */
import {
  DEFAULT_KEEP_RECENT_TOKENS,
  DEFAULT_THRESHOLD_RATIO,
  MAX_THRESHOLD_RATIO,
  MIN_KEEP_RECENT_TOKENS,
  MIN_THRESHOLD_RATIO,
} from './constants.ts';

export interface Settings {
  readonly enabled: boolean;
  readonly keepRecentTokens: number;
  readonly thresholdRatio: number;
}

export type SettingsRead =
  | { readonly kind: 'ok'; readonly settings: Settings }
  | { readonly kind: 'broken'; readonly reason: string };

/** 既定の設定 */
export function defaultSettings(): Settings {
  return {
    enabled: true,
    keepRecentTokens: DEFAULT_KEEP_RECENT_TOKENS,
    thresholdRatio: DEFAULT_THRESHOLD_RATIO,
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function broken(reason: string): SettingsRead {
  return { kind: 'broken', reason: `context-precompact settings: ${reason}` };
}

/** 読んだ文書を既定に重ねる。だめなら理由を返す */
function overlaySettings(document: Record<string, unknown>, base: Settings): Settings | string {
  for (const key of Object.keys(document)) {
    if (key !== 'enabled' && key !== 'keepRecentTokens' && key !== 'thresholdRatio') {
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
  if (document['keepRecentTokens'] !== undefined) {
    const keep = document['keepRecentTokens'];
    if (typeof keep !== 'number' || !Number.isInteger(keep) || keep < MIN_KEEP_RECENT_TOKENS) {
      return 'keepRecentTokens must be an integer of 1 or more';
    }
    settings = { ...settings, keepRecentTokens: keep };
  }
  if (document['thresholdRatio'] !== undefined) {
    const ratio = document['thresholdRatio'];
    if (typeof ratio !== 'number' || !Number.isFinite(ratio)) {
      return 'thresholdRatio must be a number';
    }
    if (ratio < MIN_THRESHOLD_RATIO || ratio > MAX_THRESHOLD_RATIO) {
      return 'thresholdRatio must be between 0.5 and 0.95';
    }
    settings = { ...settings, thresholdRatio: ratio };
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
