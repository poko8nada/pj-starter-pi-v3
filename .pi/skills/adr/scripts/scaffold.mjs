/**
 * scaffold — 新 cycle のフォルダと `adr.md` の骨を出す。
 *
 *   node scaffold.mjs [--root <dir>] [<nnn>]
 */
import { spawnSync } from 'node:child_process';
import { mkdirSync, readdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { gitEnv } from '../../../../lib/git-env.mjs';

/**
 * `adr.md` の骨。`references/format.md` の形と合わせること。
 * @param {number} nnn
 * @returns {string}
 */
export function adrSkeleton(nnn) {
  return `# ADR ${String(nnn).padStart(3, '0')}

## 01: <問い>

### Context

- <何が起きていて、何をしたいか>

### Decision

- Status: **accepted** | **rejected**（理由）
- Adopted:
- Options:
  - <案>（採らなかった理由）

### Research & Trial

- <測った事実、試した事>

### Definition Change

- \`Unit.<name>\`(updated): <新しい行>
- なし
`;
}

/**
 * ブランチ名から cycle フォルダ用の slug を作る。空だけはここが落とす。
 * 完全一致（main→main、develop→dev）、先頭セグメント（feature→feat）の順で写像し、
 * 結合してから sanitize（小文字化、英数以外を `-`、連続と端の除去）する。
 * @param {string} branch
 * @returns {string}
 */
export function slugBranch(branch) {
  if (branch === 'main') return 'main';
  if (branch === 'develop') return 'dev';
  const parts = branch.split('/');
  if (parts.length > 0 && parts[0].toLowerCase() === 'feature') {
    parts[0] = 'feat';
  }
  const joined = parts.join('-');
  const sanitized = joined.toLowerCase().replace(/[^a-z0-9]/g, '-');
  const collapsed = sanitized.replace(/-+/g, '-').replace(/^-|-$/g, '');
  if (collapsed === '') return 'no-branch';
  return collapsed;
}

/**
 * ローカル日付から YYMMDD を作る。
 * @param {Date} date
 * @returns {string}
 */
export function toYYMMDD(date) {
  const yy = String(date.getFullYear() % 100).padStart(2, '0');
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  return `${yy}${mm}${dd}`;
}

/**
 * 名前から NNN を抜く。新形 `YYMMDD-NNN-slug` を先に、旧形 `NNN-YYYY-MM-DD` を後に見る。
 * @param {string} name
 * @returns {number | null}
 */
function extractNNN(name) {
  const next = /^\d{6}-(\d{3})-/.exec(name);
  if (next) return Number(next[1]);
  const prev = /^(\d{3})-/.exec(name);
  if (prev) return Number(prev[1]);
  return null;
}

/**
 * 両ルートを合流させた名前の並びから次番号を決める。合わない物は飛ばす。空 → 1。
 * @param {readonly string[]} names
 * @returns {number}
 */
export function nextNNN(names) {
  let max = 0;
  for (const name of names) {
    const n = extractNNN(name);
    if (n !== null && n > max) max = n;
  }
  return max + 1;
}

/**
 * cycle のフォルダ名を組み立てる。0 埋めはここがやる。
 * @param {number} nnn
 * @param {string} yymmdd
 * @param {string} slug
 * @returns {string}
 */
export function cycleDirName(nnn, yymmdd, slug) {
  return `${yymmdd}-${String(nnn).padStart(3, '0')}-${slug}`;
}

/**
 * 親の下に葉だけを非 recursive で作り、path を返す。存在すれば EEXIST で投げる。
 * @param {string} parentDir
 * @param {string} name
 * @returns {string}
 */
export function createLeafDir(parentDir, name) {
  const leaf = join(parentDir, name);
  mkdirSync(leaf);
  return leaf;
}

/**
 * CLI 引数を読む。root 既定は cwd。位置引数は番号 (`/^\d+$/`、1 以上)。`--root` 値欠落・未知引数・番号外・2 つ目は投げる。
 * @param {readonly string[]} argv
 * @returns {{ root: string, nnn: number | null }}
 */
export function parseArgs(argv) {
  let root = process.cwd();
  let nnn = null;
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === '--root') {
      const value = argv[i + 1];
      if (value === undefined) throw new Error('missing value for --root');
      root = value;
      i++;
    } else if (arg.startsWith('-')) {
      throw new Error(`unknown argument: ${arg}`);
    } else {
      if (nnn !== null) throw new Error(`too many arguments: ${arg}`);
      if (!/^\d+$/.test(arg)) throw new Error(`not a cycle number: ${arg}`);
      const n = Number(arg);
      if (n < 1) throw new Error(`not a cycle number: ${arg}`);
      nnn = n;
    }
  }
  return { root, nnn };
}

/**
 * `cycles/` と `cycles/archive/` の下の dir 名を集める。番号でない物（`archive`）も入る。無いルートは空として扱う。
 * @param {string} cyclesDir
 * @param {string} archiveDir
 * @returns {readonly string[]}
 */
export function dirNames(cyclesDir, archiveDir) {
  const names = [];
  for (const dir of [cyclesDir, archiveDir]) {
    let entries;
    try {
      entries = readdirSync(dir, { withFileTypes: true });
    } catch (err) {
      if (err && err.code === 'ENOENT') continue;
      throw err;
    }
    for (const entry of entries) {
      if (entry.isDirectory()) names.push(entry.name);
    }
  }
  return names;
}

const isMain = process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;
if (isMain) {
  const { root, nnn: argNNN } = parseArgs(process.argv.slice(2));
  const cyclesDir = join(root, 'cycles');
  const archiveDir = join(cyclesDir, 'archive');
  let branch = '';
  try {
    const spawned = spawnSync('git', ['branch', '--show-current'], {
      cwd: root,
      encoding: 'utf8',
      env: gitEnv(),
    });
    if (spawned.status === 0) branch = (spawned.stdout ?? '').trim();
  } catch {
    branch = '';
  }
  const nnn = argNNN ?? nextNNN(dirNames(cyclesDir, archiveDir));
  const dirName = cycleDirName(nnn, toYYMMDD(new Date()), slugBranch(branch));
  mkdirSync(cyclesDir, { recursive: true });
  let leaf;
  try {
    leaf = createLeafDir(cyclesDir, dirName);
  } catch (err) {
    if (err && err.code === 'EEXIST') {
      console.error(`exists: ${join(cyclesDir, dirName)}`);
      process.exit(1);
    }
    throw err;
  }
  writeFileSync(join(leaf, 'adr.md'), adrSkeleton(nnn));
  console.log(`created: ${leaf}`);
}
