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

### ex-precompact-edge-tests (ADR 01)

9. 74 / Review Round 1 / `cycles/261025-038-dev/plan/ex-precompact-edge-tests.md:13` の `index.ts` は変更されたにもかかわらず `update` 標記がなく、`## Files` の標記と実態がずれています。Unplanned として開示されているため finding とはしませんが、close 時の読み替えが必要です。
10. 75 / Review Round 1 / `.pi/extensions/context-precompact/index.test.ts:342` の stale 検証は通知の有無までであり、`discardWithFallback`（`.pi/extensions/context-precompact/index.ts:159`）が置く `status: discarded` や通知種別 `warning`、`warn` 呼び出しまでは確かめていません。既存の stale 系テストと同一の方針のため Gap とはしませんが、今回の修正動機であった status の clear は `status.test.ts:31` の単体検証に間接的に依存しています。
11. 76 / Review Round 1 / `.pi/extensions/context-precompact/index.test.ts:350` の `branch.slice(0, 5)` は `threeTurns()`（6 件）の末尾欠けを表す魔数であり、`slice(0, -1)` であれば工場の件数から切り離せます。既存の stale 系テストと同一の書き方のため finding とはしません。

### async-precompact (Unit check) (ADR 01)

12. Unit check / `/precompact now` / command が要約を待ち、info の chat 行を残す

- Doing: `/precompact now` が `runPass` を await し、完了後に `notify(..., 'info')` で chat 行を出していた。
- Left: `now` の command handler が要約の完了まで待ち、`info` の chat 行が消せず、入力が止まった。
- Cost: `now` を使うたびに TUI が止まり、Pi を落とす必要がある。

## Triage

- 1: dropped (ADR 01, Unit.context-precompact): Cleanup の記録で、対応する穴はない。
- 2: dropped (ADR 01, Unit.context-precompact): Cleanup の記録で、対応する穴はない。
- 3: dropped (ADR 01, Unit.context-precompact): Cleanup の記録で、対応する穴はない。
- 4: dropped (ADR 01, Unit.context-precompact): 消えた振る舞いの試験は見つからず、対応する穴はない。
- 5: dropped (ADR 01, Unit.context-precompact): 止めた分岐の試験は見つからず、対応する穴はない。
- 6: dropped (ADR 01, Unit.context-precompact): 整理後の全件実行の記録で、対応する穴はない。
- 7: dropped (ADR 01, Unit.context-precompact): plan md の差分は記録で、産物ではない。
- 8: done 0d497db (ex-precompact-edge-tests, ADR 01, Unit.context-precompact): 4 つの枝の試験を追加し、merge した。
- 9: dropped (ADR 01, Unit.context-precompact): Unplanned で開示済みで、コードの穴ではない。
- 10: dropped (ADR 01, Unit.context-precompact): `turn_end` の stale 試験と `status.test.ts` が同じ枝を確かめている。
- 11: dropped (ADR 01, Unit.context-precompact): テストの書き方の疑義で、振る舞いの穴ではない。既存の書き方に合わせている。
- 12: ex-plan ex-precompact-now-command (ADR 01, Unit.context-precompact): `/precompact now` が command を待たせ、info の chat 行を残す。

## Verified

### Unit.context-precompact

- Plans:
  - `async-precompact`
- Result:
- Fixed:
