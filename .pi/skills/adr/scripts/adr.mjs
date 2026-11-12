/**
 * `Type:` 行を返す。
 * @param {'Full' | 'Simple'} type
 * @returns {string}
 */
export function typeLine(type) {
  return type === 'Simple' ? 'Type: _Simple_' : 'Type: _Full_';
}

/**
 * `### Scope` の本文を返す。
 * @param {'Full' | 'Simple'} type
 * @returns {string}
 */
export function scopeBody(type) {
  if (type === 'Simple') return '_omission_';
  return `- In:
  - <kind>: <何をするか>
- Out:
  - <kind>: <何をしないか>（理由）`;
}

/**
 * `#### Details` の本文を返す。
 * @param {'Full' | 'Simple'} type
 * @returns {string}
 */
export function detailsBody(type) {
  if (type === 'Simple') return '_omission_';
  return `- <フェンスのタイトル>
  \`\`\`text
  <決まったコードや文書>
  \`\`\``;
}

/**
 * 1 エントリー分の骨組み。`references/adr.format.md` のエントリーの形と合わせること。
 * @param {number} nnn
 * @param {string} [title]
 * @param {'Full' | 'Simple'} [type]
 * @returns {string}
 */
export function entrySkeleton(nnn, title, type = 'Full') {
  const q = title === undefined ? '<問い>' : title;
  return `## ${String(nnn).padStart(2, '0')}: ${q}

${typeLine(type)}

### Context

- C1: <前提。いまの振る舞い>
- C2: <制約。上限、変えないと決めたこと>
- C3: <意図。オーナーの意図と意志>

### Research & Trial

- F1: <事実>。出所: <出所>

### Scope

${scopeBody(type)}

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

${detailsBody(type)}

### Definition

- \`Unit.<name>\`(updated): <新しい行>
- \`Unit.<name>\`(kept): <その行が動かない理由>
`;
}

/**
 * `adr.md` の骨組み。`references/adr.format.md` の形と合わせること。
 * @param {number} nnn
 * @param {string} [title]
 * @param {'Full' | 'Simple'} [type]
 * @returns {string}
 */
export function adrSkeleton(nnn, title, type = 'Full') {
  return `# ADR ${String(nnn).padStart(3, '0')}

${entrySkeleton(1, title, type)}`;
}

/**
 * `heading` の行番号の範囲を返す。見出しがなければ `null`。
 * @param {readonly string[]} lines
 * @param {string} heading
 * @returns {{ start: number, end: number } | null}
 */
export function sectionRange(lines, heading) {
  const start = lines.indexOf(heading);
  if (start === -1) return null;
  const level = /^#+/u.exec(heading)[0].length;
  const end = lines.findIndex(
    (line, index) => index > start && /^(#+)\s/u.test(line) && /^#+/u.exec(line)[0].length <= level,
  );
  return { start, end: end === -1 ? lines.length : end };
}

/**
 * `### <name>` のセクションの本文を返す。セクションがなければ空文字。
 * @param {string} entry
 * @param {string} name
 * @returns {string}
 */
function section(entry, name) {
  return sectionAt(entry, `### ${name}`);
}

/**
 * `heading` の本文を返す。見出しがなければ空文字。
 * @param {string} entry
 * @param {string} heading
 * @returns {string}
 */
function sectionAt(entry, heading) {
  const lines = entry.split('\n');
  const range = sectionRange(lines, heading);
  if (range === null) return '';
  return lines.slice(range.start + 1, range.end).join('\n');
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
 * エントリの `Type:` の値を返す。行がなければ `null`。
 * @param {string} entry
 * @returns {string | null}
 */
function typeOf(entry) {
  const head = beforeHeading(entry, '### Context');
  const found = /^Type: (.*)$/mu.exec(head);
  return found ? found[1] : null;
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
    const type = typeOf(body);
    if (type === null) problems.push(`${nn}: Type is missing`);
    else if (type !== '_Full_' && type !== '_Simple_') {
      problems.push(`${nn}: Type is not _Full_ or _Simple_: ${type}`);
    }
    if (type === '_Simple_') {
      if (section(body, 'Scope').trim() !== '_omission_') {
        problems.push(`${nn}: Simple Scope is not _omission_`);
      }
      if (sectionAt(body, '#### Details').trim() !== '_omission_') {
        problems.push(`${nn}: Simple Details is not _omission_`);
      }
    } else if (type === '_Full_') {
      if (section(body, 'Scope').trim() === '_omission_') {
        problems.push(`${nn}: Full Scope is _omission_`);
      }
      if (sectionAt(body, '#### Details').trim() === '_omission_') {
        problems.push(`${nn}: Full Details is _omission_`);
      }
    }
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
