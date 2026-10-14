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

- Findings: なし
- Unplanned: なし
- Commit: cc230f4

## Review

### Round 1

- Stale: なし
- Unlisted: なし
- Gaps: なし
- Unproven: なし
- Doubts:
  - `cycles/261013-017-dev/adr.md:49` の `remove(root, plan)` の書き方は残る。芯が `plan` と `remove` の2つである決定自体は保たれるし、前計画 `cycles/261013-017-dev/plan/product-ready-list.md:185` が archive・ADR の記録だけを Stale としないと決めたため、finding とはしない。
  - `cycles/261013-017-dev/plan/product-ready-list.md:46,62,106` の `remove(root, plan)` と `:176` の `PruneArgs` 残存メモは現計画の Types/Steps に置き換えられた履歴で、live の `scripts/product-ready/cli.mjs:2`・`scripts/product-ready/targets.mjs:105` は更新済みのため、Stale とはしない。
  - `scripts/product-ready/cli.mjs:2` を `PruneArgs` に全戻ししても `pnpm typecheck` は緑のままになるが、改名は振る舞いを変えない形の変更で plan が `_no case_` と決めた範囲のため、Unproven とはしない。
  - `void root;` と第1引数を両方戻しても `pnpm lint` 単体は緑になるが、`scripts/product-ready/targets.test.ts:209,211,219` が赤になるため suite では覆う。単体チェックの弱さとみて finding とはしない。
  - `scripts/product-ready/targets.mjs:38-51` の walk を旧形（placeholder 積み＋呼び側書き直し）に戻しても `plan` の出力は同じでテストは緑のままだが、振る舞い不変を plan が `_no case_` と決めた範囲のため、Unproven とはしない。

## Acceptance

- Ran: plan の検査 3 つ（`vitest run scripts/product-ready/` 40 passed / `pnpm typecheck` が `root: ok` と `.pi: ok` / `pnpm lint` 緑）。壊して赤を見た 2 つ: `targets.mjs` の walk の `readdir` を空にする → 13 failed（`plan` の walk 系 9、`--run` 系 4）、`index.mjs` の `remove(entries)` を `remove([])` にする → 同じ 13 failed。2 ファイルは `git checkout` で戻し、40 passed に復帰
- Findings: なし
- Doubts: なし
