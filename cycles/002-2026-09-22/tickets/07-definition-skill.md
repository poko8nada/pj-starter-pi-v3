# definition-skill

Acceptance: 前のサイクルが閉じているときに agent がサイクルを始めると、1 枚の定義が出て、前を閉じて印を引き継ぎ、承認を待つ

## Todo

- `.pi/skills/definition/SKILL.md` を書く — frontmatter（`name` / `description`）と本文。日本語で、ラベルは英語のまま
  - 「いつ読むか」 — サイクルを始めるときと、閉じるとき
  - 「1 枚の型」 — `CYCLE-DESIGN.md` の「definition の型」をそのまま
  - 「単位の規則」 — 「単位（`What to build`）」の節をそのまま
  - 「印の規則」 — 「変更の記録（`002` 以降）」の節をそのまま
  - 「書くもの」 — 「書くもの」「規則 / ラベルと中身」の節をそのまま
  - 「閉じ方」 — 「`Retro` と `Changes`」「運用（サイクル）」の閉じる段階をそのまま
  - 「前のチケットの `Findings` を読む」 — 次の 1 枚を書くとき、閉じたサイクルのチケットから穴を拾う
  - 「承認を待つ」 — 承認されるまでコードに触らない

## Verify

- 実演: 子に `definition` スキルだけを渡し（`--skill .pi/skills/definition`）、002 の 1 枚を再現させる。7 節と印が出るか

## Notes

### Findings

なし

### Unplanned

なし

Commit:
