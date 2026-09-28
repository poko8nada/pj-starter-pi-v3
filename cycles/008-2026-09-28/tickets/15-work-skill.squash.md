# work-skill.squash

Acceptance:

- `squash.mjs` はハッシュをフルで渡すと「一覧が base..HEAD と違う」と言って止まる（007 の close の直後に、実際にこれで止まった）、が解ける: 短くてもフルでも同じように通る
- どちらの形でも通るテストがある

Owner: at the end

## Todo

- `.pi/skills/work/scripts/squash.mjs`
  - 渡されたハッシュを使う 2 つの照合（`base..HEAD` との照合と、`HEAD` が一覧の最後かを見る所。後者は `rev-parse --short HEAD` と比べている）— 渡されたハッシュを 1 回正規化し、両方の照合がそれを使う（短い形もフルの形も受ける）
- `.pi/skills/work/scripts/squash.test.ts`
  - 短いハッシュを渡す → 通る（happy）
  - フルのハッシュを渡す → 通る（happy）
  - 一覧が `base..HEAD` と違う → 止まる（error）
  - 0 件（空の一覧） → 止まる（error）
  - 汚れたツリー → 止まる（error。既存の安全策が残っていること）

## Verify

### test

- `pnpm test squash`（5 ケース。1・2 行）
  - 短いハッシュを渡す → 1 コミットにまとまる（happy）
  - フルのハッシュを渡す → 1 コミットにまとまる（happy）
  - 一覧が `base..HEAD` と違う → 中止のメッセージが出て、何も変わらない（error）
  - 0 件 → 中止（error）
  - 汚れたツリー → 中止（error）
  - null / undefined / 欠けたハッシュ、境界値、権限、2 回目、並行 → 見ない（引数の文字列と `git` の出力を比べるだけの道具で、状態を持たないため）

## Notes

### Findings

- なし

### Unplanned

- なし

Commit:
