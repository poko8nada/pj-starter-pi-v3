import { configDefaults } from 'vitest/config';
import { describe, expect, it } from 'vitest';
import { testConfig } from '../../vitest.config.ts';

describe('testConfig', () => {
  it('false の一覧 → copy の各道から除外の glob を作る', () => {
    const copy = [
      '.pi',
      'definition',
      'lib',
      '.github/workflows',
      'test/temp-dir.ts',
      'AGENTS.md',
      'lefthook.yaml',
      'tsconfig.json',
      'vitest.config.ts',
      '.oxlintrc.json',
      '.oxfmtrc.json',
      'scripts/checks',
      'scripts/product-ready',
      'scripts/harness',
    ];
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
});
