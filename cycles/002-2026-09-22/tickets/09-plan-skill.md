# plan-skill

Acceptance: 定義が承認されたときに agent がプランを書くと、`step 0` を含む `Steps` と `Structure` が出る

## Todo

- `.pi/skills/plan/SKILL.md` を書く — **英語**。frontmatter の `description` に「いつ読むか」を書く（定義が承認され、チケットを切る前）
  - 「いつ読むか」 — 定義が承認された後、チケットを切る前
  - 「`step 0`」 — prepare（Install / Cleanup / Refactor）
  - 「step の分け方」 — 単位を割るときは `<unit-id>.<part>`。単位を割ったら締めに `<unit-id>.check` を置く
  - 「各 step の欄」 — `What` / `Depends` / `Action` / `Files` / `Tests`。`Tests` はチケットの元になる
  - 「`Structure`」 — 変えるファイルだけをツリーで、`add` / `update` / `drop`
  - 「`What to keep`」 — 触らないが関わるファイルを並べる
  - 「承認を待つ」 — 承認されるまでチケットを切らない
- 先に `CYCLE-DESIGN.md` を読み、このスキルが引き受ける規則を全部取り込む（plan の型 / 運用表の段階 3 / 「3 つの文書」の plan の行 / 単位の中の段取りを定義に書かない / 前の 1 枚から変わっていない行はそのまま写す）。**その節をそのまま**では終わらせない

## Verify

- 実演: 子に 002 の定義からプランを書かせ、step の欄が全部埋まるか

## Notes

### Findings

- 実演の結果: 子（`research`。worktree も ref も作らない）が、定義 1 枚とスキルからプランを書いた。`step 0` の 3 欄 / 各単位が step（consult は 5 分割 + `consult.check`）/ `What` `Depends` `Action` `Files` `Tests` が全部埋まる / `Structure` / `What to keep`。本物の `plan.md` とほぼ一致した
- 子の指摘: `step 12`（`CYCLE-DESIGN.md` を消す）は定義の単位に無い。`step 0` の `Cleanup` で扱っても同じ ← この step をどう扱うかは決まっていない（実装時にチケットで決める）
- **最初の試行は `review` 型で失敗した。** 出力上限 20k に当たり（22,489 トークン）打ち切られ、テキストが 1 つも返らなかった。`review` は判定用で、長い成果物を書かせるには足りない。**型の上限とタスクの大きさを、実演の前に見る**
- **この実演は汚染されている。** リポジトリに本物の `plan.md` があったので、子が写した可能性がある（本人は言及していない）。次は存在しない題材で試す

### Unplanned

- owner に出す前の review の段を追加した（`Step 6`）。子（`review`）に固定のチェックリストを当て、直して再レビュー、新しい指摘が無くなるまで（上限 3 回）。owner には指摘と処置を一緒に見せる
- review の段そのものは、この実演では確かめていない（次のサイクルでプランを書くときに実際に走る）

Commit: f592b8b
