import { configDefaults } from 'vitest/config';
import { describe, expect, it } from 'vitest';
import { testConfig } from '../../vitest.config.ts';
import { harnessExcludes, readList } from './list.mjs';

describe('testConfig', () => {
  it('false の一覧 → copy の各道から除外の glob を作る', () => {
    const root = process.cwd();
    const list = readList(root);
    const config = testConfig(false);
    const exclude = config.test?.exclude ?? [];
    expect(exclude.slice(0, configDefaults.exclude.length)).toEqual([...configDefaults.exclude]);
    expect(exclude.slice(configDefaults.exclude.length)).toEqual(harnessExcludes(list));
    const first = list.copy[0];
    expect(exclude).toContain(first);
    expect(exclude).toContain(`${first}/**`);
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
