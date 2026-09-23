# plan-skill

Acceptance: 定義が承認されたときに agent がプランを書くと、`step 0` を含む `Steps` と `Structure` が出る

## Todo

- `.pi/skills/plan/SKILL.md` を書く — frontmatter（`name` / `description`）と本文。日本語で、ラベルは英語のまま
  - 「いつ読むか」 — 定義が承認された後、チケットを切る前
  - 「`step 0`」 — prepare（Install / Cleanup / Refactor）
  - 「step の分け方」 — 単位を割るときは `<unit-id>.<part>`。単位を割ったら締めに `<unit-id>.check` を置く
  - 「各 step の欄」 — `What` / `Depends` / `Action` / `Files` / `Tests`。`Tests` はチケットの元になる
  - 「`Structure`」 — 変えるファイルだけをツリーで、`add` / `update` / `drop`
  - 「`What to keep`」 — 触らないが関わるファイルを並べる
  - 「承認を待つ」 — 承認されるまでチケットを切らない

## Verify

- 実演: 子に 002 の定義からプランを書かせ、step の欄が全部埋まるか

## Notes

### Findings

なし

### Unplanned

なし

Commit:
