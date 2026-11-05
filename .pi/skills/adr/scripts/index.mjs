/**
 * index — adr と affected の入り口。
 *
 *   node index.mjs [--root <dir>] [<nnn>]
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { basename, join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { git } from '../../../../lib/git-env.mjs';
import { adrSkeleton, checkEntry } from './adr.mjs';
import { affectedEntrySkeleton, affectedSkeleton } from './affected.mjs';
import {
  append,
  appendEntry,
  createLeafDir,
  cycleDirName,
  cycleNumberOf,
  dirNames,
  lastEntryNumber,
  nextNNN,
  openCycleDir,
  parseArgs,
  slugBranch,
  toYYMMDD,
} from './cycle.mjs';

/**
 * `affected.md` の本文に `affectedEntrySkeleton(nnn)` を追記する。
 * @param {string} markdown
 * @param {number} nnn
 * @returns {string}
 */
function appendAffectedEntry(markdown, nnn) {
  return append(markdown, affectedEntrySkeleton(nnn));
}

const isMain = process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;
if (isMain) {
  const { root, nnn: argNNN, check } = parseArgs(process.argv.slice(2));
  const cyclesDir = join(root, 'cycles');
  const archiveDir = join(cyclesDir, 'archive');
  const openDir = openCycleDir(cyclesDir);
  if (check) {
    if (openDir === null) throw new Error('no open cycle');
    const adrPath = join(openDir, 'adr.md');
    const problems = checkEntry(readFileSync(adrPath, 'utf8'));
    for (const problem of problems) console.error(problem);
    if (problems.length > 0) process.exit(1);
    console.log(`checked: ${adrPath}`);
  } else if (openDir !== null) {
    if (argNNN !== null) {
      throw new Error(`open cycle exists: ${openDir}; refusing nnn ${argNNN}`);
    }
    const adrPath = join(openDir, 'adr.md');
    const current = readFileSync(adrPath, 'utf8');
    const next = (lastEntryNumber(current) ?? 0) + 1;
    const cycle = cycleNumberOf(basename(openDir));
    if (cycle === null) throw new Error(`broken cycle dir name: ${openDir}`);
    writeFileSync(adrPath, appendEntry(current, next));
    console.log(`appended: ${adrPath}`);
    const affectedPath = join(openDir, 'affected.md');
    if (existsSync(affectedPath)) {
      const affectedCurrent = readFileSync(affectedPath, 'utf8');
      writeFileSync(affectedPath, appendAffectedEntry(affectedCurrent, next));
    } else {
      writeFileSync(affectedPath, affectedSkeleton(cycle, next));
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
    writeFileSync(join(leaf, 'affected.md'), affectedSkeleton(nnn, 1));
    console.log(`created: ${leaf}`);
  }
}
