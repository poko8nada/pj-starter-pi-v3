# PLAN `ex-product-ready-rerun`

## Files

```text
scripts/
  product-ready/
    index.test.ts      update
```

## Slices

## 1.二度目の表示

### Types

なし

### Steps

1. `scripts/product-ready/index.test.ts`:
   - 2 回目の `--run` のケースで、`cycles` の行が消えたことを、作った一覧と fixture の印から確かめる。断言に表示文を書かない。
   - (empty) 2 回目の `--run` → `cycles` の行を出さない。

### Verify

- Always:
  - 既定の 5 つ
- Added: なし

## Notes

### Slice 1: 二度目の表示

- Findings: なし
- Unplanned: なし
- Commit: 478f50c604bb784f0f22ac868351283358fb2112
- Stopped:

## Review

### Round 1

- Stale:
  - なし — `scripts/product-ready/index.test.ts:5,131,137-140` の追加は表示の不在断言のみで、文書・注釈・他の試験を古くしていませんでした。
- Unlisted:
  - なし — 差分の 1 件は Files の 1 件（`scripts/product-ready/index.test.ts` update）と一致し、名の無い変更はありませんでした。
- Gaps:
  - なし — Steps の `(empty)` 1 件は 2 回目の `--run` の不在断言（`scripts/product-ready/index.test.ts:137-140`）に存在し、Verify の `既定の 5 つ`・`Added: なし` は試験のみの変更に見合っています。
- Unproven:
  - なし — 消去が壊れて 2 件が残れば `scripts/product-ready/index.test.ts:137` と `:139` が赤くなり、期待は工場（`makeCycleNames`）と fixture の印（`countLine`・`indented`）から組み立てて製品を読んでいませんでした。
- Noise:
  - なし — 新規断言は表示文の直書きや魔数がなく、`countLine`・`indented` と工場の一覧・`names.length` から組み立てられています。
- Doubts:
  - `scripts/product-ready/index.test.ts:137` は旧件数の `cycles (2):` の不在のみを見ており、`cycles (0):` のような誤表示の有無や `no cycles to remove` の存在までは見ていませんが、Steps の指定どおりであり所見に留めます。

## Acceptance

- Ran:
  - `pnpm test:run` → 54 ファイル / 766 ケース緑
  - `pnpm typecheck` → root: ok、`.pi`: ok
  - `pnpm lint` → 緑
  - `pnpm format:check` → 緑
  - 「振る舞いを壊す」を 1 件試した。
    - `scripts/product-ready/targets.mjs` の `rmSync` を外して、2 回目の `--run` でも消さないようにする → 4 件が赤。その中に「もう一度 `--run` → 無い旨の表示」も含まれる。戻して緑を確認。
- Findings: なし
- Doubts: なし
