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

- `read` 検証（`review` の子 `consult-7`、2 ターン、$0.0020）は合格。両方に 4 道具があり、置き場（`/tmp/pi-consult/<project>-<stamp>/<unit-id>/wt`）とブランチ（`consult/<unit-id>`）、「明示しない限り残る」も書いてあると報告された
  - 子が拾った食い違い 2 つ。1 つ目は**言い回しの差**（EN「stays until it is removed」/ JA「明示しない限り残り」）— 主張は同じで、JA の方が設計の言葉（「明示しない限り残る」）に近い。これは**直さない**と決めた（翻訳の選択として正しい）
  - 2 つ目は**本物**だった: EN が「エージェントのターンの検証は `typecheck`」と書いていたが、実物は **`typecheck:staged`**（quality-gate は step 4 で実際に `node scripts/typecheck-staged.mjs <files>` を走らせている）。commit の行も 4 つの検査（format / lint / `typecheck:staged` / `test:related`）ではなく「typecheck and test」と曖昧だった → 両方を実物に合わせた（JA も commit の行を同じ形に）
  - これはチケットの `Acceptance`（consult の説明）の外なので `Unplanned` に記録した
- これで unit 1〜8 + 7b + 9 + 10 の **11 unit が全部閉じた**（残りは `close` の段だけ）

### Unplanned

- `README.md` / `README.ja.md`: 「On commit」と「On every agent turn」の検査の行を実物に合わせた（`typecheck` → `typecheck:staged`、commit は 4 つを名指し）
  - なぜ: `consult-7` が consult の説明の外で食い違いを拾ったため（README が実物と違う検査を書いていた）

Commit: 89012b7
