import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { configDefaults } from 'vitest/config';
import { describe, expect, it } from 'vitest';
import config from './vitest.config.ts';

function markerList(): readonly string[] {
  const file = join(dirname(fileURLToPath(import.meta.url)), 'vitest.config.ts');
  const lines = readFileSync(file, 'utf8').split('\n');
  const start = lines.findIndex((line) => line.includes('product-ready: test-exclude start'));
  const end = lines.findIndex((line) => line.includes('product-ready: test-exclude end'));
  const body = lines.slice(start + 1, end);
  const found: string[] = [];
  for (const line of body) {
    const matched = line.match(/'([^']+)'/);
    if (matched !== null && matched[1] !== undefined) {
      found.push(matched[1]);
    }
  }
  return found;
}

describe('vitest config', () => {
  it('happy: configDefaults.exclude の後ろに目印の間の一覧が並ぶ → 配列が一致する', () => {
    const exclude = (config.test?.exclude ?? []) as readonly string[];
    expect(exclude.slice(0, configDefaults.exclude.length)).toEqual([...configDefaults.exclude]);
    expect(exclude.slice(configDefaults.exclude.length)).toEqual([...markerList()]);
  });

  it('happy: reporters と passWithNoTests が今の値のまま → 一致する', () => {
    const verbose = process.env.TEST_VERBOSE === '1';
    const expected = verbose ? ['verbose'] : [['default', { summary: false }]];
    expect(config.test?.reporters).toEqual(expected);
    expect(config.test?.passWithNoTests).toBe(true);
  });
});
