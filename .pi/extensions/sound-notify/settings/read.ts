/**
 * `settings.json` の読み込み。無ければ既定、読めない・壊れていれば broken。
 *
 * 入口が起動時に 1 回だけ読む。壊れていれば既定で動き、知らせない。
 */

import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { defaultSettings, parseSettings, SETTINGS_FILE, type SettingsRead } from './schema.ts';

function errorCode(error: unknown): string | undefined {
  if (typeof error === 'object' && error !== null && 'code' in error) {
    const code = error.code;
    return typeof code === 'string' ? code : undefined;
  }
  return undefined;
}

/** `<dir>/settings.json` を読む。無ければ既定 */
export function readSettings(dir: string): SettingsRead {
  const file = join(dir, SETTINGS_FILE);
  let text: string;
  try {
    text = readFileSync(file, 'utf8');
  } catch (error) {
    if (errorCode(error) === 'ENOENT') {
      return { kind: 'ok', settings: defaultSettings() };
    }
    const detail = error instanceof Error ? error.message : String(error);
    return {
      kind: 'broken',
      reason: `sound-notify settings: could not read ${file} (${detail})`,
    };
  }
  return parseSettings(text);
}
