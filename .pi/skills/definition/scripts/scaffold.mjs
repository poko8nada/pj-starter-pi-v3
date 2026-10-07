/**
 * scaffold — 新 cycle の definition 草案を素起こしする。1 script 2役。
 *
 * - 前 cycle がある時: 前回 definition の marker を外して複写する
 * - 初回 cycle の時: `references/format.md` の形の template 文字列を出す
 * `# Definition <NNN>` の見出し番号は書き手が直す。
 *
 *   node scaffold.mjs <dest-definition.md> [<src-definition.md>]
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';

/** 行末の marker。` **add** (ADR 01-1)` の形 */
const MARKER = /\s+\*\*(add|update|drop)\*\*(\s*\(.*\))?\s*$/;

/**
 * 初回 cycle の template。`references/format.md` の形と合わせること。
 * @type {string}
 */
export const TEMPLATE_001 = `# Definition <NNN>

## Product

<プロダクト名>

### What

<何であるか。何をするか>

### Who

- <id>: <誰か>
  - Does: <その人が何をするか>
  - Needs: <その人が何を必要としているか>

### Users can do

- <unit-id>: <Who が、xxx する>
  - .<feature>: <説明>

## Stack

- Ground:
  - Language: TypeScript
  - Runtime: Node
  - Package manager: pnpm
  - Deploy:
- Checks:
  - Typechecker: tsc
  - Test runner: vitest
  - Linter: oxlint
  - Formatter: oxfmt
  - Git hooks: lefthook
- Agent:
  - Host: \`@earendil-works/pi-coding-agent\`
  - Schema: typebox
- Product:
`;

/**
 * @param {string} text
 * @returns {string}
 */
export function stripMarkers(text) {
  return text
    .split('\n')
    .map((line) => line.replace(MARKER, ''))
    .join('\n');
}

const isMain = process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;
if (isMain) {
  const [dest, src] = process.argv.slice(2);
  if (!dest) {
    console.error('usage: scaffold.mjs <dest-definition.md> [<src-definition.md>]');
    process.exit(1);
  }
  writeFileSync(dest, src ? stripMarkers(readFileSync(src, 'utf8')) : TEMPLATE_001);
}
