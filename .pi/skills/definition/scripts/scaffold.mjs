/**
 * scaffold — 新 cycle のフォルダと definition 草案を素起こしする。
 *
 * - 前 cycle がある時: 前回 definition の marker を外して複写する
 * - 初回 cycle の時: `references/format.md` の形の template 文字列を出す
 * `# Definition <NNN>` の見出し番号は書き手が直す。
 *
 *   node scaffold.mjs [--root <dir>] [<src-definition.md>]
 */
import { spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { isAbsolute, join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { gitEnv } from '../../../../lib/git-env.mjs';

/** 行末の marker。` **add** (ADR 01-1)` の形 */
const MARKER = /\s+\*\*(add|update|drop)\*\*(\s*\(.*\))?\s*$/;

/**
 * 初回 cycle の template。`references/format.md` の形と合わせること。
 * @type {string}
 */
export const TEMPLATE_001 = `# Definition <NNN>

## Product

<プロダクト名>

### What

<何であるか。何をするか>

### Who

- <id>: <誰か>
  - Does: <その人が何をするか>
  - Needs: <その人が何を必要としているか>

### Users can do

- <unit-id>: <Who が、xxx する>
  - .<feature>: <説明>

## Stack

- Ground:
  - Language: TypeScript
  - Runtime: Node
  - Package manager: pnpm
  - Deploy:
- Checks:
  - Typechecker: tsc
  - Test runner: vitest
  - Linter: oxlint
  - Formatter: oxfmt
  - Git hooks: lefthook
- Agent:
  - Host: \`@earendil-works/pi-coding-agent\`
  - Schema: typebox
- Product:
`;

/**
 * @param {string} text
 * @returns {string}
 */
export function stripMarkers(text) {
  return text
    .split('\n')
    .map((line) => line.replace(MARKER, ''))
    .join('\n');
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
 * 両根を合流させた名前の並びから次番号を決める。合わない物は飛ばす。空 → 1。
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
 * 両根の dir を NNN 降順に `definition.md` を探す。無ければ null。存在しない根は空として扱う。
 * @param {string} cyclesDir
 * @param {string} archiveDir
 * @returns {string | null}
 */
export function findPrevDefinition(cyclesDir, archiveDir) {
  const candidates = [];
  const roots = [
    { dir: cyclesDir, priority: 0 },
    { dir: archiveDir, priority: 1 },
  ];
  for (const { dir, priority } of roots) {
    let entries;
    try {
      entries = readdirSync(dir, { withFileTypes: true });
    } catch (err) {
      if (err && err.code === 'ENOENT') continue;
      throw err;
    }
    for (const entry of entries) {
      if (!entry.isDirectory()) continue;
      const n = extractNNN(entry.name);
      if (n === null) continue;
      candidates.push({ nnn: n, dir, name: entry.name, priority });
    }
  }
  candidates.sort(
    (a, b) =>
      b.nnn - a.nnn || a.priority - b.priority || (a.name < b.name ? 1 : a.name > b.name ? -1 : 0),
  );
  for (const { dir, name } of candidates) {
    const file = join(dir, name, 'definition.md');
    if (existsSync(file)) return file;
  }
  return null;
}

/**
 * CLI 引数を読む。root 既定は cwd。`--root` 値欠落・未知引数は投げる。src の存在確認はしない。
 * @param {readonly string[]} argv
 * @returns {{ root: string, src: string | null }}
 */
export function parseArgs(argv) {
  let root = process.cwd();
  let src = null;
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
      if (src !== null) throw new Error(`too many arguments: ${arg}`);
      src = arg;
    }
  }
  return { root, src };
}

const isMain = process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;
if (isMain) {
  const { root, src } = parseArgs(process.argv.slice(2));
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
  const yymmdd = toYYMMDD(new Date());
  const names = [];
  for (const dir of [cyclesDir, archiveDir]) {
    try {
      for (const entry of readdirSync(dir, { withFileTypes: true })) {
        if (entry.isDirectory()) names.push(entry.name);
      }
    } catch (err) {
      if (!err || err.code !== 'ENOENT') throw err;
    }
  }
  const nnn = nextNNN(names);
  const slug = slugBranch(branch);
  const dirName = cycleDirName(nnn, yymmdd, slug);
  const leaf = join(cyclesDir, dirName);
  mkdirSync(cyclesDir, { recursive: true });
  try {
    mkdirSync(leaf);
  } catch (err) {
    if (err && err.code === 'EEXIST') {
      console.error(`exists: ${leaf}`);
      process.exit(1);
    }
    throw err;
  }
  let draft;
  let used;
  if (src !== null) {
    const resolved = isAbsolute(src) ? src : join(root, src);
    draft = stripMarkers(readFileSync(resolved, 'utf8'));
    used = resolved;
  } else {
    const prev = findPrevDefinition(cyclesDir, archiveDir);
    if (prev !== null) {
      draft = stripMarkers(readFileSync(prev, 'utf8'));
      used = prev;
    } else {
      draft = TEMPLATE_001;
      used = 'template';
    }
  }
  writeFileSync(join(leaf, 'definition.md'), draft);
  console.log(`created: ${leaf}`);
  console.log(`src: ${used}`);
}
