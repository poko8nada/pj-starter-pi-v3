/**
 * index — adr と affected の入り口。
 *
 *   node index.mjs --root <dir> --add <title>
 *   node index.mjs --root <dir> --delete <NN>
 *   node index.mjs --root <dir> --set <NN> <title>
 *   node index.mjs --root <dir> --check
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { basename, join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { git } from '../../../../lib/git-env.mjs';
import { adrSkeleton, checkEntry, entrySkeleton } from './adr.mjs';
import { affectedEntrySkeleton, affectedSkeleton } from './affected.mjs';
import {
  append,
  createLeafDir,
  cycleDirName,
  cycleNumberOf,
  deleteEntry,
  dirNames,
  lastEntryNumber,
  nextNNN,
  openCycleDir,
  parseArgs,
  setEntryTitle,
  slugBranch,
  toYYMMDD,
} from './cycle.mjs';

/**
 * `affected.md` の本文に `affectedEntrySkeleton(nnn, title)` を追記する。
 * @param {string} markdown
 * @param {number} nnn
 * @param {string} title
 * @returns {string}
 */
function appendAffectedEntry(markdown, nnn, title) {
  return append(markdown, affectedEntrySkeleton(nnn, title));
}

const isMain = process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;
if (isMain) {
  const { root, add, del, set, check } = parseArgs(process.argv.slice(2));
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
  } else if (add !== null) {
    if (openDir !== null) {
      const adrPath = join(openDir, 'adr.md');
      const current = readFileSync(adrPath, 'utf8');
      const next = (lastEntryNumber(current) ?? 0) + 1;
      const cycle = cycleNumberOf(basename(openDir));
      if (cycle === null) throw new Error(`broken cycle dir name: ${openDir}`);
      writeFileSync(adrPath, append(current, entrySkeleton(next, add)));
      console.log(`appended: ${adrPath}`);
      const affectedPath = join(openDir, 'affected.md');
      if (existsSync(affectedPath)) {
        const affectedCurrent = readFileSync(affectedPath, 'utf8');
        writeFileSync(affectedPath, appendAffectedEntry(affectedCurrent, next, add));
      } else {
        writeFileSync(affectedPath, affectedSkeleton(cycle, next, add));
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
      const nnn = nextNNN(dirNames(cyclesDir, archiveDir));
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
      writeFileSync(join(leaf, 'adr.md'), adrSkeleton(nnn, add));
      writeFileSync(join(leaf, 'affected.md'), affectedSkeleton(nnn, 1, add));
      console.log(`created: ${leaf}`);
    }
  } else if (del !== null) {
    if (openDir === null) throw new Error('no open cycle');
    const adrPath = join(openDir, 'adr.md');
    writeFileSync(adrPath, deleteEntry(readFileSync(adrPath, 'utf8'), del));
    console.log(`deleted: ${adrPath}`);
    const affectedPath = join(openDir, 'affected.md');
    if (existsSync(affectedPath)) {
      writeFileSync(affectedPath, deleteEntry(readFileSync(affectedPath, 'utf8'), del));
      console.log(`deleted: ${affectedPath}`);
    }
  } else if (set !== null) {
    if (openDir === null) throw new Error('no open cycle');
    const adrPath = join(openDir, 'adr.md');
    writeFileSync(adrPath, setEntryTitle(readFileSync(adrPath, 'utf8'), set.nn, set.title));
    console.log(`set: ${adrPath}`);
    const affectedPath = join(openDir, 'affected.md');
    if (existsSync(affectedPath)) {
      writeFileSync(
        affectedPath,
        setEntryTitle(readFileSync(affectedPath, 'utf8'), set.nn, set.title),
      );
      console.log(`set: ${affectedPath}`);
    }
  } else {
    throw new Error('no operation: use --add, --delete, --set or --check');
  }
}
