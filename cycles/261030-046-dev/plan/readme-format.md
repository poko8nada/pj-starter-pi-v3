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
  - other — `pnpm exec vitest run --config vitest.starter.config.ts scripts/product-ready/index.test.ts` を走らせ、`scripts/product-ready/index.test.ts:187` と `:189` の 2 つの見出しの検査が緑であることを確かめる

## Notes

### Slice 1: 見出しと雛形

- Findings: なし
- Unplanned: なし
- Commit: a81c47f consult(readme-format): align README skeletons to eight-line format
- Stopped: なし

## Review

### Round 1

- Stale: なし
- Unlisted: なし
- Gaps: なし
- Unproven: なし
- Noise: なし
- Doubts:
  - `git diff 12408e2..HEAD` の変更は `rules/readme.format.md` のみで、`scripts/product-ready/index.test.ts:187,189` の既存検査は ADR と design が決めた見出しのため Noise と Unproven の対象外である。
  - `rules/readme.format.md:7,29,54-56` の説明文と `## Writing` の追加 3 行は自動検査が無く差分を目視で確かめたが、文言は ADR と design が決めた値のため finding ではない。
  - `README.md:33,47,56` と `README.ja.md:33,47,56` に旧見出しが残るが、`design.md` の `starter-readme` が持ち Non-goal で変えないと定めるため、この diff が古くしたものではない。

## Acceptance

- Ran: `pnpm test:run`（788 件）、`pnpm typecheck`（root と .pi が ok）、`pnpm lint`（警告込みで緑）、`pnpm format:check`（324 ファイルが整形済み）、古い雛形の見出しの `grep -in` が 0 件、`pnpm exec vitest run --config vitest.starter.config.ts scripts/product-ready/index.test.ts`（17 件）、2 つのブロックの 8 行とフェンス無しと言語リンク無しを読んで確認。
- Findings:
  - `cycles/261030-046-dev/plan/readme-format.md:41` — `Added` のコマンド `pnpm test:run -- scripts/product-ready` は、`--` の後ろを絞り込みに使わず、全 788 件を走らせる。対象の 17 件だけを見るコマンドは `pnpm exec vitest run --config vitest.starter.config.ts scripts/product-ready/index.test.ts` である。
    - fixed: `Verify` の行を、そのコマンドに直した。
- Doubts: なし
