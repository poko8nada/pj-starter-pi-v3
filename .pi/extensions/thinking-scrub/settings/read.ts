/**
 * `settings.json` を読み込む。なければ既定値を返し、読めない場合と壊れている場合は broken を返す。
 *
 * `readSettings` は呼ばれたときにその都度ファイルを読む。配線はスキャン時と `message_end` に読む。
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

/** `<dir>/settings.json` を読む。なければ既定値を返す。 */
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
      reason: `thinking-scrub settings: could not read ${file} (${detail})`,
    };
  }
  return parseSettings(text);
}
