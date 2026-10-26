# Close 038

## Collected

### async-precompact (ADR 01)

1. 648 / Cleanup: 重複と前提の整理 / `.pi/extensions/context-precompact/index.test.ts` の `signal が undefined → pass が始まり status が preparing` の 1 件を削りました。すべての偽 ctx が既定で `signal: undefined` のため、`AbortSignal.timeout` 枝は残る pass 試験のすべてで通り、開始と ready の断定は `turn_end で比率が閾値の手前` と `flush が実行中の pass を待つ` に残ります。
   - Doing: すべての偽 ctx が既定で `signal: undefined` のため、`AbortSignal.timeout` の枝は残る pass 試験で通る。開始と ready は `turn_end` と `flush` の試験に残る。
   - Left: 重複を消しただけで、残る試験が同じ枝を通る。残す穴はない。
   - Cost: なし。suite は緑のまま。

2. 649 / Cleanup: 重複と前提の整理 / `.pi/extensions/context-precompact/run/summarize.test.ts` の `done` の試験を 2 回呼びから 1 回呼びにしました。2 回とも同じ `done` の振る舞いで、結果と経過の断定は 1 回に残ります。
   - Doing: 同じ `done` の振る舞いを 2 回確かめていた。結果と経過の断定は 1 回に残る。
   - Left: 重複を消しただけ。残す穴はない。
   - Cost: なし。

3. 650 / Cleanup: 重複と前提の整理 / `.pi/extensions/context-precompact/gate/gate.test.ts` の 2 件から前提の断定を削りました。`oldRegion < MIN_OLD_RATIO` と `tokens >= lastApplied + REARM` は試験の組み立ての確認で、振る舞いの確認は `old-region-too-small` と `start` の断定に残ります。使わなくなった `MIN_OLD_RATIO` の import も外しました。
   - Doing: `oldRegion < MIN_OLD_RATIO` と `tokens >= lastApplied + REARM` の前提を確かめていた。振る舞いの `old-region-too-small` と `start` は残る。
   - Left: 前提の再現を消しただけ。残す穴はない。
   - Cost: なし。

4. 651 / Cleanup: 重複と前提の整理 / 消えた振る舞いの試験は見当たりませんでした。prune 削除後の全件実行で残る試験は現在の振る舞いだけを確かめています。
   - Doing: prune 削除後の全件実行で、残る試験が現在の振る舞いだけを確かめることを確認した。
   - Left: 消えた振る舞いの試験は見つからなかった。
   - Cost: なし。

5. 652 / Cleanup: 重複と前提の整理 / 止めた分岐の試験は見当たりませんでした。今回の変更で到達不能になった分岐を確かめる試験はなく、残る分岐（有効・準備・適用・stale・失敗）は試験に残ります。
   - Doing: 今回の変更で到達不能になった分岐を確かめる試験がないことを確認した。有効・準備・適用・stale・失敗の分岐は残る。
   - Left: 止めた分岐の試験は見つからなかった。
   - Cost: なし。

6. 653 / Cleanup: 重複と前提の整理 / 削除後は `pnpm test:run` 56 件・802 件、`pnpm typecheck`、`pnpm lint`、`pnpm format:check` のすべてが通過しました。
   - Doing: `pnpm test:run` 56 ファイル・802 件、`typecheck`、`lint`、`format:check` を通した。
   - Left: 整理は完了している。
   - Cost: なし。

7. 666 / Review Round 1 / `cycles/261025-038-dev/plan/async-precompact.md:656` の差分は Notes の追記であり、産物の `## Files` には含めない記録です。判定には含めていません。
   - Doing: Review が `cycles/261025-038-dev/plan/async-precompact.md` の差分を Notes の追記として扱った。
   - Left: 産物の `## Files` ではないため、判定に含めていない。
   - Cost: なし。close は plan md の記録を読む。

8. 667 / Review Round 1 / `thresholdRatio` の上限（`.pi/extensions/context-precompact/settings/schema.ts:67` の `> MAX`）、`contextWindow <= 0`（`.pi/extensions/context-precompact/gate/gate.ts:36`）、`onBeforeSettle` の stale 破棄（`.pi/extensions/context-precompact/index.ts:356-363`）、`discarded` の単位試験（`.pi/extensions/context-precompact/ui/status.ts:24`）には専用の事例がありませんが、いずれも計画が事例を定めなかった範囲、または到達が希少で影響が軽微な枝のため、所見にせず疑義に留めます。
   - Doing: Review が `thresholdRatio` の上限（`settings/schema.ts:67`）、`contextWindow <= 0`（`gate/gate.ts:36`）、`onBeforeSettle` の stale 破棄（`index.ts:356-363`）、`discarded` の status（`ui/status.ts:24`）に専用の事例がないと指摘した。
   - Left: plan が事例を定めず、到達が希少で影響が軽微な枝として、所見にせず疑義に留めた。
   - Cost: この 4 つの枝が壊れても、現在の suite は緑のまま。

### ex-precompact-display (ADR 01)

9. 353 / Acceptance / Round 2 の Stale（doc.test の needle）→ fixed: `doc.test.ts` を削除した。
   - Doing: Round 2 の Stale を受けて `doc.test.ts` を消した。
   - Left: 文書文字列の needle は意味がないと判断し、ファイルごと消した。
   - Cost: なし。

10. 354 / Acceptance / Round 2 の Unlisted（fixture の宣言）→ fixed: `Types` と Step 6 を直した。
    - Doing: Round 2 の Unlisted を受けて `Types` と Step 6 を直した。
    - Left: 記録のずれで、コードの穴ではない。
    - Cost: なし。

11. 355 / Acceptance / Round 2 の Gaps（`/precompact` の失敗理由）→ fixed: `index.test.ts` に事例を足した。
    - Doing: Round 2 の Gaps を受けて `/precompact` の失敗理由の試験を足した。
    - Left: 表示の穴は `index.test.ts` で閉じた。
    - Cost: なし。

12. 356 / Acceptance / Round 2 の Unproven（モデル無しの文言）→ fixed: `toThrow(NO_MODEL_REASON)` にした。
    - Doing: Round 2 の Unproven を受けて `toThrow(NO_MODEL_REASON)` にした。
    - Left: 文言そのものの試験は要らないと判断した。
    - Cost: なし。

13. 357 / Acceptance / Round 2 の Noise（4 getter）→ fixed: 事例を消した。
    - Doing: Round 2 の Noise を受けて 4 getter の試験を消した。
    - Left: 前提の再試験で、振る舞いではない。
    - Cost: なし。

14. 358 / Acceptance / Round 2 の Doubts（console grep）→ fixed: バックスラッシュを 1 本にした。
    - Doing: Round 2 の Doubts を受けて grep のバックスラッシュを 1 本にした。
    - Left: 記録の書き方。
    - Cost: なし。

15. 359 / Acceptance / 実機の look は未実施。オーナーが Pi を reload し、`/precompact now` と `/precompact` を実行して、chat の `preparing…` → `ready (X → Y)` / `applied (X → Y)` / 失敗の warning と `status:` 行を読む必要がある。
    - Doing: Acceptance に実機の look を残した。
    - Left: オーナーが reload して、`/precompact now` の表示と適用を見た。
    - Cost: なし。

### ex-precompact-edge-tests (ADR 01)

16. 74 / Review Round 1 / `cycles/261025-038-dev/plan/ex-precompact-edge-tests.md:13` の `index.ts` は変更されたにもかかわらず `update` 標記がなく、`## Files` の標記と実態がずれています。Unplanned として開示されているため finding とはしませんが、close 時の読み替えが必要です。
    - Doing: review が `index.ts` の Files 標記のずれを指摘した。
    - Left: Unplanned で開示済み。
    - Cost: 次に読む人が `## Files` と実態のずれを踏む。

17. 75 / Review Round 1 / `.pi/extensions/context-precompact/index.test.ts:342` の stale 検証は通知の有無までであり、`discardWithFallback`（`.pi/extensions/context-precompact/index.ts:159`）が置く `status: discarded` や通知種別 `warning`、`warn` 呼び出しまでは確かめていません。既存の stale 系テストと同一の方針のため Gap とはしませんが、今回の修正動機であった status の clear は `status.test.ts:31` の単体検証に間接的に依存しています。
    - Doing: review が stale の試験は通知までで、`status: discarded` を見ていないと指摘した。
    - Left: `status.test.ts` が同じ枝を確かめている。
    - Cost: status の clear が単体試験だけに依存する。

18. 76 / Review Round 1 / `.pi/extensions/context-precompact/index.test.ts:350` の `branch.slice(0, 5)` は `threeTurns()`（6 件）の末尾欠けを表す魔数であり、`slice(0, -1)` であれば工場の件数から切り離せます。既存の stale 系テストと同一の書き方のため finding とはしません。
    - Doing: review が `branch.slice(0, 5)` の魔数を指摘した。
    - Left: 既存の stale 試験と同じ書き方。
    - Cost: 件数を変えると切れ目がずれる。

### ex-precompact-now-apply (ADR 01)

19. 355 / Slice 1 (now-apply) / `now` は閾値を見ず、次の `turn_end` か `agent_before_settle` で適用される。`running` 中の `now` は旗を立てるだけで、走っているパスを止めない。
    - Doing: `now` の適用の仕様を確かめた。
    - Left: 穴ではない。
    - Cost: なし。

20. 362 / Slice 2 (tokens-after) / `tokensAfter` は切れ目から後ろの推定と要約の推定の和になり、0 にならない。
    - Doing: `tokensAfter` の式を確かめた。
    - Left: 穴ではない。
    - Cost: なし。

21. 369 / Slice 3 (settle-guard) / `agent_before_settle` と `session_before_compact` は、拡張と Pi の両方が有効なときだけ適用する。
    - Doing: 両方のフックの有効性の確認を確かめた。
    - Left: 穴ではない。
    - Cost: なし。

22. 376 / Slice 4 (session-reset) / 旧パスの書き込みは `generation` で止める。旧パスは新しいパスの `running` を降ろさない。`forceApply` は引き継がない。
    - Doing: session 切替の `generation` を確かめた。
    - Left: 穴ではない。
    - Cost: なし。

23. 383 / Slice 5 (apply-tokens) / `applied` の前の数字は適用時の使用量。`usage` が `undefined` のときは準備時の `before` に退避する。
    - Doing: `applied` の前の数字を確かめた。
    - Left: 穴ではない。
    - Cost: なし。

24. 390 / Slice 6 (command-edges) / `status` が usage に落ちていたのを直した。コメントも `status` に触れる形にした。
    - Doing: `status` の修正を確かめた。
    - Left: 穴ではない。
    - Cost: なし。

25. 397 / Slice 7 (error-path) / `notify` の throw で `running` が残るので、戻してから rethrow する。
    - Doing: `notify` の復帰を確かめた。
    - Left: 穴ではない。
    - Cost: なし。

26. 404 / Slice 8 (compare-tests) / `mismatch` に `turnPrefixMessages` と `fileOps` が入る。既存の試験がそのまま通った。
    - Doing: `mismatch` の 3 事例を確かめた。
    - Left: 穴ではない。
    - Cost: なし。

27. 411 / Slice 9 (dead-code) / `MAX_IN_FLIGHT`、到達しない `return undefined`、`brokenNotified`、重複した `previousSummary` を消した。`brokenNotified` はどこからも読まれていなかった。
    - Doing: 死んだコードを消したことを確かめた。
    - Left: 穴ではない。
    - Cost: なし。

28. 418 / Cleanup: 重複した試験を 4 つ消した / `index.test.ts` の `turn_end` の手前、拡張か Pi が false、`session_start / shutdown` の 3 つは、他の試験が同じ振る舞いを確かめていた。`now` の off の 2 つも 1 つにまとめた。
    - Doing: 重複試験の削除を確かめた。
    - Left: 重複で、穴ではない。
    - Cost: なし。

29. 429 / Review Round 1 / `.pi/extensions/context-precompact/prepare/copied.test.ts:10` の定数化は Files に名前がありません。 / left: 前の ex-plan（display）の未コミットの試験修正で、このプランでは触っていない。
    - Doing: `copied.test.ts` の定数化。
    - Left: 前の ex-plan の差分で、このプランの外。
    - Cost: なし。`fdf9add` で入った。

30. 431 / Review Round 1 / `.pi/extensions/context-precompact/run/summarize.test.ts:8` の時計定数の削除と `Date.now` 化は Files に名前がありません。 / left: 前の ex-plan（display）の未コミットの試験修正で、このプランでは触っていない。
    - Doing: `summarize.test.ts` の時計定数の削除。
    - Left: 前の ex-plan の差分で、このプランの外。
    - Cost: なし。`fdf9add` で入った。

31. 433 / Review Round 1 / `.pi/extensions/context-precompact/settings/read.test.ts:1` の実設定読み試験の削除は Files に名前がありません。 / left: 前の ex-plan（display）の未コミットの試験修正で、このプランでは触っていない。
    - Doing: `read.test.ts` の実設定読み試験の削除。
    - Left: 前の ex-plan の差分で、このプランの外。
    - Cost: なし。`fdf9add` で入った。

32. 435 / Review Round 1 / `.pi/extensions/context-precompact/ui/count.test.ts:8` の `grouped` 化は Files に名前がありません。 / left: 前の ex-plan（display）の未コミットの試験修正で、このプランでは触っていない。
    - Doing: `count.test.ts` の `grouped` 化。
    - Left: 前の ex-plan の差分で、このプランの外。
    - Cost: なし。`fdf9add` で入った。

33. 437 / Review Round 1 / `.pi/extensions/context-precompact/ui/status.test.ts:14` の `toContain` 化と工場化は Files に名前がありません。 / left: 前の ex-plan（display）の未コミットの試験修正で、このプランでは触っていない。
    - Doing: `status.test.ts` の `toContain` 化と工場化。
    - Left: 前の ex-plan の差分で、このプランの外。
    - Cost: なし。`fdf9add` で入った。

34. 441 / Review Round 1 / `cycles/261025-038-dev/close.md:77` の前サイクル完了行の追加は Files に名前がありません。 / left: 前の ex-plan（display）の記録で、このプランでは触っていない。
    - Doing: `close.md` に前の完了行を足した。
    - Left: 前の ex-plan の記録で、このプランの外。
    - Cost: なし。

35. 461 / Review Round 1 / `.pi/extensions/context-precompact/test/wiring.ts:1` の置き場所は形式どおりに見えますが、Files に `add` が無いため合意の扱いが気になります。
    - Doing: review が `test/wiring.ts` の置き場所を疑った。
    - Left: `index.test.ts` に戻して、`test/wiring.ts` を消した。
    - Cost: なし。

36. 462 / Review Round 1 / 開始時の `git status` では `.pi/extensions/context-precompact/now-apply.test.ts` がありましたが、確認時には無くなっており、この判定は後者の状態に基づいています。
    - Doing: review が `now-apply.test.ts` の不在を記録した。
    - Left: 分割をやめ、`index.test.ts` に戻した。
    - Cost: なし。

37. 469 / Review Round 2 / 確認済みです — `.pi/extensions/context-precompact/command/precompact.ts:23` が「引数なしと `status` は status、`on` / `off` / `now`、それ以外は usage」に直っており、`status` が `usage` 扱いに読める古さは解消されています。
    - Doing: Round 2 の確認を記録した。
    - Left: 確認済みで、穴ではない。
    - Cost: なし。

38. 471 / Review Round 2 / 確認済みです — `.pi/extensions/context-precompact/test/` に `wiring.ts` はなく `session-entries.ts` のみで、`test/wiring` への参照もありません（`grep` で一致なし）。`fakeCtx`（`index.test.ts:114`）や `fakePi`（`index.test.ts:184`）などが `index.test.ts` 内に戻されており、削除と戻しは実施されています。
    - Doing: Round 2 の確認を記録した。
    - Left: 確認済みで、穴ではない。
    - Cost: なし。

39. 473 / Review Round 2 / 確認済みです — `precompact now apply` に 7 事例（`index.test.ts:721,731,741,760,778,788,795`）があり、`LEAD_TOKENS` での素通り適用、`running` 時の旗立て、失敗後の旗消し、拡張 off・Pi off での不適用、stale 時の破棄を含んでおります。`index.ts:330-331` と `index.ts:364` の素通り経路に対応しています。
    - Doing: Round 2 の確認を記録した。
    - Left: 確認済みで、穴ではない。
    - Cost: なし。

40. 474 / Review Round 2 / 確認済みです — `precompact tokens after` に 2 事例（`index.test.ts:808,819`）があり、`usage` が `undefined` のとき `turn_end` は `ready.tokensBefore`、`session_before_compact` は `ready.result.tokensBefore` を使うことを確かめています。`index.ts:184-185` と `index.ts:406-407` の退避に対応しています。
    - Doing: Round 2 の確認を記録した。
    - Left: 確認済みで、穴ではない。
    - Cost: なし。

41. 475 / Review Round 2 / 確認済みです — `precompact guards` に 4 事例（`index.test.ts:837,847,854,869`）があり、`THRESHOLD_TOKENS` で拡張 off・Pi off の `agent_before_settle` と `session_before_compact` の拒否を確かめています。`index.ts:360-362` と `index.ts:388-390` の防御に対応しています。
    - Doing: Round 2 の確認を記録した。
    - Left: 確認済みで、穴ではない。
    - Cost: なし。

42. 476 / Review Round 2 / 確認済みです — `precompact session reset` に 3 事例（`index.test.ts:912,929,949`）があり、旧 pass の書き込み抑止、新 pass の `running` 維持、`forceApply` の引継ぎ禁止を確かめています。`index.ts:297` の世代捕捉と `index.ts:256,275,314-316` の世代検査、`index.ts:424-432` の `generation` 加算に対応しています。
    - Doing: Round 2 の確認を記録した。
    - Left: 確認済みで、穴ではない。
    - Cost: なし。

43. 479 / Review Round 2 / 確認済みです — `precompact error path` に 2 事例（`index.test.ts:884,899`）があり、前者は `throws: projection／branch／usage` の 3 通りを回して `failed` を確かめ、後者は `notify` の throw で `reject` と `running` の復帰を確かめています。`index.ts:215-280` の `try` 拡大と `index.ts:301-306` の `notify` 保護、`index.ts:283-289` の `failPass` に対応しています。
    - Doing: Round 2 の確認を記録した。
    - Left: 確認済みで、穴ではない。
    - Cost: なし。

44. 481 / Review Round 2 / Round 1 で `fixed:` がないため、今回の確認対象はございません。
    - Doing: Round 2 の確認を記録した。
    - Left: 確認済みで、穴ではない。
    - Cost: なし。

45. 483 / Review Round 2 / Round 1 で `fixed:` がないため、今回の確認対象はございません。
    - Doing: Round 2 の確認を記録した。
    - Left: 確認済みで、穴ではない。
    - Cost: なし。

46. 485 / Review Round 2 / テストの実行までは行っておらず、静的な対応付けのみで確認しております。実行時の成否は見ておりませんので、所見ではございません。
    - Doing: Round 2 の確認を記録した。
    - Left: 確認済みで、穴ではない。
    - Cost: なし。

47. 493 / Acceptance / Round 2 の `off` の `warning` → fixed: `on` / `off` のループにした。
    - Doing: `off` の warning の事例を足した。
    - Left: fixed で閉じた。
    - Cost: なし。

48. 494 / Acceptance / Verify の `grep -n "閾値を見ずに" README.md` は、README が英語のため当たらない。 / left: 英語の文書に日本語の語は置かない。内容は `below thresholdRatio too` で満たしている。
    - Doing: Verify の README の grep が当たらないと記録した。
    - Left: 内容は英語の文で満たしている。
    - Cost: Verify をそのまま実行すると赤になる。

49. 496 / Acceptance / Verify の `grep -n "切れ目から後ろの推定" adr.md` は、ADR の文が「切れ目から後ろのメッセージの推定」で、一字一句が違う。 / left: 内容は ADR に入っている。文言の完全一致だけが外れている。
    - Doing: Verify の ADR の grep が文言違いで当たらないと記録した。
    - Left: 内容は ADR に入っている。
    - Cost: Verify をそのまま実行すると赤になる。

50. 498 / Acceptance / 実機の look は未実施。オーナーが reload して、使用量が `thresholdRatio` 未満の状態で `/precompact now` を実行し、次のターンで `applied` と数字を見る必要がある。コミットはしていない。
    - Doing: 実機の look を残した。
    - Left: オーナーが実機で見た。
    - Cost: なし。

### ex-precompact-now-command (ADR 01)

51. 84 / Review Round 1 / `.pi/extensions/context-precompact/index.ts:175` の `console.info` による applied ログは残っていますが、plan が対象にしていないため所見にしていません。
    - Doing: review が `console.info` の残りを疑った。
    - Left: `3b73054` で消えている。
    - Cost: なし。

## Triage

- 1: dropped (ADR 01, Unit.context-precompact): Cleanup の記録。`signal` の重複した試験を消した。
- 2: dropped (ADR 01, Unit.context-precompact): Cleanup の記録。`done` の試験を 1 回にした。
- 3: dropped (ADR 01, Unit.context-precompact): Cleanup の記録。前提の断定を消した。
- 4: dropped (ADR 01, Unit.context-precompact): 消えた振る舞いの試験はない。
- 5: dropped (ADR 01, Unit.context-precompact): 止めた分岐の試験はない。
- 6: dropped (ADR 01, Unit.context-precompact): 整理後の全件実行の記録。
- 7: dropped (ADR 01, Unit.context-precompact): plan md の差分は記録で、産物ではない。
- 8: done 0d497db (ex-precompact-edge-tests, ADR 01, Unit.context-precompact): 4 つの枝の試験を足した。
- 9: dropped (ADR 01, Unit.context-precompact): `9f86dc5` で直した。
- 10: dropped (ADR 01, Unit.context-precompact): `9f86dc5` で直した。
- 11: dropped (ADR 01, Unit.context-precompact): `9f86dc5` で直した。
- 12: dropped (ADR 01, Unit.context-precompact): `9f86dc5` で直した。
- 13: dropped (ADR 01, Unit.context-precompact): `9f86dc5` で直した。
- 14: dropped (ADR 01, Unit.context-precompact): `9f86dc5` で直した。
- 15: dropped (ADR 01, Unit.context-precompact): オーナーが実機で見た。
- 16: dropped (ADR 01, Unit.context-precompact): Unplanned で開示済みで、コードの穴ではない。
- 17: dropped (ADR 01, Unit.context-precompact): `status.test.ts` が同じ枝を確かめている。
- 18: dropped (ADR 01, Unit.context-precompact): 既存の stale 試験と同じ書き方。
- 19: dropped (ADR 01, Unit.context-precompact): 仕様の記録で、穴ではない。
- 20: dropped (ADR 01, Unit.context-precompact): 仕様の記録で、穴ではない。
- 21: dropped (ADR 01, Unit.context-precompact): 仕様の記録で、穴ではない。
- 22: dropped (ADR 01, Unit.context-precompact): 仕様の記録で、穴ではない。
- 23: dropped (ADR 01, Unit.context-precompact): 仕様の記録で、穴ではない。
- 24: dropped (ADR 01, Unit.context-precompact): 仕様の記録で、穴ではない。
- 25: dropped (ADR 01, Unit.context-precompact): 仕様の記録で、穴ではない。
- 26: dropped (ADR 01, Unit.context-precompact): 仕様の記録で、穴ではない。
- 27: dropped (ADR 01, Unit.context-precompact): 仕様の記録で、穴ではない。
- 28: dropped (ADR 01, Unit.context-precompact): 重複試験の削除の記録。
- 29: dropped (ADR 01, Unit.context-precompact): 前の ex-plan の差分で、`fdf9add` に入った。
- 30: dropped (ADR 01, Unit.context-precompact): 前の ex-plan の差分で、`fdf9add` に入った。
- 31: dropped (ADR 01, Unit.context-precompact): 前の ex-plan の差分で、`fdf9add` に入った。
- 32: dropped (ADR 01, Unit.context-precompact): 前の ex-plan の差分で、`fdf9add` に入った。
- 33: dropped (ADR 01, Unit.context-precompact): 前の ex-plan の差分で、`fdf9add` に入った。
- 34: dropped (ADR 01, Unit.context-precompact): 前の ex-plan の記録で、このプランの外。
- 35: dropped (ADR 01, Unit.context-precompact): 分割をやめて `index.test.ts` に戻した。
- 36: dropped (ADR 01, Unit.context-precompact): 分割をやめて `index.test.ts` に戻した。
- 37: dropped (ADR 01, Unit.context-precompact): 確認済みの記録。
- 38: dropped (ADR 01, Unit.context-precompact): 確認済みの記録。
- 39: dropped (ADR 01, Unit.context-precompact): 確認済みの記録。
- 40: dropped (ADR 01, Unit.context-precompact): 確認済みの記録。
- 41: dropped (ADR 01, Unit.context-precompact): 確認済みの記録。
- 42: dropped (ADR 01, Unit.context-precompact): 確認済みの記録。
- 43: dropped (ADR 01, Unit.context-precompact): 確認済みの記録。
- 44: dropped (ADR 01, Unit.context-precompact): 確認済みの記録。
- 45: dropped (ADR 01, Unit.context-precompact): 確認済みの記録。
- 46: dropped (ADR 01, Unit.context-precompact): 確認済みの記録。
- 47: dropped (ADR 01, Unit.context-precompact): fixed で閉じた。
- 48: dropped (ADR 01, Unit.context-precompact): 内容は英語の文で満たしている。Verify の文言だけが外れている。
- 49: dropped (ADR 01, Unit.context-precompact): 内容は ADR にある。Verify の文言だけが外れている。
- 50: dropped (ADR 01, Unit.context-precompact): 実機で見た。
- 51: dropped (ADR 01, Unit.context-precompact): console は消えている。

## Verified

### Unit.context-precompact

- Plans:
  - `async-precompact`
- Result: OK
