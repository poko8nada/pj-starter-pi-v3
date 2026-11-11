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
    reporters: (verbose ? ['verbose'] : [['default', { summary: false }]]) as Reporters,
    passWithNoTests: true,
  },
});
