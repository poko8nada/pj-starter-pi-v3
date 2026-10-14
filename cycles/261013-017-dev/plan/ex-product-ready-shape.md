# PLAN `ex-product-ready-shape`

## Files

```text
scripts/
  product-ready/
    cli.mjs                                  update
    targets.mjs                              update
    targets.test.ts                          update
    index.mjs                                update
    cli.test.ts
    index.test.ts
```

## Slices

## 1.product-ready の形を直す

### Types

```js
// cli.mjs
// { root: string, run: boolean, only: string | undefined } — `PruneArgs` を `Args` に改名
export function parseArgs(argv) {}

// targets.mjs
export function remove(entries) {} // 第 1 引数 root を落とす
export function plan(root, only) {} // `tests` の walk はパスだけを集めて返す
```

### Steps

1. `scripts/product-ready/cli.mjs`: JSDoc の `PruneArgs` を `Args` に改名する（typedef と `parseArgs` の `@returns`）。
2. `scripts/product-ready/targets.mjs`:
   - `remove(root, entries)` を `remove(entries)` にする。`void root;` を消す。
   - `plan` の `tests` の walk を、パスを集めて返す形にする。`{ label: '', at: '', path }` を積んで呼び側で書き直す形をやめる。
3. `scripts/product-ready/index.mjs`: `remove(args.root, entries)` を `remove(entries)` にする。
4. `scripts/product-ready/targets.test.ts`: `remove(root, …)` の呼びを `remove(…)` にする。

### Verify:

- test: `pnpm vitest run scripts/product-ready/`
  - (happy) 40 passed（振る舞いは既存のテストが持つ）
  - (happy) `pnpm typecheck` が `root: ok` / `.pi: ok`（型の名前はコンパイラが見る）
  - (happy) `pnpm lint` が緑（`void root;` が消え、未使用の警告が出ない）
  - _no case_: 名前と形の変更 — 振る舞いは変わらない。既存のテストとコンパイラが持つ

## Notes

### Slice 1: product-ready の形を直す

- Findings:
- Unplanned:
- Commit:

## Review

### Round 1

- Stale:
- Unlisted:
- Gaps:
- Unproven:
- Doubts:

## Acceptance

- Ran:
- Findings:
- Doubts:
