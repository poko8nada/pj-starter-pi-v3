/**
 * 1 エントリー分の affected の骨組み。`references/affected.format.md` の形と合わせること。
 * @param {number} nnn
 * @param {string} [title]
 * @returns {string}
 */
export function affectedEntrySkeleton(nnn, title) {
  const q = title === undefined ? '<問い>' : title;
  return `## ${String(nnn).padStart(2, '0')}: ${q}

### Keywords

- \`<キーワード>\`

### Code

- Path: \`<パス>\`
  - Kind: \`module\` | \`test\` | \`doc\` | \`config\` | \`artifact\` | \`dir\`
  - Edge: \`needs\` | \`names\` | \`mentions\` | \`checks\` | \`contains\` | \`defines\` \`<パス>\`

### External

- Name: \`<外のもの>\`
  - Kind: \`env\` | \`contract\` | \`event\` | \`data\` | \`path\` | \`limit\`
  - Used by: \`<それを使うパス>\`
`;
}
