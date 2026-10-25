# Close 038

## Collected

### async-precompact (ADR 01)

1. 648 / Cleanup: 重複と前提の整理 / `index.test.ts` の `signal` 重複試験を 1 件削除
   - Doing: すべての偽 ctx が既定で `signal: undefined` のため、`AbortSignal.timeout` の枝は残る pass 試験で通る。開始と ready は `turn_end` と `flush` の試験に残る。
   - Left: 重複を消しただけで、残る試験が同じ枝を通る。残す穴はない。
   - Cost: なし。suite は緑のまま。
2. 649 / Cleanup: 重複と前提の整理 / `summarize.test.ts` の `done` を 2 回呼びから 1 回呼びへ
   - Doing: 同じ `done` の振る舞いを 2 回確かめていた。結果と経過の断定は 1 回に残る。
   - Left: 重複を消しただけ。残す穴はない。
   - Cost: なし。
3. 650 / Cleanup: 重複と前提の整理 / `gate.test.ts` の組み立て確認 2 件を削除
   - Doing: `oldRegion < MIN_OLD_RATIO` と `tokens >= lastApplied + REARM` の前提を確かめていた。振る舞いの `old-region-too-small` と `start` は残る。
   - Left: 前提の再現を消しただけ。残す穴はない。
   - Cost: なし。
4. 651 / Cleanup: 重複と前提の整理 / 消えた振る舞いの試験なし
   - Doing: prune 削除後の全件実行で、残る試験が現在の振る舞いだけを確かめることを確認した。
   - Left: 消えた振る舞いの試験は見つからなかった。
   - Cost: なし。
5. 652 / Cleanup: 重複と前提の整理 / 止めた分岐の試験なし
   - Doing: 今回の変更で到達不能になった分岐を確かめる試験がないことを確認した。有効・準備・適用・stale・失敗の分岐は残る。
   - Left: 止めた分岐の試験は見つからなかった。
   - Cost: なし。
6. 653 / Cleanup: 重複と前提の整理 / 整理後の全件実行
   - Doing: `pnpm test:run` 56 ファイル・802 件、`typecheck`、`lint`、`format:check` を通した。
   - Left: 整理は完了している。
   - Cost: なし。
7. 666 / Review Round 1 / plan md の差分は Notes の記録
   - Doing: Review が `cycles/261025-038-dev/plan/async-precompact.md` の差分を Notes の追記として扱った。
   - Left: 産物の `## Files` ではないため、判定に含めていない。
   - Cost: なし。close は plan md の記録を読む。
8. 667 / Review Round 1 / 4 つの枝に専用の試験がない
   - Doing: Review が `thresholdRatio` の上限（`settings/schema.ts:67`）、`contextWindow <= 0`（`gate/gate.ts:36`）、`onBeforeSettle` の stale 破棄（`index.ts:356-363`）、`discarded` の status（`ui/status.ts:24`）に専用の事例がないと指摘した。
   - Left: plan が事例を定めず、到達が希少で影響が軽微な枝として、所見にせず疑義に留めた。
   - Cost: この 4 つの枝が壊れても、現在の suite は緑のまま。

## Triage

- 1: dropped (ADR 01, Unit.context-precompact): Cleanup の記録で、対応する穴はない。
- 2: dropped (ADR 01, Unit.context-precompact): Cleanup の記録で、対応する穴はない。
- 3: dropped (ADR 01, Unit.context-precompact): Cleanup の記録で、対応する穴はない。
- 4: dropped (ADR 01, Unit.context-precompact): 消えた振る舞いの試験は見つからず、対応する穴はない。
- 5: dropped (ADR 01, Unit.context-precompact): 止めた分岐の試験は見つからず、対応する穴はない。
- 6: dropped (ADR 01, Unit.context-precompact): 整理後の全件実行の記録で、対応する穴はない。
- 7: dropped (ADR 01, Unit.context-precompact): plan md の差分は記録で、産物ではない。
- 8: ex-plan ex-precompact-edge-tests (ADR 01, Unit.context-precompact): 4 つの枝に専用の試験がなく、regression が suite を通過する。

## Verified
