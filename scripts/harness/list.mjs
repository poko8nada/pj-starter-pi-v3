// ハーネスの一覧を読む。置き場は `scripts/harness/harness.json`。
import * as fs from 'node:fs';
import * as path from 'node:path';

/**
 * `scripts/harness/harness.json` の形
 * @typedef {{ readonly copy: readonly string[], readonly skip: readonly string[], readonly legacy: readonly string[] }} HarnessList
 */

/**
 * テストの除外を作る（純）。`copy` の各道から `<道>` と `<道>/**` を作る。末の `/` は落とす。空と `.` は飛ばす。
 * @param {HarnessList} list 一覧
 * @returns {readonly string[]} 除外の glob（一覧の順）
 */
export function harnessExcludes(list) {
  /** @type {string[]} */
  const out = [];
  for (const entry of list.copy ?? []) {
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
 * 一覧を読む。無い / JSON として読めない / `copy` が配列でない / `legacy` が配列でない → 道を入れた 1 つのエラーで投げる。
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
  if (typeof data !== 'object' || data === null || !Array.isArray(data.copy)) {
    throw new Error(`the list is not valid JSON: ${file}`);
  }
  const skip = Array.isArray(data.skip) ? data.skip : [];
  const legacy = data.legacy === undefined ? [] : data.legacy;
  if (!Array.isArray(legacy)) {
    throw new Error(`the list is not valid JSON: ${file}`);
  }
  return { copy: data.copy, skip, legacy };
}
