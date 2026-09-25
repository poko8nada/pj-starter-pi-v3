# plan-skill

Acceptance:

- 定義が承認されたときに agent がプランを書く
- `step 0` を含む `Steps` が出る
- `Structure` が出る

## Todo

- `.pi/skills/plan/SKILL.md`
  - **英語**で書く
  - frontmatter の `description` に「いつ読むか」を書く
    - 定義が承認された後、チケットを切る前
  - 「`step 0`」 — prepare
    - Install
    - Cleanup
    - Refactor
  - 「step の分け方」
    - 単位を割るときは `<unit-id>.<part>`
    - 単位を割ったら締めに `<unit-id>.check` を置く
  - 「各 step の欄」
    - `What`
    - `Depends`
    - `Action`
    - `Files`
    - `Tests`
    - `Tests` はチケットの元になる
  - 「`Structure`」
    - 変えるファイルだけをツリーで書く
    - `add`
    - `update`
    - `drop`
  - 「`What to keep`」 — 触らないが関わるファイルを並べる
  - 「承認を待つ」 — 承認されるまでチケットを切らない
- 先に `CYCLE-DESIGN.md` を読み、このスキルが引き受ける規則を全部取り込む
  - plan の型
  - 運用表の段階 3
  - 「3 つの文書」の plan の行
  - 単位の中の段取りを定義に書かない
  - 前の 1 枚から変わっていない行はそのまま写す
  - **その節をそのまま**では終わらせない

## Verify

- 実演: 子に 002 の定義からプランを書かせ、step の欄が全部埋まるか

## Notes

### Findings

- 実演の結果: 子が、定義 1 枚とスキルからプランを書いた
  - 子は `research` 型
  - worktree も ref も作らない
  - `step 0` の 3 欄が埋まる
  - 各単位が step になる
    - consult は 5 分割
    - 締めに `consult.check`
  - `What` `Depends` `Action` `Files` `Tests` が全部埋まる
  - `Structure` が出る
  - `What to keep` が出る
  - 本物の `plan.md` とほぼ一致した
- 子の指摘: `step 12` は定義の単位に無い
  - `step 12` は `CYCLE-DESIGN.md` を消す
  - `step 0` の `Cleanup` で扱っても同じ
  - この step をどう扱うかは決まっていない → 実装時にチケットで決める
- 最初の試行は `review` 型で失敗した
  - 出力上限に当たって打ち切られ、テキストが 1 つも返らなかった
  - `review` は判定用で、長い成果物を書かせるには足りない
  - **型の上限とタスクの大きさを、実演の前に見る**
- この実演は汚染されている
  - リポジトリに本物の `plan.md` があった
  - 子が写した可能性がある
    - 本人は言及していない
  - 次は存在しない題材で試す

### Unplanned

- owner に出す前の review のフェーズを追加した — `Step 6`
  - 子は `review` 型
  - 子に固定のチェックリストを当てる
  - 直して再レビューする
    - 新しい指摘が無くなるまで
    - 上限 3 回
  - owner には指摘と処置を一緒に見せる
- review の段そのものは、この実演では確かめていない
  - 次のサイクルでプランを書くときに実際に走る

Commit: f592b8b
