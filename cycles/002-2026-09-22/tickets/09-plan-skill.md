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

なし

### Unplanned

なし

Commit:
