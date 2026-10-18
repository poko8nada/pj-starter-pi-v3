/**
 * `settings.json` の読み込み。無ければ既定、読めて壊れていれば投げる。
 *
 * 呼ぶたびにファイルを読む。既定は引数で受けず、内部で `defaultSettings()` を使う。
 * 移行中の旧呼び出し（第2引数つき）も受け付ける。
 */

import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { defaultSettings, parseSettings, SETTINGS_FILE, type Settings } from './schema.ts';

function errorCode(error: unknown): string | undefined {
  if (typeof error === 'object' && error !== null && 'code' in error) {
    const code = (error as { code?: unknown }).code;
    return typeof code === 'string' ? code : undefined;
  }
  return undefined;
}

/** `<dir>/settings.json` を読む。無ければ既定、読めて壊れていれば投げる */
export function readSettings(dir: string, defaults?: Settings): Settings {
  const base = defaults ?? defaultSettings();
  const file = join(dir, SETTINGS_FILE);
  let text: string;
  try {
    text = readFileSync(file, 'utf8');
  } catch (error) {
    if (errorCode(error) === 'ENOENT') {
      return base;
    }
    const detail = error instanceof Error ? error.message : String(error);
    throw new Error(`intent-router settings: could not read ${file} (${detail})`, { cause: error });
  }
  return parseSettings(text, base);
}
