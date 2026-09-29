# consult.docs

Acceptance:

- `.pi/extensions/consult/README.md` が、4 つの道具（`consult_run` / `consult_children` / `consult_worktree` / `consult_commit`）と「worktree は明示しない限り残る」設計に追随している
- 消える物の名前（`consult_new` / `consult_resume` / `consult_refs` / `ref` / `stopped.json` / `kept` / diff の受け渡し）が残っていない
- 直下の一時ファイル `consult-redesign.md` が消えている

Owner: at the end

## Todo

- `.pi/extensions/consult/README.md`
  - 道具の節を 4 つに書き換える（引数・戻り値・worktree の指し方・`continue`）
  - 「worktree は `/tmp/pi-consult/...` に作られ、明示しない限り残る」「ブランチは `consult/<unit-id>`」の節を足す
  - 消えた 3 道具、ref、diff の受け渡し、`stopped.json` の記述を消す
- `consult-redesign.md`（リポジトリ直下）— 削除する（実装が終わったら消す約束の一時ファイル）

## Verify

### form

- `grep -rn "consult_new\|consult_resume\|consult_refs\|stopped\.json" .pi/extensions/consult/README.md` → 0 件
  - 2 行目を決める
- `ls consult-redesign.md` → 無い
  - 3 行目を決める
- `grep -c "consult_run\|consult_children\|consult_worktree\|consult_commit" .pi/extensions/consult/README.md` → 4 つとも 1 回以上出る
  - 1 行目を決める

### read

- `review` の子に `.pi/extensions/consult/README.md` だけを渡す
  - 4 つの道具の使い方と、worktree の残り方・置き場・ブランチを報告させる
  - 合格: 道具 4 つが引数つきで説明され、worktree の 3 つの規約（残る・置き場・ブランチ）が書いてある

## Notes

### Findings

- なし

### Unplanned

- なし

Commit:
