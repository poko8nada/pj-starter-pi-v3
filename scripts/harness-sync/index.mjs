// ハーネスを運ぶ（スターターとプロダクトの間で差分で合わせる）。
// 使い方: node scripts/harness-sync/index.mjs pull|push [--run]
// 仕組み: scripts/harness-sync/setting.json の一覧の内側のファイルを両側で集め、
// 元にある物は写す。既定は表示だけ、`--run` で実行する
import * as fs from 'node:fs';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';
import { collect } from './collect/index.mjs';
import { diffPaths, sameFile } from './diff/index.mjs';
import { formatLines } from './display/index.mjs';
import { readList } from './list/index.mjs';
import { resolveStarter } from './path/index.mjs';

/**
 * 引数（副作用なし）
 * @typedef {{ readonly direction: import('./display/index.mjs').Direction, readonly run: boolean }} Args
 */

/**
 * `--run` で写した物
 * @typedef {{ readonly copied: readonly string[] }} Applied
 */

/**
 * 引数を解釈する
 * @param {readonly string[]} argv `process.argv.slice(2)` の形
 * @returns {Args}
 */
function parseArgs(argv) {
  let run = false;
  /** @type {string[]} */
  const positionals = [];
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === '--run') {
      run = true;
    } else if (typeof arg === 'string' && arg.startsWith('--')) {
      throw new Error(`unknown argument: ${arg}`);
    } else {
      positionals.push(arg);
    }
  }
  if (positionals.length === 0) {
    throw new Error('missing direction: pull or push');
  }
  if (positionals.length > 1) {
    throw new Error(`unknown argument: ${positionals[1]}`);
  }
  const first = positionals[0];
  if (first !== 'pull' && first !== 'push') {
    throw new Error(`unknown direction: ${first}`);
  }
  return { direction: first, run };
}

/**
 * 差分を先に当てる（副作用）。`copy` を写すだけにする。
 * @param {string} fromRoot 元のルート
 * @param {string} toRoot 先のルート
 * @param {import('./diff/index.mjs').Diff} diff 差分と見つからなかった項目
 * @returns {Applied}
 */
export function applyTo(fromRoot, toRoot, diff) {
  for (const rel of diff.copy) {
    const dst = path.join(toRoot, rel);
    fs.mkdirSync(path.dirname(dst), { recursive: true });
    fs.copyFileSync(path.join(fromRoot, rel), dst);
  }
  return { copied: diff.copy };
}

/**
 * 入口。既定は表示だけ、`--run` で実行する。
 * @param {readonly string[]} argv `process.argv.slice(2)` の形
 * @returns {number} 終了コード（0 か 1）
 */
export function main(argv) {
  let args;
  try {
    args = parseArgs(argv);
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    return 1;
  }
  const root = process.cwd();
  /** @type {import('./list/index.mjs').HarnessList} */
  let list;
  try {
    list = readList(root);
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    return 1;
  }
  let starter;
  try {
    starter = resolveStarter(root, list.starter);
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    return 1;
  }
  if (starter.kind === 'self') {
    console.log(`same: ${starter.path}`);
    return 0;
  }
  const patterns = args.direction === 'pull' ? list.copy : list.push;
  const fromRoot = args.direction === 'pull' ? starter.path : root;
  const toRoot = args.direction === 'pull' ? root : starter.path;
  const fromSide = collect(fromRoot, patterns);
  const toSide = collect(toRoot, patterns);
  const copy = diffPaths(fromSide.paths, toSide.paths, (rel) => sameFile(fromRoot, toRoot, rel));
  const diff = { copy, missing: fromSide.missing };
  for (const line of formatLines(args.direction, starter.path, root, diff)) {
    console.log(line);
  }
  if (!args.run) {
    return diff.missing.length > 0 ? 1 : 0;
  }
  try {
    applyTo(fromRoot, toRoot, diff);
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    return 1;
  }
  return diff.missing.length > 0 ? 1 : 0;
}

const invokedAsMain =
  process.argv[1] !== undefined && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (invokedAsMain) {
  process.exitCode = main(process.argv.slice(2));
}
