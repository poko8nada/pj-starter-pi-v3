import { existsSync, readdirSync, rmSync, statSync } from 'node:fs';
import { basename, join, relative } from 'node:path';

/** 消す物の 1 行 */
export const STARTER_ONLY = [
  { label: 'harness', at: 'scripts/harness-scopes.json', pick: 'file' },
  { label: 'tests', at: '.pi', pick: 'tests' },
  { label: 'tests', at: 'scripts/product-ready', pick: 'tests' },
  { label: 'tests', at: 'test/env.test.ts', pick: 'file' },
  { label: 'tests', at: 'scripts/typecheck-staged.test.ts', pick: 'file' },
  { label: 'cycles', at: 'cycles', pick: 'dirs' },
];

// テストのファイルか（vitest の既定 include に合わせる）。
// 既定は `**/*.{test,spec}.?(c|m)[jt]s?(x)`。ここがずれると（ゆるめる／狭める）、
// 消し残しや食いすぎで「0本」が言えなくなるので、変えるときは両方を直す。
// 名指しのファイルも同じ物差しで見る（テストでない名指しは拾わない）。
/**
 * @param {string} name ファイル名
 * @returns {boolean} テストなら真
 */
function isTestFile(name) {
  return /\.(test|spec)\.(c|m)?[jt]sx?$/.test(name);
}

/**
 * 消す物を集める（純）。
 *
 * @param {string} root リポジトリの根
 * @param {string} [only] 絞る label（undefined なら全行）
 * @returns {readonly { readonly label: string, readonly at: string, readonly path: string }[]} 見つけた物（`at` の昇順）
 */
export function plan(root, only) {
  if (!existsSync(root)) {
    throw new Error(`no such directory: ${root}`);
  }
  const rows = only === undefined ? STARTER_ONLY : STARTER_ONLY.filter((row) => row.label === only);
  const walk = (dir) => {
    const paths = [];
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      const path = join(dir, entry.name);
      if (entry.isDirectory()) {
        if (entry.name === 'node_modules' || entry.name === '.git') {
          continue;
        }
        paths.push(...walk(path));
      } else if (entry.isFile() && isTestFile(entry.name)) {
        paths.push(path);
      }
    }
    return paths;
  };
  /** @type {{ readonly label: string, readonly at: string, readonly path: string }[]} */
  const out = [];
  for (const row of rows) {
    if (row.pick === 'file') {
      const full = join(root, row.at);
      if (!existsSync(full)) {
        continue;
      }
      out.push({ label: row.label, at: row.at, path: full });
    } else if (row.pick === 'tests') {
      const base = join(root, row.at);
      if (!existsSync(base)) {
        continue;
      }
      let isDir = false;
      try {
        isDir = statSync(base).isDirectory();
      } catch (_unused) {
        continue;
      }
      if (isDir) {
        for (const hit of walk(base)) {
          out.push({ label: row.label, at: relative(root, hit), path: hit });
        }
      } else if (isTestFile(basename(base))) {
        out.push({ label: row.label, at: row.at, path: base });
      }
    } else if (row.pick === 'dirs') {
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
