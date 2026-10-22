# Close 029

## Collected

### context-prune (ADR 01, 02, 03, 04, 05, 06 / Scope `Unit.context-prune`)

1. 662 / Review Round 1 / `command/prune.ts:62`・`entry/render.ts:21` — `markerText` は `ja-JP` 固定だが `statusLines`・`cardText` は既定ロケール。試験環境では `,` になるが、plan は status/card のロケールを決めていないので所感どまり。
   - Doing: `/prune` の状態の行と、カードの「省略: N 件 / M 文字」を組み立てていた。
   - Left: plan が `statusLines` と `cardText` の数字のロケールを決めておらず、ADR も決めていない。
   - Cost: 端末のロケールによって桁区切りが変わる程度で、機能は壊れない。表記の揺れが残る。
2. 665 / Review Round 1 / `prune/judge.ts:51` — `batches` は `maxQuestions` 0 で進まない。設定が 1 以上を保証するので到達不能だが、公開関数の守りは無い。所感どまり。
   - Doing: 候補を `maxQuestions` ずつに束ねていた。
   - Left: `maxQuestions` は設定の検証で 1 以上に限られており、0 は設定から来ない。
   - Cost: 呼び出し側が設定を迂回したときだけ、束が空になって判定が走らない。設定の口からは起きない。
3. 666 / Review Round 1 / `command/prune.ts:71` — `writeEnabled` は壊れ JSON を捨て `{enabled}` に上書きする。他キー保持の約束と矛盾しないが検査は無い。所感どまり。
   - Doing: `/prune on` と `off` で `settings.json` の `enabled` だけを書き換えていた。
   - Left: 壊れた `settings.json` を読んだときの扱いを plan が決めていなかった。
   - Cost: 壊れた設定に対して `on` / `off` を打つと、他のキーが消えて `{enabled}` だけになる。
4. 672 / Acceptance / Slice 3 の `Steps` の `gate` の順序が実装と違う — fixed: plan を実装の順（`below-ratio` が `empty` より前）に直した。
   - Doing: `gate` の順序を plan の `Steps` に書いていた。
   - Left: レビューの修正で順序が変わり、plan の文が古くなった。受入で直した。
   - Cost: なし（直した）。
5. 673 / Acceptance / `ports` のエラー経路（設定破損・registry/model 不在・空要約・例外・`stopReason: error`）が無試験 — left: plan の `Verify` が正常系だけを求めており、本番の口は SDK の戻りを写すだけである。
   - Doing: 本番の `summarize` と `classify` を `prune/ports.ts` で SDK につないでいた。
   - Left: plan の `Verify` が正常系 2 件だけを求め、エラー経路の試験を求めなかった。
   - Cost: `stopReason: error` や空要約の扱いが変わっても、テストは緑のままになる。
6. 675 / Acceptance / `markerText` は `ja-JP` 固定で、`statusLines` と `cardText` は既定ロケール。plan はロケールを決めていない。
   - Doing: 1 と同じ（印の数字と状態の行）。
   - Left: 1 と同じ。
   - Cost: 1 と同じ。
7. 676 / Acceptance / `assistantText` は `collect` で使うが、`runPass` の要約は `serializeConversation` 経由で使わない。
   - Doing: 結果の文字数を `assistantText` で数え、要約の入力は `serializeConversation` で作っていた。
   - Left: plan は `assistantText` を置くことだけを求め、要約の入力の組み方までは決めていなかった。
   - Cost: 2 つの関数が同じメッセージを別々に読む。片方だけ直すと数え方と要約の入力がずれる。
8. 677 / Acceptance / `batches` は `maxQuestions` 0 で守らない（設定が 1 以上を保証するので到達不能）。
   - Doing: 2 と同じ。
   - Left: 2 と同じ。
   - Cost: 2 と同じ。
9. 678 / Acceptance / `writeEnabled` は壊れた `settings.json` を他キーごと捨てて `{enabled}` に上書きする。
   - Doing: 3 と同じ。
   - Left: 3 と同じ。
   - Cost: 3 と同じ。

### ex-prune-leftovers (ADR 未特定 / Scope 未特定)

10. 186 / Review Round 1 / `cycles/261022-029-dev/plan/ex-prune-leftovers.md:52` — `formatCount` を `ja-JP` 固定にする妥当性は計画だけでは判断できず、所感どまり。
11. 187 / Review Round 1 / `cycles/261022-029-dev/plan/ex-prune-leftovers.md:128` — `batches` の `NaN` / `Infinity` 時の振る舞いは Verify に無く、設定が 1 以上を保証する前提なら到達不能のため所感どまり。
12. 188 / Review Round 1 / `cycles/261022-029-dev/plan/ex-prune-leftovers.md:133` — `ModelCell` 公開は型整理のみで Verify が無く、要否は計画だけでは判断できず所感どまり。
13. 195 / Acceptance / `formatCount` を `ja-JP` 固定にした。英語圏でも `1,234` になるが、区切りを変える端末では他と違う見え方になる。
14. 196 / Acceptance / `batches` は `NaN` と `Infinity` を丸めない。設定が 1 以上の整数を保証するので到達不能。
15. 197 / Acceptance / `ModelCell` の公開はテストのために型を開いただけで、`Verify` を持たない。

## Triage

- 1: ex-plan `ex-prune-leftovers` (ADR 04 / `Unit.context-prune`): 数字の区切りを `formatCount` に寄せた。— done 15de1d7
- 2: ex-plan `ex-prune-leftovers` (ADR 03 / `Unit.context-prune`): `batches` を 1 以上に丸めた。— done 15de1d7
- 3: ex-plan `ex-prune-leftovers` (ADR 04 / `Unit.context-prune`): 壊れた `settings.json` は書かずに理由を返す形にした。— done 15de1d7
- 4: done 178dca2 (ADR 02 / `Unit.context-prune`): 受入で plan の順序を直した。残っていない。
- 5: ex-plan `ex-prune-leftovers` (ADR 03 / `Unit.context-prune`): `ports` のエラー経路を、偽の registry で試した。— done 15de1d7
- 6: ex-plan `ex-prune-leftovers` (ADR 04 / `Unit.context-prune`): 1 と同じ。— done 15de1d7
- 7: ex-plan `ex-prune-leftovers` (ADR 03 / `Unit.context-prune`): `messageText` に名前を揃え、要約は `serializeConversation` と役目を分けた。— done 15de1d7
- 8: ex-plan `ex-prune-leftovers` (ADR 03 / `Unit.context-prune`): 2 と同じ。— done 15de1d7
- 9: ex-plan `ex-prune-leftovers` (ADR 04 / `Unit.context-prune`): 3 と同じ。— done 15de1d7
- 10: dropped (ADR 04 / `Unit.context-prune`): `ja-JP` 固定を採った。固定した時点で、端末ごとの見え方の違いは決めたことになる。
- 11: dropped (ADR 03 / `Unit.context-prune`): `NaN` と `Infinity` は設定の検証で作れない。1 以上に丸めたので、さらに届かない。
- 12: dropped (ADR 03 / `Unit.context-prune`): `ModelCell` はテストの口として開いただけ。振る舞いを持たない。
- 13: dropped (ADR 04 / `Unit.context-prune`): 10 と同じ。
- 14: dropped (ADR 03 / `Unit.context-prune`): 11 と同じ。
- 15: dropped (ADR 03 / `Unit.context-prune`): 12 と同じ。
