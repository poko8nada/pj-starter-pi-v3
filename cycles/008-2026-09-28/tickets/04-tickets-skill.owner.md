# tickets-skill.owner

Acceptance:

- チケットに `Owner:`（全 step）と、`in the loop` の step の止まり方の欄が無い、が解ける: `Owner:` と「どこで止まるか・何を見せるか・何をもって終わりか」が入る（止まり方は `in the loop` の step だけ）
- チケット名の規則が step の名前だけ、が解ける: `ユニット名.機能.何するか` になる（いまの 2 段をこの 3 段に置き換える）

Owner: at the end

## Todo

- `.pi/skills/tickets/SKILL.md`
  - `## Steps` のチケットを書く段 — `Owner:` の行（値はプランの `Owner:` から）と、`in the loop` の step に「どこで止まるか・何を見せるか・何をもって終わりか」を書く項を足す
  - `## The files` — `<NN>-<step-name>.md` はそのまま（名前の規則は `format.md` の `Names` 側で変える）
- `.pi/skills/tickets/references/format.md`
  - `The shape` — `Owner:` と止まり方の欄を足す
  - `Names` — チケット名を、プランの step 名（`ユニット名.機能`、分割した step は `ユニット名.機能.部品`）と一致させる。`何するか` はその 3 つ目の部分に当たる。いまの `<unit-id>` / `.check` / `.refactor` の形は残す
  - `step 0` は なし ならチケットを切らない、は残す

## Verify

### read

- `review` の子に `.pi/skills/tickets/SKILL.md` と `.pi/skills/tickets/references/format.md` を渡し、`Owner:` の行と止まり方の欄、チケット名の規則を報告させる
- 合格: `Owner:` の行があり、止まり方の欄に、どこで止まるか・何を見せるか・何をもって終わりかの 3 つが書いてある（1 行）。チケット名の規則が、プランの step 名と一致している（2 行。2 段の step はそのまま、分割した step は 3 段）

## Notes

### Findings

- なし

### Unplanned

- `.pi/skills/tickets/references/format.md:5`: `止まり方:` を日本語のまま残す例外を足した
  - なぜ: `The shape` に `止まり方:` を足すと「field names are English」と矛盾する。`止まり方:` は既存チケットと `work/SKILL.md` が使う名前で、英語にできない

Commit:
