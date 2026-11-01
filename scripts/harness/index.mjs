// ハーネスを運ぶ（スターターとプロダクトの間で差分で合わせる）。
// 使い方: node scripts/harness/index.mjs pull|push [--run]
// 仕組み: scripts/harness/harness.json の一覧の内側のファイルを両側で集め、
// 元にある物は写す。既定は表示だけ、`--run` で実行する
import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';
import { readList } from './list.mjs';

/**
 * どちらへ運ぶか
 * @typedef {'pull' | 'push'} Direction
 */

/**
 * 引数（純）
 * @typedef {{ readonly direction: Direction, readonly run: boolean }} Args
 */

/**
 * 一覧の項目を 1 つのルートで展開した結果。パスは `/` 区切りで、そのルートからの相対
 * @typedef {{ readonly paths: readonly string[], readonly missing: readonly string[] }} Resolved
 */

/**
 * 元から先へ写す物と、元で見つからなかった項目
 * @typedef {{ readonly copy: readonly string[], readonly missing: readonly string[] }} Diff
 */

/**
 * `--run` で写した物
 * @typedef {{ readonly copied: readonly string[] }} Applied
 */

/**
 * 相手の向きと、解決した絶対のパス
 * @typedef {{ readonly kind: 'self' | 'other', readonly path: string }} Starter
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
 * 相手のパスを、`~` と相対を開いて決める。
 * 解決したパスが `root` と同じなら `self`、違えば `other` を返す。指されたパスが無い → 1 行で投げる。
 * @param {string} root こちら側のルート
 * @param {string} starter 一覧の `starter`
 * @returns {Starter} 相手の向きと絶対のパス
 */
export function resolveStarter(root, starter) {
  let expanded = starter;
  if (expanded.startsWith('~')) {
    expanded = path.join(os.homedir(), expanded.slice(1));
  }
  const rootAbs = path.resolve(root);
  const starterPath = path.isAbsolute(expanded)
    ? path.resolve(expanded)
    : path.resolve(rootAbs, expanded);
  if (!fs.existsSync(starterPath)) {
    throw new Error(`no such directory: ${starterPath}`);
  }
  if (starterPath === rootAbs) {
    return { kind: 'self', path: starterPath };
  }
  return { kind: 'other', path: starterPath };
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
 * 除外する区画かどうか（`node_modules` と `.git`）。
 * @param {string} rel `/` 区切りの相対
 * @returns {boolean}
 */
function isExcluded(rel) {
  return rel.split('/').includes('node_modules') || rel.split('/').includes('.git');
}

/**
 * 一方の側のファイルを集める。一覧の項目を `fs.globSync` で展開し、一致が 0 件の項目を `missing` に集める。
 * `node_modules` と `.git` は外す。辞書順にそろえる。
 * @param {string} sideRoot 側のルート
 * @param {readonly unknown[]} patterns 一覧の `copy` または `push`
 * @returns {Resolved} 辞書順
 */
function collect(sideRoot, patterns) {
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
    /** @type {string[]} */
    let matches;
    try {
      matches = fs.globSync(rel, {
        cwd: sideRoot,
        exclude: ['**/node_modules/**', '**/.git/**'],
      });
    } catch (_unused) {
      missing.push(rel);
      continue;
    }
    const kept = matches.filter((m) => !isExcluded(m));
    if (kept.length === 0) {
      missing.push(rel);
      continue;
    }
    for (const m of kept) {
      const abs = path.resolve(sideRoot, m);
      let stat;
      try {
        stat = fs.statSync(abs);
      } catch (_unused) {
        continue;
      }
      if (stat.isFile()) {
        const posix = toPosixRel(sideRoot, abs);
        if (!isExcluded(posix)) {
          files.push(posix);
        }
      } else if (stat.isDirectory()) {
        /** @type {string[]} */
        let inner;
        try {
          inner = fs.globSync(`${m}/**/*`, {
            cwd: sideRoot,
            exclude: ['**/node_modules/**', '**/.git/**'],
          });
        } catch (_unused) {
          continue;
        }
        for (const im of inner) {
          if (isExcluded(im)) {
            continue;
          }
          const iabs = path.resolve(sideRoot, im);
          try {
            const istat = fs.statSync(iabs);
            if (istat.isFile()) {
              files.push(toPosixRel(sideRoot, iabs));
            }
          } catch (_unused) {
            continue;
          }
        }
      }
    }
  }
  const paths = [...new Set(files)].toSorted();
  const misses = [...new Set(missing)].toSorted();
  return { paths, missing: misses };
}

/**
 * 両側の差分を作る（純）。`copy` は元にあって先と中身が違う物か先に無い物。
 * @param {string} fromRoot 元のルート
 * @param {string} toRoot 先のルート
 * @param {readonly string[]} fromPaths 元の側
 * @param {readonly string[]} toPaths 先の側
 * @returns {readonly string[]} 辞書順
 */
function diffSides(fromRoot, toRoot, fromPaths, toPaths) {
  const toSet = new Set(toPaths);
  /** @type {string[]} */
  const copy = [];
  for (const rel of fromPaths) {
    if (!toSet.has(rel)) {
      copy.push(rel);
      continue;
    }
    let same = false;
    try {
      const a = fs.readFileSync(path.join(fromRoot, rel));
      const b = fs.readFileSync(path.join(toRoot, rel));
      same = a.equals(b);
    } catch (_unused) {
      same = false;
    }
    if (!same) {
      copy.push(rel);
    }
  }
  return copy.toSorted();
}

/**
 * 表示の行を作る（純）。
 * @param {Direction} direction 向き
 * @param {string} starter 相手側のパス
 * @param {string} root こちら側のルート
 * @param {Diff} diff 差分と見つからなかった項目
 * @returns {readonly string[]}
 */
function formatLines(direction, starter, root, diff) {
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

/**
 * 差分を先に当てる（副作用）。`copy` を写すだけにする。
 * @param {string} fromRoot 元のルート
 * @param {string} toRoot 先のルート
 * @param {Diff} diff 差分と見つからなかった項目
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
  /** @type {import('./list.mjs').HarnessList} */
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
  const copy = diffSides(fromRoot, toRoot, fromSide.paths, toSide.paths);
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
