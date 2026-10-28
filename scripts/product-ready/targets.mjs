import { existsSync, readdirSync, rmSync, statSync } from 'node:fs';
import { join } from 'node:path';

/** 全体／部分の別。全体はファイルを丸ごと、部分は見出しの範囲の本文だけを差し替える */
/** @typedef {{ readonly kind: 'whole' }} Whole */
/** @typedef {{ readonly kind: 'sections', readonly headings: readonly string[] }} Sections */
/** @typedef {Whole | Sections} Part */

/** 雛形の出所 */
/** @typedef {{ readonly file: string, readonly heading: string, readonly part: Part }} Skeleton */

/** 消す対象の 1 行 */
/** @typedef {{ readonly action: 'remove', readonly label: string, readonly at: string, readonly pick: 'dirs' | 'files' }} RemoveTarget */

/** 雛形に差し替える対象の 1 行 */
/** @typedef {{ readonly action: 'replace', readonly label: string, readonly at: string }} ReplaceTarget */

/** 見つけた 1 行 */
/** @typedef {(RemoveTarget | ReplaceTarget) & { readonly path: string }} FoundEntry */

/** 表示する 1 行 */
/** @typedef {{ readonly label: string, readonly verb: 'remove' | 'replace' }} Label */

/** スターターだけの物のうち、消す物 */
export const REMOVE_TARGETS = [{ action: 'remove', label: 'cycles', at: 'cycles', pick: 'dirs' }];

/** スターターだけの物のうち、雛形に差し替える物 */
export const REPLACE_TARGETS = [
  { action: 'replace', label: 'replace', at: 'ROADMAP.md' },
  { action: 'replace', label: 'replace', at: 'DEFINITION.md' },
  { action: 'replace', label: 'replace', at: 'README.md' },
  { action: 'replace', label: 'replace', at: 'README.ja.md' },
];

/** 表示する並び */
export const LABELS = [
  { label: 'cycles', verb: 'remove' },
  { label: 'replace', verb: 'replace' },
];

/** 何もしない label に付ける動詞 */
const FALLBACK_VERB = 'remove';

/**
 * 雛形を組み立てる（純）。`file` か `heading` が空、または `sections` の見出しが空なら投げる。
 *
 * @param {string} file 雛形を持つファイル（ルートからの道）
 * @param {string} heading その中の見出し
 * @param {Part} part 全体か部分か
 * @returns {Skeleton}
 */
export function skeleton(file, heading, part) {
  if (file === '' || heading === '') {
    throw new Error(`a skeleton needs a file and a heading: ${file} / ${heading}`);
  }
  if (part.kind === 'sections' && part.headings.length === 0) {
    throw new Error(`a sections skeleton needs a heading: ${file}`);
  }
  return { file, heading, part };
}

/** 差し替える対象ごとの雛形 */
const SKELETONS = new Map([
  ['ROADMAP.md', skeleton('rules/roadmap.md', '## Skeleton', { kind: 'whole' })],
  [
    'DEFINITION.md',
    skeleton('rules/definition.format.md', '## Skeleton', {
      kind: 'sections',
      headings: ['## Product', '### What'],
    }),
  ],
  ['README.md', skeleton('rules/readme.format.md', '## Skeleton', { kind: 'whole' })],
  ['README.ja.md', skeleton('rules/readme.format.md', '## Skeleton (ja)', { kind: 'whole' })],
]);

/**
 * `at` の雛形を返す（純）。表に無ければ投げ、雛形のファイルが `root` の下に無ければその道を入れて投げる。
 *
 * @param {string} root リポジトリのルート
 * @param {string} at 差し替える対象
 * @returns {Skeleton}
 */
export function skeletonFor(root, at) {
  const found = SKELETONS.get(at);
  if (found === undefined) {
    throw new Error(`no skeleton for: ${at}`);
  }
  const path = join(root, found.file);
  if (!existsSync(path)) {
    throw new Error(`no skeleton file: ${path}`);
  }
  return found;
}

/**
 * 消す物と差し替える物を集める（純）。
 *
 * @param {string} root リポジトリのルート
 * @param {string} [only] 絞る label（undefined なら全行）
 * @returns {readonly FoundEntry[]} 見つけた物（`at` の昇順）
 */
export function plan(root, only) {
  if (!existsSync(root)) {
    throw new Error(`no such directory: ${root}`);
  }
  const rows = [...REMOVE_TARGETS, ...REPLACE_TARGETS].filter(
    (row) => only === undefined || row.label === only,
  );
  /** @type {FoundEntry[]} */
  const out = [];
  for (const row of rows) {
    if (row.action === 'remove') {
      if (row.pick !== 'dirs') {
        continue;
      }
      const base = join(root, row.at);
      if (!existsSync(base)) {
        continue;
      }
      for (const entry of readdirSync(base, { withFileTypes: true })) {
        if (entry.isDirectory()) {
          out.push({
            action: 'remove',
            label: row.label,
            at: join(row.at, entry.name),
            path: join(base, entry.name),
          });
        }
      }
      continue;
    }
    if (!existsSync(join(root, row.at))) {
      continue;
    }
    out.push({ action: 'replace', label: row.label, at: row.at, path: join(root, row.at) });
  }
  return out.toSorted((a, b) => (a.at < b.at ? -1 : a.at > b.at ? 1 : 0));
}

/**
 * 消す物を消す（副作用）。無い物は飛ばす。`action: 'remove'` の行だけを受ける。
 *
 * @param {readonly (RemoveTarget & { readonly path: string })[]} entries 消す物
 * @returns {readonly string[]} 消した物の `at`
 */
export function remove(entries) {
  const removed = [];
  for (const entry of entries) {
    const path = entry.path;
    if (!existsSync(path)) {
      continue;
    }
    let isDir = false;
    try {
      isDir = statSync(path).isDirectory();
    } catch (_unused) {
      continue;
    }
    if (isDir) {
      rmSync(path, { recursive: true, force: true });
    } else {
      rmSync(path, { force: true });
    }
    removed.push(entry.at);
  }
  return removed;
}

/**
 * 表示する label（一覧の順、重複なし）。only があればその 1 つ。
 *
 * @param {string} [only] 絞る label（undefined なら全 label）
 * @returns {readonly Label[]} label
 */
export function labels(only) {
  if (only !== undefined) {
    const known = LABELS.find((item) => item.label === only);
    return [known ?? { label: only, verb: FALLBACK_VERB }];
  }
  return [...LABELS];
}
