// 一覧の項目を 1 つのルートで展開する（`fs.globSync` で集める）。
import * as fs from 'node:fs';
import * as path from 'node:path';

/**
 * 一覧の項目を 1 つのルートで展開した結果
 * @typedef {{ readonly paths: readonly string[], readonly missing: readonly string[] }} Resolved
 */

/**
 * 除外する区画かどうか（`node_modules` と `.git`）。
 * @param {string} rel `/` 区切りの相対
 * @returns {boolean}
 */
function isExcluded(rel) {
  const parts = rel.split('/');
  return parts.includes('node_modules') || parts.includes('.git');
}

/**
 * `/` 区切りの相対に直す。
 * @param {string} sideRoot 側のルート
 * @param {string} full 絶対のパス
 * @returns {string}
 */
function toPosixRel(sideRoot, full) {
  return path.relative(sideRoot, full).split(path.sep).join('/');
}

/**
 * glob の一致から、重複を除いた `/` 区切りの相対パスを作る（純）。
 * @param {string} sideRoot 側のルート
 * @param {readonly string[]} matches 絶対パスの一致
 * @returns {readonly string[]} 辞書順
 */
export function toPaths(sideRoot, matches) {
  const seen = new Set();
  for (const full of matches) {
    const rel = path.isAbsolute(full) ? toPosixRel(sideRoot, full) : full.split(path.sep).join('/');
    if (rel === '' || rel === '.') {
      continue;
    }
    if (isExcluded(rel)) {
      continue;
    }
    seen.add(rel);
  }
  return [...seen].toSorted((a, b) => (a < b ? -1 : a > b ? 1 : 0));
}

/**
 * 一覧の項目を 1 つのルートで展開する（境界）。
 * 項目ごとに `fs.globSync` を 1 回だけ呼び、項目と項目配下の配列を渡す。
 * 一致が 0 件の項目を `missing` に集める。辞書順にそろえる。
 * @param {string} sideRoot 側のルート
 * @param {readonly unknown[]} patterns 一覧の `copy` または `push`
 * @returns {Resolved} 辞書順
 */
export function collect(sideRoot, patterns) {
  /** @type {string[]} */
  const files = [];
  /** @type {string[]} */
  const missing = [];
  for (const entry of patterns ?? []) {
    if (typeof entry !== 'string' || entry === '') {
      continue;
    }
    const rel = entry.replace(/\/+$/, '');
    if (rel === '' || rel === '.') {
      continue;
    }
    /** @type {import('node:fs').Dirent[]} */
    let ents;
    try {
      ents = fs.globSync([rel, `${rel}/**/*`], {
        cwd: sideRoot,
        exclude: ['**/node_modules/**', '**/.git/**'],
        withFileTypes: true,
      });
    } catch (_unused) {
      missing.push(rel);
      continue;
    }
    if (ents.length === 0) {
      missing.push(rel);
      continue;
    }
    for (const ent of ents) {
      if (!ent.isFile()) {
        continue;
      }
      const parent = ent.parentPath ?? ent.path;
      files.push(path.join(parent, ent.name));
    }
  }
  const paths = toPaths(sideRoot, files);
  return { paths, missing: [...new Set(missing)].toSorted((a, b) => (a < b ? -1 : a > b ? 1 : 0)) };
}
