/**
 * `settings.json` の読み込み。無ければ既定、読めて壊れていれば投げる。
 */

import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { parseSettings, SETTINGS_FILE, type Settings } from './schema.ts';

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
