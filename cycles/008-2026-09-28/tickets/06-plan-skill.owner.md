# plan-skill.owner

Acceptance:

- owner の値を決める段が無い、が解ける: エージェントがユニットごとに `owner: in the loop / at the end` の提案を出して owner に明示的に聞き、owner が決める。聞くのはプランを書いたあとでよい（書く前に決まっていれば、それを使う）。既定の提案は `at the end`
- `Owner:` の行が step ごとに有ったり無かったりする、が解ける: すべての step に `Owner:` の行がある（`step 0` も含む）
- step をどの大きさで切るかの規則が無い、が解ける: `in the loop` の step は vertical slice で切られ、内部だけの step は単独にせず切片に付く
- 「見せられる大きさ」の定義が無い、が解ける: `plan/references/format.md` にある（1 つの操作が端から端まで動き、owner が見て 1 つの判断を下せる。見せる物は 1 つ）
- 見せ方が書かれていない、が解ける: `in the loop` の step には見せ方の行があり、`at the end` の step には無い

Owner: at the end

## Todo

- `.pi/skills/plan/SKILL.md`
  - `## Steps` — owner の値をユニットごとに提案して聞く段を足す（書き上げたあとでよい、と明記する）
  - `## The review's checklist` — `Owner:` の行が全 step にあるか、`in the loop` の step に「見せ方」があるか、を観点に足す
- `.pi/skills/plan/references/format.md`
  - `The shape` — 全 step に `Owner:` の行を足し、`in the loop` の step には「見せ方」の行も書く
  - `Steps` — 「見せられる大きさ」の定義（1 つの操作が端から端まで動き、owner が見て 1 つの判断を下せる。見せる物は 1 つ）と、vertical slice の規則を足す

## Verify

### read

- `review` の子に `.pi/skills/plan/SKILL.md` と `.pi/skills/plan/references/format.md` を渡し、owner の値の決め方、`Owner:` の行、見せ方、vertical slice の規則を報告させる
- 合格: `Owner:` の行が全 step にあり、`in the loop` の step に見せ方の行がある（5 行）。1〜4 行にもそれぞれ対応する記述がある

## Notes

### Findings

- なし

### Unplanned

- なし

Commit:
