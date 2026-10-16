// ハーネスの状態を読む・書く。一覧の形と読みは `./harness.mjs` の `readList` を借りる。
import * as fs from 'node:fs';
import * as path from 'node:path';

export { readList } from './harness.mjs';

/**
 * ハーネスの状態
 * @typedef {'starter' | 'product'} Mode
 */

/**
 * 状態の道（root から）
 * @type {string}
 */
export const MODE_AT = 'scripts/harness.mode.json';

/**
 * テストの既定の対象（vitest の既定と同じ字）
 * @type {string}
 */
export const TEST_GLOB = '**/*.{test,spec}.?(c|m)[jt]s?(x)';

/**
 * テストの対象を組む（純）。product のときだけ、一覧の各道を否定で足す。
 * @param {import('./harness.mjs').HarnessList} list 一覧
 * @param {Mode} mode 状態
 * @returns {readonly string[]} vitest の `include`
 */
export function includeList(list, mode) {
  if (mode === 'starter') {
    return [TEST_GLOB];
  }
  /** @type {string[]} */
  const out = [TEST_GLOB];
  for (const entry of list.copy) {
    if (typeof entry !== 'string' || entry === '') {
      continue;
    }
    const rel = entry.replace(/\/+$/, '');
    if (rel === '' || rel === '.') {
      continue;
    }
    out.push(`!${rel}`, `!${rel}/**`);
  }
  return out;
}

/**
 * 状態を読む。無い / JSON として読めない / starter でも product でもない → 道を入れた 1 つのエラーで投げる。
 * @param {string} root リポジトリの根
 * @returns {Mode} 状態
 */
export function readMode(root) {
  const file = path.join(root, MODE_AT);
  let text;
  try {
    text = fs.readFileSync(file, 'utf8');
  } catch (error) {
    throw new Error(`no such file: ${file}`, { cause: error });
  }
  let data;
  try {
    data = JSON.parse(text);
  } catch (error) {
    throw new Error(`the mode is not valid JSON: ${file}`, { cause: error });
  }
  const mode = typeof data === 'object' && data !== null ? data.mode : undefined;
  if (mode !== 'starter' && mode !== 'product') {
    throw new Error(`the mode is not starter or product: ${file}`);
  }
  return mode;
}

/**
 * 状態を書く。
 * @param {string} root リポジトリの根
 * @param {Mode} mode 書く状態
 * @returns {void}
 */
export function writeMode(root, mode) {
  const file = path.join(root, MODE_AT);
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, `${JSON.stringify({ mode }, null, 2)}\n`);
}
