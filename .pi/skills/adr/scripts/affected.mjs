/**
 * 1 エントリー分の affected の骨組み。`references/affected.format.md` の形と合わせること。
 * @param {number} nnn
 * @returns {string}
 */
export function affectedEntrySkeleton(nnn) {
  return `## ${String(nnn).padStart(2, '0')}: <問い>

### Code

#### <パス>

- Search:
  - 01: <検索名（範囲を含む）> - <ヒット数/対象ファイル数>: <検索で見えていないもの>
- Adr: <ADR の事実との一致。一致しないときは何が違うか>
- Direction: _Read_ | _Read by_ | _Check_ | _Generate_
- Relation: <変更との関係。何をするか、何をされるか>
- Role: <構造の中で何か。自分の言葉で>
- Role change: **Change** | Not change
  - <変わる場合は、何がどのように変わるのか>
- Adjustment: **YES** | No
  - <新しい役割が要求する調整内容。plan が決める>

### External

#### <外のもの>

- Search:
  - 01: <検索名（範囲を含む）> - <ヒット数/対象ファイル数>: <検索で見えていないもの>
- Adr: <ADR の事実との一致。一致しないときは何が違うか>
- Relation: <変更との関係>
- Role: <外側で何か>
- Role change: **Change** | Not change
  - <変わる場合は、何がどのように変わるのか>
- Adjustment: **YES** | No
  - <新しい役割が要求する調整内容。plan が決める>
`;
}

/**
 * `affected.md` の骨組み。`references/affected.format.md` の形と合わせること。
 * @param {number} nnn
 * @returns {string}
 */
export function affectedSkeleton(nnn) {
  return `# Affected ${String(nnn).padStart(3, '0')}

${affectedEntrySkeleton(1)}`;
}
