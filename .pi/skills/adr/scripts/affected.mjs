/**
 * 1 エントリー分の affected の骨組み。`references/affected.format.md` の形と合わせること。
 * @param {number} nnn
 * @returns {string}
 */
export function affectedEntrySkeleton(nnn) {
  return `## ${String(nnn).padStart(2, '0')}: <問い>

### Code

- Read: <path> — <何をするか>
- Check: <path> — <何をするか>
- Generate: <path> — <何をするか>

### External

- <外のもの> — <何をするか>
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
