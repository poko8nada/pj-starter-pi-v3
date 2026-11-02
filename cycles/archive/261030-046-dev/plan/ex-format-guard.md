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

- Findings: なし
- Unplanned: なし
- Commit: b41c5fe consult(ex-format-guard): pin readme skeleton lines in guard test
- Stopped: なし

## Review

### Round 1

- Stale: なし — 差分は `scripts/product-ready/readme-format.test.ts` の追加のみで、文書も注釈も既存テストも古くしないことを確かめた。
- Unlisted: なし — 差分は `Files` が `add` で名指す 1 件のみで、`rules/readme.format.md` は無印の従属のままであることを確かめた。
- Gaps: なし — `happy` 1 件と `error` 4 件が `Steps` の 5 件に対応し、`## Usage` や追記も 8 行一致で落ちることを確かめた。
- Unproven: なし — `happy` が常時 `throw` を防ぎ、各 `error` が対応する変異で赤になることを確かめた。
- Noise: なし — `EXPECTED` の文字列は `ADR 01/03` の決定値で、表明は変数比較と `toThrow` のみであることを確かめた。
- Doubts:
  - `scripts/product-ready/readme-format.test.ts:48-71` の `blockUnder` は `scripts/product-ready/index.mjs:19-42` の写しで、将来ずれる。8 行一致が挙動を保つ。
  - `scripts/product-ready/readme-format.test.ts:73-87` の `sectionBody` は `scripts/product-ready/index.mjs:51-64` の `sectionOf` と形が違い、将来ずれる。6 行一致が挙動を保つ。
  - `scripts/product-ready/readme-format.test.ts:11` の `process.cwd()` は、起動位置がルートであることを仮定する。`vitest --root` ではずれる可能性がある。
  - `scripts/product-ready/readme-format.test.ts:154`、`:159`、`:164`、`:172` の `replace` は最初の 1 件だけを変える。将来の重複で、別の箇所を変える可能性がある。

## Acceptance

- Ran: `pnpm exec vitest run --config vitest.starter.config.ts scripts/product-ready/readme-format.test.ts`（5 件）、`pnpm test:run`（793 件）、`pnpm typecheck`（root と .pi が ok）、`pnpm lint`（警告込みで緑）、`pnpm format:check`（全ファイルが整形済み）。本体（`rules/readme.format.md`）は変えていないので、この plan の検査は新しいテストが担う。
- Findings: なし
- Doubts: なし（`## Review` の `Doubts` が 4 件を持つ）。作業場は計画の md より前の基点 `afa9f0a` から切ったので、記録はマージの後に基点の md へ書いた。
