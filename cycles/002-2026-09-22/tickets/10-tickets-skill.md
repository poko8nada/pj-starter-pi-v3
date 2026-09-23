# tickets-skill

Acceptance: プランが承認されたときに agent がチケットを切って作業すると、`Todo` と `Verify` の承認を取り、結果が `Notes` に残り、`Commit` のハッシュで閉じる

## Todo

- `.pi/skills/tickets/SKILL.md` を書く — frontmatter（`name` / `description`）と本文。日本語で、ラベルは英語のまま
  - 「いつ読むか」 — プランが承認された後
  - 「チケットの型」 — `CYCLE-DESIGN.md` の「tickets の型」をそのまま
  - 「規則」 — 「変更の記録（`002` 以降）」以降のチケットの規則をそのまま（`Todo` の分け方 / テストの書き方 / `Verify` / `Notes` / `Commit` / 承認）
  - 「誰がやるか」 — 「誰がやるか（実装を子に任せる場合）」の節をそのまま（親が切り親が閉じる / 子は `code` / 前の ref から / 並列の条件 / マージは 1 枚ごと）
  - 「穴の置き場所」 — その step の中なら直して `Unplanned`。外なら `Findings` に書いて次の 1 枚へ

## Verify

- 実演: 子に 002 のプランから 1 枚切らせ、`Verify` が書いた時点で走れる形か

## Notes

### Findings

なし

### Unplanned

なし

Commit:
