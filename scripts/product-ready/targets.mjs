import { existsSync, readdirSync, rmSync, statSync } from 'node:fs';
import { basename, isAbsolute, join } from 'node:path';

/** 消すテストの対象（root からの相対）。ディレクトリか、テストのファイルそのもの */
export const TEST_TARGETS = [
  '.pi',
  'scripts/product-ready',
  'test/env.test.ts',
  'scripts/typecheck-staged.test.ts',
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
 * 名指しの対象の中のテストを集める（純）。無い対象は飛ばす。
 *
 * @param {string} root リポジトリの根
 * @param {readonly string[]} targets 集める対象（root からの相対）。既定は名指し
 * @returns {readonly string[]} 見つけたテストの絶対パス（昇順）
 */
export function findTests(root, targets = TEST_TARGETS) {
  if (!existsSync(root)) {
    throw new Error(`no such directory: ${root}`);
  }
  const found = [];
  const walk = (dir) => {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      const path = join(dir, entry.name);
      if (entry.isDirectory()) {
        if (entry.name === 'node_modules' || entry.name === '.git') {
          continue;
        }
        walk(path);
      } else if (entry.isFile() && isTestFile(entry.name)) {
        found.push(path);
      }
    }
  };
  for (const target of targets) {
    const full = join(root, target);
    if (!existsSync(full)) {
      continue;
    }
    let isDir = false;
    try {
      isDir = statSync(full).isDirectory();
    } catch (_unused) {
      continue;
    }
    if (isDir) {
      walk(full);
    } else if (isTestFile(basename(full))) {
      found.push(full);
    }
  }
  return found.toSorted((a, b) => (a < b ? -1 : a > b ? 1 : 0));
}

/**
 * `cycles/` の下の全フォルダを集める（純）。今のサイクルも含む。
 *
 * @param {string} root リポジトリの根
 * @returns {readonly string[]} 見つけたフォルダの絶対パス（昇順）
 */
export function findCycles(root) {
  if (!existsSync(root)) {
    throw new Error(`no such directory: ${root}`);
  }
  const cyclesDir = join(root, 'cycles');
  if (!existsSync(cyclesDir)) {
    return [];
  }
  const found = [];
  for (const entry of readdirSync(cyclesDir, { withFileTypes: true })) {
    if (entry.isDirectory()) {
      found.push(join(cyclesDir, entry.name));
    }
  }
  return found.toSorted((a, b) => (a < b ? -1 : a > b ? 1 : 0));
}

function resolveIn(root, file) {
  return isAbsolute(file) ? file : join(root, file);
}

/**
 * テストを消す（副作用）。無い物は飛ばす。
 *
 * @param {string} root リポジトリの根（相対パス用）
 * @param {readonly string[]} files 消す物
 * @returns {readonly string[]} 消した物（渡された文字列のまま）
 */
export function removeTests(root, files) {
  const removed = [];
  for (const file of files) {
    const path = resolveIn(root, file);
    if (!existsSync(path)) {
      continue;
    }
    rmSync(path, { force: true });
    removed.push(file);
  }
  return removed;
}

/**
 * サイクルのフォルダを消す（副作用）。無い物は飛ばす。
 *
 * @param {string} root リポジトリの根（相対パス用）
 * @param {readonly string[]} dirs 消す物
 * @returns {readonly string[]} 消した物（渡された文字列のまま）
 */
export function removeCycles(root, dirs) {
  const removed = [];
  for (const dir of dirs) {
    const path = resolveIn(root, dir);
    if (!existsSync(path)) {
      continue;
    }
    rmSync(path, { recursive: true, force: true });
    removed.push(dir);
  }
  return removed;
}
