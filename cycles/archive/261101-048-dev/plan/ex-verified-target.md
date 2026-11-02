# PLAN `ex-verified-target`

## Files

```text
.pi/
  skills/
    close/
      SKILL.md                    update
      references/
        format.md                 update
```

## Slices

## 1.verify の対象を、このサイクルが触った Unit に揃える

### Types

```ts
なし;
```

### Steps

1. `.pi/skills/close/SKILL.md`:
   - `:90` の「the Units are the lines under `Users can do` of the `accepted` entries' `Definition`」に、そのうちこのサイクルが触ったもの（行か route）を verify すると足す。
2. `.pi/skills/close/references/format.md`:
   - `:72` の「one section per Unit listed in `Users can do`」を「one section per Unit this cycle touched, among the Units listed in `Users can do`」に直し、`:85` の「Every Unit has a section」を「Every Unit this cycle touched has a section」に直す。

### Verify

- Always:
  - 関連するテスト: 変えるのは md の 2 本で、どのテストもこの 2 本を取り込まないため関連は無い。`pnpm test:run` を走らせる
  - `pnpm typecheck`
  - `pnpm lint`
  - `pnpm format:check`
  - このスライスが消した文言（`one section per Unit listed in`、`Every Unit has a section`）が、この 2 ファイルに残っていないことを `grep -in` が 0 件であることで見る
- Added:
  - other — `grep -c "this cycle touched"` の合計が 3 件（`close/SKILL.md:90`、`close/references/format.md:72`、`:85`）であることを見る

## Notes

### Slice 1: verify の対象を、このサイクルが触った Unit に揃える

- Findings: なし
- Unplanned: なし
- Commit: base(ex-verified-target)
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

- Ran: 変えた 2 ファイルの diff を読んだ（文書の plan なので、読むことが検査である）。`pnpm test:run`（58 ファイル、796 テスト）、`pnpm typecheck`、`pnpm lint`、`pnpm format:check`、いずれも緑。`Verify` の `Always`: 消した文言（`one section per Unit listed in`、`Every Unit has a section`）が 2 ファイルで 0 件。`Verify` の `Added`: `this cycle touched` が `close/SKILL.md` で 1、`close/references/format.md` で 2 の合計 3。
- Findings: なし
- Doubts: なし
