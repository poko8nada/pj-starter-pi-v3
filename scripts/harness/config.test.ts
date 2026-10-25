import { readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { configDefaults } from 'vitest/config';
import { describe, expect, it } from 'vitest';
import { testConfig } from '../../vitest.config.ts';
import { readList } from './list.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..', '..');

/** `test/` 直下の `*.ts` を `test/<名>` の形で集める。件数は直書きしない */
function testFiles(): string[] {
  const entries = readdirSync(join(root, 'test'), { withFileTypes: true });
  const rels: string[] = [];
  for (const entry of entries) {
    if (entry.isFile() && entry.name.endsWith('.ts')) {
      rels.push(`test/${entry.name}`);
    }
  }
  rels.sort();
  return rels;
}

describe('testConfig', () => {
  it('false の一覧 → copy の各道から除外の glob を作る', () => {
    const { copy } = readList(root);
    const exclude = testConfig(false).test?.exclude ?? [];
    const expectedTail: string[] = [];
    for (const entry of copy) {
      const rel = entry.replace(/\/+$/, '');
      if (rel === '' || rel === '.') {
        continue;
      }
      expectedTail.push(rel, `${rel}/**`);
    }
    expect(exclude.slice(configDefaults.exclude.length)).toEqual(expectedTail);
  });

  it('true の一覧 → 除外が無い', () => {
    expect(testConfig(true).test?.exclude).toBeUndefined();
  });

  it('両方とも既定値を埋める', () => {
    const verbose = process.env.TEST_VERBOSE === '1';
    const expected = verbose ? ['verbose'] : [['default', { summary: false }]];
    for (const harness of [false, true]) {
      const config = testConfig(harness);
      expect(config.test?.passWithNoTests).toBe(true);
      expect(config.test?.reporters).toEqual(expected);
    }
  });

  it('test/ 直下の *.ts → すべて copy の項目にある', () => {
    const { copy } = readList(root);
    for (const rel of testFiles()) {
      expect(copy).toContain(rel);
    }
  });
});
