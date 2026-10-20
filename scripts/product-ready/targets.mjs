import { existsSync, readdirSync, rmSync, statSync } from 'node:fs';
import { join } from 'node:path';

/** スターターだけの物の 1 行 */
export const STARTER_ONLY = [{ label: 'cycles', at: 'cycles', pick: 'dirs' }];

/**
 * 消す物を集める（純）。
 *
 * @param {string} root リポジトリのルート
 * @param {string} [only] 絞る label（undefined なら全行）
 * @returns {readonly { readonly label: string, readonly at: string, readonly path: string }[]} 見つけた物（`at` の昇順）
 */
export function plan(root, only) {
  if (!existsSync(root)) {
    throw new Error(`no such directory: ${root}`);
  }
  const rows = only === undefined ? STARTER_ONLY : STARTER_ONLY.filter((row) => row.label === only);
  /** @type {{ readonly label: string, readonly at: string, readonly path: string }[]} */
  const out = [];
  for (const row of rows) {
    if (row.pick === 'dirs') {
      const base = join(root, row.at);
      if (!existsSync(base)) {
        continue;
      }
      for (const entry of readdirSync(base, { withFileTypes: true })) {
        if (entry.isDirectory()) {
          out.push({
            label: row.label,
            at: join(row.at, entry.name),
            path: join(base, entry.name),
          });
        }
      }
    }
  }
  return out.toSorted((a, b) => (a.at < b.at ? -1 : a.at > b.at ? 1 : 0));
}

/**
 * 消す物を消す（副作用）。無い物は飛ばす。
 *
 * @param {readonly { readonly label: string, readonly at: string, readonly path: string }[]} entries 消す物
 * @returns {readonly string[]} 消した物の `at`
 */
export function remove(entries) {
  const removed = [];
  for (const entry of entries) {
    const path = entry.path;
    if (!existsSync(path)) {
      continue;
    }
    let isDir = false;
    try {
      isDir = statSync(path).isDirectory();
    } catch (_unused) {
      continue;
    }
    if (isDir) {
      rmSync(path, { recursive: true, force: true });
    } else {
      rmSync(path, { force: true });
    }
    removed.push(entry.at);
  }
  return removed;
}

/**
 * 表示する label（一覧の順、重複なし）。only があればその 1 つ。
 *
 * @param {string} [only] 絞る label（undefined なら全 label）
 * @returns {readonly string[]} label
 */
export function labels(only) {
  if (only !== undefined) {
    return [only];
  }
  const out = [];
  for (const row of STARTER_ONLY) {
    if (!out.includes(row.label)) {
      out.push(row.label);
    }
  }
  return out;
}
