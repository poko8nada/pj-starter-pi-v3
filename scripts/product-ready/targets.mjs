import { existsSync, readdirSync, rmSync } from 'node:fs';
import { isAbsolute, join } from 'node:path';

/**
 * `.pi/` の下の `*.test.ts` を集める（純）。
 *
 * @param {string} root リポジトリの根
 * @returns {readonly string[]} 見つけたテストの絶対パス（昇順）
 */
export function findTests(root) {
  if (!existsSync(root)) {
    throw new Error(`no such directory: ${root}`);
  }
  const piDir = join(root, '.pi');
  if (!existsSync(piDir)) {
    return [];
  }
  const found = [];
  const walk = (dir) => {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      const path = join(dir, entry.name);
      if (entry.isDirectory()) {
        walk(path);
      } else if (entry.isFile() && entry.name.endsWith('.test.ts')) {
        found.push(path);
      }
    }
  };
  walk(piDir);
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
