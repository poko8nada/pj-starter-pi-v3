/**
 * 1 エントリー分の骨組み。`references/adr.format.md` のエントリーの形と合わせること。
 * @param {number} nnn
 * @returns {string}
 */
export function entrySkeleton(nnn) {
  return `## ${String(nnn).padStart(2, '0')}: <問い>

### Context

- C1: <前提。いまの振る舞い>
- C2: <制約。Who の要望、上限、変えないと決めたこと>

### Scope

- 変更:
  - <kind>: in — <何をするか>
  - <kind>: out — <何をしないか>（理由）
- 品質:
  - <kind>: in — <何をするか>
  - <kind>: out — <何をしないか>（理由）
- 運用:
  - <kind>: in — <何をするか>
  - <kind>: out — <何をしないか>（理由）

### Research & Trial

- F1 (C1): <事実>。出所。

### Decision

- Status:
- Adopted:
  - <A>: <説明>
    - Add:
      - <何が増えるか>（C1）
    - Update:
      - <変わるもの（何がどうなるか）>（C1）
    - Drop:
      - <消えるもの>（F1）
    - Keep:
      - <触らないものとその理由>（C2）
    - Cost:
      - <他の選択肢と比べたときの相対的なコスト>（F1）
- Options:
  - <B>: <説明> - <その選択肢を採用しなかった理由>
- Deferred:
  - <決めない項目と、その理由>

### Definition

- \`Unit.<name>\`(updated): <新しい行>
- \`Unit.<name>\`(kept): <その行が動かない理由>
`;
}

/**
 * `adr.md` の骨組み。`references/adr.format.md` の形と合わせること。
 * @param {number} nnn
 * @returns {string}
 */
export function adrSkeleton(nnn) {
  return `# ADR ${String(nnn).padStart(3, '0')}

${entrySkeleton(1)}`;
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
 * 選択肢のブロック。`Adopted` と `Options` の下の `- <名前>:` と、その子の行。
 * 子の行を持つものだけを、選択肢として返す。
 * @param {string} decision
 * @returns {readonly { name: string, text: string }[]}
 */
function options(decision) {
  const blocks = [];
  let current = null;
  for (const line of decision.split('\n')) {
    const head = line.match(/^  - ([^:]+):(.*)$/u);
    if (head) {
      if (current !== null) blocks.push(current);
      current = { name: head[1].trim(), text: line };
      continue;
    }
    if (current === null) continue;
    if (/^ {4,}\S/u.test(line)) {
      current.text += `\n${line}`;
      continue;
    }
    if (line.trim() === '') continue;
    blocks.push(current);
    current = null;
  }
  if (current !== null) blocks.push(current);
  return blocks.filter((block) => /^ {4,}- /mu.test(block.text));
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
 * エントリーの `Context` の項目（`C<n>`）と `Research & Trial` の事実（`F<n>`）が、
 * `Decision` の選択肢から参照されているかを確かめる。
 * 各選択肢はすべての `C` を参照し、すべての `F` はどれかの選択肢から参照される。
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
    const fs = labels(section(body, 'Research & Trial'), /^- F(\d+) \(C\d+\):/gmu);
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
    const blocks = options(section(body, 'Decision'));
    for (const block of blocks) {
      const found = refs(block.text);
      for (const c of cs) {
        if (!found.c.includes(c)) problems.push(`${nn}: ${block.name} does not carry C${c}`);
      }
      for (const c of found.c) {
        if (!cs.includes(c)) problems.push(`${nn}: ${block.name} refers to unknown C${c}`);
      }
      for (const f of found.f) {
        if (!fs.includes(f)) problems.push(`${nn}: ${block.name} refers to unknown F${f}`);
      }
    }
    const weighed = new Set(blocks.flatMap((block) => refs(block.text).f));
    for (const f of fs) {
      if (!weighed.has(f)) problems.push(`${nn}: F${f} is not weighed`);
    }
  }
  return problems;
}
