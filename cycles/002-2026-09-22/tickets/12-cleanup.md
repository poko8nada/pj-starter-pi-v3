# cleanup

Acceptance: `CYCLE-DESIGN.md` がリポジトリに無い（スキル 4 つに吸収済み。理由は git 履歴に残る）

## Todo

- `CYCLE-DESIGN.md` を消す — 中身がスキル 4 つにあることを先に確かめる（definition / stack / plan / tickets）
- 消した後に残る参照を直す — `CYCLE-DESIGN.md` を指している文書やコメントがあれば直す

## Verify

- 実演: 削除の前に、`CYCLE-DESIGN.md` の項目を 1 つずつ潰す — どのスキルに入ったか、または消すと決めたか（移し漏れゼロが条件）。そのうえで `CYCLE-DESIGN.md` が無く、`pnpm test:run` と `pnpm lint` と `pnpm typecheck` が緑で、`grep -rn CYCLE-DESIGN --exclude-dir=node_modules --exclude-dir=.git .` の一致が `cycles/` 配下だけになる（このチケット自身と閉じた記録が必ず一致するので、「何も返さない」は満たせない）

## Notes

### Findings

なし

### Unplanned

なし

Commit:
