import { existsSync, mkdirSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { detailsBody, entrySkeleton, scopeBody, sectionRange, typeLine } from './adr.mjs';

/**
 * `markdown` 中の `## NN:` の最大値を返す。`## ` で始まる見出しが `## NN:` に一致しなければ理由付きで投げる。該当がなければ `null`。
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
 * `markdown` 中の `## NN:` の番号を出現順に返す。
 * @param {string} markdown
 * @returns {readonly number[]}
 */
export function entryNumbers(markdown) {
  const numbers = [];
  for (const line of markdown.split('\n')) {
    if (!line.startsWith('## ')) continue;
    const found = /^## (\d{2}):/.exec(line);
    if (found) numbers.push(Number(found[1]));
  }
  return numbers;
}

/**
 * 末尾の改行を調整して `entry` を追記する。
 * @param {string} markdown
 * @param {string} entry
 * @returns {string}
 */
export function append(markdown, entry) {
  if (markdown === '') return entry;
  const withNewline = markdown.endsWith('\n') ? markdown : `${markdown}\n`;
  const sep = withNewline.endsWith('\n\n') ? '' : '\n';
  return `${withNewline}${sep}${entry}`;
}

/**
 * 末尾の改行を調整して `entrySkeleton(nnn, title, type)` を追記する。`# ADR NNN` は重複させない。
 * @param {string} markdown
 * @param {number} nnn
 * @param {string} [title]
 * @param {'Full' | 'Simple'} [type]
 * @returns {string}
 */
export function appendEntry(markdown, nnn, title, type = 'Full') {
  return append(markdown, entrySkeleton(nnn, title, type));
}

/**
 * `markdown` を先頭部と `## NN:` ごとの本文に分ける。
 * @param {string} markdown
 * @returns {{ head: string, bodies: readonly string[] }}
 */
function splitEntries(markdown) {
  const parts = markdown.split(/^## (?=\d{2}:)/mu);
  return { head: parts[0], bodies: parts.slice(1) };
}

/**
 * 本文の先頭 `NN: <title>` の番号を返す。合わなければ投げる。
 * @param {string} body
 * @returns {number}
 */
function bodyNumber(body) {
  const found = /^(\d{2}):/.exec(body);
  if (!found) {
    throw new Error(`broken entry heading: expected "NN:" but got "${body.slice(0, 20)}"`);
  }
  return Number(found[1]);
}

/**
 * 本文の先頭 `NN: <title>` を `next` 番と元の題名で組み立てる。
 * @param {string} body
 * @param {number} next
 * @returns {string}
 */
function renumberBody(body, next) {
  const nn = String(next).padStart(2, '0');
  return body.replace(/^\d{2}:/, `${nn}:`);
}

/**
 * 全エントリーの番号を出現順に `01` から振り直す。
 * @param {string} markdown
 * @returns {string}
 */
export function renumberEntries(markdown) {
  const { head, bodies } = splitEntries(markdown);
  const renumbered = bodies.map((body, index) => renumberBody(body, index + 1));
  return `${head}${renumbered.map((body) => `## ${body}`).join('')}`;
}

/**
 * `heading` の本文を `body` に置き換える。見出しがなければ投げる。
 * @param {string} entry
 * @param {string} heading
 * @param {string} body
 * @returns {string}
 */
function replaceSection(entry, heading, body) {
  const lines = entry.split('\n');
  const range = sectionRange(lines, heading);
  if (range === null) throw new Error(`section not found: ${heading}`);
  return [
    ...lines.slice(0, range.start + 1),
    '',
    ...body.split('\n'),
    '',
    ...lines.slice(range.end),
  ].join('\n');
}

/**
 * 番号 `nn` のエントリーの題名、Type 行、`### Scope` と `#### Details` の本文を、
 * `type` の形に置き換える。なければ投げる。
 * @param {string} markdown
 * @param {number} nn
 * @param {string} title
 * @param {'Full' | 'Simple'} type
 * @returns {string}
 */
export function setEntryType(markdown, nn, title, type) {
  const { head, bodies } = splitEntries(markdown);
  let found = false;
  const next = bodies.map((body) => {
    if (bodyNumber(body) !== nn) return `## ${body}`;
    found = true;
    let entry = body.replace(/^\d{2}:\s*[^\n]*/, `${body.slice(0, 2)}: ${title}`);
    entry = entry.replace(/^Type: .*$/mu, typeLine(type));
    entry = replaceSection(entry, '### Scope', scopeBody(type));
    entry = replaceSection(entry, '#### Details', detailsBody(type));
    return `## ${entry}`;
  });
  if (!found) throw new Error(`entry not found: ${String(nn).padStart(2, '0')}`);
  return `${head}${next.join('')}`;
}

/**
 * 番号 `nn` のエントリーの題名を `title` に置き換える。なければ投げる。
 * @param {string} markdown
 * @param {number} nn
 * @param {string} title
 * @returns {string}
 */
export function setEntryTitle(markdown, nn, title) {
  const { head, bodies } = splitEntries(markdown);
  let found = false;
  const next = bodies.map((body) => {
    if (bodyNumber(body) !== nn) return `## ${body}`;
    found = true;
    const rest = body.replace(/^\d{2}:\s*[^\n]*/, `${body.slice(0, 2)}: ${title}`);
    return `## ${rest}`;
  });
  if (!found) throw new Error(`entry not found: ${String(nn).padStart(2, '0')}`);
  return `${head}${next.join('')}`;
}

/**
 * 番号 `nn` のエントリーを削除し、残りを `01` から振り直す。なければ投げる。
 * @param {string} markdown
 * @param {number} nn
 * @returns {string}
 */
export function deleteEntry(markdown, nn) {
  const { head, bodies } = splitEntries(markdown);
  const kept = bodies.filter((body) => bodyNumber(body) !== nn);
  if (kept.length === bodies.length) {
    throw new Error(`entry not found: ${String(nn).padStart(2, '0')}`);
  }
  const renumbered = kept.map((body, index) => renumberBody(body, index + 1));
  return `${head}${renumbered.map((body) => `## ${body}`).join('')}`;
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
 * dir 名からサイクルの番号を抜く。合わなければ null。新形 `YYMMDD-NNN-slug` を先に、旧形 `NNN-YYYY-MM-DD` を後に見る。
 * @param {string} name
 * @returns {number | null}
 */
export function cycleNumberOf(name) {
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
    const n = cycleNumberOf(name);
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
 * `Full` か `Simple` なら返し、そうでなければ `null` を返す。
 * @param {string | undefined} value
 * @returns {'Full' | 'Simple' | null}
 */
function typeArg(value) {
  return value === 'Full' || value === 'Simple' ? value : null;
}

/**
 * @typedef {{ root: string, add: { title: string, type: 'Full' | 'Simple' } | null, del: number | null, set: { nn: number, title: string, type: 'Full' | 'Simple' | null } | null, check: boolean }} Args
 */

/**
 * CLI 引数を読む。`--root` 既定は cwd。操作は `--add`、`--delete`、`--set`、`--check` のいずれか一つ。
 * @param {readonly string[]} argv
 * @returns {Args}
 */
export function parseArgs(argv) {
  let root = process.cwd();
  let add = null;
  let del = null;
  let set = null;
  let check = false;
  const ops = () => [add !== null, del !== null, set !== null, check].filter(Boolean).length;
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === '--root') {
      const value = argv[i + 1];
      if (value === undefined) throw new Error('missing value for --root');
      root = value;
      i++;
    } else if (arg === '--add') {
      const value = argv[i + 1];
      if (value === undefined) throw new Error('missing value for --add');
      if (ops() > 0) throw new Error('too many operations');
      if (value.trim() === '') throw new Error('empty title for --add');
      const type = typeArg(argv[i + 2]) ?? 'Full';
      add = { title: value, type };
      i += typeArg(argv[i + 2]) === null ? 1 : 2;
    } else if (arg === '--delete') {
      const value = argv[i + 1];
      if (value === undefined) throw new Error('missing value for --delete');
      if (ops() > 0) throw new Error('too many operations');
      if (!/^\d+$/.test(value)) throw new Error(`not an entry number: ${value}`);
      const n = Number(value);
      if (n < 1) throw new Error(`not an entry number: ${value}`);
      del = n;
      i++;
    } else if (arg === '--set') {
      const nnValue = argv[i + 1];
      const titleValue = argv[i + 2];
      if (nnValue === undefined || titleValue === undefined) {
        throw new Error('missing value for --set');
      }
      if (ops() > 0) throw new Error('too many operations');
      if (!/^\d+$/.test(nnValue)) throw new Error(`not an entry number: ${nnValue}`);
      const n = Number(nnValue);
      if (n < 1) throw new Error(`not an entry number: ${nnValue}`);
      if (titleValue.trim() === '') throw new Error('empty title for --set');
      const setType = typeArg(argv[i + 3]);
      set = { nn: n, title: titleValue, type: setType };
      i += setType === null ? 2 : 3;
    } else if (arg === '--check') {
      if (ops() > 0) throw new Error('too many operations');
      check = true;
    } else {
      throw new Error(`unknown argument: ${arg}`);
    }
  }
  return { root, add, del, set, check };
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
    const nnn = cycleNumberOf(entry.name);
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
