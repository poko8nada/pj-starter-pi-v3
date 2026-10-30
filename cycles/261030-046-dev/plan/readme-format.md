# PLAN `readme-format`

- No: 01, 03

## Files

```text
rules/
  readme.format.md        update
scripts/
  product-ready/
    index.test.ts
    index.mjs
    targets.mjs
```

## Slices

## 1.見出しと雛形

### Types

なし

### Steps

1. `rules/readme.format.md`:
   - `## Skeleton` と `## Skeleton (ja)` のフェンス付きブロックを `design.md` の `readme-format` の `Goal` の 1 行目と 2 行目が言う 8 行にし、ブロックの中にフェンスと `## Usage` と言語のリンクの行を置かず、ブロックの前の説明文と `## Writing` を `Goal` の 4 行目から 6 行目に合わせる。

### Verify

- Always:
  - `pnpm test:run` — `rules/readme.format.md` に関連するテストは無いので、すべて走らせる
  - `pnpm typecheck`
  - `pnpm lint`
  - `pnpm format:check`
  - `grep -in "## Checks\|## Harness\|## Cycle\|## 検査\|## ハーネス\|## サイクル" rules/readme.format.md` が 0 件である（古い雛形の見出しが残っていない）
- Added:
  - other — 2 つのブロックの 8 行の並びが、`design.md` の `readme-format` の `Goal` の 1 行目と 2 行目に一致することを、エージェントが読んで確かめる
  - other — 2 つのブロックの中にフェンスの行が無く、言語のリンクの行も無いことを、エージェントが読んで確かめる
  - other — `pnpm test:run -- scripts/product-ready` を走らせ、`scripts/product-ready/index.test.ts:187` と `:189` の 2 つの見出しの検査が緑であることを確かめる

## Notes

### Slice 1: 見出しと雛形

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
