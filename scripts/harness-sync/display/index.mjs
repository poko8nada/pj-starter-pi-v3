// 表示の行を作る（副作用なし）。
/**
 * どちらへ運ぶか
 * @typedef {'pull' | 'push'} Direction
 */

/**
 * 表示の行を作る（副作用なし）。
 * @param {Direction} direction 向き
 * @param {string} starter 相手側のパス
 * @param {string} root こちら側のルート
 * @param {import('../diff/index.mjs').Diff} diff 差分と見つからなかった項目
 * @returns {readonly string[]}
 */
export function formatLines(direction, starter, root, diff) {
  /** @type {string[]} */
  const lines = [];
  lines.push(direction === 'pull' ? `pull: ${starter} → ${root}` : `push: ${root} → ${starter}`);
  if (diff.missing.length === 0) {
    lines.push('no files missing');
  } else {
    lines.push(`missing (${diff.missing.length}):`);
    for (const rel of diff.missing) {
      lines.push(`  ${rel}`);
    }
  }
  if (diff.copy.length === 0) {
    lines.push('no files to copy');
  } else {
    lines.push(`copy (${diff.copy.length}):`);
    for (const rel of diff.copy) {
      lines.push(`  ${rel}`);
    }
  }
  return lines;
}
