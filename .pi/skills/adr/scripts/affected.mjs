/**
 * 1 エントリー分の affected の骨組み。`references/affected.format.md` の形と合わせること。
 * @param {number} nnn
 * @returns {string}
 */
export function affectedEntrySkeleton(nnn) {
  return `## ${String(nnn).padStart(2, '0')}: <問い>

### Code

- Path: \`<パス>\`
  - Kind: \`module\` | \`test\` | \`doc\` | \`config\` | \`artifact\` | \`dir\`
  - Edge: \`needs\` | \`names\` | \`mentions\` | \`checks\` | \`contains\` \`<パス>\`

### External

- Name: \`<外のもの>\`
  - Kind: \`env\` | \`contract\` | \`data\` | \`path\` | \`limit\`
  - Used by: \`<それを使うパス>\`
`;
}

/**
 * `affected.md` の骨組み。`references/affected.format.md` の形と合わせること。`cycle` はサイクルの番号、`entry` は最初のエントリーの番号。
 * @param {number} cycle
 * @param {number} entry
 * @returns {string}
 */
export function affectedSkeleton(cycle, entry) {
  return `# Affected ${String(cycle).padStart(3, '0')}

${affectedEntrySkeleton(entry)}`;
}
