import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

type SkeletonLines = {
  readonly en: readonly string[];
  readonly ja: readonly string[];
  readonly writing: readonly string[];
};

const RULES = join(process.cwd(), 'rules');
const FORMAT_FILE = 'readme.format.md';

const EXPECTED_EN: readonly string[] = [
  "# <the product's name>",
  '<badges>',
  '<what it is, in one sentence>',
  '## What is in it',
  '## Getting started',
  "## <the product's own sections>",
  '## Contributing',
  '## License',
];

const EXPECTED_JA: readonly string[] = [
  '# <プロダクトの名前>',
  '<バッジ>',
  '<何であるか、何をするか。1 文>',
  '## 入っているもの',
  '## 使い始める',
  '## <プロダクト固有のセクション>',
  '## コントリビュート',
  '## ライセンス',
];

const EXPECTED_WRITING: readonly string[] = [
  '- A section the product does not need is left out.',
  '- The pair stays a pair: a heading added to one is added to the other, in the same order.',
  '- Do not write what the reader can look up.',
  '- Keep only related badges, each with a value from a source.',
  '- The badges line sits right after the title with no heading.',
  '- `## Getting started` covers install and usage. There is no `## Usage`.',
];

const FENCE = /^(`{3,}|~{3,})/;
const HEADING = /^#{1,6} /;

function blockUnder(text: string, heading: string): string | null {
  const lines = text.split('\n');
  const start = lines.findIndex((line) => line.trim() === heading);
  if (start === -1) {
    return null;
  }
  let mark = '';
  let open = -1;
  for (let i = start + 1; i < lines.length; i += 1) {
    const line = lines[i].trim();
    if (open === -1) {
      const found = FENCE.exec(line);
      if (found) {
        mark = found[1];
        open = i;
      }
      continue;
    }
    if (line === mark) {
      return lines.slice(open + 1, i).join('\n');
    }
  }
  return null;
}

function sectionBody(text: string, heading: string): string | null {
  const lines = text.split('\n');
  const start = lines.findIndex((line) => line.trim() === heading);
  if (start === -1) {
    return null;
  }
  let to = lines.length;
  for (let i = start + 1; i < lines.length; i += 1) {
    if (HEADING.test(lines[i])) {
      to = i;
      break;
    }
  }
  return lines.slice(start + 1, to).join('\n');
}

function nonEmptyLines(block: string): readonly string[] {
  return block.split('\n').filter((line) => line.trim() !== '');
}

function sameLines(left: readonly string[], right: readonly string[]): boolean {
  if (left.length !== right.length) {
    return false;
  }
  for (let i = 0; i < left.length; i += 1) {
    if (left[i] !== right[i]) {
      return false;
    }
  }
  return true;
}

function readChecked(text: string): SkeletonLines {
  const en = blockUnder(text, '## Skeleton');
  if (en === null) {
    throw new Error('no block under ## Skeleton');
  }
  const ja = blockUnder(text, '## Skeleton (ja)');
  if (ja === null) {
    throw new Error('no block under ## Skeleton (ja)');
  }
  const enLines = nonEmptyLines(en);
  const jaLines = nonEmptyLines(ja);
  for (const line of [...enLines, ...jaLines]) {
    if (FENCE.test(line.trim())) {
      throw new Error('fence line inside skeleton block');
    }
    if (line.includes('## Usage')) {
      throw new Error('## Usage must not be in skeleton');
    }
  }
  if (!sameLines(enLines, EXPECTED_EN)) {
    throw new Error('English skeleton changed');
  }
  if (!sameLines(jaLines, EXPECTED_JA)) {
    throw new Error('Japanese skeleton changed');
  }
  const writing = sectionBody(text, '## Writing');
  if (writing === null) {
    throw new Error('no section ## Writing');
  }
  const writingLines = nonEmptyLines(writing);
  if (!sameLines(writingLines, EXPECTED_WRITING)) {
    throw new Error('Writing rules changed');
  }
  return { en: enLines, ja: jaLines, writing: writingLines };
}

function readFormat(): string {
  return readFileSync(join(RULES, FORMAT_FILE), 'utf8');
}

describe('readme-format guard', () => {
  it('2つの雛形が決まった8行で、Writingが決まった6行', () => {
    const checked = readChecked(readFormat());
    expect(checked.en).toEqual(EXPECTED_EN);
    expect(checked.ja).toEqual(EXPECTED_JA);
    expect(checked.writing).toEqual(EXPECTED_WRITING);
  });

  it('1行を別の見出しに変えた写しは通らない', () => {
    const mutated = readFormat().replace('## What is in it', '## Extra');
    expect(() => readChecked(mutated)).toThrow();
  });

  it('1行を落とした写しは通らない', () => {
    const mutated = readFormat().replace('## Getting started\n\n', '');
    expect(() => readChecked(mutated)).toThrow();
  });

  it('Writingから1行を消した写しは通らない', () => {
    const mutated = readFormat().replace(
      '- Keep only related badges, each with a value from a source.\n',
      '',
    );
    expect(() => readChecked(mutated)).toThrow();
  });

  it('雛形の中にフェンスを足した写しは通らない', () => {
    const mutated = readFormat().replace('## What is in it', '```\n## What is in it');
    expect(() => readChecked(mutated)).toThrow();
  });
});
