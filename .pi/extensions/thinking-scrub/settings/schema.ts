/**
 * thinking-scrub の設定。`settings.json` と 1 対 1。
 *
 * 壊れているときは投げずに broken で返す。入口が既定で動く旨と合わせて知らせる。
 */

export interface Settings {
  readonly enabled: boolean;
  readonly show: boolean;
}

export type SettingsRead =
  | { readonly kind: 'ok'; readonly settings: Settings }
  | { readonly kind: 'broken'; readonly reason: string };

export const SETTINGS_FILE = 'settings.json';

/** 既定の設定 */
export function defaultSettings(): Settings {
  return { enabled: true, show: true };
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
  if (typeof document !== 'object' || document === null || Array.isArray(document)) {
    return { kind: 'broken', reason: 'thinking-scrub settings: must be an object' };
  }
  let enabled = true;
  let show = true;
  if ('enabled' in document) {
    const value: unknown = document.enabled;
    if (typeof value !== 'boolean') {
      return { kind: 'broken', reason: 'thinking-scrub settings: enabled must be a boolean' };
    }
    enabled = value;
  }
  if ('show' in document) {
    const value: unknown = document.show;
    if (typeof value !== 'boolean') {
      return { kind: 'broken', reason: 'thinking-scrub settings: show must be a boolean' };
    }
    show = value;
  }
  return { kind: 'ok', settings: { enabled, show } };
}
