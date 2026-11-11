/**
 * index — plan のスキャフォールド。
 *
 *   node index.mjs <plan id> --order <NN> --place <worktree|base> --entries <NN[,NN...]>
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { entryNumbers, openCycleDir } from '../../adr/scripts/cycle.mjs';
import { filesTree, parseArgs, planSkeleton } from './plan.mjs';

/**
 * affected の `Path` を集める。
 * @param {string} openDir
 * @param {readonly string[]} entries
 * @returns {readonly { path: string, dir: boolean }[]}
 */
function readAffectedPaths(openDir, entries) {
  const paths = [];
  for (const nn of entries) {
    const path = join(openDir, 'affected', `${nn}.md`);
    if (!existsSync(path)) throw new Error(`missing affected: ${path}`);
    const lines = readFileSync(path, 'utf8').split('\n');
    let current = null;
    for (const line of lines) {
      const found = /^- Path: `(.+)`$/u.exec(line);
      if (found) {
        current = { path: found[1].replace(/\/$/u, ''), dir: false };
        paths.push(current);
        continue;
      }
      if (current !== null) {
        const kind = /^  - Kind: `(.+)`/u.exec(line);
        if (kind && kind[1] === 'dir') current.dir = true;
        if (line.startsWith('### ')) current = null;
      }
    }
  }
  return paths;
}

const isMain = process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;
if (isMain) {
  const { root, id, order, place, entries } = parseArgs(process.argv.slice(2));
  const cyclesDir = join(root, 'cycles');
  const openDir = openCycleDir(cyclesDir);
  if (openDir === null) throw new Error('no open cycle');
  const known = entryNumbers(readFileSync(join(openDir, 'adr.md'), 'utf8'));
  for (const nn of entries) {
    if (!known.includes(Number(nn))) throw new Error(`entry not found: ${nn}`);
  }
  const paths = readAffectedPaths(openDir, entries);
  const planDir = join(openDir, 'plan');
  mkdirSync(planDir, { recursive: true });
  const planPath = join(planDir, `${order}-${id}.md`);
  if (existsSync(planPath)) throw new Error(`exists: ${planPath}`);
  writeFileSync(planPath, planSkeleton({ id, entries, place, files: filesTree(paths) }));
  console.log(`created: ${planPath}`);
}
