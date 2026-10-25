# PLAN `ex-precompact-edge-tests`

## Files

```text
.pi/extensions/context-precompact/
  settings/
    schema.ts
    schema.test.ts         update
  gate/
    gate.ts
    gate.test.ts           update
  index.ts
  index.test.ts            update
  ui/
    status.ts
    status.test.ts         update
```

## Slices

## 1.edge-tests

### Types

`なし`

### Steps

1. `.pi/extensions/context-precompact/settings/schema.test.ts`:
   - (error) `thresholdRatio: MAX_THRESHOLD_RATIO + Number.EPSILON` → `broken`。`MAX_THRESHOLD_RATIO` は `../settings/constants.ts` から読む。
2. `.pi/extensions/context-precompact/gate/gate.test.ts`:
   - (error) `contextWindow: 0`、`tokens` は非 null → `skip: unknown`。
3. `.pi/extensions/context-precompact/index.test.ts`:
   - (error) `agent_before_settle` で prepared の stamp を現在の branch と変える → draft 無し、フォールバック通知。
4. `.pi/extensions/context-precompact/ui/status.test.ts`:
   - (happy) `discarded` → `statusText` は `undefined`、`notifyText` は `precompact: failed; default compaction will run`、`notifyType` は `warning`。

### Verify

- Always:
  - `pnpm test:related .pi/extensions/context-precompact/settings/schema.ts .pi/extensions/context-precompact/settings/schema.test.ts .pi/extensions/context-precompact/gate/gate.ts .pi/extensions/context-precompact/gate/gate.test.ts .pi/extensions/context-precompact/index.ts .pi/extensions/context-precompact/index.test.ts .pi/extensions/context-precompact/ui/status.ts .pi/extensions/context-precompact/ui/status.test.ts`; 関連が無いときは `pnpm test:run`
  - `pnpm typecheck`
  - `pnpm lint`
  - `pnpm format:check`
  - `grep -nE "MAX_THRESHOLD_RATIO|contextWindow: 0|discarded|stale" .pi/extensions/context-precompact/settings/schema.test.ts .pi/extensions/context-precompact/gate/gate.test.ts .pi/extensions/context-precompact/index.test.ts .pi/extensions/context-precompact/ui/status.test.ts` で新しい case がある
- Added: なし

## Notes

### Slice 1: edge-tests

- Findings: なし
- Unplanned:
  - `.pi/extensions/context-precompact/index.ts` の `onBeforeSettle` の stale 破棄を `discardWithFallback` に変えました。warn のみで `notify` と status の clear がなく、`onTurnEnd` / `onSessionBeforeCompact` と不整合だったためです。
- Commit: 0e5905d consult(ex-precompact-edge-tests): add edge tests
- Stopped: なし

## Review

### Round 1

- Stale:
  - なし — `.pi/extensions/context-precompact/README.md:11` の破棄の説明と `.pi/extensions/context-precompact/index.ts:5` のコメントは、`discardWithFallback` 後も「破棄して既定に任せる」として成り立つため、古くなった文書・コメント・テストはありません。
- Unlisted:
  - なし — 差分の 5 件（`.pi/extensions/context-precompact/gate/gate.test.ts`、`.pi/extensions/context-precompact/index.test.ts`、`.pi/extensions/context-precompact/index.ts`、`.pi/extensions/context-precompact/settings/schema.test.ts`、`.pi/extensions/context-precompact/ui/status.test.ts`）はいずれも `## Files` に名前があり、`index.ts` の変更は `## Notes` の Unplanned に理由とともに記録されています。
- Gaps:
  - なし — 4 件の `Steps` が求めた振る舞い（上限超過→`broken`、`contextWindow: 0`→`skip: unknown`、`agent_before_settle` の stale→ draft 無し・フォールバック通知、`discarded` の文言・種別）はいずれも対応するテストで直接確かめられており、`Verify` の `Added: なし` を覆す行為もありません。
- Unproven:
  - なし — 4 件とも判定を外すと赤くなります（`settings/schema.ts:67` の上限判定を外せば `schema.test.ts:35` が `ok` になり、`gate/gate.ts:36` の `contextWindow <= 0` を外せば `gate.test.ts:58` が `wait` になり、`index.ts:358` を旧来の `warn` のみに戻せば `index.test.ts:355` の通知が消え、`status.ts:37` の `discarded` を外せば `status.test.ts:31` の通知が `undefined` になります）。
- Noise:
  - なし — `MAX_THRESHOLD_RATIO + Number.EPSILON`、`contextWindow: 0`、`precompact: failed; default compaction will run` は計画が決めた値であり、型・スキーマ・制約が既に保証する前提の焼き直しや、誰も気づかない行為の検証はありません。
- Doubts:
  - `cycles/261025-038-dev/plan/ex-precompact-edge-tests.md:13` の `index.ts` は変更されたにもかかわらず `update` 標記がなく、`## Files` の標記と実態がずれています。Unplanned として開示されているため finding とはしませんが、close 時の読み替えが必要です。
  - `.pi/extensions/context-precompact/index.test.ts:342` の stale 検証は通知の有無までであり、`discardWithFallback`（`.pi/extensions/context-precompact/index.ts:159`）が置く `status: discarded` や通知種別 `warning`、`warn` 呼び出しまでは確かめていません。既存の stale 系テストと同一の方針のため Gap とはしませんが、今回の修正動機であった status の clear は `status.test.ts:31` の単体検証に間接的に依存しています。
  - `.pi/extensions/context-precompact/index.test.ts:350` の `branch.slice(0, 5)` は `threeTurns()`（6 件）の末尾欠けを表す魔数であり、`slice(0, -1)` であれば工場の件数から切り離せます。既存の stale 系テストと同一の書き方のため finding とはしません。

## Acceptance

- Ran:
  - `pnpm test:related` 6 files / 54 tests（plan の Verify）。
  - `pnpm test:run` 56 files / 806 tests。
  - `pnpm typecheck`（root / .pi）、`pnpm lint`、`pnpm format:check`。
  - 4 つの新しい case の grep。
  - 壊して戻す 3 件: `schema.ts` の上限を外すと `thresholdRatio が上限超過` が赤。`gate.ts` の `contextWindow <= 0` を外すと `contextWindow が 0` が赤。`index.ts` の `onBeforeSettle` の stale 判定を反転すると `agent_before_settle` の 2 件が赤。いずれも復旧して緑に戻した。
- Findings:
  - なし
- Doubts:
  - なし
