/**
 * 1 エントリー分の骨組み。`references/adr.format.md` のエントリーの形と合わせること。
 * @param {number} nnn
 * @returns {string}
 */
export function entrySkeleton(nnn) {
  return `## ${String(nnn).padStart(2, '0')}: <問い>

### Context

- <何が起きていて、何をしたいか>

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

- <測った事実、試した事>

### Decision

- Status: **accepted** | **rejected**（理由）
- Adopted:
  - <A>: <説明>
    - Add:
      - <増えるもの>
    - Update:
      - <変わるもの（何がどうなるか）>
    - Drop:
      - <消えるもの>
    - Keep:
      - <触らないものとその理由>
    - Cost:
      - <他の選択肢と比べたときの相対的なコスト>
- Options:
  - <B>: <説明> - <その選択肢を採用しなかった理由>

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
