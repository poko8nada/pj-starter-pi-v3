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

- `read` 検証（`review` の子 `consult-2`、2 ターン、$0.0045）は合格。4 道具の引数と戻り値、worktree の 3 規約（残る・置き場・ブランチ）が全部書いてあると報告された
  - 子が拾った穴 1 つ: `new` の戻り表に `id` と `base` の行が無く、`base` は既定値しか書いていなかった。表の「place」という行名も、道具が実際に出す `path:` と食い違っていた
  - 直した物: 表に `id` / `base` を足し、行名を `path` に合わせ、説明を「子が働く場所」とした
  - 子の見積り: 7 つのうち欠けは 0。上の 1 つは「7 つには数えないが小さな穴」として自分から報告してきた
- **`consult_children` の root 修正が実物で証明された**: デモでは「no children」になった同じ呼び出しが、この step では走っている `consult-2`（`parent`、pid 84024）を正しく出した
  - こちらは `30fa6fa`（reload 済み）が効いている。step 7b の修正（未マージのブランチを残す等）は reload 前の物なので、次の reload で入る
- 子が返した塊の見出しはまだ `## consult undefined` だった（`561f778` の修正が reload 前のため）。テストでは固定済みで、reload 後に実物でも直る

### Unplanned

- `.pi/extensions/consult/README.md` の「The code」「Tests」の節を、step 1〜7b で変わったファイル構成（`child/budget.ts`・`run/log.ts`・`run/delivery.ts`・`tool/children.ts`・`tool/commit.ts` 等）に合わせて書き直した
  - なぜ: チケットの Todo は道具の節と worktree の節を上げていたが、コードの地図もすでに古かった
- `.pi/extensions/consult/README.md` の「Trust」の「`task` または `input`」を「`task` だけ」に直した
  - なぜ: `input` が消えたため（読ませたいファイルは `task` にパスを書く）

Commit: 2251b24
