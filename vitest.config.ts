import { configDefaults, defineConfig } from 'vitest/config';

const verbose = process.env.TEST_VERBOSE === '1';

type Reporters = ['verbose'] | [['default', { summary: boolean }]];

export default defineConfig({
  test: {
    exclude: [
      ...configDefaults.exclude,
      // product-ready: test-exclude start
      // product-ready: test-exclude end
    ],
    sequence: {
      shuffle: true,
    },
    reporters: (verbose ? ['verbose'] : [['default', { summary: false }]]) as Reporters,
    restoreMocks: true, // vi.spyOn を各テスト前に元へ戻す
    unstubGlobals: true, // vi.stubGlobal を各テスト後に戻す
    unstubEnvs: true, // vi.stubEnv を各テスト後に戻す
    passWithNoTests: true,
  },
});
