/**
 * index — adr と affected の入り口。
 *
 *   node index.mjs [--root <dir>] [<nnn>]
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { git } from '../../../../lib/git-env.mjs';
import { adrSkeleton } from './adr.mjs';
import { affectedEntrySkeleton, affectedSkeleton } from './affected.mjs';
import {
  appendEntry,
  createLeafDir,
  cycleDirName,
  dirNames,
  lastEntryNumber,
  nextNNN,
  openCycleDir,
  parseArgs,
  slugBranch,
  toYYMMDD,
} from './cycle.mjs';

/**
 * `affected.md` の本文に `affectedEntrySkeleton(nnn)` を追記する。改行の扱いは `appendEntry` と同じ。
 * @param {string} markdown
 * @param {number} nnn
 * @returns {string}
 */
function appendAffectedEntry(markdown, nnn) {
  const entry = affectedEntrySkeleton(nnn);
  if (markdown === '') return entry;
  const withNewline = markdown.endsWith('\n') ? markdown : `${markdown}\n`;
  const sep = withNewline.endsWith('\n\n') ? '' : '\n';
  return `${withNewline}${sep}${entry}`;
}

const isMain = process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;
if (isMain) {
  const { root, nnn: argNNN } = parseArgs(process.argv.slice(2));
  const cyclesDir = join(root, 'cycles');
  const archiveDir = join(cyclesDir, 'archive');
  const openDir = openCycleDir(cyclesDir);
  if (openDir !== null) {
    if (argNNN !== null) {
      throw new Error(`open cycle exists: ${openDir}; refusing nnn ${argNNN}`);
    }
    const adrPath = join(openDir, 'adr.md');
    const current = readFileSync(adrPath, 'utf8');
    const next = (lastEntryNumber(current) ?? 0) + 1;
    writeFileSync(adrPath, appendEntry(current, next));
    console.log(`appended: ${adrPath}`);
    const affectedPath = join(openDir, 'affected.md');
    if (existsSync(affectedPath)) {
      const affectedCurrent = readFileSync(affectedPath, 'utf8');
      writeFileSync(affectedPath, appendAffectedEntry(affectedCurrent, next));
    } else {
      writeFileSync(affectedPath, affectedSkeleton(next));
    }
    console.log(`appended: ${affectedPath}`);
  } else {
    let branch = '';
    try {
      const result = git(root, ['branch', '--show-current']);
      if (result.status === 0) branch = (result.stdout ?? '').trim();
    } catch {
      branch = '';
    }
    const nnn = argNNN ?? nextNNN(dirNames(cyclesDir, archiveDir));
    const dirName = cycleDirName(nnn, toYYMMDD(new Date()), slugBranch(branch));
    mkdirSync(cyclesDir, { recursive: true });
    let leaf;
    try {
      leaf = createLeafDir(cyclesDir, dirName);
    } catch (err) {
      if (err && err.code === 'EEXIST') {
        console.error(`exists: ${join(cyclesDir, dirName)}`);
        process.exit(1);
      }
      throw err;
    }
    writeFileSync(join(leaf, 'adr.md'), adrSkeleton(nnn));
    writeFileSync(join(leaf, 'affected.md'), affectedSkeleton(nnn));
    console.log(`created: ${leaf}`);
  }
}
