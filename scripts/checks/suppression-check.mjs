// suppression-check: リンターと型チェックの抑制コメントを列挙する。
// 使い方: node scripts/checks/suppression-check.mjs [--report] [file...]
// 仕組み: コメントの指令を走査し、scripts/checks/suppression-check.json の allow と直前の // Reason: で判定する。
// .pi のようなドットで始まるディレクトリは、** が当たらない。設定に書くときは .pi/** と明示する。
import * as fs from 'node:fs';
import * as path from 'node:path';
import { pathToFileURL } from 'node:url';

/**
 * @typedef {object} Suppression
 * @property {string} file process.cwd() をルートにした / 区切りの相対パス
 * @property {number} line 指令を含むコメントの開始行。1 始まり
 * @property {'oxlint' | 'eslint' | 'biome' | 'tsc'} tool
 * @property {string} directive 例: eslint-disable-next-line
 * @property {'line' | 'next-line' | 'block' | 'file'} scope
 * @property {readonly string[]} rules 空は全ルール
 * @property {string} before 開始行の 1 つ前の行の原文
 */

const CODE_EXTENSIONS = new Set(['.js', '.jsx', '.ts', '.tsx', '.mts', '.cts', '.mjs', '.cjs']);
const SKIP_DIRS = new Set(['node_modules', 'dist', '.next', '.git']);

const DIRECTIVES = [
  ['oxlint-disable-next-line', 'oxlint', 'next-line'],
  ['oxlint-disable-line', 'oxlint', 'line'],
  ['oxlint-disable', 'oxlint', 'block'],
  ['oxlint-enable', 'oxlint', null],
  ['eslint-disable-next-line', 'eslint', 'next-line'],
  ['eslint-disable-line', 'eslint', 'line'],
  ['eslint-disable', 'eslint', 'block'],
  ['eslint-enable', 'eslint', null],
  ['biome-ignore-all', 'biome', 'file'],
  ['biome-ignore-start', 'biome', 'block'],
  ['biome-ignore-end', 'biome', null],
  ['biome-ignore', 'biome', 'next-line'],
  ['@ts-nocheck', 'tsc', 'file'],
  ['@ts-ignore', 'tsc', 'next-line'],
  ['@ts-expect-error', 'tsc', 'next-line'],
];
// コメント本文の最初の語を、この表と完全一致で照合する。
// null の範囲は、抑制ではなく解除を表す。読むが報告しない。

function splitFirstWord(body) {
  const m = body.match(/^\s*(\S+)([\s\S]*)$/);
  if (!m) {
    return null;
  }
  return { first: m[1], rest: m[2] ?? '' };
}

function parseOxEslintRules(rest) {
  const at = rest.search(/\s--+\s/);
  const rulePart = at === -1 ? rest : rest.slice(0, at);
  return rulePart
    .split(',')
    .map((s) => s.trim())
    .filter((s) => s !== '');
}

function parseBiomeRules(rest) {
  const colon = rest.indexOf(':');
  const targetPart = colon === -1 ? rest : rest.slice(0, colon);
  const trimmed = targetPart.trim();
  if (trimmed === '') {
    return [];
  }
  const m = trimmed.match(/^(.*?)\s*\([^)]*\)\s*$/);
  const name = m ? m[1].trim() : trimmed;
  if (name === '') {
    return [];
  }
  return [name];
}

function parseDirective(body) {
  const split = splitFirstWord(body);
  if (!split) {
    return null;
  }
  const entry = DIRECTIVES.find((d) => d[0] === split.first);
  if (!entry) {
    return null;
  }
  if (entry[2] === null) {
    return null;
  }
  if (entry[1] === 'tsc') {
    return { directive: entry[0], tool: entry[1], scope: entry[2], rules: [] };
  }
  if (entry[1] === 'biome') {
    return {
      directive: entry[0],
      tool: entry[1],
      scope: entry[2],
      rules: parseBiomeRules(split.rest),
    };
  }
  return {
    directive: entry[0],
    tool: entry[1],
    scope: entry[2],
    rules: parseOxEslintRules(split.rest),
  };
}

function scanNewline(st) {
  if (st.state === 'line') {
    st.comments.push({ body: st.body, line: st.startLine });
    st.state = 'code';
  } else if (st.state === 'single' || st.state === 'double') {
    st.state = 'code';
  } else if (st.state === 'block') {
    st.body += '\n';
  }
  st.line += 1;
}

function scanComments(text) {
  const st = { state: 'code', startLine: 0, body: '', line: 1, comments: [] };
  let i = 0;
  while (i < text.length) {
    const c = text[i];
    const next = i + 1 < text.length ? text[i + 1] : '';
    if (c === '\n') {
      scanNewline(st);
      i += 1;
      continue;
    }
    if (st.state === 'code') {
      if (c === '/' && next === '/') {
        st.state = 'line';
        st.startLine = st.line;
        st.body = '';
        i += 2;
        continue;
      }
      if (c === '/' && next === '*') {
        st.state = 'block';
        st.startLine = st.line;
        st.body = '';
        i += 2;
        continue;
      }
      if (c === "'") {
        st.state = 'single';
      } else if (c === '"') {
        st.state = 'double';
      } else if (c === '`') {
        st.state = 'template';
      }
      i += 1;
      continue;
    }
    if (st.state === 'line') {
      st.body += c;
      i += 1;
      continue;
    }
    if (st.state === 'block') {
      if (c === '*' && next === '/') {
        st.comments.push({ body: st.body, line: st.startLine });
        st.state = 'code';
        i += 2;
        continue;
      }
      st.body += c;
      i += 1;
      continue;
    }
    if (st.state === 'single' || st.state === 'double' || st.state === 'template') {
      if (c === '\\') {
        if (next === '\n') {
          st.line += 1;
        }
        i += 2;
        continue;
      }
      const closer = st.state === 'single' ? "'" : st.state === 'double' ? '"' : '`';
      if (c === closer) {
        st.state = 'code';
      }
      i += 1;
      continue;
    }
    i += 1;
  }
  if (st.state === 'line' || st.state === 'block') {
    st.comments.push({ body: st.body, line: st.startLine });
  }
  return st.comments;
}

export function findSuppressions(file, text) {
  const lines = text.split('\n');
  const out = [];
  for (const comment of scanComments(text)) {
    const parsed = parseDirective(comment.body);
    if (!parsed) {
      continue;
    }
    const before = comment.line > 1 ? (lines[comment.line - 2] ?? '') : '';
    out.push({
      file,
      line: comment.line,
      tool: parsed.tool,
      directive: parsed.directive,
      scope: parsed.scope,
      rules: parsed.rules,
      before,
    });
  }
  return out;
}

export function collectFiles(root) {
  const out = [];
  const stack = [{ dir: root, rel: '' }];
  while (stack.length > 0) {
    const cur = stack.pop();
    if (!cur) {
      continue;
    }
    const entries = fs.readdirSync(cur.dir, { withFileTypes: true });
    for (const entry of entries) {
      const name = entry.name;
      const rel = cur.rel === '' ? name : `${cur.rel}/${name}`;
      if (entry.isSymbolicLink()) {
        let stat = null;
        try {
          stat = fs.statSync(path.join(cur.dir, name));
        } catch {
          continue;
        }
        if (stat.isDirectory()) {
          continue;
        }
        if (stat.isFile() && CODE_EXTENSIONS.has(path.extname(name))) {
          out.push(rel);
        }
        continue;
      }
      if (entry.isDirectory()) {
        if (SKIP_DIRS.has(name)) {
          continue;
        }
        stack.push({ dir: path.join(cur.dir, name), rel });
        continue;
      }
      if (entry.isFile() && CODE_EXTENSIONS.has(path.extname(name))) {
        out.push(rel);
      }
    }
  }
  out.sort();
  return out;
}

export function findAll(root) {
  const out = [];
  for (const rel of collectFiles(root)) {
    const abs = path.join(root, ...rel.split('/'));
    const text = fs.readFileSync(abs, 'utf8');
    for (const item of findSuppressions(rel, text)) {
      out.push(item);
    }
  }
  out.sort((a, b) => (a.file < b.file ? -1 : a.file > b.file ? 1 : a.line - b.line));
  return out;
}

/**
 * @typedef {object} AllowEntry
 * @property {string} path process.cwd() をルートにした / 区切りの glob
 * @property {readonly string[]} rules 1 つ以上
 */

export function loadAllow(root) {
  const configPath = path.join(root, 'scripts', 'checks', 'suppression-check.json');
  let text;
  try {
    text = fs.readFileSync(configPath, 'utf8');
  } catch (error) {
    if (error instanceof Error && 'code' in error && error.code === 'ENOENT') {
      return [];
    }
    throw error;
  }
  let data;
  try {
    data = JSON.parse(text);
  } catch {
    throw new Error('suppression-check.json is not valid JSON');
  }
  if (typeof data !== 'object' || data === null || Array.isArray(data)) {
    throw new Error('suppression-check.json must have only allow');
  }
  const keys = Object.keys(data);
  if (keys.length !== 1 || keys[0] !== 'allow') {
    throw new Error('suppression-check.json must have only allow');
  }
  if (!Array.isArray(data.allow)) {
    throw new Error('suppression-check.json allow must be an array');
  }
  for (const entry of data.allow) {
    if (typeof entry !== 'object' || entry === null || Array.isArray(entry)) {
      throw new Error('suppression-check.json entry must have path and rules');
    }
    if (typeof entry.path !== 'string') {
      throw new Error('suppression-check.json entry path must be a string');
    }
    const rulesOk =
      Array.isArray(entry.rules) &&
      entry.rules.length > 0 &&
      entry.rules.every((r) => typeof r === 'string');
    if (!rulesOk) {
      throw new Error('suppression-check.json entry rules must be a non-empty array of strings');
    }
  }
  return data.allow;
}

export function hasReason(before) {
  const trimmed = before.trimStart();
  const prefix = '// Reason: ';
  if (!trimmed.startsWith(prefix)) {
    return false;
  }
  return /\S/.test(trimmed.slice(prefix.length));
}

export function judge(record, allow) {
  const keys = record.rules.length === 0 ? [record.directive] : record.rules;
  for (const entry of allow) {
    if (!path.matchesGlob(record.file, entry.path)) {
      continue;
    }
    if (!keys.every((k) => entry.rules.includes(k))) {
      continue;
    }
    if (hasReason(record.before)) {
      return { kind: 'allowed', suppression: record };
    }
    return { kind: 'no-reason', suppression: record };
  }
  return { kind: 'not-listed', suppression: record };
}

/**
 * @typedef {object} Options
 * @property {boolean} report
 * @property {readonly string[]} paths
 */

export function parseArgs(argv) {
  let report = false;
  const paths = [];
  for (const arg of argv) {
    if (arg === '--report') {
      report = true;
      continue;
    }
    if (arg.startsWith('--')) {
      throw new Error(`unknown argument: ${arg}`);
    }
    paths.push(arg);
  }
  return { report, paths };
}

function resolveTargets(root, paths) {
  const out = [];
  for (const p of paths) {
    const abs = path.isAbsolute(p) ? p : path.join(root, p);
    if (!fs.existsSync(abs)) {
      continue;
    }
    if (!fs.statSync(abs).isFile()) {
      throw new Error(`not a file: ${p}`);
    }
    if (!CODE_EXTENSIONS.has(path.extname(abs))) {
      continue;
    }
    out.push(path.relative(root, abs).split(path.sep).join('/'));
  }
  out.sort();
  return out;
}

function formatRecord(record, kind) {
  const rules = record.rules.length === 0 ? 'all' : record.rules.join(', ');
  const verdict =
    kind === 'allowed'
      ? 'allowed'
      : kind === 'not-listed'
        ? 'not allowed'
        : "no Reason line: add // Reason: above in Japanese (owner's approval needed)";
  return `${record.file}:${record.line}: ${record.directive} [${record.tool}] ${rules} ${verdict}`;
}

export function run(root, options) {
  const allow = loadAllow(root);
  const rels = options.paths.length > 0 ? resolveTargets(root, options.paths) : collectFiles(root);
  const found = [];
  for (const rel of rels) {
    const text = fs.readFileSync(path.join(root, ...rel.split('/')), 'utf8');
    for (const item of findSuppressions(rel, text)) {
      found.push(item);
    }
  }
  found.sort((a, b) => (a.file < b.file ? -1 : a.file > b.file ? 1 : a.line - b.line));
  const verdicts = found.map((s) => judge(s, allow));
  const allowed = verdicts.filter((v) => v.kind === 'allowed');
  const violations = verdicts.filter((v) => v.kind !== 'allowed');
  console.log(
    'suppression-check: Report to the owner. A suppressed rule is a bypass unless the whitelist and the Reason line allow it.',
  );
  console.log('suppression-check: Fix the code, or ask the owner to allow it.');
  const shown = options.report ? verdicts : violations;
  for (const v of shown) {
    console.log(formatRecord(v.suppression, v.kind));
  }
  if (shown.length === 0) {
    console.log('No findings.');
  }
  console.log(
    `suppression-check: ${rels.length} files, ${violations.length} violations, ${allowed.length} allowed.`,
  );
  return violations.length > 0 ? 1 : 0;
}

const isMain =
  process.argv[1] !== undefined && import.meta.url === pathToFileURL(process.argv[1]).href;
if (isMain) {
  try {
    const options = parseArgs(process.argv.slice(2));
    process.exit(run(process.cwd(), options));
  } catch (error) {
    console.error(`suppression-check: ${error instanceof Error ? error.message : String(error)}`);
    process.exit(1);
  }
}
