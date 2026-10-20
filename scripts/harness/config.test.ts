import { configDefaults } from 'vitest/config';
import { describe, expect, it } from 'vitest';
import { testConfig } from '../../vitest.config.ts';
import starterConfig from '../../vitest.starter.config.ts';

describe('testConfig', () => {
  it('false → exclude が configDefaults.exclude で始まり、.pi と .pi/** を含む', () => {
    const config = testConfig(false);
    const exclude = config.test?.exclude ?? [];
    expect(exclude.slice(0, configDefaults.exclude.length)).toEqual([...configDefaults.exclude]);
    expect(exclude).toContain('.pi');
    expect(exclude).toContain('.pi/**');
  });

  it('true → test.exclude が無い', () => {
    const config = testConfig(true);
    expect(config.test?.exclude).toBeUndefined();
  });

  it('false と true → setupFiles、passWithNoTests、空でない reporters を持つ', () => {
    for (const harness of [false, true]) {
      const config = testConfig(harness);
      expect(config.test?.setupFiles).toEqual(['./test/setup.ts']);
      expect(config.test?.passWithNoTests).toBe(true);
      expect(config.test?.reporters).not.toHaveLength(0);
    }
  });

  it('starter config の既定 → test.exclude が無い', () => {
    expect(starterConfig.test?.exclude).toBeUndefined();
  });
});
