# DESIGN 041

## Affected

### 01: デザインの各プランに、達成条件を示す一文とノンゴールをどう記載するか

- `.pi/skills/plan/SKILL.md` — 手順 1 が `design/references/format.md` の `Goal` と `Non-goal` を読む。
- `lefthook.yaml` — commit 時に md を整形対象にする。
- `.oxfmtrc.json` — 整形の設定を持つ。
- `package.json` — format の入口を持つ。

### 02: プランは、デザインの `Goal` と `Non-goal` にどう従うか

- `.pi/skills/work/references/tasks.md` — `plan/references/format.md` の `## Test cases` で読むと明記している。
- `.pi/skills/work/SKILL.md` — プランの `## Test cases` でケースを読むと定めている。

### 03: プランのレビューの観点を、どう並べ直すか

- なし

### 04: プランの作成前に、足りない情報のリサーチをどう独立した手順にするか

- なし

## External

### 01: デザインの各プランに、達成条件を示す一文とノンゴールをどう記載するか

- なし

### 02: プランは、デザインの `Goal` と `Non-goal` にどう従うか

- なし

### 03: プランのレビューの観点を、どう並べ直すか

- なし

### 04: プランの作成前に、足りない情報のリサーチをどう独立した手順にするか

- なし

## `design-goal`

### ADR & Where

- No: 01
- Why: 入力は design の 3 ファイルで、02 が読む `Goal` と `Non-goal` の欄を足すので先に走り、待つ相手は無い。
- Where: base（owner が変更を見る）

### Summary

- `design.md` のプランのセクションに `Goal` と `Non-goal` を足します。
- デザインの手順 5 と 7、`design/references/tasks.md` を直します。

### Paths

- `.pi/skills/design/SKILL.md`
- `.pi/skills/design/references/format.md`
- `.pi/skills/design/references/tasks.md`

### Boundary

- Plans: なし
- External: なし

## `plan-goal-review-research`

### ADR & Where

- No: 02, 03, 04
- Why: 入力は plan のスキルの同じファイルで、02、03、04 が共有するので 1 つのプランにし、01 が足す `Goal` と `Non-goal` の欄名を待つ。
- Where: base（owner が変更を見る）

### Summary

- プランがデザインの `Goal` と `Non-goal` を読み、`Steps` と `Verify` に反映します。
- レビューの観点を `Goal`、`Files`、`Types`、`Cases`、`Checks` に並べ直します。
- 書けない行ごとのリサーチの手順を足します。

### Paths

- `.pi/skills/plan/SKILL.md`
- `.pi/skills/plan/references/format.md`
- `.pi/skills/plan/references/tasks.md`
- `.pi/skills/yolo/SKILL.md`
- `README.md`
- `README.ja.md`

### Boundary

- Plans:
  - `design-goal`: `design/references/format.md` に `Goal` と `Non-goal` の欄名を足す。02 の手順 1 がその名を読む（先に終わる）。
- External: なし
