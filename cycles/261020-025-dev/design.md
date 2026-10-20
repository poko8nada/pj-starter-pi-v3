# DESIGN 025

## Possibly related files

### 01: ハーネスの道具を、どこに置き、どう呼ぶか

- `scripts/harness.mjs`
- `scripts/harness-state.mjs`
- `scripts/harness.json`
- `scripts/harness.mode.json`
- `scripts/harness.test.ts`
- `scripts/harness-state.test.ts`
- `package.json`
- `vitest.config.ts`
- `scripts/product-ready/index.mjs`
- `scripts/product-ready/index.test.ts`
- `tsconfig.json`
- `scripts/checks/scopes.json`
- `scripts/checks/typecheck.mjs`
- `scripts/checks/typecheck-staged.mjs`
- `.gitignore`
- `lefthook.yaml`
- `test/tmp.ts`
- `test/setup.ts`
- `README.md`
- `README.ja.md`
- `test/README.md`
- `DEFINITION.md`

### 02: スターターのパスを、どう持つか

- `scripts/harness.mjs`
- `scripts/harness.json`
- `.gitignore`
- `scripts/harness.test.ts`
- `vitest.config.ts`
- `scripts/harness-state.mjs`
- `README.md`
- `README.ja.md`

### 03: プロダクトでハーネスのテストを回さないことを、どう表すか

- `vitest.config.ts`
- `scripts/harness.json`
- `scripts/harness.mjs`
- `scripts/harness-state.mjs`
- `scripts/harness.mode.json`
- `package.json`
- `scripts/product-ready/index.mjs`
- `scripts/product-ready/cli.mjs`
- `lefthook.yaml`
- `test/setup.ts`
- `scripts/harness-state.test.ts`
- `scripts/product-ready/index.test.ts`
- `scripts/product-ready/cli.test.ts`
- `scripts/harness.test.ts`
- `tsconfig.json`
- `scripts/checks/typecheck.mjs`
- `README.md`
- `README.ja.md`
- `test/README.md`
- `DEFINITION.md`

## `harness-tooling`

### ADR & Where

- No: 01, 02, 03
- Why: 3 つの entry は同じハーネスのソースと config を読み、同じ道を書き換えるので、1 つにする。
- Where: worktree

### Scope

- `Unit.harness-copy`:
  - 行は動かない。
  - ハーネスの道具を `scripts/harness/` にまとめ、`harness:pull` / `harness:push` を登録する。
  - スターターのパスを `scripts/harness/starter.json` に分け、commit し、写さない。
- `Unit.product-ready`:
  - 行は動かない。
  - ハーネスのテストを外すのを、mode の値ではなく、starter 用 config の削除にする。

### Boundary

- Plans: なし
- External:
  - `vitest`: config の自動の名前の順、`configDefaults`、`--config` がこの版のままであること。
    - Version: ^4.0.18
