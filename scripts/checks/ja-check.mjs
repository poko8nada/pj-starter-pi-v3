// ja-check: report banned Japanese words in staged files.
// Usage: node scripts/checks/ja-check.mjs <file1> <file2> ...
// Mechanism: reads scripts/checks/ja-check.json with fs.readFileSync and JSON.parse,
// prints <file>:<line>: <word> → <replacement> [error|warn] and a summary line.
import * as fs from 'node:fs';
import * as path from 'node:path';

const root = process.cwd();
const configPath = path.join(root, 'scripts', 'checks', 'ja-check.json');

let config;
try {
  config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
} catch (error) {
  if (error instanceof Error && 'code' in error && error.code === 'ENOENT') {
    const total = process.argv.slice(2).length;
    console.log('設定なし');
    console.log(`ja-check: ${total} ファイル、error 0 件、warn 0 件`);
    process.exit(0);
  } else {
    console.error('ja-check.json is not valid JSON');
    process.exit(1);
  }
}

function isRecord(value) {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

if (!isRecord(config)) {
  console.error('ja-check.json is not valid JSON');
  process.exit(1);
}

const keys = Object.keys(config);
if (keys.length !== 2 || !keys.includes('error') || !keys.includes('warn')) {
  console.error('ja-check.json is not valid JSON');
  process.exit(1);
}

if (!isRecord(config.error) || !isRecord(config.warn)) {
  console.error('ja-check.json is not valid JSON');
  process.exit(1);
}

for (const group of [config.error, config.warn]) {
  for (const [word, replacement] of Object.entries(group)) {
    if (typeof word !== 'string' || typeof replacement !== 'string') {
      console.error('ja-check.json is not valid JSON');
      process.exit(1);
    }
  }
}

const errorEntries = Object.entries(config.error);
const warnEntries = Object.entries(config.warn);

// True when word occurs in line outside matching quotes that hold only the word.
function hasUnquoted(line, word) {
  let from = 0;
  while (true) {
    const at = line.indexOf(word, from);
    if (at === -1) {
      return false;
    }
    const before = line[at - 1];
    const after = line[at + word.length];
    const quoted = (before === "'" || before === '"' || before === '`') && before === after;
    if (!quoted) {
      return true;
    }
    from = at + word.length;
  }
}

function isZeroHeading(line) {
  return /^##\s+0\.x\.x\b/.test(line);
}

function isHeading(line) {
  return /^##\s+/.test(line);
}

const files = process.argv.slice(2);
let errors = 0;
let warns = 0;

for (const file of files) {
  const abs = path.isAbsolute(file) ? file : path.join(root, file);
  if (abs === configPath) {
    continue;
  }
  let content;
  try {
    content = fs.readFileSync(abs, 'utf8');
  } catch {
    continue;
  }
  const isRoadmap = path.basename(abs) === 'ROADMAP.md';
  const lines = content.split('\n');
  let inZero = false;
  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index];
    if (isRoadmap) {
      if (isZeroHeading(line)) {
        inZero = true;
        continue;
      }
      if (isHeading(line)) {
        inZero = false;
      }
      if (inZero) {
        continue;
      }
    }
    for (const [word, replacement] of errorEntries) {
      if (hasUnquoted(line, word)) {
        console.log(`${file}:${index + 1}: ${word} → ${replacement} [error]`);
        errors += 1;
      }
    }
    for (const [word, replacement] of warnEntries) {
      if (hasUnquoted(line, word)) {
        console.log(`${file}:${index + 1}: ${word} → ${replacement} [warn]`);
        warns += 1;
      }
    }
  }
}

console.log(`ja-check: ${files.length} ファイル、error ${errors} 件、warn ${warns} 件`);
process.exit(errors > 0 ? 1 : 0);
