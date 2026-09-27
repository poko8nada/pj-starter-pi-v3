# tickets-skill

Acceptance:

- 変更の無い step は、`Commit: なし` とその理由で閉じる、と `tickets/references/format.md` に書いてある

## Todo

- `.pi/skills/tickets/references/format.md`
  - `## Notes` の `Commit:` の項 — 変更の無い step（`<unit-id>.check` など）は `Commit: なし` と書き、理由を `Notes` に置く、を足す
  - 置き場が 1 か所であること — この規則はチケットの形の話なので、`work/SKILL.md` step 10 と同じことを 2 度書かない（work 側は手順、こちらは形）

## Verify

### read

- `review` の子に `.pi/skills/tickets/references/format.md` だけを渡す
  - 変更の無い step の閉じ方を報告させる（`Commit:` の行に何を書き、理由をどこに置くか）
  - その規則がチケットの形の 1 か所に書いてあるか報告させる

## Notes

### Findings

- `tickets/references/format.md`: `Commit: なし（理由）` の適用範囲が `.check` 以外の「変更の無い step」にも及ぶかが書かれていない（例示が `a <unit-id>.check` だけ）。閉じるには: 一般則として書くか、例示を増やすかを決める

### Unplanned

- 理由の置き場を `Notes` と書いた（子の成果）→ owner の判断で「同じ行の括弧の中（`Commit: なし（理由）`）」に変えた。`work/SKILL.md` step 10 も同じ形に揃えた（`008d43c`）

Commit: 008d43c
