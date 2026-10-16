// ハーネスを運ぶ（スターターとプロダクトの間で差分で合わせる）。
// 使い方: node scripts/harness.mjs pull|push [--root <dir>] [--run]
// 仕組み: scripts/harness.json の一覧の内側のファイルを両側で集め、
// 元にある物は写し、先にだけある物は消す。既定は表示だけ、`--run` で実行する
import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';

/**
 * どちらへ運ぶか
 * @typedef {'pull' | 'push'} Direction
 */

/**
 * 引数（純）
 * @typedef {{ readonly direction: Direction, readonly root: string, readonly run: boolean }} Args
 */

/**
 * `scripts/harness.json` の形
 * @typedef {{ readonly copy: readonly string[], readonly skip: readonly string[] }} HarnessList
 */

/**
 * 一方の側にある、一覧の内側のファイル。root からの相対で `/` 区切り、辞書順
 * @typedef {readonly string[]} Side
 */

/**
 * 両側の差分
 * @typedef {{ readonly copy: Side, readonly remove: Side }} Diff
 */

/**
 * 実行した結果
 * @typedef {{ readonly copied: Side, readonly removed: Side }} Applied
 */

/**
 * 引数を解釈する（純）。
 * @param {readonly string[]} argv `process.argv.slice(2)` の形
 * @returns {Args}
 */
function parseArgs(argv) {
  let root = process.cwd();
  let run = false;
  /** @type {string[]} */
  const positionals = [];
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === '--run') {
      run = true;
    } else if (arg === '--root') {
      const value = argv[i + 1];
      if (value === undefined) {
        throw new Error('missing a value for --root');
      }
      root = value;
      i += 1;
    } else if (typeof arg === 'string' && arg.startsWith('--root=')) {
      const value = arg.slice('--root='.length);
      if (value === '') {
        throw new Error('missing a value for --root');
      }
      root = value;
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
  return { direction: first, root, run };
}

/**
 * 一覧を読む。無い / JSON として読めない / `copy` が配列でない → 道を入れた 1 つのエラーで投げる。02 もこれを読む
 * @param {string} root リポジトリの根
 * @returns {HarnessList}
 */
export function readList(root) {
  const file = path.join(root, 'scripts', 'harness.json');
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
    throw new Error(`the list is not valid JSON: ${file}`, { cause: error });
  }
  if (typeof data !== 'object' || data === null || !Array.isArray(data.copy)) {
    throw new Error(`the list is not valid JSON: ${file}`);
  }
  const skip = Array.isArray(data.skip) ? data.skip : [];
  return { copy: data.copy, skip };
}

/**
 * 相手側の道を読む。無い / 道が無い / 道に物が無い → 1 行で投げる。
 * `~` で始まる道は `os.homedir()` で開く。
 * @param {string} root こちら側の根
 * @returns {string} 相手側の絶対の道
 */
function readStarter(root) {
  const file = path.join(root, 'scripts', 'harness.local.json');
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
    throw new Error(`the list is not valid JSON: ${file}`, { cause: error });
  }
  const raw = typeof data === 'object' && data !== null ? data.starter : undefined;
  if (typeof raw !== 'string' || raw === '') {
    throw new Error(`no starter in ${file}`);
  }
  let expanded = raw;
  if (expanded === '~' || expanded.startsWith('~/')) {
    expanded = path.join(os.homedir(), expanded.slice(1));
  } else if (expanded.startsWith('~')) {
    expanded = path.join(os.homedir(), expanded.slice(1));
  }
  const starter = path.isAbsolute(expanded) ? expanded : path.resolve(expanded);
  if (!fs.existsSync(starter)) {
    throw new Error(`no such directory: ${starter}`);
  }
  return starter;
}

/**
 * `/` 区切りの相対に直す。
 * @param {string} sideRoot 側の根
 * @param {string} full 絶対の道
 * @returns {string}
 */
function toPosixRel(sideRoot, full) {
  return path.relative(sideRoot, full).split(path.sep).join('/');
}

/**
 * 一方の側の、一覧の内側のファイルを集める。`skip` の名を持つ区画には降りない。
 * `logs`、`node_modules`、`.git` は常に降りない。
 * @param {string} sideRoot 側の根
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
 * @param {string} fromRoot 元の根
 * @param {string} toRoot 先の根
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
 * @param {string} root こちら側の根
 * @param {Diff} diff 差分
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
  return lines;
}

/**
 * 差分を先に当てる（副作用）。`remove` を消して空の dir を払い、`copy` を写す。
 * @param {string} fromRoot 元の根
 * @param {string} toRoot 先の根
 * @param {HarnessList} list 一覧
 * @param {Diff} diff 差分
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
  return { copied: diff.copy, removed: diff.remove };
}

/**
 * 一覧の内側で空になった dir を消す（下から）。一覧自体の dir は残す。
 * 除外の名の区画には触らない。
 * @param {string} toRoot 先の根
 * @param {HarnessList} list 一覧
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
  const root = path.isAbsolute(args.root) ? args.root : path.resolve(args.root);
  /** @type {HarnessList} */
  let list;
  try {
    list = readList(root);
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    return 1;
  }
  let starter;
  try {
    starter = readStarter(root);
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    return 1;
  }
  const fromRoot = args.direction === 'pull' ? starter : root;
  const toRoot = args.direction === 'pull' ? root : starter;
  const fromSide = collectSide(fromRoot, list.copy, list.skip);
  const toSide = collectSide(toRoot, list.copy, list.skip);
  const diff = diffSides(fromRoot, toRoot, fromSide, toSide);
  for (const line of formatLines(args.direction, starter, root, diff)) {
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

process.exitCode = main(process.argv.slice(2));
