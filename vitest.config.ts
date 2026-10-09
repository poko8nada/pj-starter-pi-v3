import { defineConfig } from 'vitest/config';

const verbose = process.env.TEST_VERBOSE === '1';

export default defineConfig({
  test: {
    // テストの足場（`test/setup.ts`）。理由はファイルを確認。
    setupFiles: ['./test/setup.ts'],
    reporters: verbose ? ['verbose'] : [['default', { summary: false }]],
    // 開始時はテストが0本でも緑。product:ready が名指しを消すと0本になる。
    passWithNoTests: true,
  },
});
