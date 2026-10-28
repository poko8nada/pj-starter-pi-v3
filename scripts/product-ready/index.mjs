import * as fs from 'node:fs';
import * as path from 'node:path';
import { labels, plan, remove, skeletonFor } from './targets.mjs';
import { parseArgs, planLines, switchLines } from './cli.mjs';

const STARTER_FLAG = ' --config vitest.starter.config.ts';
const STARTER_CONFIG_AT = 'vitest.starter.config.ts';
const TARGET_SCRIPTS = ['test', 'test:run', 'test:related'];
const FENCE = /^(`{3,}|~{3,})/;
const HEADING = /^#{1,6} /;

/**
 * 見出しの後ろにある最初のフェンス付きブロックの中身を返す（純）。無ければ null。
 *
 * @param {string} text 読んだファイル
 * @param {string} heading 見出しの行
 * @returns {string | null}
 */
export function blockUnder(text, heading) {
  const lines = text.split('\n');
  const start = lines.findIndex((line) => line.trim() === heading);
  if (start === -1) {
    return null;
  }
  let mark = '';
  let open = -1;
  for (let i = start + 1; i < lines.length; i += 1) {
    const line = lines[i].trim();
    if (open === -1) {
      const found = FENCE.exec(line);
      if (found) {
        mark = found[1];
        open = i;
      }
      continue;
    }
    if (line === mark) {
      return lines.slice(open + 1, i).join('\n');
    }
  }
  return null;
}

/**
 * 見出しの直後の本文の範囲を返す（純）。見出しが無ければ null。
 *
 * @param {readonly string[]} lines 行の並び
 * @param {string} heading 見出しの行
 * @returns {{ readonly from: number, readonly to: number } | null}
 */
export function sectionOf(lines, heading) {
  const start = lines.findIndex((line) => line.trim() === heading);
  if (start === -1) {
    return null;
  }
  let to = lines.length;
  for (let i = start + 1; i < lines.length; i += 1) {
    if (HEADING.test(lines[i])) {
      to = i;
      break;
    }
  }
  return { from: start + 1, to };
}

/**
 * 見出しごとに、本文だけを雛形の本文で置き換える（純）。見出しが無ければ投げる。
 *
 * @param {string} text 差し替えるファイル
 * @param {string} block 雛形のブロック
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

/**
 * 差し替えの仕事を作る。雛形を読み、書く中身を決める。読めなければ投げる。
 *
 * @param {string} root リポジトリのルート
 * @param {readonly import('./targets.mjs').FoundEntry[]} entries 見つけた物
 * @returns {readonly { readonly at: string, readonly path: string, readonly text: string }[]}
 */
export function jobsFor(root, entries) {
  /** @type {{ readonly at: string, readonly path: string, readonly text: string }[]} */
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
      jobs.push({ at: entry.at, path: entry.path, text: `${block}\n` });
      continue;
    }
    const current = fs.readFileSync(entry.path, 'utf8');
    jobs.push({
      at: entry.at,
      path: entry.path,
      text: replaceSections(current, block, skeleton.part.headings),
    });
  }
  return jobs;
}

/**
 * 差し替えを書く（副作用）。
 *
 * @param {readonly { readonly at: string, readonly path: string, readonly text: string }[]} jobs 仕事
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
 * flag を持つ script の名を返す（純）。
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
 * スターターだけの物を消し、雛形に差し替え、`test*` の flag を外し、`vitest.starter.config.ts` を消す入口。引数なしは表示だけ、`--run` で実行する。
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
  for (const line of [
    ...switchLines({ config: configExists, scripts: flagged }),
    ...planLines(labels(args.only), entries),
  ]) {
    console.log(line);
  }
  if (!args.run) {
    return 0;
  }
  try {
    const jobs = jobsFor(root, entries);
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
