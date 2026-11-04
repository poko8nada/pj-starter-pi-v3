/**
 * close 系テストのテンプレートファクトリ。
 *
 * 文字列を組み立てるだけで、プロセスも FS も開かない。
 * テストの外から読まれても、何も起きずに止まらない（読んだだけでは何もしない）。
 */

/** plan md の材料。`no` を省くと `- No:` の無い形（`ex-` plan）になる。 */
export type PlanDocOptions = {
  readonly name: string;
  readonly no?: string | null;
  readonly notes: string;
  readonly review?: readonly string[];
};

/** plan md のテンプレートを作る。 */
export function planDoc({ no = null, name, notes, review }: PlanDocOptions): string {
  const noLine = no === null || no === undefined ? '' : `\n- No: ${no}\n`;
  const base = `# PLAN \`${name}\`${noLine}\n## Notes\n\n### Slice 1: foo\n\n- Findings:\n  - ${notes}\n- Unplanned:\n  - なし\n- Commit: abc1234\n`;
  if (review === undefined) return base;
  const bullets = review.map((item) => `- ${item}`).join('\n');
  return `${base}\n## Work Review\n\n### Round 1\n\n${bullets}\n`;
}

/** close md の Triage 行の材料。 */
export type TriageOptions = {
  readonly name: string;
  readonly no: string;
};

/** Triage 行を持つ close md のテンプレートを作る。 */
export function closeDoc({ triages }: { readonly triages: readonly TriageOptions[] }): string {
  const lines = triages.map(
    (triage, index) => `- ${index + 1}: _ex-plan_ ${triage.name} (ADR ${triage.no}, xxx): why`,
  );
  return `# Close 001\n\n## Collected\n\nなし\n\n## Triage\n\n${lines.join('\n')}\n`;
}
