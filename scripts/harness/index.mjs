// ハーネスを運ぶ（スターターとプロダクトの間で差分で合わせる）。
// 使い方: node scripts/harness/index.mjs pull|push [--run]
// 仕組み: scripts/harness/harness.json の一覧の内側のファイルを両側で集め、
// 元にある物は写し、先にだけある物は消し、古い道は `legacy` として消す。既定は表示だけ、`--run` で実行する
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
 * 一方の側にある、一覧の内側のファイル。root からの相対で `/` 区切り、辞書順
 * @typedef {readonly string[]} Side
 */

/**
 * 両側の差分と先に残る古い道
 * @typedef {{ readonly copy: Side, readonly remove: Side, readonly legacy: Side }} Diff
 */

/**
 * 実行した結果
 * @typedef {{ readonly copied: Side, readonly removed: Side, readonly legacy: Side }} Applied
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
 * スターターの道を読む。`scripts/harness/starter.json` を読み、`~` は HOME に開き、相対は `root` から解決する。
 * 解決した道が `root` と同じなら `self`、違えば `other` を返す。無い / JSON でない / 中身が無い / 道に物が無い → 1 行で投げる。
 * @param {string} root こちら側のルート
 * @returns {{ readonly kind: 'self' | 'other', readonly path: string }} スターターの向きと絶対の道
 */
function readStarter(root) {
  const file = path.join(root, 'scripts', 'harness', 'starter.json');
  let text;
  try {
    text = fs.readFileSync(file, 'utf8');
  } catch (error) {
    throw new Error(`no such file: ${file}`, { cause: error });
  }
  let data;
  try {
    data = JSON.parse(text);
  } catch (error) {
    throw new Error(`the starter is not valid JSON: ${file}`, { cause: error });
  }
  const raw = typeof data === 'object' && data !== null ? data.starter : undefined;
  if (typeof raw !== 'string' || raw === '') {
    throw new Error(`no starter in ${file}`);
  }
  let expanded = raw;
  if (expanded.startsWith('~')) {
    expanded = path.join(os.homedir(), expanded.slice(1));
  }
  const rootAbs = path.resolve(root);
  const starter = path.isAbsolute(expanded)
    ? path.resolve(expanded)
    : path.resolve(rootAbs, expanded);
  if (!fs.existsSync(starter)) {
    throw new Error(`no such directory: ${starter}`);
  }
  if (starter === rootAbs) {
    return { kind: 'self', path: starter };
  }
  return { kind: 'other', path: starter };
}

/**
 * `/` 区切りの相対に直す。
 * @param {string} sideRoot 側のルート
 * @param {string} full 絶対の道
 * @returns {string}
 */
function toPosixRel(sideRoot, full) {
  return path.relative(sideRoot, full).split(path.sep).join('/');
}

/**
 * 一方の側の、一覧の内側のファイルを集める。`skip` の名を持つ区画には降りない。
 * `logs`、`node_modules`、`.git` は常に降りない。
 * @param {string} sideRoot 側のルート
 * @param {readonly unknown[]} copy 一覧の `copy`
 * @param {readonly unknown[]} skip 一覧の `skip`
 * @returns {Side} 辞書順
 */
function collectSide(sideRoot, copy, skip) {
  /** @type {Set<string>} */
  const skipNames = new Set(['logs', 'node_modules', '.git']);
  for (const entry of skip) {
    if (typeof entry !== 'string' || entry === '') {
      continue;
    }
    const base = entry.split('/').pop();
    if (base !== undefined && base !== '') {
      skipNames.add(base);
    }
  }
  /** @type {string[]} */
  const out = [];
  /**
   * @param {string} dir 絶対の dir
   */
  const walk = (dir) => {
    /** @type {import('node:fs').Dirent[]} */
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      if (skipNames.has(entry.name)) {
        continue;
      }
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        walk(full);
      } else if (entry.isFile()) {
        out.push(toPosixRel(sideRoot, full));
      }
    }
  };
  for (const entry of copy) {
    if (typeof entry !== 'string' || entry === '') {
      continue;
    }
    const rel = entry.replace(/\/+$/, '');
    if (rel === '' || rel === '.') {
      continue;
    }
    const base = rel.split('/').pop();
    if (base !== undefined && skipNames.has(base)) {
      continue;
    }
    const full = path.join(sideRoot, rel);
    let stat;
    try {
      stat = fs.statSync(full);
    } catch (_unused) {
      continue;
    }
    if (stat.isFile()) {
      out.push(toPosixRel(sideRoot, full));
    } else if (stat.isDirectory()) {
      walk(full);
    }
  }
  out.sort();
  return out;
}

/**
 * 両側の差分を作る（純）。`copy` は元にあって先と中身が違う物か先に無い物、`remove` は先にだけある物。
 * @param {string} fromRoot 元のルート
 * @param {string} toRoot 先のルート
 * @param {Side} fromSide 元の側
 * @param {Side} toSide 先の側
 * @returns {Diff}
 */
function diffSides(fromRoot, toRoot, fromSide, toSide) {
  const toSet = new Set(toSide);
  const fromSet = new Set(fromSide);
  /** @type {string[]} */
  const copy = [];
  for (const rel of fromSide) {
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
  const remove = toSide.filter((rel) => !fromSet.has(rel));
  return { copy, remove };
}

/**
 * 表示の行を作る（純）。
 * @param {Direction} direction 向き
 * @param {string} starter 相手側の道
 * @param {string} root こちら側のルート
 * @param {Diff} diff 差分と古い道
 * @returns {readonly string[]}
 */
function formatLines(direction, starter, root, diff) {
  /** @type {string[]} */
  const lines = [];
  lines.push(direction === 'pull' ? `pull: ${starter} → ${root}` : `push: ${root} → ${starter}`);
  if (diff.copy.length === 0) {
    lines.push('no files to copy');
  } else {
    lines.push(`copy (${diff.copy.length}):`);
    for (const rel of diff.copy) {
      lines.push(`  ${rel}`);
    }
  }
  if (diff.remove.length === 0) {
    lines.push('no files to remove');
  } else {
    lines.push(`remove (${diff.remove.length}):`);
    for (const rel of diff.remove) {
      lines.push(`  ${rel}`);
    }
  }
  const legacy = diff.legacy ?? [];
  if (legacy.length === 0) {
    lines.push('no legacy to remove');
  } else {
    lines.push(`legacy (${legacy.length}):`);
    for (const rel of legacy) {
      lines.push(`  ${rel}`);
    }
  }
  return lines;
}

/**
 * 差分を先に当てる（副作用）。`remove` を消して空の dir を払い、`copy` を写し、後に `legacy` を消す。
 * @param {string} fromRoot 元のルート
 * @param {string} toRoot 先のルート
 * @param {import('./list.mjs').HarnessList} list 一覧
 * @param {Diff} diff 差分と古い道
 * @returns {Applied}
 */
export function applyTo(fromRoot, toRoot, list, diff) {
  for (const rel of diff.remove) {
    fs.rmSync(path.join(toRoot, rel), { force: true });
  }
  pruneEmptyDirs(toRoot, list);
  for (const rel of diff.copy) {
    const dst = path.join(toRoot, rel);
    fs.mkdirSync(path.dirname(dst), { recursive: true });
    fs.copyFileSync(path.join(fromRoot, rel), dst);
  }
  const legacy = diff.legacy ?? [];
  for (const rel of legacy) {
    fs.rmSync(path.join(toRoot, rel), { recursive: true, force: true });
  }
  return { copied: diff.copy, removed: diff.remove, legacy };
}

/**
 * 一覧の内側で空になった dir を消す（下から）。一覧自体の dir は残す。
 * 除外の名の区画には触らない。
 * @param {string} toRoot 先のルート
 * @param {import('./list.mjs').HarnessList} list 一覧
 */
function pruneEmptyDirs(toRoot, list) {
  /** @type {Set<string>} */
  const skipNames = new Set(['logs', 'node_modules', '.git']);
  for (const entry of list.skip) {
    if (typeof entry !== 'string' || entry === '') {
      continue;
    }
    const base = entry.split('/').pop();
    if (base !== undefined && base !== '') {
      skipNames.add(base);
    }
  }
  /** @type {string[]} */
  const roots = [];
  for (const entry of list.copy) {
    if (typeof entry !== 'string' || entry === '') {
      continue;
    }
    const rel = entry.replace(/\/+$/, '');
    if (rel === '' || rel === '.') {
      continue;
    }
    const base = rel.split('/').pop();
    if (base !== undefined && skipNames.has(base)) {
      continue;
    }
    let stat;
    try {
      stat = fs.statSync(path.join(toRoot, rel));
    } catch (_unused) {
      continue;
    }
    if (stat.isDirectory()) {
      roots.push(rel);
    }
  }
  /** @type {string[]} */
  const dirs = [];
  /**
   * @param {string} dir 絶対の dir
   */
  const walk = (dir) => {
    /** @type {import('node:fs').Dirent[]} */
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      if (skipNames.has(entry.name)) {
        continue;
      }
      if (entry.isDirectory()) {
        const full = path.join(dir, entry.name);
        dirs.push(full);
        walk(full);
      }
    }
  };
  for (const rel of roots) {
    try {
      walk(path.join(toRoot, rel));
    } catch (_unused) {
      continue;
    }
  }
  dirs.sort((a, b) => b.length - a.length);
  for (const dir of dirs) {
    try {
      fs.rmdirSync(dir);
    } catch (_unused) {
      // 空でなければ残す
    }
  }
}

/**
 * 先に残る古い道のうち、実在する物だけを集める（一覧の順）。
 * @param {string} toRoot 先のルート
 * @param {readonly unknown[]} legacy 一覧の `legacy`
 * @returns {Side}
 */
function collectLegacy(toRoot, legacy) {
  /** @type {string[]} */
  const out = [];
  for (const entry of legacy ?? []) {
    if (typeof entry !== 'string' || entry === '') {
      continue;
    }
    try {
      if (fs.existsSync(path.join(toRoot, entry))) {
        out.push(entry);
      }
    } catch (_unused) {
      continue;
    }
  }
  return out;
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
  let starter;
  try {
    starter = readStarter(root);
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    return 1;
  }
  if (starter.kind === 'self') {
    console.log(`same: ${starter.path}`);
    return 0;
  }
  /** @type {import('./list.mjs').HarnessList} */
  let list;
  try {
    list = readList(root);
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    return 1;
  }
  const fromRoot = args.direction === 'pull' ? starter.path : root;
  const toRoot = args.direction === 'pull' ? root : starter.path;
  const fromSide = collectSide(fromRoot, list.copy, list.skip);
  const toSide = collectSide(toRoot, list.copy, list.skip);
  const base = diffSides(fromRoot, toRoot, fromSide, toSide);
  const diff = { ...base, legacy: collectLegacy(toRoot, list.legacy) };
  for (const line of formatLines(args.direction, starter.path, root, diff)) {
    console.log(line);
  }
  if (!args.run) {
    return 0;
  }
  try {
    applyTo(fromRoot, toRoot, list, diff);
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    return 1;
  }
  return 0;
}

const invokedAsMain =
  process.argv[1] !== undefined && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (invokedAsMain) {
  process.exitCode = main(process.argv.slice(2));
}
