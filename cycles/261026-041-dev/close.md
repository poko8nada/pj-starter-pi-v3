# Close 041

## Collected

### design-goal (ADR 01)

1. 75 / Review Round 1 / `.pi/skills/design/SKILL.md:73` の要約は不踏み込みを明示せず正文は `references/tasks.md:45` が持つため、手順書だけを読む作業者の読み落としの余地が残る。
   - Doing: デザインのレビューの 1 点目の要約を書いた。
   - Left: 01 の 4 点のうち、`Goal` が `Non-goal` を越えない点が抜けた。
   - Cost: 要約だけ読む作業者が、その点を検めない。
2. 76 / Review Round 1 / `.pi/skills/design/SKILL.md:80` の所有者への提示物は従来の 3 点のままで、`Goal` を見せるかは計画もデザインも決めていない。
   - Doing: デザインのステップ 8 のオーナーへの一覧を書いた。
   - Left: 01 でプランに `Goal` と `Non-goal` が増えたが、一覧は summary、paths、boundary のまま。
   - Cost: オーナーが `Goal` と `Non-goal` を見ずに答える。
3. 83 / Acceptance / `.pi/skills/design/SKILL.md:73` の要約は不踏み込みを明示せず、正文は `references/tasks.md:45` が持つため、手順書だけを読む作業者の読み落としの余地が残ります。
   - Doing: 受け入れの `Doubts` に、レビューの同じ 2 点を書いた。
   - Left: `Doubts` として残した。
   - Cost: 1 と同じ穴が、受け入れにも残る。
4. 84 / Acceptance / `.pi/skills/design/SKILL.md:80` の所有者への提示物は従来の 3 点のままで、`Goal` を見せるかは計画もデザインも決めていません。
   - Doing: 受け入れの `Doubts` に、レビューの同じ 2 点を書いた。
   - Left: `Doubts` として残した。
   - Cost: 2 と同じ穴が、受け入れにも残る。

## Triage

- 1: done (ADR 01, `Unit.design-skill`): 73 行目に「`Goal` が `Non-goal` を越えない」を足した。
- 2: done (ADR 01, `Unit.design-skill`): 80 行目の一覧に `Goal` と `Non-goal` を足した。
- 3: done (ADR 01, `Unit.design-skill`): 1 と同じ。
- 4: done (ADR 01, `Unit.design-skill`): 2 と同じ。

## Verified

### Unit.design-skill

- Plans:
  - `design-goal`
- Result: しない — 各スライスの `Added` で変更を読んだため。

### Unit.plan-skill

- Plans:
  - `plan-goal-review-research`
- Result: しない — 各スライスの `Added` で変更を読んだため。

### Unit.yolo-skill

- Plans:
  - `plan-goal-review-research`
- Result: しない — 各スライスの `Added` で変更を読んだため。

### Unit.usage-readme

- Plans:
  - `plan-goal-review-research`
- Result: しない — 各スライスの `Added` で変更を読んだため。
