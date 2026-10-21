# PLAN `ex-scrub-cleanup`

## Files

```text
.pi/
  extensions/
    thinking-scrub/
      index.ts                   update
      scrub/
        message.ts               update
        message.test.ts          update
```

## 1.書き込みを 1 経路にする

### Types

なし

### Steps

1. `.pi/extensions/thinking-scrub/index.ts`:
   - `onCommand` から、`runCommand` の外にある `writeEnabled(options.settingsDir, command.enabled)` の呼び出しを消す。
   - 書き込みは `runCommand` が `port.writeEnabled` で行う 1 経路だけにする。

### Verify:

- test: `pnpm test:related .pi/extensions/thinking-scrub/index.test.ts` → `.pi/extensions/thinking-scrub/index.test.ts`
  - (happy) コマンド `off` → `settings.json` の `enabled` が偽になり、次の `message_end` が `undefined`
  - (happy) コマンド `on` → その後の `message_end` が差し替えを返す
  - (happy) コマンドが引数無し → 通知が 1 回呼ばれ、`runCommand` の行が渡る
  - _no case_: 書き込みの回数 — 1 経路になったので、2 回目を数える対象が無い。

## 2.空になる差し替えを止める

### Types

なし

### Steps

1. `.pi/extensions/thinking-scrub/scrub/message.ts`:
   - `scrubThinking` の結果が空白だけで出来ている（`trim()` が空）ときは、そのブロックを差し替えず元のまま残し、`removed` にも数えない。
   - 他のブロックが畳めたなら、その分だけで差し替えを返す。
2. `.pi/extensions/thinking-scrub/scrub/message.test.ts`:
   - 既存の case の形に合わせて、全消しの case を足す。

### Verify:

- test: `pnpm test:related .pi/extensions/thinking-scrub/scrub/message.test.ts` → `.pi/extensions/thinking-scrub/scrub/message.test.ts`
  - (happy) 本文が 1 つの区間だけで、前後に文が無い → `undefined`（差し替えない）
  - (boundary values) 本文が区間と空白だけ → `undefined`
  - (happy) 区間の前後に正常な文 → 差し替わり、正常な文が残る
  - (boundary values) 2 ブロックのうち片方が全部区間 → その片方は元の値のまま、もう片方は畳まれ、`removed` は畳んだ分だけ
  - (empty) 退化の無い本文 → `undefined`

## 3.統合: thinking-scrub が緑のまま

### Types

なし

### Steps

1. `.pi/extensions/thinking-scrub/index.ts`:
   - 4 つの検査が通る形に整える（この段で挙動は変えない）。

### Verify:

- cli: `pnpm test:run .pi/extensions/thinking-scrub && pnpm typecheck && pnpm lint && pnpm format:check`
  - (happy) 全部 exit 0 → 拡張の全テストと、型・lint・整形の検査に落ちた行が無い

## Notes

### Slice 1: 書き込みを 1 経路にする

- Findings:
- Unplanned:
- Commit:

### Slice 2: 空になる差し替えを止める

- Findings:
- Unplanned:
- Commit:

### Slice 3: 統合: thinking-scrub が緑のまま

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
