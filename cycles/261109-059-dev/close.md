# Close 059

## Collected

### 01 readable-rules (ADR 01, 02, 03, 04)

1. 450 / Work Review Round 1 / `.pi/skills/plan/references/cut.md:49-54` の `## Present` の表（field / what it holds）が、形の規則「表は、決まった値の組があるセクションにだけ置く」に当たるかどうかを判断する境界事例である。フィールド名 6 つは固定だが値の組ではないため、レビューは断定せず、残すか外すかの判断をオーナーに委ねる。

## Triage

- 1: dropped (ADR 01, `Unit.plan-skill`)
  - Fact: `cut.md` の `## Present` の表の左列は `ADR`、`Place`、`Goal`、`Summary`、`Why`、`## Order:` の 6 つの固定の欄名であり、欄名と意味の対応を書く箇所である。レビューは、これが「固定の値の組」に当たるかを断定せず、判断をオーナーに委ねた。
  - Why: `adr.format.md` の 13 kind の表と同じように、この表は固定の欄名とその意味の対応を書くものなので、表を置く条件を満たす。表を外すと、欄の意味の説明が 6 項目の箇条書きになり、`## Present` のセクションが長くなる。
  - Then: なし

## Verified

### adr-skill

- Plans:
  - `readable-rules`
- Result: しない — 文面を確認済みのため

### plan-skill

- Plans:
  - `readable-rules`
- Result: しない — 文面を確認済みのため

### work-skill

- Plans:
  - `readable-rules`
- Result: しない — 文面を確認済みのため

### close-skill

- Plans:
  - `readable-rules`
- Result: しない — 文面を確認済みのため

### upgrade-skill

- Plans:
  - `readable-rules`
- Result: しない — 文面を確認済みのため

### yolo-skill

- Plans:
  - `readable-rules`
- Result: しない — 文面を確認済みのため
