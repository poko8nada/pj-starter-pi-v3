import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';
import { readList } from './scripts/harness/list.mjs';
import { includeList, readMode } from './scripts/harness-state.mjs';

const verbose = process.env.TEST_VERBOSE === '1';

// config 自身の道から root を出す（`vitest --root` でも同じ所を読む）。
const root = dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  test: {
    // starter は全てが対象、product はハーネスの一覧を否定で外す。
    // 状態の切り替えは `scripts/harness.mode.json` を手で書く。
    include: [...includeList(readList(root), readMode(root))],
    // テストの足場（`test/setup.ts`）。理由はファイルを確認。
    setupFiles: ['./test/setup.ts'],
    reporters: verbose ? ['verbose'] : [['default', { summary: false }]],
    // 開始時はテストが0本でも緑。product は include の否定で0本になる。
    passWithNoTests: true,
  },
});
