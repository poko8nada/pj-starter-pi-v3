# cleanup

Acceptance: `CYCLE-DESIGN.md` がリポジトリに無い（スキル 4 つに吸収済み。理由は git 履歴に残る）

## Todo

- `CYCLE-DESIGN.md` を消す — 中身がスキル 4 つにあることを先に確かめる（definition / stack / plan / tickets）
- 消した後に残る参照を直す — `CYCLE-DESIGN.md` を指している文書やコメントがあれば直す

## Verify

- 実演: `pnpm test:run` と `pnpm lint` と `pnpm typecheck` が緑で、`grep -r CYCLE-DESIGN` が何も返さない

## Notes

### Findings

なし

### Unplanned

なし

Commit:
