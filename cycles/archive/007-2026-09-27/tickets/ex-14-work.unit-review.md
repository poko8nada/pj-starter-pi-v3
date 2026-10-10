# work.unit-review

Acceptance:

- `work/SKILL.md` のユニット単位のレビューの観点に、「owner が見て同意したか」「直しが owner の指摘に答えているか」が入っている（定義 `125` 行の `Then`）

## Todo

- `.pi/skills/work/SKILL.md` の step 11（ユニットの終わり）の観点の行に、次の 2 つを足す
  - 他のスキル（`close` の `78-79` 行、`plan`、`stack`、`definition`、`tickets`）と同じ言い方に揃える
    - 「owner が見て同意したか」— このユニットが応えているもの（サイクルの定義・プラン・チケット）を owner が見て同意しているか
    - 「直しが owner の指摘に答えているか」— owner の指摘のあとの変更が、その指摘に答えているか

## Verify

### read

- `review` の子に `.pi/skills/work/SKILL.md` だけを渡す
  - 報告させる: ユニット単位のレビューの観点はいくつで、その中に「owner が見て同意したか」「直しが owner の指摘に答えているか」が入っているか

## Notes

### Findings

- なし

### Unplanned

- 最初の文言（`two of them:`）は「観点が 2 個のときは」と読まれた（`read` の検証 1 回目）。`required, whatever else is picked:` に直し、2 回目の検証で「必ず入れるもの」と読めることを確かめた

Commit: e5902b0（ex-14 の作業コミット。`read` 通過）
