import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { configDefaults, defineConfig } from 'vitest/config';
import { harnessExcludes, readList } from './scripts/harness/list.mjs';

const verbose = process.env.TEST_VERBOSE === '1';

// config 自身の道から root を出す（`vitest --root` でも同じ所を読む）。
const root = dirname(fileURLToPath(import.meta.url));

type Reporters = ['verbose'] | [['default', { summary: boolean }]];

type TestConf = {
  test: {
    setupFiles: string[];
    reporters: Reporters;
    passWithNoTests: boolean;
    exclude?: string[];
  };
};

/**
 * テストの設定を作る（純）。starter（`true`）は全てが対象、product（`false`）はハーネスの一覧を除外で外す。
 */
export function testConfig(harness: boolean): TestConf {
  const base = {
    // テストの足場（`test/setup.ts`）。理由はファイルを確認。
    setupFiles: ['./test/setup.ts'],
    reporters: (verbose ? ['verbose'] : [['default', { summary: false }]]) as Reporters,
    // 開始時はテストが0本でも緑。product は除外の結果0本になる。
    passWithNoTests: true,
  };
  if (harness) {
    return { test: base };
  }
  return {
    test: {
      ...base,
      exclude: [...configDefaults.exclude, ...harnessExcludes(readList(root))],
    },
  };
}

export default defineConfig(testConfig(false));
