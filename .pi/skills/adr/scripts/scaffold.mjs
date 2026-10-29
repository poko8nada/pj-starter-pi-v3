/**
 * scaffold — 新 cycle のフォルダと `adr.md` の骨を出す。
 *
 *   node scaffold.mjs [--root <dir>] [<nnn>]
 */
import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { git } from '../../../../lib/git-env.mjs';

/**
 * 1 エントリー分の骨。`references/format.md` のエントリーの形と合わせること。
 * @param {number} nnn
 * @returns {string}
 */
export function entrySkeleton(nnn) {
  return `## ${String(nnn).padStart(2, '0')}: <問い>

### Context

- <何が起きていて、何をしたいか>

### Scope

- 変更:
  - <kind>: in — <何をするか>
  - <kind>: out — <何をしないか>（理由）
- 品質:
  - <kind>: in — <何をするか>
  - <kind>: out — <何をしないか>（理由）
- 運用:
  - <kind>: in — <何をするか>
  - <kind>: out — <何をしないか>（理由）

### Research & Trial

- <測った事実、試した事>

### Decision

- Status: **accepted** | **rejected**（理由）
- Adopted:
  - <採った形>
- Options:
  - <案>（採らなかった理由）

### Definition

- \`Unit.<name>\`(updated): <新しい行>
- \`Unit.<name>\`(kept): <その行が動かない理由>
`;
}

/**
 * `adr.md` の骨。`references/format.md` の形と合わせること。
 * @param {number} nnn
 * @returns {string}
 */
export function adrSkeleton(nnn) {
  return `# ADR ${String(nnn).padStart(3, '0')}

${entrySkeleton(1)}`;
}

/**
 * `markdown` 中の `## NN:` の最大値を返す。`## ` で始まる見出しが `## NN:` と一致しなければ理由付きで投げる。該当がなければ `null`。
 * @param {string} markdown
 * @returns {number | null}
 */
export function lastEntryNumber(markdown) {
  let max = null;
  for (const line of markdown.split('\n')) {
    if (!line.startsWith('## ')) continue;
    const found = /^## (\d{2}):/.exec(line);
    if (found) {
      const n = Number(found[1]);
      if (max === null || n > max) max = n;
      continue;
    }
    throw new Error(`broken entry heading: expected "## NN:" but got "${line}"`);
  }
  return max;
}

/**
 * 末尾の改行を調整して `entrySkeleton(nnn)` を追記する。`# ADR NNN` は重複させない。
 * @param {string} markdown
 * @param {number} nnn
 * @returns {string}
 */
export function appendEntry(markdown, nnn) {
  const entry = entrySkeleton(nnn);
  if (markdown === '') return entry;
  const withNewline = markdown.endsWith('\n') ? markdown : `${markdown}\n`;
  const sep = withNewline.endsWith('\n\n') ? '' : '\n';
  return `${withNewline}${sep}${entry}`;
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

/**
 * 開いている cycle の dir を返す。`cycles/` 直下で `adr.md` を持ち `close.md` を持たない物のうち、名前の `NNN` が最大の物。なければ `null`。
 * @param {string} cyclesDir
 * @returns {string | null}
 */
export function openCycleDir(cyclesDir) {
  let entries;
  try {
    entries = readdirSync(cyclesDir, { withFileTypes: true });
  } catch (err) {
    if (err && err.code === 'ENOENT') return null;
    throw err;
  }
  let bestName = null;
  let bestNNN = -1;
  for (const entry of entries) {
    if (!entry.isDirectory()) continue;
    const nnn = extractNNN(entry.name);
    if (nnn === null) continue;
    if (!existsSync(join(cyclesDir, entry.name, 'adr.md'))) continue;
    if (existsSync(join(cyclesDir, entry.name, 'close.md'))) continue;
    if (nnn > bestNNN) {
      bestNNN = nnn;
      bestName = entry.name;
    }
  }
  if (bestName === null) return null;
  return join(cyclesDir, bestName);
}

const isMain = process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;
if (isMain) {
  const { root, nnn: argNNN } = parseArgs(process.argv.slice(2));
  const cyclesDir = join(root, 'cycles');
  const archiveDir = join(cyclesDir, 'archive');
  const openDir = openCycleDir(cyclesDir);
  if (openDir !== null) {
    if (argNNN !== null) {
      throw new Error(`open cycle exists: ${openDir}; refusing nnn ${argNNN}`);
    }
    const adrPath = join(openDir, 'adr.md');
    const current = readFileSync(adrPath, 'utf8');
    const next = (lastEntryNumber(current) ?? 0) + 1;
    writeFileSync(adrPath, appendEntry(current, next));
    console.log(`appended: ${adrPath}`);
  } else {
    let branch = '';
    try {
      const result = git(root, ['branch', '--show-current']);
      if (result.status === 0) branch = (result.stdout ?? '').trim();
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
}
