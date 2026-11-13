# PLAN `vitest-config`

- No: 03
- Place: worktree
- Boundary Plans: なし

## Goal

`vitest.config.test.ts` から振る舞いを持たない定数確認がなくなり、`TEST_VERBOSE` の切り替えだけが残る

## Design

- Inside:
  - Modules: なし。`vitest.config.test.ts` は 1 つのテストを残し、モジュールの分割・統合はしない。
  - Dirs: なし。
- Outside:
  - Extract: なし。`vitest.config.ts` と `scripts/product-ready` の値は変えず、テストだけを削る。
  - Colocate: なし。

## Files

```text
scripts/
  product-ready/
    index.mjs
    index.test.ts
vitest.config.test.ts          update
vitest.config.ts
```

## Slices

## 1.定数確認の削除

`vitest.config.test.ts` から、実装の値を写すだけの確認を削除し、`TEST_VERBOSE` の切り替えのテストだけを残す。

### Types

なし

### Steps

1. `vitest.config.test.ts`
   1. update: 1 本目のテスト、`markerList()`、`readFileSync`、`dirname`、`join`、`fileURLToPath`、`configDefaults`、既定 import の `config`、`passWithNoTests` の断言 2 つを削除する。
   2. update: 2 本目の表題を「happy: TEST_VERBOSE の有無で reporters が切り替わる → 一致する」にする。
   3. update: 残るテストは次の形にする。

      ```ts
      import { describe, expect, it, vi } from 'vitest';

      describe('vitest config', () => {
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
      ```

### Policy

- Allowed:
  - 1 本目を削除する。
  - `passWithNoTests` の断言を削除する。
  - 2 本目の `TEST_VERBOSE` の確認を残す。
  - `pnpm test:run`、`pnpm typecheck`、`pnpm lint` で確かめる。
- Forbidden:
  - `vitest.config.ts` の値（`exclude`、`reporters`、`passWithNoTests`）を変えない - テストだけを扱い、028 は振る舞いを変えない。
  - 2 本目の `TEST_VERBOSE` の確認を削除しない - 振る舞いを持つ唯一の確認になる。
  - 新しいテストを足さない - このエントリは削除だけを決めており、代わりの確認は足さない。`scripts/product-ready/index.test.ts` は生成する設定を確かめるが、リポジトリの `vitest.config.ts` の値はこの plan では守らない。

### Verify

- Always:
  - `pnpm test:related vitest.config.test.ts`
  - `pnpm test:run`
  - `pnpm typecheck`
  - `pnpm lint`
  - `pnpm format:check`
  - 変えたファイル全体と、名指すファイルを読み、読む者の順に手順をたどり、番号、パス、名前、形を当て、不整合を直す。
- Added: なし

## Notes

### Slice 1: 定数確認の削除

- Findings: なし
- Unplanned: なし
- Commit: f5429ae
- Stopped:

### Cleanup: 定数確認の削除後に残るテストの見直し

- Findings: なし — `vitest.config.test.ts` は残る 1 本（happy: TEST_VERBOSE の有無で reporters が切り替わる → 一致する）のみで、重複・消えた振る舞い・作らなくなった分岐・型が保証する前提の再現・隠れた前提・共有すべき前提のいずれにも当たらないため、削るものも直すものもない。`scripts/product-ready/index.test.ts` は Files に印がなく対象外。`pnpm test:run` は 66 files / 872 tests 合格で緑を保つ。
- Unplanned: なし

## Work Review

### Round 1

- Stale:
- Unlisted:
- Gaps:
- Policy:
- Unproven:
- Noise:
- Doubts:

### Round 2

- Stale:
- Unlisted:
- Gaps:
- Policy:
- Unproven:
- Noise:
- Doubts:

## Acceptance

- Goal:
- Ran:
- Findings:
- Doubts:
