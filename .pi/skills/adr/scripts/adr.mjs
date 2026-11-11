/**
 * 1 エントリー分の骨組み。`references/adr.format.md` のエントリーの形と合わせること。
 * @param {number} nnn
 * @param {string} [title]
 * @returns {string}
 */
export function entrySkeleton(nnn, title) {
  const q = title === undefined ? '<問い>' : title;
  return `## ${String(nnn).padStart(2, '0')}: ${q}

### Research & Trial

- F1: <事実>。出所。

### Scope

- In:
  - <kind>: <何をするか>
- Out:
  - <kind>: <何をしないか>（理由）

### Context

- C1: <前提。いまの振る舞い>
- C2: <制約。Who の要望、上限、変えないと決めたこと>

### Decision

- Status:
- Main: <この関心事は、何がどうなるか>
  - Add:
    - <増えるもの>（C1）
  - Update:
    - <変わるもの（何がどうなるか）>（C1）
  - Drop:
    - <消えるもの>（F1）
- Sub: <この関心事は、何がどうなるか>
  - Add:
    - <増えるもの>（C1）
  - Update:
    - <変わるもの（何がどうなるか）>（C1）
  - Drop:
    - <消えるもの>（F1）
- Policy:
  - Allowed:
    - <して良いこと>（C2）
  - Forbidden:
    - <明示的にしてはいけないこと> - <しない理由>（C2）

#### Details

- <フェンスのタイトル>
  \`\`\`text
  <決まったコードや文書>
  \`\`\`

### Definition

- \`Unit.<name>\`(updated): <新しい行>
- \`Unit.<name>\`(kept): <その行が動かない理由>
`;
}

/**
 * `adr.md` の骨組み。`references/adr.format.md` の形と合わせること。
 * @param {number} nnn
 * @param {string} [title]
 * @returns {string}
 */
export function adrSkeleton(nnn, title) {
  return `# ADR ${String(nnn).padStart(3, '0')}

${entrySkeleton(1, title)}`;
}

/**
 * `### <name>` のセクションの本文を返す。セクションがなければ空文字。
 * @param {string} entry
 * @param {string} name
 * @returns {string}
 */
function section(entry, name) {
  const lines = entry.split('\n');
  const start = lines.findIndex((line) => line === `### ${name}`);
  if (start === -1) return '';
  const rest = lines.slice(start + 1);
  const end = rest.findIndex((line) => line.startsWith('### '));
  return (end === -1 ? rest : rest.slice(0, end)).join('\n');
}

/**
 * 行頭の `C<n>` と `F<n>` の番号を、出た順に返す。
 * @param {string} text
 * @param {RegExp} pattern
 * @returns {readonly string[]}
 */
function labels(text, pattern) {
  return [...text.matchAll(pattern)].map((match) => match[1]);
}

/**
 * 行末の括弧の `C<n>` と `F<n>` を集める。
 * @param {string} text
 * @returns {{ c: readonly string[], f: readonly string[] }}
 */
function refs(text) {
  const c = [];
  const f = [];
  for (const match of text.matchAll(/（([^）]*)）/gu)) {
    for (const part of match[1].split(',')) {
      const label = part.trim();
      const cMatch = label.match(/^C(\d+)$/u);
      const fMatch = label.match(/^F(\d+)$/u);
      if (cMatch) c.push(cMatch[1]);
      if (fMatch) f.push(fMatch[1]);
    }
  }
  return { c, f };
}

/**
 * `text` の先頭から、行頭が `heading` の行の手前までを返す。`heading` がなければ全体。
 * @param {string} text
 * @param {string} heading
 * @returns {string}
 */
function beforeHeading(text, heading) {
  const lines = text.split('\n');
  const end = lines.findIndex((line) => line === heading);
  return (end === -1 ? lines : lines.slice(0, end)).join('\n');
}

/**
 * エントリーの `Context` の項目（`C<n>`）と `Research & Trial` の事実（`F<n>`）が、
 * `Decision` から参照されているかを確かめる。
 * `Decision` セクションの `#### Details` より前で、すべての `C` を参照し、すべての `F` をどれかが参照する。
 * `#### Details` の中の括弧は参照として数えない。
 * 参照は実在し、番号は重複しない。
 * @param {string} markdown
 * @returns {readonly string[]} 抜けの一覧。空なら良い
 */
export function checkEntry(markdown) {
  const problems = [];
  const entries = markdown.split(/^## (?=\d{2}:)/mu).slice(1);
  for (const body of entries) {
    const nn = body.slice(0, 2);
    const cs = labels(section(body, 'Context'), /^- C(\d+):/gmu);
    const fs = labels(section(body, 'Research & Trial'), /^- F(\d+):/gmu);
    const seenC = new Set();
    for (const n of cs) {
      if (seenC.has(n)) problems.push(`${nn}: C${n} is used twice`);
      seenC.add(n);
    }
    const seenF = new Set();
    for (const n of fs) {
      if (seenF.has(n)) problems.push(`${nn}: F${n} is used twice`);
      seenF.add(n);
    }
    const found = refs(beforeHeading(section(body, 'Decision'), '#### Details'));
    for (const c of cs) {
      if (!found.c.includes(c)) problems.push(`${nn}: Decision does not carry C${c}`);
    }
    for (const c of found.c) {
      if (!cs.includes(c)) problems.push(`${nn}: Decision refers to unknown C${c}`);
    }
    for (const f of found.f) {
      if (!fs.includes(f)) problems.push(`${nn}: Decision refers to unknown F${f}`);
    }
    for (const f of fs) {
      if (!found.f.includes(f)) problems.push(`${nn}: F${f} is not weighed`);
    }
  }
  return problems;
}
