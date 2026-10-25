/**
 * close 系テストの雛形工場。
 *
 * 文字列を組み立てるだけで、プロセスも FS も開かない。
 * テストの外から読まれても、何も起きずに止まらない（読んだだけでは何もしない）。
 */

/** plan md の材料。`no` を省くと `- No:` の無い形（`ex-` plan）になる。 */
export type PlanDocOptions = {
  readonly name: string;
  readonly no?: string | null;
  readonly notes: string;
};

/** plan md の雛形を作る。 */
export function planDoc({ no = null, name, notes }: PlanDocOptions): string {
  const noLine = no === null || no === undefined ? '' : `\n- No: ${no}\n`;
  return `# PLAN \`${name}\`${noLine}\n## Notes\n\n### Slice 1: foo\n\n- Findings:\n  - ${notes}\n- Unplanned:\n  - なし\n- Commit: abc1234\n`;
}

/** close md の Triage 行の材料。 */
export type TriageOptions = {
  readonly name: string;
  readonly no: string;
};

/** Triage 行を持つ close md の雛形を作る。 */
export function closeDoc({ triages }: { readonly triages: readonly TriageOptions[] }): string {
  const lines = triages.map(
    (triage, index) => `- ${index + 1}: ex-plan ${triage.name} (ADR ${triage.no}, xxx): why`,
  );
  return `# Close 001\n\n## Collected\n\nなし\n\n## Triage\n\n${lines.join('\n')}\n`;
}
