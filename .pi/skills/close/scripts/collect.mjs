/**
 * collect — サイクルの残り物を、機械的に一覧にする。
 *
 * サイクルの plan md を読んで、close が仕分ける物を `## Collected` の中身として出す。
 * 拾うのは、Notes の各スライスの Findings、Review の各ラウンドの指摘、Acceptance の Findings。
 * 1件は1行にし、`場所 / 穴 / 対応: 理由` の形にする。判断はしない。人が写し落とさないためだけの物。
 *
 * plan ごとの見出しには、design.md の plan 節から読んだ `ADR` と `Scope` を添える。
 * 読めない時は `未特定` と出す。close は `未特定` を探し、design と定義を見て埋める。
 *
 * 並びは、設計の plan（ファイル名順）が先、`ex-` の plan（ファイル名順）が後。
 * だから `ex-` の plan を足しても、前の番号はずれない。
 *
 *   node collect.mjs <cycle-dir>
 */
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';

/**
 * 残り物の1件。
 *
 * @typedef {{ place: string, finding: string, handling: string | null }} Leftover
 */

/** 節や観点の見出し（穴ではない行） */
const LABELS = /^(Findings|Unplanned|Commit|Stopped|Ran|Stale|Unlisted|Gaps|Unproven):\s*(.*)$/;
/** 穴に対する対応 */
const HANDLINGS = /^(fixed|left):\s*(.*)$/;
/** design の plan 節。`## \`<plan id>\`` の形。backtick の無い `##`（`## Refactor` 等）は plan ではない */
const PLAN_HEAD = /^## `(.+)`\s*$/;
const ADR_FIELD = /^-\s*ADR:\s*(.*)$/;
const SCOPE_FIELD = /^-\s*Scope:\s*(.*)$/;
const SCOPE_ITEM = /^\s+-\s*([^:]+):/;
/** 読めなかった所の印。close はこれを探して埋める */
const UNKNOWN = '未特定';

const isBullet = (line) => /^\s*- /.test(line);
/** `なし` は穴ではない。後ろに注記（`なし — 理由`）が続いても穴ではない */
const isNone = (text) => text.startsWith('なし');
const indentOf = (line) => line.length - line.trimStart().length;
const bulletText = (line) => line.replace(/^\s*- /, '').trim();

function splitSections(text) {
  const sections = [];
  let current = null;
  for (const line of text.split('\n')) {
    if (line.startsWith('## ')) {
      current = { name: line.slice(3).trim(), lines: [] };
      sections.push(current);
      continue;
    }
    if (current) current.lines.push(line);
  }
  return sections;
}

function splitPlaces(lines) {
  const places = [];
  let current = null;
  for (const line of lines) {
    if (line.startsWith('### ')) {
      current = { name: line.slice(4).trim(), lines: [] };
      places.push(current);
      continue;
    }
    if (current) current.lines.push(line);
  }
  return places;
}

/** `- <field>:` の中身。穴は `対応: 理由` の行を伴う。
 *
 * @param {string[]} lines
 * @param {string} field
 * @returns {Leftover[]}
 */
function readField(lines, field) {
  /** @type {Leftover[]} */
  const items = [];
  /** @type {Leftover | null} */
  let last = null;
  let inField = false;
  let fieldIndent = 0;
  for (const line of lines) {
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
          last = { finding: inline, handling: null };
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
      last = { finding: text, handling: null };
      items.push(last);
      continue;
    }
    if (inField && line.trim() && indentOf(line) <= fieldIndent) inField = false;
  }
  return items;
}

/** 1つのラウンドの指摘。観点の見出しは穴ではない。
 *
 * @param {string[]} lines
 * @returns {Leftover[]}
 */
function readRound(lines) {
  /** @type {Leftover[]} */
  const items = [];
  /** @type {Leftover | null} */
  let last = null;
  for (const line of lines) {
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
        last = { finding: inline, handling: null };
        items.push(last);
      }
      continue;
    }
    last = { finding: text, handling: null };
    items.push(last);
  }
  return items;
}

/**
 * 1つの plan md の残り物。番号は付けない。
 *
 * 場所は `Slice 2 (remove が片付ける)` / `Review Round 1` / `Acceptance`。
 * `fixed:` の付いた穴は閉じているので、残り物ではない。
 *
 * @param {string} text
 * @returns {Leftover[]}
 */
export function collectPlan(text) {
  /** @type {Leftover[]} */
  const items = [];
  for (const section of splitSections(text)) {
    if (section.name === 'Notes') {
      for (const place of splitPlaces(section.lines)) {
        const named = place.name.match(/^Slice\s+(\d+):\s*(.*)$/);
        const at = named ? `Slice ${named[1]} (${named[2]})` : place.name;
        for (const item of readField(place.lines, 'Findings')) {
          items.push({ place: at, ...item });
        }
      }
      continue;
    }
    if (section.name === 'Review') {
      for (const place of splitPlaces(section.lines)) {
        const named = place.name.match(/^Round\s+(\d+)/);
        const at = named ? `Review Round ${named[1]}` : place.name;
        for (const item of readRound(place.lines)) {
          items.push({ place: at, ...item });
        }
      }
      continue;
    }
    if (section.name === 'Acceptance') {
      for (const item of readField(section.lines, 'Findings')) {
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
 * design.md から plan ごとの `ADR` と `Scope` を読む。
 *
 * plan 節は backtick 付きの `##` だけ。`## Refactor` などは plan ではない。
 * 節や欄が読めない plan は `未特定` になる。
 *
 * @param {string} text
 * @returns {Map<string, { adr: string, scope: string }>}
 */
export function designLinks(text) {
  /** @type {Map<string, { adr: string, scope: string }>} */
  const links = new Map();
  /** @type {string | null} */
  let id = null;
  let adr = null;
  /** @type {string[]} */
  let scope = [];
  let inScope = false;
  const keep = () => {
    if (!id) return;
    links.set(id, { adr: adr ?? UNKNOWN, scope: scope.length ? scope.join(', ') : UNKNOWN });
  };
  for (const line of text.split('\n')) {
    const head = line.match(PLAN_HEAD);
    if (head) {
      keep();
      id = head[1].trim();
      adr = null;
      scope = [];
      inScope = false;
      continue;
    }
    if (line.startsWith('## ')) {
      keep();
      id = null;
      continue;
    }
    if (!id) continue;
    if (inScope) {
      const item = line.match(SCOPE_ITEM);
      if (item) {
        scope.push(item[1].trim());
        continue;
      }
      inScope = false;
    }
    const adrLine = line.match(ADR_FIELD);
    if (adrLine) {
      adr = adrLine[1].trim() || UNKNOWN;
      continue;
    }
    const scopeLine = line.match(SCOPE_FIELD);
    if (scopeLine) {
      if (scopeLine[1].trim()) scope.push(scopeLine[1].trim());
      inScope = true;
    }
  }
  keep();
  return links;
}

/** plan ごとの見出しの後ろに付ける link。読めない所は `未特定`。
 *
 * @param {{ adr: string, scope: string } | undefined} link
 * @returns {string}
 */
const linkText = (link) => `ADR ${link?.adr ?? UNKNOWN} / Scope ${link?.scope ?? UNKNOWN}`;

/** `## Collected` の中身。残り物が無ければ `なし`。
 *
 * @param {string} planDir
 * @param {string} designPath
 * @returns {string}
 */
export function collectCycle(planDir, designPath) {
  const links =
    designPath && existsSync(designPath)
      ? designLinks(readFileSync(designPath, 'utf8'))
      : new Map();
  const files = readdirSync(planDir)
    .filter((file) => file.endsWith('.md'))
    .toSorted((a, b) => planRank(a) - planRank(b) || a.localeCompare(b));
  /** @type {string[]} */
  const blocks = [];
  let n = 0;
  for (const file of files) {
    const items = collectPlan(readFileSync(join(planDir, file), 'utf8'));
    if (!items.length) continue;
    const id = file.replace(/\.md$/, '');
    const lines = items.map((item) => {
      const handling = item.handling ? ` / ${item.handling}` : '';
      const place = `${++n}. ${item.place} / ${item.finding}`;
      return place + handling;
    });
    blocks.push(`### ${id} (${linkText(links.get(id))})\n\n${lines.join('\n')}`);
  }
  return blocks.length ? blocks.join('\n\n') : 'なし';
}

const isMain = process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;
if (isMain) {
  const dir = process.argv[2];
  if (!dir) {
    console.error('usage: collect.mjs <cycle-dir>');
    process.exit(1);
  }
  console.log(collectCycle(join(dir, 'plan'), join(dir, 'design.md')));
}
