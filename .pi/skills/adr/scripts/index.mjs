/**
 * index — adr と affected の入り口。
 *
 *   node index.mjs --root <dir> --add <title> [Full|Simple]
 *   node index.mjs --root <dir> --delete <NN>
 *   node index.mjs --root <dir> --set <NN> <title> [Full|Simple]
 *   node index.mjs --root <dir> --check
 */
import { existsSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { git } from '../../../../lib/git-env.mjs';
import { adrSkeleton, checkEntry, entrySkeleton } from './adr.mjs';
import { affectedEntrySkeleton } from './affected.mjs';
import {
  append,
  createLeafDir,
  cycleDirName,
  deleteEntry,
  dirNames,
  lastEntryNumber,
  nextNNN,
  openCycleDir,
  parseArgs,
  setEntryTitle,
  setEntryType,
  slugBranch,
  toYYMMDD,
} from './cycle.mjs';

/**
 * `affected/` の dir を返す。
 * @param {string} openDir
 * @returns {string}
 */
function affectedDir(openDir) {
  return join(openDir, 'affected');
}

/**
 * 1 エントリ分の affected の path を返す。
 * @param {string} openDir
 * @param {number} nn
 * @returns {string}
 */
function affectedPath(openDir, nn) {
  return join(affectedDir(openDir), `${String(nn).padStart(2, '0')}.md`);
}

/**
 * `affected/` の `.md` を番号順に返す。dir がなければ空。
 * @param {string} openDir
 * @returns {readonly { nn: number, path: string }[]}
 */
function affectedFiles(openDir) {
  let entries;
  try {
    entries = readdirSync(affectedDir(openDir), { withFileTypes: true });
  } catch (err) {
    if (err && err.code === 'ENOENT') return [];
    throw err;
  }
  const files = [];
  for (const entry of entries) {
    if (!entry.isFile()) continue;
    const found = /^(\d{2})\.md$/.exec(entry.name);
    if (!found) continue;
    files.push({ nn: Number(found[1]), path: join(affectedDir(openDir), entry.name) });
  }
  return files.toSorted((a, b) => a.nn - b.nn);
}

/**
 * 1 エントリ分の affected の見出し番号を `next` に変える。
 * @param {string} markdown
 * @param {number} next
 * @returns {string}
 */
function renumberEntryFile(markdown, next) {
  return markdown.replace(/^## \d{2}:/u, `## ${String(next).padStart(2, '0')}:`);
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
      writeFileSync(adrPath, append(current, entrySkeleton(next, add.title, add.type)));
      console.log(`appended: ${adrPath}`);
      mkdirSync(affectedDir(openDir), { recursive: true });
      const path = affectedPath(openDir, next);
      writeFileSync(path, affectedEntrySkeleton(next, add.title));
      console.log(`created: ${path}`);
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
      writeFileSync(join(leaf, 'adr.md'), adrSkeleton(nnn, add.title, add.type));
      mkdirSync(affectedDir(leaf), { recursive: true });
      writeFileSync(affectedPath(leaf, 1), affectedEntrySkeleton(1, add.title));
      console.log(`created: ${leaf}`);
    }
  } else if (del !== null) {
    if (openDir === null) throw new Error('no open cycle');
    const adrPath = join(openDir, 'adr.md');
    writeFileSync(adrPath, deleteEntry(readFileSync(adrPath, 'utf8'), del));
    console.log(`deleted: ${adrPath}`);
    const path = affectedPath(openDir, del);
    if (existsSync(path)) {
      rmSync(path);
      console.log(`deleted: ${path}`);
    }
    for (const file of affectedFiles(openDir)) {
      if (file.nn <= del) continue;
      const next = file.nn - 1;
      const nextPath = affectedPath(openDir, next);
      writeFileSync(nextPath, renumberEntryFile(readFileSync(file.path, 'utf8'), next));
      rmSync(file.path);
      console.log(`renamed: ${file.path} -> ${nextPath}`);
    }
  } else if (set !== null) {
    if (openDir === null) throw new Error('no open cycle');
    const adrPath = join(openDir, 'adr.md');
    const markdown = readFileSync(adrPath, 'utf8');
    writeFileSync(
      adrPath,
      set.type === null
        ? setEntryTitle(markdown, set.nn, set.title)
        : setEntryType(markdown, set.nn, set.title, set.type),
    );
    console.log(`set: ${adrPath}`);
    const path = affectedPath(openDir, set.nn);
    if (existsSync(path)) {
      writeFileSync(path, setEntryTitle(readFileSync(path, 'utf8'), set.nn, set.title));
      console.log(`set: ${path}`);
    }
  } else {
    throw new Error('no operation: use --add, --delete, --set or --check');
  }
}
