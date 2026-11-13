import { describe, expect, it, vi } from 'vitest';
import config from './vitest.config.ts';

describe('vitest config', () => {
  // product-ready が全テストを除外したとき、0 件でも失敗しないための設定を守る。
  it('happy: passWithNoTests が true のまま → 一致する', () => {
    expect(config.test?.passWithNoTests).toBe(true);
  });

  it('happy: TEST_VERBOSE の有無で reporters が切り替わる → 一致する', async () => {
    const original = process.env.TEST_VERBOSE;
    try {
      process.env.TEST_VERBOSE = '1';
      vi.resetModules();
      const verboseConfig = (await import('./vitest.config.ts')).default;
      expect(verboseConfig.test?.reporters).toEqual(['verbose']);

      delete process.env.TEST_VERBOSE;
      vi.resetModules();
      const plainConfig = (await import('./vitest.config.ts')).default;
      expect(plainConfig.test?.reporters).toEqual([['default', { summary: false }]]);
    } finally {
      if (original === undefined) {
        delete process.env.TEST_VERBOSE;
      } else {
        process.env.TEST_VERBOSE = original;
      }
      vi.resetModules();
    }
  });
});
