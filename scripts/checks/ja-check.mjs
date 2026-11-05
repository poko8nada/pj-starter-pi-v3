// ja-check: report banned Japanese words in staged files.
// Usage: node scripts/checks/ja-check.mjs <file1> <file2> ...
// Mechanism: reads scripts/checks/ja-check.json with fs.readFileSync and JSON.parse,
// outputs header, per-hit context lines, No findings or No config lines, closing counts.
// Skips files matching exclude without reading.
import * as fs from 'node:fs';
import * as path from 'node:path';

const root = process.cwd();
const configPath = path.join(root, 'scripts', 'checks', 'ja-check.json');

const HEADER_1 =
  'ja-check: Report to the owner. warn needs judgement (commit continues); error must be fixed (commit stops).';
const HEADER_2 = 'ja-check: Replacements are ideas; judge by context and content.';

function printHeader() {
  console.log(HEADER_1);
  console.log(HEADER_2);
}

function failConfig() {
  printHeader();
  console.error('ja-check.json is not valid JSON');
  process.exit(1);
}

let config;
try {
  config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
} catch (error) {
  if (error instanceof Error && 'code' in error && error.code === 'ENOENT') {
    const total = process.argv.slice(2).length;
    printHeader();
    console.log('ja-check: No config.');
    console.log(`ja-check: ${total} files, error 0, warn 0.`);
    process.exit(0);
  } else {
    printHeader();
    console.error('ja-check.json is not valid JSON');
    process.exit(1);
  }
}

function isRecord(value) {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

if (!isRecord(config)) {
  failConfig();
}

const keys = Object.keys(config);
if (
  keys.length !== 4 ||
  !keys.includes('error') ||
  !keys.includes('warn') ||
  !keys.includes('exception') ||
  !keys.includes('exclude')
) {
  failConfig();
}

if (!isRecord(config.error) || !isRecord(config.warn)) {
  failConfig();
}

if (!Array.isArray(config.exception) || !Array.isArray(config.exclude)) {
  failConfig();
}

for (const word of config.exception) {
  if (typeof word !== 'string') {
    failConfig();
  }
}

for (const pattern of config.exclude) {
  if (typeof pattern !== 'string') {
    failConfig();
  }
}

for (const group of [config.error, config.warn]) {
  for (const [word, replacement] of Object.entries(group)) {
    if (typeof word !== 'string' || typeof replacement !== 'string') {
      failConfig();
    }
  }
}

const errorEntries = Object.entries(config.error);
const warnEntries = Object.entries(config.warn);
const exceptionWords = config.exception;
const excludePatterns = config.exclude;
const configRelPosix = path.relative(root, configPath).split(path.sep).join('/');

/**
 * Argument may be relative or absolute.
 * Converts to a relative path from the repo root with `/` separators,
 * then matches against each `exclude` pattern and the config file itself.
 */
function isExcluded(file) {
  const abs = path.isAbsolute(file) ? file : path.join(root, file);
  const relPosix = path.relative(root, abs).split(path.sep).join('/');
  if (relPosix === configRelPosix) {
    return true;
  }
  for (const pattern of excludePatterns) {
    const posixPattern = pattern.split(path.sep).join('/');
    if (path.matchesGlob(relPosix, posixPattern)) {
      return true;
    }
  }
  return false;
}

// True when the hit at `at` with length `word.length` lies inside an exception word.
// L is the exception length, N is the hit length; check each k in 0..L-N
// whether line.slice(at - k, at - k + L) equals the exception word.
function isCovered(line, at, word) {
  const hitLen = word.length;
  for (const exception of exceptionWords) {
    const len = exception.length;
    if (len < hitLen) {
      continue;
    }
    for (let k = 0; k <= len - hitLen; k += 1) {
      const start = at - k;
      if (start < 0 || start + len > line.length) {
        continue;
      }
      if (line.slice(start, start + len) === exception) {
        return true;
      }
    }
  }
  return false;
}

// Index of word in line outside matching quotes that hold only the word
// and outside exception words, -1 when absent.
function findUnquoted(line, word) {
  let from = 0;
  while (true) {
    const at = line.indexOf(word, from);
    if (at === -1) {
      return -1;
    }
    const before = line[at - 1];
    const after = line[at + word.length];
    const quoted = (before === "'" || before === '"' || before === '`') && before === after;
    if (!quoted && !isCovered(line, at, word)) {
      return at;
    }
    from = at + word.length;
  }
}

function contextSnippet(line, word, at) {
  const before = line.slice(Math.max(0, at - 10), at);
  const after = line.slice(at + word.length, at + word.length + 10);
  return `(…${before}[${word}]${after}…)`;
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

printHeader();

for (const file of files) {
  if (isExcluded(file)) {
    continue;
  }
  const abs = path.isAbsolute(file) ? file : path.join(root, file);
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
      const at = findUnquoted(line, word);
      if (at !== -1) {
        console.log(
          `${file}:${index + 1}: ${word} → ${replacement} [error] ${contextSnippet(line, word, at)}`,
        );
        errors += 1;
      }
    }
    for (const [word, replacement] of warnEntries) {
      const at = findUnquoted(line, word);
      if (at !== -1) {
        console.log(
          `${file}:${index + 1}: ${word} → ${replacement} [warn] ${contextSnippet(line, word, at)}`,
        );
        warns += 1;
      }
    }
  }
}

if (errors + warns === 0) {
  console.log('ja-check: No findings.');
}
console.log(`ja-check: ${files.length} files, error ${errors}, warn ${warns}.`);
process.exit(errors > 0 ? 1 : 0);
