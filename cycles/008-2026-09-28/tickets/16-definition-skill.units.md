# definition-skill.units

Acceptance:

- 前のサイクルのユニット一覧を引き継ぐ段が無い、が解ける: `definition/SKILL.md` が前の `What to build` と `What to keep` の一覧から始める
- 名前の増減の規則が無い、が解ける: 増えるのは `add` のときだけ、減るのは `drop` のときだけ。`update` は名前を変えず `ユニット名.機能`
- unit の定義が無い、が解ける: unit は実物（拡張・スキル・ゲート・文書）で、機能は unit にしない
- 007 の 3 つの機能名が unit として並んでいた、が解ける: `definition/references/format.md` の名前の規則がこの形に置き換わり、3 つは `Change: drop` として並ぶ

Owner: at the end

## Todo

- `.pi/skills/definition/SKILL.md`
  - `## Steps` の最初（`What to build` を書く段の前）— 前のサイクルの `What to build` と `What to keep` の一覧を読み、その名前から始める、という段を足す
  - `## Steps` — `add` 以外では名前を増やさない、`drop` 以外では減らさない、`update` は `ユニット名.機能`、という規則を足す
  - `## The review's checklist` — 「前の一覧の名前が引き継がれているか」「増減が `add` / `drop` に限られているか」を観点に足す
- `.pi/skills/definition/references/format.md`
  - `## Units` — unit は実物（拡張・スキル・ゲート・文書）で、機能は unit にしない、を足す
  - `## Units` — 名前の規則（two nouns, at most one hyphen）を、`ユニット名.機能` の形に置き換える
  - `## Markers` — 名前が減るのは `drop` のときだけ、を足す

## Verify

### read

- `review` の子に `.pi/skills/definition/SKILL.md` と `.pi/skills/definition/references/format.md`、それに 007 の定義を渡し、新しい規則で 008 の 19 項目が説明できるかを報告させる
- 合格: 引き継ぎの段、増減の規則、unit の定義、3 つの `drop` の扱いが、4 つの `Acceptance` 行に対応して書いてある（1〜4 行）

## Notes

### Findings

- なし

### Unplanned

- なし

Commit:
