import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { blockUnder, sectionOf } from './blocks.mjs';

type SkeletonLines = {
  readonly en: readonly string[];
  readonly ja: readonly string[];
  readonly writing: readonly string[];
};

// config 自身の道からルートを出す（`vitest.config.ts:9` と同じ形）。
const HERE = dirname(fileURLToPath(import.meta.url));
const FORMAT_AT = join(HERE, '..', '..', 'rules', 'readme.format.md');

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
  const range = sectionOf(text.split('\n'), '## Writing');
  if (range === null) {
    throw new Error('no section ## Writing');
  }
  const writingLines = nonEmptyLines(text.split('\n').slice(range.from, range.to).join('\n'));
  if (!sameLines(writingLines, EXPECTED_WRITING)) {
    throw new Error('Writing rules changed');
  }
  return { en: enLines, ja: jaLines, writing: writingLines };
}

function readFormat(): string {
  return readFileSync(FORMAT_AT, 'utf8');
}

/** 行を差し替えた写しを返す（純）。対象の行が 1 つでなければ投げる */
function withLine(text: string, target: string, replacement: readonly string[]): string {
  const lines = text.split('\n');
  const hits = lines.flatMap((line, index) => (line === target ? [index] : []));
  if (hits.length !== 1) {
    throw new Error(`the line must appear once: ${target}`);
  }
  const at = hits[0];
  return [...lines.slice(0, at), ...replacement, ...lines.slice(at + 1)].join('\n');
}

describe('readme-format guard', () => {
  it('2つの雛形が決まった8行で、Writingが決まった6行', () => {
    const checked = readChecked(readFormat());
    expect(checked.en).toEqual(EXPECTED_EN);
    expect(checked.ja).toEqual(EXPECTED_JA);
    expect(checked.writing).toEqual(EXPECTED_WRITING);
  });

  it('1行を別の見出しに変えた写しは通らない', () => {
    const mutated = withLine(readFormat(), '## What is in it', ['## Extra']);
    expect(() => readChecked(mutated)).toThrow();
  });

  it('1行を落とした写しは通らない', () => {
    const mutated = withLine(readFormat(), '## Getting started', []);
    expect(() => readChecked(mutated)).toThrow();
  });

  it('Writingから1行を消した写しは通らない', () => {
    const mutated = withLine(
      readFormat(),
      '- Keep only related badges, each with a value from a source.',
      [],
    );
    expect(() => readChecked(mutated)).toThrow();
  });

  it('雛形の中にフェンスを足した写しは通らない', () => {
    const mutated = withLine(readFormat(), '## What is in it', ['```', '## What is in it']);
    expect(() => readChecked(mutated)).toThrow();
  });
});
