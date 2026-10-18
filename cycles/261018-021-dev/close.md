# Close 021

## Collected

### judge-questions (ADR 01 / Scope `Unit.intent-router`)

1. 274 / Review Round 1 / index.ts は plan Files で update だが差分なし。配線は変えずに済み、index.test の verdicts 確認は緑。閉じる上では問題ないと見る
   - Doing: 途中の判定の配線（`index.ts`）を、新しい 2 問に合わせる所だった。
   - Left: `index.ts` は変えずに済んだ。確かめる検査だけを `index.test.ts` に足した。
   - Cost: 無し。plan の `Files` に付けた印が、実物と食い違っていた。
2. 275 / Review Round 1 / state/run.ts:160 の noteVerdict は hook から呼ばれず、生産の数えは decide と hook の stamped で行われる。run.test は緑のまま残る。消すか残すかは別 cycle の判断にしたい
   - Doing: 「関係ない」と判定された回数を、run の関数（`noteVerdict`）で数える作りだった。
   - Left: 数える所を `decideJudge` と hook に移した。関数は自分のテストからだけ呼ばれる形で残った。
   - Cost: 使われていない関数と、それだけのためのテストが残る（`state/run.ts:159`、`state/run.test.ts:160`）。読む人は、使われている関数だと思う。
3. 284 / Review Round 2 / 実行による緑は確かめていない。読み合わせでの確認にとどまるため、最終の緑は別途の実行記録に任せたい
   - Doing: Round 2 は、`fixed:` の行だけを読み合わせる回だった。
   - Left: レビューの役割が読み合わせだけなので、緑の確認は受け入れに残した。
   - Cost: 無し。受け入れで 208 件と 706 件の緑を確かめている。
4. 301 / Acceptance / `judge/hook.test.ts:799` と `:628` が同じファイルの `:430` / `:511` と同じ振る舞い。
   - Doing: 受け入れの時にテスト 12 ファイルをレビューさせ、同じファイルの中で重複している検査を探した。
   - Left: 見つかった 11 件は、その場で消した。
   - Cost: 無し。
5. 302 / Acceptance / `record/recent.test.ts:64` が `:48` と同じ（件数違いだけ）。
   - Doing: 同上（記録の上限の検査）。
   - Left: 消した 11 件の 1 つ。`record/recent.test.ts` は、あとの ex-plan でファイルごと消えた。
   - Cost: 無し。
6. 303 / Acceptance / `route/decide.test.ts:27` が `:16` と同じ（値違いだけ）。
   - Doing: 同上（承認の閾値の検査）。
   - Left: 消した 11 件の 1 つ。
   - Cost: 無し。
7. 304 / Acceptance / `route/hook.test.ts:267` と `:188` が `:149` / `:162` と同じ（文面違いだけ）。
   - Doing: 同上（guide の差し込みの検査）。
   - Left: 消した 11 件の 2 つ。
   - Cost: 無し。
8. 305 / Acceptance / `settings/schema.test.ts:122` と `:126` が定数の文字を写しただけ。
   - Doing: 同上（既定値の書き写し）。
   - Left: 消した 11 件の 2 つ。
   - Cost: 無し。
9. 306 / Acceptance / `state/payload.test.ts:114` が `:103` と同じ。
   - Doing: 同上（切り詰めの検査）。
   - Left: 消した 11 件の 1 つ。
   - Cost: 無し。
10. 307 / Acceptance / `state/payload.test.ts:160` と `:192` が同じ関数の中の重複。
    - Doing: 同上（画像を落とす検査と、詰めてから切る順の検査）。
    - Left: 消した 11 件の 2 つ。
    - Cost: 無し。
11. 311 / Acceptance / テストの見直しで「同じ枝に見える」として残した 10 件: `judge/hook.test.ts:268` と `:815`、`state/run.test.ts:97` と `:105`、`settings/schema.test.ts:96` と `:103`、`state/payload.test.ts:136` と `:120`、`route/decide.test.ts:84`、`judge/hook.test.ts:676`、`record/recent.test.ts:143`、`ask/ask.test.ts:174`。
    - Doing: テストのレビューで、「2 つの検査が同じ枝を通っていそう」という組を 8 つ拾った。
    - Left: 同じ枝かどうかを、コードを読んで確かめていない。消すと別の枝が覆われなくなる恐れがあるので、その場では決めなかった。
    - Cost: どの検査が余分か分からないまま残る。`record/recent.test.ts` の 1 件は、ファイルごと消えたので既に無い。
12. 312 / Acceptance / テストの構造の揺れ: 記録を読む小さな道具が 3 つのテストに写されている、`payload.test.ts` の題と中身のずれ、数値かどうかだけを見る書き方。
    - Doing: テストの構造（記録を読む小さな道具、題の付け方、値の見方）をそろえる所までは、踏み込まなかった。
    - Left: 動きを変えない整理なので、この変更の範囲に入れなかった。
    - Cost: 読みにくいだけ。動きには影響しない。

### record-jsonl (ADR 02 / Scope `Unit.intent-router`)

13. 160 / Review Round 1 / `.pi/extensions/intent-router/judge/hook.ts:211` の `void turnIndex; void truncated; void stateChars;` は `logNudge` に渡しているのに void しており意図が読めない。動作に影響しないため finding にしない。
    - Doing: 記録の欄を増やした時、既にあった `void` の 3 行をそのまま残した。
    - Left: 動きに影響しないので、指摘にしなかった。
    - Cost: 3 行が「渡しているのに使っていない」ように読める（`judge/hook.ts:210-212`）。
14. 161 / Review Round 1 / `.pi/extensions/intent-router/record/recent.ts:12` の `isRecord` が `at` の有無しか見ず `state_chars`/`truncated` を要求しない。旧 JSONL の 1 行（新欄なし）が混ざると欠けたまま読めるが、plan Verify は旧形式＝配列 1 行のみを空と決めており単行旧欄の扱いは決めていないため finding にしない。
    - Doing: 記録を読む側の形の検査（`isRecord`）が緩かった。
    - Left: 指摘にしなかった。
    - Cost: 無し。`record/recent.ts` は ex-plan で消えた。いまの `record/log.ts` は書くだけで、読む者が居ない（`/intent last` も消えた）。
15. 162 / Review Round 1 / `.pi/extensions/intent-router/README.md:19` の例 `route.thresholds.approve 0.9` は `set` の使用例であり既定値の記述ではないため stale に数えていない。
    - Doing: 閾値を 0.8 に変えた時、README の `set` の例をどうするか見た。
    - Left: 例なので、既定値の説明ではないと判断した。
    - Cost: 無し。ただし、例の数字を既定値と取り違える人はいるかもしれない。

### ex-drop-unused (ADR 01 / Scope `Unit.intent-router`)

16. 153 / Review Round 1 / e の題は decide.test.ts:68 に残るため題名 grep 0 件は hook 側限定の読み替えが要る、Notes slice3 はその読みで書かれている、閉じるなら Verify に限定の明記が望ましい
    - Doing: 消した検査の題を `git grep` して 0 件、という閉じ方にした。
    - Left: 消した題（「related=no と yes が交互 → …」）は `judge/decide.test.ts` にも同じ文面で残る。0 件になるのは hook 側だけ。
    - Cost: 読み方を知らない人は、0 件を「同じ題が全部消えた」と誤解する。
17. 154 / Review Round 1 / f の 3 件全赤は消した件と残した 2 件（decide.test.ts:53 の選択と decide.test.ts:77 の潰し切り詰め）のこと、同ファイル decide.test.ts:64 の文面差替は置換なしでも緑だが消した置換の枝と無関係のため記録は正しい、数の数え方だけ誤読注意
    - Doing: 差し込みの枝を、消す側と残す側の両方を壊して確かめた。
    - Left: 「3 件全赤」は、消した 1 件と残した 2 件の数のこと。同じファイルの「文面を差し替えると…」は、置換を外しても緑のまま（枝が違う）。
    - Cost: 記録の数え方を読み違えると、覆いが足りないように見える。
18. 155 / Review Round 1 / g は残る it に latencyMs の実行時表明が無い、ask.ts:280 等の代入と型 number に typecheck を組み合わせた裏付けであり型を偽る破壊は vitest 単体では緑になる、型で十分という判断は plan の決定事項として残す
    - Doing: `latencyMs` が数であることだけを見る 1 行を消した。
    - Left: 残した `it` には、その数を実行時に見る表明が無い。型（`number`）と `pnpm typecheck` が守るという判断で消した。
    - Cost: 型を偽る壊し方では vitest が緑のままなので、テストだけを見ると守りが見えない。
19. 156 / Review Round 1 / 実行環境のガードで vitest を打てず緑の確認は検査と枝の読みのみ、Notes slice3 の 41 ファイル 699 件は未検証
    - Doing: レビュワーはコードとテストを読んで判定した。
    - Left: レビューの環境では vitest を打てず、緑は読むだけでは確かめられなかった。
    - Cost: 無し。受け入れで 41 ファイル / 699 件を確かめている。

### ex-log-per-day (ADR 02 / Scope `Unit.intent-router`)

20. 246 / Review Round 1 / 始まりの掃除の失敗を握りつぶす点 .pi/extensions/intent-router/index.ts:232 は計画に指示が無く、通常の動きを変えないため指摘にしない。失敗が見えなくなる点は心に留める。
    - Doing: セッションの始まりの掃除（`prune`）を `try/catch` で包み、失敗してもセッションを止めない形にした。
    - Left: plan に指示が無かったので、指摘にしなかった。
    - Cost: 掃除が失敗しても、何も表示されない。古い日付のファイルが増え続ける。
21. 247 / Review Round 1 / 日付として読めない名前の扱い .pi/extensions/intent-router/record/log.ts:64 は計画が正常な日付名だけを想定し、実害が無いため指摘にしない。
    - Doing: `prune` は `YYYY-MM-DD.jsonl` という名前だけを見る形にした。
    - Left: 他の名前には触らないのが意図で、害が無いと判断した。
    - Cost: 無し。手で置いた別の名前のファイルは消えない。

22. adr.md:02 / ADR / entry 02 の文が「1 つのファイル（`logs/recent.json`）に直近 `record.recent` 行を保つ」のままで、いまの形（`logs/YYYY-MM-DD.jsonl` に足していく。`log.keepDays` 日で古い日付を消す）と食い違う。ex-log-per-day で形を戻したが、ADR の文は直していない。
    - Doing: ADR の entry 02 は「記録は 1 つのファイルで、直近 `record.recent` 件を持つ」と決めていた。
    - Left: ex-plan がその形を戻したが、ADR の文を直す担当が居なかった。
    - Cost: ADR と実物が食い違う。あとで読む人は、窓の形が正しいと考える。

## Triage

- 1: dropped (ADR 01 / `Unit.intent-router`): 配線は変えずに済んだ。確かめる検査は `index.test.ts` に足りている。
- 2: ex-plan ex-drop-unused (ADR 01 / `Unit.intent-router`): 使われていない `noteVerdict` と、それだけのための検査を消した。done 672e9ff
- 3: dropped (ADR 01 / `Unit.intent-router`): レビューは読み合わせだけ。緑は受け入れが確かめている（208 件と 706 件）。
- 4: dropped (ADR 01 / `Unit.intent-router`): すでに直っている（plan 2 の受け入れで 11 件を消した）。
- 5: dropped (ADR 01 / `Unit.intent-router`): すでに直っている。`record/recent.test.ts` は ex-plan で消えた。
- 6: dropped (ADR 01 / `Unit.intent-router`): すでに直っている。
- 7: dropped (ADR 01 / `Unit.intent-router`): すでに直っている。
- 8: dropped (ADR 01 / `Unit.intent-router`): すでに直っている。
- 9: dropped (ADR 01 / `Unit.intent-router`): すでに直っている。
- 10: dropped (ADR 01 / `Unit.intent-router`): すでに直っている。
- 11: ex-plan ex-drop-unused (ADR 01 / `Unit.intent-router`): 同じ枝に見える 8 組を読んで、要らない側 5 件と、型が決める 1 行を消した。done 672e9ff
- 12: dropped (ADR 01 / `Unit.intent-router`): 読みやすさの話。動きには影響しない。
- 13: dropped (ADR 02 / `Unit.intent-router`): 死んだ `void` の 3 行。動きには影響しない。
- 14: dropped (ADR 02 / `Unit.intent-router`): 記録を読む者が居なくなったので、古い形の行の心配は無くなった。
- 15: dropped (ADR 02 / `Unit.intent-router`): README の `set` の例。既定値の説明ではない。
- 16: dropped (ADR 01 / `Unit.intent-router`): 題の grep が 0 件になるのは hook 側だけ。残る題は decide 側の別の層。記録に読み方が書いてある。
- 17: dropped (ADR 01 / `Unit.intent-router`): 「3 件全赤」は消した 1 件と残した 2 件の数のこと。枝の違いは記録に書いてある。
- 18: dropped (ADR 01 / `Unit.intent-router`): `latencyMs` の 1 行は型（`number`）と `pnpm typecheck` が守る。受け入れで、型を偽ると `typecheck` が赤になり vitest は緑のままであることを確かめた。
- 19: dropped (ADR 01 / `Unit.intent-router`): レビューは vitest を打てなかった。受け入れで 41 ファイル / 699 件を確かめた。
- 20: dropped (ADR 02 / `Unit.intent-router`): 掃除の失敗でセッションを止めない方がよい。失敗が見えない点は残る。
- 21: dropped (ADR 02 / `Unit.intent-router`): `YYYY-MM-DD.jsonl` 以外の名前を触らないのは意図どおり。
- 22: dropped (ADR 02 / `Unit.intent-router`): ADR はその時の決定の記録。形を戻したことは ex-plan の plan md と、この close の収集に残る。
