# tickets-skill

Acceptance: プランが承認されたときに agent がチケットを切って作業すると、`Todo` と `Verify` の承認を取り、結果が `Notes` に残り、`Commit` のハッシュで閉じる

## Todo

- `.pi/skills/tickets/SKILL.md` を書く — **英語**。frontmatter の `description` に「いつ読むか」を書く（プランが承認され、実装に入る前）
  - 「いつ読むか」 — プランが承認された後
  - 「チケットの型」 — `CYCLE-DESIGN.md` の「tickets の型」をそのまま
  - 「規則」 — 「変更の記録（`002` 以降）」以降のチケットの規則をそのまま（`Todo` の分け方 / テストの書き方 / `Verify` / `Notes` / `Commit` / 承認）
  - 「誰がやるか（実装を子に任せる場合）」 — 設計書の次の規則を全部（親が切り親が閉じる / 子は `type code`。渡すのは `Acceptance` と `Todo` / `Notes` は親が書く / 依存は前の ref から（ref が積み重なる）/ 並列は書き込むファイルが重ならないものだけ / 複数 step を 1 回の子にまとめてよい（同じハッシュ）/ マージは 1 枚ごと / **ref は決めたら消す** / **実演は残るものを作らない** / 破壊的な操作はガード付きの道具側に）
  - 「穴の置き場所」 — その step の中なら直して `Unplanned`。外なら `Findings` に書いて次の 1 枚へ
- 先に `CYCLE-DESIGN.md` を読み、このスキルが引き受ける規則を全部取り込む（tickets の型 / チケットの規則 / 誰がやるか / 運用表の段階 4 / 「3 つの文書」の tickets の行）。**その節をそのまま**では終わらせない

## Verify

- 実演: 子に 002 のプランから 1 枚切らせ、`Verify` が書いた時点で走れる形か

## Notes

### Findings

なし

### Unplanned

なし

Commit:
