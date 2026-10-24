// close.md の `## Collected` を書く。
// 使い方: node .pi/skills/close/scripts/collect.mjs <cycle-dir>
// 仕組み: <cycle-dir>/plan/*.md の残り物を集め、plan md の `No` を読んで、
// close.md の `## Collected` を書き直す。番号行より深い行（エージェントの文脈）と `## Triage` は残す。
import { existsSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';

/**
 * 残り物の1件。
 *
 * @typedef {{ plan: string, link: string, line: number, place: string, finding: string, handling: string | null }} Leftover
 */

/**
 * Triageの1行。`ex-` planの`No`の出所。
 *
 * @typedef {{ planId: string, adrNo: string }} TriageEntry
 */

/** セクションや観点の見出し（穴ではない行） */
const LABELS =
  /^(Findings|Unplanned|Commit|Stopped|Ran|Stale|Unlisted|Gaps|Unproven|Noise|Doubts):\s*(.*)$/;
/** 穴に対する対応 */
const HANDLINGS = /^(fixed|left):\s*(.*)$/;
const ADR_FIELD = /^-\s*No:\s*(.*)$/;
/** 読めなかった所の印。close はこれを探して埋める */
const UNKNOWN = '未特定';
/** 番号行。`1. <line> / …`。plan は上の `### ` の見出しから取る */
const NUMBERED = /^\s*\d+\.\s+(\d+)\s+\//;
/** 穴を並べる所（`Slice 2 (…)` / `Round 1`）の見分け */
const SLICE_PLACE = /^Slice\s+(\d+):\s*(.*)$/;
const ROUND_PLACE = /^Round\s+(\d+)/;

const isBullet = (line) => /^\s*- /.test(line);
/** `なし` は穴ではない。後ろに注記（`なし — 理由`）が続いても穴ではない */
const isNone = (text) => text.startsWith('なし');
const indentOf = (line) => line.length - line.trimStart().length;
const bulletText = (line) => line.replace(/^\s*- /, '').trim();

/**
 * `## ` でセクションに切る。`at` は最初の中身の行の行番号（1 起点）。
 *
 * @param {string} text
 * @returns {{ name: string, lines: string[], at: number }[]}
 */
function splitSections(text) {
  const sections = [];
  let current = null;
  const all = text.split('\n');
  for (let i = 0; i < all.length; i += 1) {
    const line = all[i];
    if (line.startsWith('## ')) {
      current = { name: line.slice(3).trim(), lines: [], at: i + 2 };
      sections.push(current);
      continue;
    }
    if (current) current.lines.push(line);
  }
  return sections;
}

/**
 * `### ` で所に切る。`at` は最初の中身の行の行番号。
 *
 * @param {string[]} lines
 * @param {number} at
 * @returns {{ name: string, lines: string[], at: number }[]}
 */
function splitPlaces(lines, at) {
  const places = [];
  let current = null;
  for (let i = 0; i < lines.length; i += 1) {
    const line = lines[i];
    if (line.startsWith('### ')) {
      current = { name: line.slice(4).trim(), lines: [], at: at + i + 1 };
      places.push(current);
      continue;
    }
    if (current) current.lines.push(line);
  }
  return places;
}

/**
 * 欄（`Findings:` など）の中身を読む。欄の下の、深いバレットも拾う。
 *
 * @param {string[]} lines
 * @param {number} at
 * @param {string} field
 * @returns {{ line: number, finding: string, handling: string | null }[]}
 */
function readField(lines, at, field) {
  const items = [];
  /** @type {{ line: number, finding: string, handling: string | null } | null} */
  let last = null;
  let inField = false;
  let fieldIndent = 0;
  for (let i = 0; i < lines.length; i += 1) {
    const line = lines[i];
    const bare = line.trim().replace(/^-\s*/, '');
    const bareHandling = bare.match(HANDLINGS);
    if (inField && bareHandling && last) {
      last.handling = `${bareHandling[1]}: ${bareHandling[2].trim()}`;
      continue;
    }
    if (isBullet(line)) {
      const text = bulletText(line);
      const label = text.match(LABELS);
      if (label) {
        inField = label[1] === field;
        fieldIndent = indentOf(line);
        last = null;
        const inline = label[2].trim();
        if (inField && inline && !isNone(inline)) {
          last = { line: at + i, finding: inline, handling: null };
          items.push(last);
        }
        continue;
      }
      if (!inField || indentOf(line) <= fieldIndent) continue;
      if (isNone(text)) continue;
      const handling = text.match(HANDLINGS);
      if (handling && last) {
        last.handling = `${handling[1]}: ${handling[2].trim()}`;
        continue;
      }
      last = { line: at + i, finding: text, handling: null };
      items.push(last);
      continue;
    }
    if (inField && line.trim() && indentOf(line) <= fieldIndent) inField = false;
  }
  return items;
}

/**
 * 1つのラウンドの指摘。観点の見出しは穴ではない。
 *
 * @param {string[]} lines
 * @param {number} at
 * @returns {{ line: number, finding: string, handling: string | null }[]}
 */
function readRound(lines, at) {
  const items = [];
  /** @type {{ line: number, finding: string, handling: string | null } | null} */
  let last = null;
  for (let i = 0; i < lines.length; i += 1) {
    const line = lines[i];
    const handling = line.trim().replace(/^-\s*/, '').match(HANDLINGS);
    if (handling) {
      if (last) last.handling = `${handling[1]}: ${handling[2].trim()}`;
      continue;
    }
    if (!isBullet(line)) continue;
    const text = bulletText(line);
    if (!text || isNone(text)) continue;
    const label = text.match(LABELS);
    if (label) {
      last = null;
      const inline = label[2].trim();
      if (inline && !isNone(inline)) {
        last = { line: at + i, finding: inline, handling: null };
        items.push(last);
      }
      continue;
    }
    last = { line: at + i, finding: text, handling: null };
    items.push(last);
  }
  return items;
}

/**
 * 1つの plan md の残り物。番号は付けない。
 *
 * `## Notes` は `Slice N` の所の `Findings:`、`## Review` は `Round N` の所の指摘、
 * `## Acceptance` は `Findings:` と `Doubts:`。
 * `fixed:` の付いた穴は閉じているので、残り物ではない。
 *
 * @param {string} text
 * @returns {{ line: number, place: string, finding: string, handling: string | null }[]}
 */
export function collectPlan(text) {
  /** @type {{ line: number, place: string, finding: string, handling: string | null }[]} */
  const items = [];
  for (const section of splitSections(text)) {
    if (section.name === 'Notes' || section.name === 'Review') {
      for (const place of splitPlaces(section.lines, section.at)) {
        const named =
          section.name === 'Notes' ? place.name.match(SLICE_PLACE) : place.name.match(ROUND_PLACE);
        let at = place.name;
        if (named && section.name === 'Notes') at = `Slice ${named[1]} (${named[2]})`;
        else if (named) at = `Review Round ${named[1]}`;
        const found =
          section.name === 'Notes'
            ? readField(place.lines, place.at, 'Findings')
            : readRound(place.lines, place.at);
        for (const item of found) {
          items.push({ place: at, ...item });
        }
      }
      continue;
    }
    if (section.name === 'Acceptance') {
      const found = [
        ...readField(section.lines, section.at, 'Findings'),
        ...readField(section.lines, section.at, 'Doubts'),
      ];
      for (const item of found) {
        items.push({ place: 'Acceptance', ...item });
      }
    }
  }
  return items.filter(isLeftover);
}

/** 残り物か。`fixed:` は閉じているので集めない。 */
const isLeftover = (item) => !item.handling?.startsWith('fixed:');

/** 設計の plan が先、`ex-` の plan が後。 */
const planRank = (file) => (file.startsWith('ex-') ? 1 : 0);

/**
 * close.mdの`## Triage`から`ex-` planの`No`を読む。`ex-plan <plan id> (ADR <NN>, ...)`の対応。
 *
 * @param {string} closeText
 * @returns {Map<string, string>}
 */
function readTriageNos(closeText) {
  /** @type {Map<string, string>} */
  const map = new Map();
  for (const line of triagePart(closeText).split('\n')) {
    const found = line.match(/^-\s*\d+:\s*ex-plan\s+(\S+)\s*\(ADR\s+([^,\s)]+)/);
    if (found) map.set(found[1], found[2].trim());
  }
  return map;
}

/**
 * planの`No`の値。通常planはplan mdの`- No:`、`ex-` planはclose.mdの`## Triage`行の`ADR <NN>`。無ければnull。
 *
 * @param {string} planId
 * @param {string} text plan md本文
 * @param {string} closeText close.md本文
 * @returns {string | null}
 */
export function noOf(planId, text, closeText) {
  if (planId.startsWith('ex-')) {
    return readTriageNos(closeText ?? '').get(planId) ?? null;
  }
  for (const line of text.split('\n')) {
    const found = line.match(ADR_FIELD);
    if (found) return found[1].trim() || null;
  }
  return null;
}

/** plan ごとの見出しの後ろに付ける link。読めない所は `未特定`。
 *
 * @param {string | null} no
 * @returns {string}
 */
const linkText = (no) => `ADR ${no ?? UNKNOWN}`;

/**
 * 残り物を、plan ごとにまとめて 1 本のテキストにする。
 *
 * @param {Leftover[]} items
 * @param {Map<string, string[]>} contexts 番号行の下の文脈（`<plan id>:<line>` で引く）
 * @returns {string}
 */
function render(items, contexts) {
  if (!items.length) return 'なし';
  /** @type {string[]} */
  const blocks = [];
  /** @type {string[]} */
  const lines = [];
  let current = null;
  let n = 0;
  const flush = () => {
    if (!current) return;
    blocks.push(`### ${current.id} (${current.link})\n\n${lines.join('\n')}`);
    lines.length = 0;
  };
  for (const item of items) {
    if (!current || current.id !== item.plan) {
      flush();
      current = { id: item.plan, link: item.link };
    }
    n += 1;
    const handling = item.handling ? ` / ${item.handling}` : '';
    lines.push(`${n}. ${item.line} / ${item.place} / ${item.finding}${handling}`);
    for (const kept of contexts.get(`${item.plan}:${item.line}`) ?? []) {
      lines.push(kept);
    }
  }
  flush();
  return blocks.join('\n\n');
}

/**
 * close.md の番号行の下の文脈（深い行）を拾う。無ければ空。
 *
 * @param {string} text
 * @returns {Map<string, string[]>}
 */
function readContexts(text) {
  /** @type {Map<string, string[]>} */
  const kept = new Map();
  /** @type {string | null} */
  let plan = null;
  /** @type {string | null} */
  let current = null;
  for (const line of text.split('\n')) {
    const head = line.match(/^### (\S+)/);
    if (head) {
      plan = head[1];
      current = null;
      continue;
    }
    const numbered = line.match(NUMBERED);
    if (numbered) {
      current = `${plan}:${numbered[1]}`;
      if (!kept.has(current)) kept.set(current, []);
      continue;
    }
    if (!current) continue;
    if (line.trim() === '' || !/^\s/.test(line)) {
      current = null;
      continue;
    }
    kept.get(current)?.push(line);
  }
  return kept;
}

/**
 * close.md の `## Triage` のセクションを、あればそのまま返す。無ければ見出しだけ。
 *
 * @param {string} text
 * @returns {string}
 */
function triagePart(text) {
  const lines = text.split('\n');
  const at = lines.findIndex((line) => line.startsWith('## Triage'));
  if (at < 0) return '## Triage\n';
  return lines.slice(at).join('\n');
}

/**
 * cycle の plan md を読み、`ADR` を付けて残り物を返す。
 * 通常planの`No`はplan md、`ex-` planの`No`はclose.mdの`## Triage`から読む。
 *
 * @param {string} planDir
 * @param {string} closeText close.md本文
 * @returns {Leftover[]}
 */
export function collectCycle(planDir, closeText = '') {
  const files = readdirSync(planDir)
    .filter((file) => file.endsWith('.md'))
    .toSorted((a, b) => planRank(a) - planRank(b) || a.localeCompare(b));
  /** @type {Leftover[]} */
  const items = [];
  for (const file of files) {
    const id = file.replace(/\.md$/, '');
    const text = readFileSync(join(planDir, file), 'utf8');
    const link = linkText(noOf(id, text, closeText));
    for (const item of collectPlan(text)) {
      items.push({ plan: id, link, ...item });
    }
  }
  return items;
}

/**
 * close.md を書き、そのパスを返す。無ければ作る。
 *
 * `## Collected` は毎回作り直すが、番号行の下の文脈と `## Triage` は残す。
 *
 * @param {string} cycleDir
 * @returns {string}
 */
export function writeClose(cycleDir) {
  if (!existsSync(cycleDir)) {
    throw new Error(`no such directory: ${cycleDir}`);
  }
  const planDir = join(cycleDir, 'plan');
  if (!existsSync(planDir)) {
    throw new Error(`no such directory: ${planDir}`);
  }
  const closePath = join(cycleDir, 'close.md');
  const old = existsSync(closePath) ? readFileSync(closePath, 'utf8') : '';
  const items = collectCycle(planDir, old);
  const body = render(items, readContexts(old));
  const triage = triagePart(old);
  const nnn = (cycleDir.replace(/\/+$/, '').split('/').pop() ?? '').split('-')[1] ?? '';
  const text = `# Close ${nnn}\n\n## Collected\n\n${body}\n\n${triage}`;
  writeFileSync(closePath, text);
  return closePath;
}

const isMain = process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;
if (isMain) {
  const dir = process.argv[2];
  if (!dir) {
    console.error('usage: collect.mjs <cycle-dir>');
    process.exit(1);
  }
  try {
    console.log(`wrote ${writeClose(dir)}`);
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    process.exit(1);
  }
}
