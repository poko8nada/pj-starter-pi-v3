/**
 * `settings.json` の読み込み。無ければ既定、読めない・壊れていれば broken。
 *
 * 呼ぶたびにファイルを読む。入口は毎回読み直す。
 */
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { defaultSettings, parseSettings, type SettingsRead } from './schema.ts';

export const SETTINGS_FILE = 'settings.json';

function errorCode(error: unknown): string | undefined {
  if (typeof error === 'object' && error !== null && 'code' in error) {
    const code = error.code;
    return typeof code === 'string' ? code : undefined;
  }
  return undefined;
}

export type WriteEnabledResult =
  | { readonly kind: 'ok' }
  | { readonly kind: 'broken'; readonly reason: string };

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
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
      reason: `context-precompact settings: could not read ${file} (${detail})`,
    };
  }
  return parseSettings(text);
}

/** `<dir>/settings.json` の enabled だけを書き換える。壊れていれば書かずに broken */
export function writeEnabled(dir: string, enabled: boolean): WriteEnabledResult {
  const file = join(dir, SETTINGS_FILE);
  let text: string;
  try {
    text = readFileSync(file, 'utf8');
  } catch (error) {
    if (errorCode(error) === 'ENOENT') {
      mkdirSync(dirname(file), { recursive: true });
      writeFileSync(file, `${JSON.stringify({ enabled }, null, 2)}\n`, 'utf8');
      return { kind: 'ok' };
    }
    const detail = error instanceof Error ? error.message : String(error);
    return {
      kind: 'broken',
      reason: `context-precompact settings: could not read ${file} (${detail})`,
    };
  }
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch (parseError) {
    const detail = parseError instanceof Error ? parseError.message : String(parseError);
    return { kind: 'broken', reason: `context-precompact settings: not JSON (${detail})` };
  }
  if (!isRecord(parsed)) {
    return { kind: 'broken', reason: 'context-precompact settings: must be an object' };
  }
  mkdirSync(dirname(file), { recursive: true });
  writeFileSync(file, `${JSON.stringify({ ...parsed, enabled }, null, 2)}\n`, 'utf8');
  return { kind: 'ok' };
}
