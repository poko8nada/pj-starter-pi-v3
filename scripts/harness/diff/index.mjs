// 両側の同じパスの中身を比べ、写す物を作る。
import * as fs from 'node:fs';
import * as path from 'node:path';

/**
 * コピー元からコピー先へ写す物と、コピー元で見つからなかった項目
 * @typedef {{ readonly copy: readonly string[], readonly missing: readonly string[] }} Diff
 */

/**
 * 両側の同じパスの中身を比べる（境界）。
 * @param {string} fromRoot 元のルート
 * @param {string} toRoot 先のルート
 * @param {string} rel `/` 区切りの相対パス
 * @returns {boolean} 中身が同じか
 */
export function sameFile(fromRoot, toRoot, rel) {
  try {
    const a = fs.readFileSync(path.join(fromRoot, rel));
    const b = fs.readFileSync(path.join(toRoot, rel));
    return a.equals(b);
  } catch (_unused) {
    return false;
  }
}

/**
 * 写す物を作る（純）。`isSame` が中身の比較。
 * @param {readonly string[]} fromPaths 元の側
 * @param {readonly string[]} toPaths 先の側
 * @param {(rel: string) => boolean} isSame 中身が同じか
 * @returns {readonly string[]} 辞書順
 */
export function diffPaths(fromPaths, toPaths, isSame) {
  const toSet = new Set(toPaths);
  /** @type {string[]} */
  const copy = [];
  for (const rel of fromPaths) {
    if (!toSet.has(rel)) {
      copy.push(rel);
      continue;
    }
    if (!isSame(rel)) {
      copy.push(rel);
    }
  }
  return copy.toSorted((a, b) => (a < b ? -1 : a > b ? 1 : 0));
}
