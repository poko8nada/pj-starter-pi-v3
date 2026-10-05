import { defineConfig } from 'vitest/config';

const verbose = process.env.TEST_VERBOSE === '1';

export default defineConfig({
  test: {
    // ハーネスのテスト設定（`.pi/test/setup.ts`）。理由はファイルにを確認。
    setupFiles: ['./.pi/test/setup.ts'],
    reporters: verbose ? ['verbose'] : [['default', { summary: false }]],
  },
});
