/**
 * sound-notify の設定。`settings.json` と 1 対 1。
 *
 * 書いていない欄は既定のまま。書いてある欄の型が違えば broken。知らないキーは無視する。
 */

export interface Settings {
  readonly enabled: boolean;
  readonly notifications: boolean;
  readonly sounds: {
    readonly permission: string;
    readonly question: string;
    readonly done: string;
    readonly commit: string;
    readonly compact: string;
  };
}

export type SettingsRead =
  | { readonly kind: 'ok'; readonly settings: Settings }
  | { readonly kind: 'broken'; readonly reason: string };

export const SETTINGS_FILE = 'settings.json' as const;

/** 既定の設定 */
export function defaultSettings(): Settings {
  return {
    enabled: true,
    notifications: true,
    sounds: { permission: 'Blow', question: 'Ping', done: 'Glass', commit: 'Pop', compact: 'Ping' },
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function broken(reason: string): SettingsRead {
  return { kind: 'broken', reason: `sound-notify settings: ${reason}` };
}

/** 読んだ文書を既定に重ねる。だめなら理由を返す */
function overlaySettings(document: Record<string, unknown>, base: Settings): Settings | string {
  let enabled = base.enabled;
  if (document['enabled'] !== undefined) {
    if (typeof document['enabled'] !== 'boolean') {
      return 'enabled must be a boolean';
    }
    enabled = document['enabled'];
  }
  let notifications = base.notifications;
  if (document['notifications'] !== undefined) {
    if (typeof document['notifications'] !== 'boolean') {
      return 'notifications must be a boolean';
    }
    notifications = document['notifications'];
  }
  let sounds = base.sounds;
  if (document['sounds'] !== undefined) {
    const raw = document['sounds'];
    if (!isRecord(raw)) {
      return 'sounds must be an object';
    }
    const keys = ['permission', 'question', 'done', 'commit', 'compact'] as const;
    const next = { ...sounds };
    for (const key of keys) {
      if (raw[key] !== undefined) {
        if (typeof raw[key] !== 'string') {
          return `sounds.${key} must be a string`;
        }
        next[key] = raw[key];
      }
    }
    sounds = next;
  }
  return { enabled, notifications, sounds };
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

/** 読んだ結果を使う形にする。壊れていれば既定 */
export function settingsOrDefault(read: SettingsRead): Settings {
  return read.kind === 'ok' ? read.settings : defaultSettings();
}
