// suppression-check: リンターと型チェックの抑制コメントを列挙する。
// 使い方: node scripts/checks/suppression-check.mjs [--report] [file...]
// 仕組み: コメントの指令を走査し、scripts/checks/suppression-check.json の allow と直前の // Reason: で判定する。
// .pi のようなドットで始まるディレクトリは、** が当たらない。設定に書くときは .pi/** と明示する。
import * as fs from 'node:fs';
import * as path from 'node:path';

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
