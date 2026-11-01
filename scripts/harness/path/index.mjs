// 相手のパスを解決する（`~` と相対を開く）。
import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';

/**
 * 相手が自分か他かと、解決した絶対のパス
 * @typedef {{ readonly kind: 'self' | 'other', readonly path: string }} Starter
 */

/**
 * 相手のパスを、`~` と相対を解決する（副作用なし）。
 * @param {string} root こちら側のルート
 * @param {string} starter 一覧の `starter`
 * @returns {string} 解決した絶対のパス
 */
export function resolvePath(root, starter) {
  let expanded = starter;
  if (expanded.startsWith('~')) {
    expanded = path.join(os.homedir(), expanded.slice(1));
  }
  const rootAbs = path.resolve(root);
  if (path.isAbsolute(expanded)) {
    return path.resolve(expanded);
  }
  return path.resolve(rootAbs, expanded);
}

/**
 * 相手のパスを決め、存在を確認する（境界）。
 * @param {string} root こちら側のルート
 * @param {string} starter 一覧の `starter`
 * @returns {Starter} 相手の向きと絶対のパス
 */
export function resolveStarter(root, starter) {
  const starterPath = resolvePath(root, starter);
  if (!fs.existsSync(starterPath)) {
    throw new Error(`no such directory: ${starterPath}`);
  }
  const rootAbs = path.resolve(root);
  if (starterPath === rootAbs) {
    return { kind: 'self', path: starterPath };
  }
  return { kind: 'other', path: starterPath };
}
