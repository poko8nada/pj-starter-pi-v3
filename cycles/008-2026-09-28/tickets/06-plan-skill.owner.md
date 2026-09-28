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

- なし（親の読み: `ref` `consult/code-20260928-122110-0` を取り込んだ。名指しの 2 ファイルのみ、27 行）
- （影響読み `consult-20` の指摘と、親の修正）
  - 観点が 6 個になり、007 が決めた上限 2〜4 個と矛盾していた → 2 つずつ統合して 4 個に戻した（`plan/SKILL.md` の観点）
  - フィールド名 `見せ方` が日本語で、同じファイルの規則（名前は英語、内容は日本語）に反していた → `Show:` にした（`plan/references/format.md` の形 4 か所）
  - vertical slice を切る段が無く、`in the loop` が決まるのは切った後だった → step 3 に slice の参照と「値が後から来たら切り直す」を足した（`plan/SKILL.md` の step 3）
  - 未対応（この step の外）: `tickets` 側の `Owner:` 受け皿は step 4 が作る。`work` の「最後に 1 回報告する」は step 3 が直す。`<unit-id>.refactor` の `Owner:` と、リファクタを単独 step にしない規則の同居は、次に `plan` を触るときに見る
- （単位レビュー `consult-27` の指摘と、親の修正）
  - `format.md:114` の括弧が「`in the loop` の単位のリファクタ step」に触れ、`format.md:132` / `plan/SKILL.md:42`（`in the loop` には単独のリファクタ step を置かない）と矛盾していた → 括弧を外した
  - 未対応（記録）: step 5 への追加（`plan/SKILL.md:42`）はチケットの `Todo` に無い（`Then` 2 行目から出る規則）。凍結した 008 の plan は `見せ方:` のままで `Show:` と一致しない（plan は凍結物なので直さない）。定義の `Then` 4 行目は「step ごと」のまま（狭めたのはチケットで承認済み）。「owner に値が聞かれたか」は観点では見ていない
  - 並列の帰結（大きな穴）: 単位のコミットが main 上で混ざるので、`squash.mjs`（`HEAD` が一覧の最後であることを要求）が使えない。この単位の 3 コミットは 1 つにまとめられない。`Carry over` 3 本目の根拠になる

### Unplanned

- なし

Commit: 3018191 + 8d60197 + 3e04681（並列で走らせたので 1 つにまとめない。`squash.mjs` は `HEAD` が一覧の最後であることを要求するため、混ざった単位には使えない）
