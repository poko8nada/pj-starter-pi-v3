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
- Unplanned:
- Commit:

## Review

### Round 1

- Stale:
- Unlisted:
- Gaps:
- Unproven:
- Doubts:

## Acceptance

- Ran:
- Findings:
- Doubts:
