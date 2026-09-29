# readme.consult

Acceptance:

- ルートの `README.md` と `README.ja.md` の consult の説明が、4 つの道具（`consult_run` / `consult_children` / `consult_worktree` / `consult_commit`）と、worktree が明示しない限り残る設計に追随している
- 消えた名前（`consult_new` / `consult_resume` / `consult_refs`）が残っていない

Owner: at the end

## Todo

- `README.md`
  - consult の道具の箇条書きを 4 つに書き換える
  - worktree が残る設計（置き場とブランチ）を 1 文で足す
- `README.ja.md`
  - 同じ内容を日本語で合わせる

## Verify

### form

- `grep -c "consult_run\|consult_children\|consult_worktree\|consult_commit" README.md README.ja.md` → どちらも 4 つとも 1 回以上
  - 1 行目を決める
- `grep -rn "consult_new\|consult_resume\|consult_refs" README.md README.ja.md` → 0 件
  - 2 行目を決める
- `grep -c "pi-consult\|consult/" README.md README.ja.md` → 置き場かブランチの記述が 1 回以上
  - 1 行目を決める

### read

- `review` の子に `README.md` と `README.ja.md` を渡す
  - consult の道具がいくつ挙げられ、worktree の設計がどう書かれているかを報告させる
  - 合格: 4 つの道具が両方にあり、worktree が残ることが書いてある

## Notes

### Findings

- なし

### Unplanned

- なし

Commit:
