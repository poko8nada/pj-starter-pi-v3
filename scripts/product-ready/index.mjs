import * as fs from 'node:fs';
import * as path from 'node:path';
import { labels, plan, remove, skeletonFor } from './targets.mjs';
import { parseArgs, planLines, switchLines } from './cli.mjs';
import { blockUnder, sectionOf } from './blocks.mjs';

const STARTER_FLAG = ' --config vitest.starter.config.ts';
const STARTER_CONFIG_AT = 'vitest.starter.config.ts';
const TARGET_SCRIPTS = ['test', 'test:run', 'test:related'];

/**
 * 見出しごとに、本文だけをテンプレートの本文で置き換える（副作用なし）。見出しが無ければ投げる。
 *
 * @param {string} text 差し替えるファイル
 * @param {string} block テンプレートのブロック
 * @param {readonly string[]} headings 差し替える見出し
 * @returns {string}
 */
export function replaceSections(text, block, headings) {
  const source = block.split('\n');
  let lines = text.split('\n');
  for (const heading of headings) {
    const into = sectionOf(lines, heading);
    if (into === null) {
      throw new Error(`no such heading: ${heading}`);
    }
    const from = sectionOf(source, heading);
    if (from === null) {
      throw new Error(`no such heading in the skeleton: ${heading}`);
    }
    lines = [
      ...lines.slice(0, into.from),
      ...source.slice(from.from, from.to),
      ...lines.slice(into.to),
    ];
  }
  return lines.join('\n');
}

/** 置き換える前の README の `###` 1つ分の行 */
/** @typedef {{ readonly heading: string, readonly paragraph: string }} DefaultLine */

/**
 * `##` 範囲の中にある `###` の行位置を返す（副作用なし）。
 *
 * @param {readonly string[]} lines 行の並び
 * @param {number} from 範囲の先頭
 * @param {number} to 範囲の末尾
 * @returns {readonly number[]} `### ` で始まる行の位置
 */
function h3Indices(lines, from, to) {
  const found = [];
  for (let i = from; i < to; i += 1) {
    if (lines[i].startsWith('### ')) {
      found.push(i);
    }
  }
  return found;
}

/** `##` までの見出し（`#` と `##`）に一致する */
const H2 = /^#{1,2} /;

/**
 * `##` 見出しの直後の本文の範囲を返す（副作用なし）。`###` では切らず、次の `##` までを含む。見出しが無ければ null。
 *
 * @param {readonly string[]} lines 行の並び
 * @param {string} heading `##` 見出しの行
 * @returns {{ readonly from: number, readonly to: number } | null } 範囲
 */
function h2Range(lines, heading) {
  const start = lines.findIndex((line) => line.trim() === heading);
  if (start === -1) {
    return null;
  }
  let to = lines.length;
  for (let i = start + 1; i < lines.length; i += 1) {
    if (H2.test(lines[i])) {
      to = i;
      break;
    }
  }
  return { from: start + 1, to };
}

/**
 * `###` の直後の段落を返す（副作用なし）。段落が無ければ null。
 *
 * @param {readonly string[]} lines 行の並び
 * @param {number} index `###` の行位置
 * @param {number} end 範囲の末尾
 * @returns {string | null} 空行までの本文を空白でつないだ物
 */
function paragraphAfter(lines, index, end) {
  const parts = [];
  for (let i = index + 1; i < end; i += 1) {
    const line = lines[i];
    if (line.trim() === '') {
      if (parts.length > 0) {
        break;
      }
      continue;
    }
    if (line.startsWith('#')) {
      break;
    }
    parts.push(line.trim());
  }
  if (parts.length === 0) {
    return null;
  }
  return parts.join(' ');
}

/**
 * 置き換える前の README の同じ `##` 見出しから各 `###` の段落を集める（副作用なし）。見出しや段落がなければ投げる。
 *
 * @param {readonly string[]} sourceLines 置き換える前の README の行
 * @param {string} heading `##` 見出しの行
 * @returns {readonly DefaultLine[]} `###` の並び
 */
function collectUnder(sourceLines, heading) {
  const range = h2Range(sourceLines, heading);
  if (range === null) {
    throw new Error(`no such heading: ${heading}`);
  }
  const targets = h3Indices(sourceLines, range.from, range.to);
  if (targets.length < 2) {
    throw new Error(`not enough headings under ${heading}`);
  }
  return targets.map((at) => {
    const name = sourceLines[at].slice('### '.length).trim();
    if (name === '') {
      throw new Error(`no heading name under ${heading}`);
    }
    const paragraph = paragraphAfter(sourceLines, at, range.to);
    if (paragraph === null || paragraph === '') {
      throw new Error(`no paragraph under ### ${name}`);
    }
    return { heading: name, paragraph };
  });
}

/**
 * `##` 見出しの下の `###` が2つ以上あるとき、後ろの `###` の本文を `- <見出しの名前>: <段落>` の箇条書きで置き換える。`###` が2つ未満なら `block` をそのまま返す
 *
 * @param {string} block テンプレートのブロック
 * @param {string} source 置き換え前の README
 * @returns {{ readonly text: string, readonly filled: readonly string[] }} 置き換えた本文と、箇条書きで埋めた `###` の見出し名（材料の名。文書の順）
 */
export function fillDefaults(block, source) {
  const sourceLines = source.split('\n');
  let out = block.split('\n');
  const headings = [];
  for (const line of out) {
    if (line.startsWith('## ') && !headings.includes(line)) {
      headings.push(line);
    }
  }
  /** @type {readonly string[][]} */
  const groups = [];
  for (let h = headings.length - 1; h >= 0; h -= 1) {
    const heading = headings[h];
    const range = h2Range(out, heading);
    if (range === null) {
      continue;
    }
    const h3 = h3Indices(out, range.from, range.to);
    if (h3.length < 2) {
      continue;
    }
    const lines = collectUnder(sourceLines, heading);
    const bullets = lines.map((entry) => `- ${entry.heading}: ${entry.paragraph}`);
    groups.push(lines.map((entry) => entry.heading));
    out = [...out.slice(0, h3[1] + 1), '', ...bullets, '', ...out.slice(range.to)];
  }
  return { text: out.join('\n'), filled: groups.toReversed().flat() };
}

/**
 * 表示の見出し。仕事の `filled` を順につなげ、重複を取り除く（副作用なし）。
 *
 * @param {readonly Job[]} jobs 仕事
 * @returns {readonly string[]} 見出しの並び
 */
function headingsOf(jobs) {
  const seen = new Set();
  const headings = [];
  for (const job of jobs) {
    for (const name of job.filled) {
      if (!seen.has(name)) {
        seen.add(name);
        headings.push(name);
      }
    }
  }
  return headings;
}

/**
 * 差し替えの仕事。
 *
 * @typedef {{ at: string, path: string, text: string, filled: readonly string[] }} Job
 */

/**
 * 差し替えの仕事を作る。テンプレートを読み、書く中身を決める。読めなければ投げる。
 *
 * @param {string} root リポジトリのルート
 * @param {readonly import('./targets.mjs').FoundEntry[]} entries 見つけた物
 * @returns {readonly Job[]}
 */
export function jobsFor(root, entries) {
  /** @type {Job[]} */
  const jobs = [];
  for (const entry of entries) {
    if (entry.action !== 'replace') {
      continue;
    }
    const skeleton = skeletonFor(root, entry.at);
    const source = fs.readFileSync(path.join(root, skeleton.file), 'utf8');
    const block = blockUnder(source, skeleton.heading);
    if (block === null) {
      throw new Error(`no block under ${skeleton.heading}: ${skeleton.file}`);
    }
    if (skeleton.part.kind === 'whole') {
      const current = fs.readFileSync(entry.path, 'utf8');
      const { text, filled } = fillDefaults(block, current);
      jobs.push({ at: entry.at, path: entry.path, text: `${text}\n`, filled });
      continue;
    }
    const current = fs.readFileSync(entry.path, 'utf8');
    jobs.push({
      at: entry.at,
      path: entry.path,
      text: replaceSections(current, block, skeleton.part.headings),
      filled: [],
    });
  }
  return jobs;
}

/**
 * 差し替えを書く（副作用）。
 *
 * @param {readonly Job[]} jobs 仕事
 * @returns {readonly string[]} 書いた物の `at`
 */
export function applyJobs(jobs) {
  const written = [];
  for (const job of jobs) {
    fs.writeFileSync(job.path, job.text);
    written.push(job.at);
  }
  return written;
}

/**
 * flag を持つ script の名を返す（副作用なし）。
 *
 * @param {Readonly<Record<string, unknown>> | undefined} scripts `package.json` の `scripts`
 * @returns {readonly string[]}
 */
export function flaggedScripts(scripts) {
  /** @type {string[]} */
  const names = [];
  if (scripts === undefined) {
    return names;
  }
  for (const name of TARGET_SCRIPTS) {
    const value = scripts[name];
    if (typeof value === 'string' && value.includes(STARTER_FLAG)) {
      names.push(name);
    }
  }
  return names;
}

/**
 * スターターだけの物を消し、テンプレートに差し替え、`test*` の flag を外し、`vitest.starter.config.ts` を消す入口。引数なしは表示だけ、`--run` で実行する。
 *
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
  let entries;
  try {
    entries = plan(root, args.only);
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    return 1;
  }
  const packageFile = path.join(root, 'package.json');
  let packageText;
  try {
    packageText = fs.readFileSync(packageFile, 'utf8');
  } catch (_unused) {
    console.error(`no such file: ${packageFile}`);
    return 1;
  }
  let packageData;
  try {
    packageData = JSON.parse(packageText);
  } catch (_unused) {
    console.error(`the package.json is not valid JSON: ${packageFile}`);
    return 1;
  }
  const flagged = flaggedScripts(packageData?.scripts);
  const configExists = fs.existsSync(path.join(root, STARTER_CONFIG_AT));
  let jobs;
  try {
    jobs = jobsFor(root, entries);
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    return 1;
  }
  const headings = headingsOf(jobs);
  for (const line of [
    ...switchLines({ config: configExists, scripts: flagged }),
    ...planLines(labels(args.only), entries, headings),
  ]) {
    console.log(line);
  }
  if (!args.run) {
    return 0;
  }
  try {
    remove(entries.filter((entry) => entry.action === 'remove'));
    if (typeof packageData === 'object' && packageData !== null) {
      const nextScripts =
        typeof packageData.scripts === 'object' && packageData.scripts !== null
          ? { ...packageData.scripts }
          : {};
      for (const name of flagged) {
        const value = nextScripts[name];
        if (typeof value === 'string') {
          nextScripts[name] = value.replaceAll(STARTER_FLAG, '');
        }
      }
      packageData = { ...packageData, scripts: nextScripts };
      fs.writeFileSync(packageFile, `${JSON.stringify(packageData, null, 2)}\n`);
    }
    if (configExists) {
      fs.rmSync(path.join(root, STARTER_CONFIG_AT), { force: true });
    }
    applyJobs(jobs);
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    return 1;
  }
  return 0;
}

process.exitCode = main(process.argv.slice(2));
