// ハーネスの一覧を読む。置き場は `scripts/harness/harness.json`。
import * as fs from 'node:fs';
import * as path from 'node:path';

/**
 * `scripts/harness/harness.json` の形
 * @typedef {{ readonly starter: string, readonly copy: readonly string[], readonly push: readonly string[] }} HarnessList
 */

/**
 * テストの除外を作る（純）。`copy` と `push` の両方の項目から `<項目>` と `<項目>/**` を作る。末の `/` は落とす。空と `.` は飛ばす。
 * @param {HarnessList} list 一覧
 * @returns {readonly string[]} 除外の glob（一覧の順）
 */
export function harnessExcludes(list) {
  /** @type {string[]} */
  const out = [];
  for (const entry of [...(list.copy ?? []), ...(list.push ?? [])]) {
    if (typeof entry !== 'string' || entry === '') {
      continue;
    }
    const rel = entry.replace(/\/+$/, '');
    if (rel === '' || rel === '.') {
      continue;
    }
    out.push(rel, `${rel}/**`);
  }
  return out;
}

/**
 * 一覧を読む。無い / JSON として読めない / `starter` が文字列でない / `copy` が配列でない / `push` が配列でない → パスを入れた 1 つのエラーで投げる。
 * @param {string} root リポジトリのルート
 * @returns {HarnessList}
 */
export function readList(root) {
  const file = path.join(root, 'scripts', 'harness', 'harness.json');
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
    throw new Error(`the list is not valid JSON: ${file}`, { cause: error });
  }
  if (typeof data !== 'object' || data === null) {
    throw new Error(`the list is not valid JSON: ${file}`);
  }
  const starter = data.starter;
  if (typeof starter !== 'string' || starter === '') {
    throw new Error(`the list is not valid JSON: ${file}`);
  }
  const copy = data.copy === undefined ? [] : data.copy;
  const push = data.push === undefined ? [] : data.push;
  if (!Array.isArray(copy) || !Array.isArray(push)) {
    throw new Error(`the list is not valid JSON: ${file}`);
  }
  return { starter, copy, push };
}
