# PLAN `ex-format-guard`

## Files

```text
scripts/
  product-ready/
    readme-format.test.ts   add
rules/
  readme.format.md
```

## Slices

## 1.雛形の行を固定する

### Types

なし

### Steps

1. `scripts/product-ready/readme-format.test.ts`:
   - `rules/readme.format.md` を読み、`## Skeleton` と `## Skeleton (ja)` のブロックの空行を除いた 8 行が、決まった並びのままであることを確かめる。
   - (happy) 2 つのブロックが、決まった 8 行の並びである → 緑
   - (error) ブロックの 1 行を別の見出しに変えた写し → 赤
   - (error) ブロックの行を 1 つ落とした写し → 赤
   - (error) `## Writing` からバッジの規則を消した写し → 赤
   - (error) ブロックの中にフェンスの行を足した写し → 赤

### Verify

- Always:
  - `pnpm exec vitest run --config vitest.starter.config.ts scripts/product-ready/readme-format.test.ts`、`pnpm test:run`、`pnpm typecheck`、`pnpm lint`、`pnpm format:check`
  - 新しいテストの名前と説明に古い文言が残っていないことを `grep -in` で確かめる
- Added: なし

## Notes

### Slice 1: 雛形の行を固定する

- Findings:
- Unplanned:
- Commit:
- Stopped:

## Review

### Round 1

- Stale:
- Unlisted:
- Gaps:
- Unproven:
- Noise:
- Doubts:

## Acceptance

- Ran:
- Findings:
- Doubts:
