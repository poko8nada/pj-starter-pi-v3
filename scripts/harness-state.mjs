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
