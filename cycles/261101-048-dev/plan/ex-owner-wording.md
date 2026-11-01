# PLAN `ex-owner-wording`

## Files

```text
DEFINITION.md                        update
```

## Slices

## 1.説明の中の owner をオーナーに

### Types

```ts
なし;
```

### Steps

1. `DEFINITION.md`:
   - `Users can do` の `:24`、`:25`、`:42`、`:44`、`:46`、`:57`、`:58` の説明の中の `owner` を `オーナー` に直し、`Who` の `- owner:`（`:13`）は項目名なので変えない。

### Verify

- Always:
  - 関連するテスト: 変えるのは `DEFINITION.md` 1 本で、どのテストもこれを取り込まないため関連は無い。`pnpm test:run` を走らせる
  - `pnpm typecheck`
  - `pnpm lint`
  - `pnpm format:check`
  - このスライスが消した文言（`- adr-skill: owner`、`（owner が決める）`、`- definition-file: owner`、`- sound-notify: owner`、`- usage-readme: owner`、`- product-ready: owner`、`- harness-copy: owner`）が、`DEFINITION.md` に残っていないことを `grep -in` が 0 件であることで見る
- Added:
  - other — `grep -n "^\- .*owner" DEFINITION.md` が `:13` の `- owner:` の 1 件だけであることを見る
  - other — `grep -c "オーナー" DEFINITION.md` が 8 以上であることを見る（7 行と、`- owner:` の説明ではない箇所）

## Notes

### Slice 1: 説明の中の owner をオーナーに

- Findings: なし
- Unplanned: なし
- Commit: なし（base の plan。オーナーの確認の後にコミットする）
- Stopped:

## Work Review

### Round 1

- Stale:
- Unlisted:
- Gaps:
- Unproven:
- Noise:
- Doubts:

## Acceptance

- Ran: `DEFINITION.md` の diff を読んだ（文書の plan なので、読むことが検査である）。`pnpm test:run`（58 ファイル、796 テスト）、`pnpm typecheck`、`pnpm lint`、`pnpm format:check`、いずれも緑。`Verify` の `Added`: `grep -n "^\- .*owner"` が `:13` の `- owner:` の 1 件だけ、`オーナー` が 8 件。
- Findings: なし
- Doubts: なし
