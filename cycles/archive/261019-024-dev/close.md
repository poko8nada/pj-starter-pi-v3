# Close 024

## Collected

### close-words (ADR 05 / Scope `Unit.close-skill`)

1. 116 / Review Round 1 / `.pi/skills/close/SKILL.md:29` 後段の追加句（`and the plan mds hold what they left`）は Steps の文言にないが Files が `update` と名指した内の詳述であり slice 3 の `look` が覆うため Unlisted/Gaps にしない。
   - Doing: close の「read the cycle」の段を、記憶ではなく file と plan md を読む形に書き換えた。
   - Left: 追加句は Steps の文言になく、ケースも押さえていない。
   - Cost: 次の書き直しでこの句が落ちても赤にならない。
2. 117 / Review Round 1 / `.pi/skills/close/SKILL.md:44` の `those four` は直前行の 4 つを指す読みで、文面の読みやすさは `_no case_`（`cycles/261019-024-dev/plan/close-words.md:44`）のため指摘にしない。
   - Doing: triage に 4 つの条件の行を足し、`ex-plan` を「those four のどれか、直すのはコード」に直した。
   - Left: `those four` は直前行を指す読みに頼っている。
   - Cost: 4 つの行が離れたら `those four` が宙に浮く。
3. 123 / Acceptance / 壊し確認の 1 回目で、4 つの文を消した時にケース 39（「4 つに当てはまる leftover は `ex-` を検討」）は緑のままだった。ケース 38 が同じ 4 語を見ているので、ケース 39 は単独では弱い。
   - Doing: `criteria` を 4 つに置き換え、slice 1 のケースを 7 つ書いた。
   - Left: ケース 39 は、`:42` の文を消しても `ex-plan` の行だけで緑になる。
   - Cost: 同じ slice のケース 38 が 4 語を見ているので、弱いケースが並ぶだけ。

### common-docs (ADR 01, 06 / Scope `Unit.design-skill`)

4. 97 / Review Round 1 / `cycles/261019-024-dev/adr.md:193` の文末`。`を `DEFINITION.md:42` に合わせて取ったことは `cycles/261019-024-dev/plan/common-docs.md:79` に記録済みで、意味は変わらず現行の両者は一致するため finding にしない。
   - Doing: `DEFINITION.md` の `yolo-skill` の行を、ADR 06 の `Definition Change` の文で足した。
   - Left: ADR 06 の文末にだけ `。` があり、`DEFINITION.md` の他の行に `。` が無いので、ADR の `。` を取った。
   - Cost: ない（両者は一致し、`Unplanned` に記録した）。
5. 98 / Review Round 1 / `README.md:63`・`README.ja.md:63` が差分で動かないのは base が既に規則の話無しで Steps の「規則を外す」が空振りになったため。`cycles/261019-024-dev/plan/plan-rules.md:84` が同行の規則無しを確認し、Verify の `:42` は現行を読むため緑になる。finding にしない。
   - Doing: `README.md` と `README.ja.md` の plan の行を読んだ。
   - Left: base の時点で規則の話を持っていなかったので、行は動かなかった。
   - Cost: ない（plan-rules が消した先と揃っている）。

### design-research (ADR 01 / Scope `Unit.design-skill`)

6. 136 / Review Round 1 / `README.md:62` と `DEFINITION.md:38` の旧文言残存は `common-docs` が直す前提（`cycles/261019-024-dev/plan/common-docs.md:21-29`）のため指摘にしなかった。
   - Doing: design の手順に調査の段を足し、`## Refactor` の文を消した。
   - Left: `README.md:62` と `DEFINITION.md:38` は `common-docs` の持ち場なので、触らなかった。
   - Cost: ない（`common-docs` が直した）。
7. 137 / Review Round 1 / `cycles/261019-024-dev/plan/design-research.md:112` の Unplanned 1 行（What is not here）は Verify に対応する case がないが Notes に記録のため Gaps にしなかった。
   - Doing: `## What is not here` の行を「files the plan changes」に直した（Unplanned）。
   - Left: その 1 行に対応するケースを足していない。
   - Cost: 次にこの行を戻しても赤にならない。
8. 143 / Acceptance / `## Possibly related files` に何を残すか（cut に要らない path を落とすか）は、このサイクルでは手で選んだ。research の返した物をそのまま書くのかどうかは、次のサイクルで分かる。
   - Doing: research の結果を `## Possibly related files` に写した。
   - Left: 何を残すかは手で選び、research の返した物を全部は書いていない。
   - Cost: サイクルごとに、残す量の判断が担当者に委ねられる。

### plan-rules (ADR 02 / Scope `Unit.plan-skill`)

9. 89 / Review Round 1 / `cycles/261019-024-dev/plan/plan-rules.md:71` の Unplanned 1 文（`.pi/skills/plan/SKILL.md:57` の `Boundary.Plans` に命名の行）に対応する Verify の case が無いが Notes に記録のため Gaps にしなかった。
   - Doing: 手順 8 の「組が見つかった時」に、plan を書き直す行き先を 1 文だけ書いた（Unplanned）。
   - Left: その 1 文に対応するケースを足していない。
   - Cost: 次にこの文を戻しても赤にならない。
10. 90 / Review Round 1 / `git diff a340e03..HEAD -- .pi/skills/plan cycles/261019-024-dev/plan/plan-rules.md` は subagent-guard で bash が不許可のため実行できず、boundary-values ・ Unlisted は現行ファイルの読み（`.pi/skills/plan/SKILL.md:1-69` ・ `.pi/skills/plan/references/format.md:1-80` ・ `.pi/skills/plan/references/tasks.md:1-8`）で代替した。
    - Doing: 規則の 1 文と書き戻しを消した。
    - Left: レビューは、この時 diff の代わりに現行ファイルを読んで代替した。consult-47 で確かめたら、レビューは `git diff` を打てた（`types.json` の `bash` に `git diff` がある）。`tasks.md` のレビューの囲みには、diff をどこで見るかが 1 行も無い。
    - Cost: レビューは、diff を見ずに現行ファイルだけで「閉じられる」と言う。
11. 96 / Acceptance / review のサブエージェントは bash を許されておらず、`git diff <base hash>..HEAD` を自分で走らせられない。手順 5 の「plan md と diff を渡す」は、diff の中身をタスクに載せることを指すと読むべきである。
    - Doing: 受け入れで、レビューの diff の扱いを見た。
    - Left: レビューが git を打てないという前提は誤りだった（consult-47）。ただし、diff をどこで見るかがレビューの文に書かれていないのは事実で、穴である。
    - Cost: ない（10 の `ex-` が直す）。

### work-steps (ADR 03, 04 / Scope `Unit.work-skill`)

12. 127 / Review Round 1 / `.pi/skills/work/SKILL.md:3` の説明と `:12` の列挙にテスト整理が無いが、元から手順の全体列挙ではなく本変更が古くした物ではないため finding にしない。
    - Doing: テストの整理の段を足し、番号を詰めた。
    - Left: description と冒頭の列挙に、テストの整理を足していない。
    - Cost: description は手順を全部は挙げていないので、読めば分かる。
13. 128 / Review Round 1 / `.pi/skills/work/SKILL.md:52` の `drops them, and keeps the suite green` と `:53` 後段 `and a slice carries a Verify of its own` は Steps の文言に無いが、Files が `update` と名指した内の詳述であり、base 括弧は `## Notes` の Unplanned に記録済みのため Unlisted/Gaps にしない。
    - Doing: テストの整理の段を書いた。
    - Left: Steps にない 2 つの詳述（まとめて落とす、スライスには Verify が要る）を足した。
    - Cost: ない（Files の内側の詳述で、`## Notes` にも記録した）。
14. 129 / Review Round 1 / Slice 3 の 6 つの順序・番号連続・参照実在は `look` の check が覆うため、指示通り Gaps/Unproven にしない。
    - Doing: 統合で、6 つの順と番号、参照の実在を見た。
    - Left: その 3 つは `look` が覆うので、`read` のケースを置いていない。
    - Cost: ない（`look` が本文を読む）。
15. 143 / Acceptance / `SKILL.md:3` の description は手順を全部は挙げていないので、テストの整理を足しても古びていないと読んだ（review の Doubt のとおり）。
    - Doing: 受け入れで、description の古びを確かめた。
    - Left: description にテストの整理を足していない。
    - Cost: ない（全部は挙げていないので、古びてはいない）。

### yolo-skill (ADR 06 / Scope `Unit.yolo-skill`)

16. 99 / Review Round 1 / `.pi/skills/yolo/SKILL.md:9` の冒頭に ADR accepted 後発動が無いが、`description:3` と `:13` が持つため finding にしない。Steps（`cycles/261019-024-dev/plan/yolo-skill.md:25`）の位置指定だが意味は覆われる。
    - Doing: yolo の本文を書いた。
    - Left: 冒頭には「accepted の後でだけ」を書かず、`description` と `## When it runs` に置いた。
    - Cost: 冒頭だけ読むと、いつ走るかが分からない。
17. 100 / Review Round 1 / `.pi/skills/yolo/SKILL.md:14` の `and it says so` は case（`cycles/261019-024-dev/plan/yolo-skill.md:41`）文言に明示が無いが、product は持ち、case は bullet 全体を読むため Gaps/Unproven にしない。
    - Doing: `## When it runs` を 4 つにした。
    - Left: 「無効なら何も走らず、そう言う」の「そう言う」を、ケースの文言に書いていない。
    - Cost: ない（ケースは bullet 全体を読む）。
18. 101 / Review Round 1 / `.pi/skills/yolo/SKILL.md:40` の `their OK after each slice of a plan that runs in the base` は Steps（`cycles/261019-024-dev/plan/yolo-skill.md:28`）の 4 名に無いが、`.pi/skills/work/SKILL.md:46` の詳述であり Files が `add` と名指した内の詳述＋`look`（`cycles/261019-024-dev/plan/yolo-skill.md:71`）が覆うため Unlisted/Gaps にしない。
    - Doing: work の段に、飛ばす確認を書いた。
    - Left: base の plan でスライスごとの OK を飛ばすことを、Steps の 4 名に足していない。
    - Cost: ない（`look` が本文を読む）。
19. 102 / Review Round 1 / `.pi/skills/yolo/SKILL.md:46` の destinations は `DEFINITION.md` 1 行→`proposed`（`.pi/skills/close/SKILL.md:47`）と research（`.pi/skills/close/SKILL.md:48`）を省くが、plan が求めず close 決定値のため指摘にしない。
    - Doing: close の段に、4 つの条件と宛先を書いた。
    - Left: `DEFINITION.md` の行を動かす leftover と research の 2 つを省いた。
    - Cost: ない（close の決定値なので食い違わない）。
20. 103 / Review Round 1 / `.pi/skills/yolo/SKILL.md:20` の `Each keeps its work, and loses only its look` と `:24-25,31-32,38-39,45-46` の作業詳述に単独 read case は無いが、yolo 概念自体（ADR 06 決定値）＋`look`（`cycles/261019-024-dev/plan/yolo-skill.md:68`）が本文を読むため対象外とした。
    - Doing: yolo の本文を書いた。
    - Left: 前書きと作業の詳述に、単独のケースを置いていない。
    - Cost: ない（`look` が本文全体を読む）。
21. 109 / Acceptance / close の「そこで終わる」は、箇条だけ落としても段落が意味を担ってケースは緑のままだった。両方落とすと赤になる。同じ意味の文が 2 つ並んでいる。
    - Doing: close の段を、「it ends here」の箇条と、判断の後の仕事を言う段落で書いた。
    - Left: 2 つの文が同じ意味を担い、片方だけ落としても赤にならない。
    - Cost: 片方を落としても赤にならない。

- ex-review-diff (ADR 04 / Scope `Unit.work-skill`、`ex-`)

22. 85 / Review Round 1 / `this diff` の受けは配置で保たれている (tasks.md:35 が :36 の直前) が、配置を名指す Verify ケースは無い。囲み全体を読む happy ケースで目に入るため finding にはしない。
    - Doing: レビューの囲みの 2 行目に、diff を自分で読む行を入れた。
    - Left: `this diff` がその行を受けることを、位置で示しているだけである。
    - Cost: なければ、`this diff` が宙に浮く。
23. 86 / Review Round 1 / diff は plan md 自体にも触れるが、中身は ## Notes の記録欄の記入のみで、Steps/Verify/Files の変更は無い。計画自体の記録のため Unlisted にはしない。
    - Doing: スライスごとの記録を、plan md の `## Notes` に書いた。
    - Left: その記録は、同じ差分の中で plan md を動かす。
    - Cost: なければ、記録が残らない。
24. 92 / Acceptance / 3 つ目のケース（diff をタスクに貼るとは書かれていない）は、字面の不在を見るので、壊しを入れても赤にならない。
    - Doing: 「貼るとは書かれていない」を見るケースを 1 つ置いた。
    - Left: 今回の壊しは行を消す向きで、不在のケースには当たらない。
    - Cost: なければ、貼る指示を書いても赤にならない（貼る指示を足せば赤になるので、ケース自体は働く）。

## Triage

- 1: dropped (ADR 05 / `Unit.close-skill`): Files が名指した内の詳述で、slice 3 の `look` が読む。
- 2: dropped (ADR 05 / `Unit.close-skill`): 4 つの行が直前にあり、読み手には通じる。
- 3: dropped (ADR 05 / `Unit.close-skill`): ケース 38 が同じ 4 語を見ている。plan md は記録で、直すのは次のサイクル。
- 4: dropped (ADR 01, 06 / `Unit.design-skill`): 両者は一致し、`Unplanned` に記録した。
- 5: dropped (ADR 01, 06 / `Unit.design-skill`): base の時点で規則の話が無く、直す所が無い。
- 6: dropped (ADR 01 / `Unit.design-skill`): `common-docs` が直した。
- 7: dropped (ADR 01 / `Unit.design-skill`): plan md は記録で、1 行の詳述にケースを足す重さが勝つ。
- 8: proposed (ADR 01 / `Unit.design-skill`): `## Possibly related files` に何を残すかが決まっていない。次のサイクルの ADR が決める。
- 9: dropped (ADR 02 / `Unit.plan-skill`): plan md は記録で、1 文の詳述にケースを足す重さが勝つ。
- 10: ex-plan `ex-review-diff` (ADR 04 / `Unit.work-skill`) done 5cd13fe: レビューの文に diff の出どころが無かった。`git diff` は許されているので、自分の目で読めと書いて穴を閉じた。
- 11: ex-plan `ex-review-diff` (ADR 04 / `Unit.work-skill`) done 5cd13fe: 10 と同じ穴。前提（git が打てない）は誤りだったが、diff を見ていないのは事実だった。
- 12: dropped (ADR 03, 04 / `Unit.work-skill`): description は手順を全部は挙げていない。
- 13: dropped (ADR 03, 04 / `Unit.work-skill`): Files の内側の詳述で、`Unplanned` にも記録した。
- 14: dropped (ADR 03, 04 / `Unit.work-skill`): `look` が本文を読む。
- 15: dropped (ADR 03, 04 / `Unit.work-skill`): description は手順を全部は挙げていない。
- 16: dropped (ADR 06 / `Unit.yolo-skill`): `description` と `## When it runs` が持つ。
- 17: dropped (ADR 06 / `Unit.yolo-skill`): ケースは bullet 全体を読む。
- 18: dropped (ADR 06 / `Unit.yolo-skill`): `look` が本文を読む。
- 19: dropped (ADR 06 / `Unit.yolo-skill`): close の決定値と食い違わない。
- 20: dropped (ADR 06 / `Unit.yolo-skill`): `look` が本文全体を読む。
- 21: dropped (ADR 06 / `Unit.yolo-skill`): 意味が通る文が 2 つあり、片方を落とす理由が無い。
- 22: dropped (ADR 04 / `Unit.work-skill`): 囲みを読むケースが同じ行を読む。
- 23: dropped (ADR 04 / `Unit.work-skill`): 記録欄の記入で、計画の変更ではない。
- 24: dropped (ADR 04 / `Unit.work-skill`): 貼る指示を足せば赤になる。今回の壊しが違っただけ。
