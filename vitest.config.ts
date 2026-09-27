// 詳細が必要なときだけ TEST_VERBOSE=1（日本語補足：要約なしdefaultがvitest 4のbasic代替）。
import { defineConfig } from 'vitest/config';

const verbose = process.env.TEST_VERBOSE === '1';

export default defineConfig({
  test: {
    // フックが渡す GIT_* や利用者の git 設定を、テストの環境から切る（vitest.setup.ts に理由）。
    setupFiles: ['./vitest.setup.ts'],
    reporters: verbose ? ['verbose'] : [['default', { summary: false }]],
  },
});
