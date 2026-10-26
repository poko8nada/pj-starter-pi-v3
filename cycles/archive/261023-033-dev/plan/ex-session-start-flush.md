# PLAN `ex-session-start-flush`

## Files

```text
.pi/extensions/consult/
  index.ts               update
```

## Slices

## 1.起動の配達を、tick の配達と同じ関数にする

### Types

```ts
// .pi/extensions/consult/index.ts（`deliverUnread` を消し、`flushPending` だけを残す）
export function flushPending(port: TickPort): number;
```

### Steps

1. `.pi/extensions/consult/index.ts`:
   - `deliverUnread` を消す。
   - `session_start` の中で、`deliverUnread(place, session, pi)` の代わりに `flushPending({ pi, place, sessionNow: () => session })` を呼ぶ。

### Verify:

- cli: `grep -n "deliverUnread\|flushPending" .pi/extensions/consult/index.ts`
  - (happy) 実行 → `deliverUnread` の行が 0 行
  - (happy) 実行 → `flushPending` が、`export function flushPending` と `session_start` の中の呼び出しの 2 行
  - _no case_: 件数や文字列の一致 — 出力の行を読むだけ

## Notes

### Slice 1: 起動の配達を、tick の配達と同じ関数にする

- Findings:
  - なし
- Unplanned:
  - なし
- Commit: 1e8e855

## Review

### Round 1

- Stale: なし（`deliverUnread` は JSDoc ごと削除され `.pi/extensions/consult/index.ts` に残骸なし。`pendingReports`・`appendDelivered` の import は `flushPending`（`.pi/extensions/consult/index.ts:74`）が使い続け、`index.test.ts:6` の import も有効。ADR・他 plan の `deliverUnread` 言及（`cycles/261023-033-dev/adr.md:8`・`cycles/261023-033-dev/plan/record-delivery.md:381`）は決定時の記録で更新対象外）
- Unlisted: なし（`git diff 594a3f9f1d87fee4ce4845e9fccf59bdd2da0f95..HEAD` の変更は `.pi/extensions/consult/index.ts` のみで `## Files`（`cycles/261023-033-dev/plan/ex-session-start-flush.md:3`）の名指し通り）
- Gaps: なし（件数・文字列一致は `_no case_`（`cycles/261023-033-dev/plan/ex-session-start-flush.md:32`）で対象外が決定済み。`session_start` 配線の試験欠落は `cycles/261023-033-dev/plan/record-delivery.md:381` で finding にしない決定済み。`flushPending` 本体は既存試験（`.pi/extensions/consult/index.test.ts:82`）が覆う）
- Unproven: なし（`deliverUnread` 0 行と `session_start` 内呼出し行の存在確認は `grep -n` の出力行を読む形（`cycles/261023-033-dev/plan/ex-session-start-flush.md:29`）で、引数違い（`.pi/extensions/consult/index.ts:216`）や呼出し削除・`deliverUnread` 復活はいずれも出力行の差として赤になる）
- Doubts:
  - Verify の「`flushPending` …の 2 行」（`cycles/261023-033-dev/plan/ex-session-start-flush.md:31`）は厳密には注釈（`.pi/extensions/consult/index.ts:101`）と `startTick` 内呼出し（`.pi/extensions/consult/index.ts:110`）にも当たり 4 行出るが、`_no case_`（`cycles/261023-033-dev/plan/ex-session-start-flush.md:32`）が行数えを対象外にしているため、`export`（`.pi/extensions/consult/index.ts:74`）と `session_start` 呼出し（`.pi/extensions/consult/index.ts:216`）の存在確認として通る。finding にしない。

## Acceptance

- Ran: `grep -n "deliverUnread\|flushPending" .pi/extensions/consult/index.ts` → `deliverUnread` は 0 行。`flushPending` は定義（74）・注（101）・tick の呼び出し（110）・`session_start` の呼び出し（216）の 4 行。
- Ran: `pnpm test:run .pi/extensions/consult`（18 files / 375 tests）、`pnpm typecheck`（root / .pi とも ok）。commit の hook で format、test 11 件、typecheck、lint も通っている。
- Ran: 壊し試験 1 つ。`session_start` の `flushPending` の呼び出しを消す → check の出力から `session_start` の行が消え、check が閉じない。戻して再実行し、4 行に戻った。
- Findings: なし
- Doubts: なし
