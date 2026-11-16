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
  - なし — `markerList()`・`readFileSync`・`configDefaults`・既定 import の `config` への残存参照はなく（`vitest.config.test.ts:1-25`）、`vitest.config.ts:11-12` の目印は `scripts/product-ready/index.mjs:7-8` が現役で使うため陳腐化しない。ADR の旧記述は履歴であり更新対象外。
- Unlisted:
  - なし — 差分は `vitest.config.test.ts:1-25`（Files が `update` 指定）のみで、`vitest.config.ts`・`scripts/product-ready/` は無変更。plan md の記録追記は定型の進捗記録であり Files 対象外。
- Gaps:
  - なし — 残る 1 本（`vitest.config.test.ts:4-24`）が `TEST_VERBOSE='1'` と未設定の両分岐を fresh import で確かめ、Goal の「TEST_VERBOSE の切り替えだけが残る」を満たす。`Added: なし`（plan `01-vitest-config.md:97`）のため追加検査の欠落もない。削除した `exclude`・`passWithNoTests` の代替は ADR が `scripts/product-ready/index.test.ts` にあると決めており（adr.md:231）、本 plan の守備範囲外。
- Policy:
  - なし — Allowed の 1 本目削除・`passWithNoTests` 断言削除・`TEST_VERBOSE` 確認残置を守り、Forbidden の `vitest.config.ts` 不変・2 本目削除禁止・新規テスト追加禁止のいずれも破っていない（`vitest.config.ts:1-17` 無変更）。
- Unproven:
  - なし — `reporters` を両分岐で `toEqual` 断言しており（`vitest.config.test.ts:10,15`）、片方の分岐が壊れれば（例: 常に `['verbose']`）もう片方が赤になる。env 復元＋`vi.resetModules()`（`vitest.config.test.ts:17-23`）で順序依存の偶然緑もない。
- Noise:
  - なし — `['verbose']`・`[['default', { summary: false }]]`・`'1'` は Steps と ADR Details が形として決めた値（plan `01-vitest-config.md:48-74`、adr.md:272-299）のため、指示により所見としない。`TEST_VERBOSE` による切り替えは型 `Reporters`（`vitest.config.ts:5`）が保証しない振る舞いであり、型で settled でもない。
- Doubts:
  - なし

### Round 2

- Stale:
- Unlisted:
- Gaps:
- Policy:
- Unproven:
- Noise:
- Doubts:

## Acceptance

- Goal: `vitest.config.test.ts` から振る舞いを持たない定数確認がなくなり、`TEST_VERBOSE` の切り替えだけが残る — 達成した。
- Ran: `pnpm test:related vitest.config.test.ts`（66 files / 872 tests）、`pnpm test:run`（66 files / 872 tests）、`pnpm typecheck`（root ok、.pi ok）、`pnpm lint`、`pnpm format:check`、変えたファイルと `vitest.config.ts` の読み直し — すべて成功した。
- Findings: なし
- Doubts: `passWithNoTests` の値は product-ready の生成する設定でだけ確かめられ、リポジトリの `vitest.config.ts` の値はこのサイクルでは守らない。ADR 03 の `Forbidden` の「代わり」の主張はこの plan で事実に合わせた。
