/**
 * PLAN の骨組みと、引数の読み取り。
 */

/**
 * @typedef {{ root: string, id: string, order: string, place: 'worktree' | 'base', entries: readonly string[] }} Args
 */

/**
 * CLI 引数を読む。`<plan id>` は位置引数、残りは名前付き。
 * @param {readonly string[]} argv
 * @returns {Args}
 */
export function parseArgs(argv) {
  let root = process.cwd();
  let rootSet = false;
  let id = null;
  let order = null;
  let place = null;
  let entries = null;
  const setPlace = (value) => {
    if (place !== null) throw new Error('too many places');
    place = value;
  };
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === '--root') {
      const value = argv[i + 1];
      if (value === undefined) throw new Error('missing value for --root');
      if (rootSet) throw new Error('too many --root');
      root = value;
      rootSet = true;
      i++;
    } else if (arg === '--order') {
      const value = argv[i + 1];
      if (value === undefined) throw new Error('missing value for --order');
      if (!/^\d+$/.test(value) || Number(value) < 1) throw new Error(`not an order: ${value}`);
      if (order !== null) throw new Error('too many --order');
      order = String(Number(value)).padStart(2, '0');
      i++;
    } else if (arg === '--place') {
      const value = argv[i + 1];
      if (value === undefined) throw new Error('missing value for --place');
      if (value !== 'worktree' && value !== 'base') throw new Error(`not a place: ${value}`);
      setPlace(value);
      i++;
    } else if (arg === '-w') {
      setPlace('worktree');
    } else if (arg === '-b') {
      setPlace('base');
    } else if (arg === '--entries') {
      const value = argv[i + 1];
      if (value === undefined) throw new Error('missing value for --entries');
      if (entries !== null) throw new Error('too many --entries');
      const list = value.split(',').map((part) => part.trim());
      if (list.some((part) => !/^\d+$/.test(part) || Number(part) < 1)) {
        throw new Error(`not an entry list: ${value}`);
      }
      entries = [...new Set(list.map((part) => String(Number(part)).padStart(2, '0')))];
      i++;
    } else if (arg.startsWith('-')) {
      throw new Error(`unknown argument: ${arg}`);
    } else {
      if (id !== null) throw new Error(`too many plan ids: ${arg}`);
      if (arg.trim() === '') throw new Error('empty plan id');
      id = arg;
    }
  }
  if (id === null) throw new Error('missing plan id');
  if (order === null) throw new Error('missing --order');
  if (place === null) throw new Error('missing --place');
  if (entries === null) throw new Error('missing --entries');
  return { root, id, order, place, entries };
}

/**
 * affected の `Path` から `Files` のツリーを作る。
 * @param {readonly { path: string, dir: boolean }[]} paths
 * @returns {string}
 */
export function filesTree(paths) {
  const root = { children: new Map() };
  for (const entry of paths) {
    const segments = entry.path.split('/').filter((part) => part !== '');
    let node = root;
    for (let i = 0; i < segments.length; i++) {
      const name = segments[i];
      const last = i === segments.length - 1;
      let child = node.children.get(name);
      if (child === undefined) {
        child = { name, dir: !last || entry.dir, children: new Map() };
        node.children.set(name, child);
      } else if (!last || entry.dir) {
        child.dir = true;
      }
      node = child;
    }
  }
  const lines = [];
  const render = (node, depth) => {
    const children = [...node.children.values()].toSorted((a, b) => {
      if (a.dir !== b.dir) return a.dir ? -1 : 1;
      return a.name.localeCompare(b.name);
    });
    for (const child of children) {
      lines.push(`${'  '.repeat(depth)}${child.name}${child.dir ? '/' : ''}`);
      if (child.dir) render(child, depth + 1);
    }
  };
  render(root, 0);
  return lines.length === 0 ? 'なし' : lines.join('\n');
}

/**
 * PLAN の骨組み。
 * @param {{ id: string, entries: readonly string[], place: 'worktree' | 'base', files: string }} plan
 * @returns {string}
 */
export function planSkeleton({ id, entries, place, files }) {
  return `# PLAN \`${id}\`

- No: ${entries.join(', ')}
- Place: ${place}
- Boundary Plans:

## Goal

## Design

- Inside:
  - Modules:
  - Dirs:
- Outside:
  - Extract:
  - Colocate:

## Files

\`\`\`text
${files}
\`\`\`

## Slices

## Notes

## Work Review

### Round 1

- Stale:
- Unlisted:
- Gaps:
- Policy:
- Unproven:
- Noise:
- Doubts:

### Round 2

- Stale:
- Unlisted:
- Gaps:
- Policy:
- Unproven:
- Noise:
- Doubts:

## Acceptance

- Goal:
- Ran:
- Findings:
- Doubts:
`;
}
