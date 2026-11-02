# PLAN `thinking-scrub`

- No: 04

## Files

```text
.pi/extensions/thinking-scrub/
  index.test.ts        update
  live/
    guard.test.ts      update
  scrub/
    detect.test.ts     update
    units.test.ts      update
  state/
    cell.test.ts       update
  command/
    scrub.test.ts      update
  settings/
    schema.test.ts
```

## Slices

## 1.本当に気づかれないテストの削除

### Types

なし

### Steps

1. `.pi/extensions/thinking-scrub/index.test.ts`:
   - `it('1 回の message_end は作成時の 1 回と message_end の 1 回で 2 回呼ばれる')` を削除する。設定の読み込み回数だけが変わり、誰も気づかない。
2. `.pi/extensions/thinking-scrub/live/guard.test.ts`:
   - `it('無効のときは間隔が来たスキャンで scanned が進む')` を削除する。`scanned` の進みだけが変わり、誰も気づかない。
   - `it('live.maxAborts に達したら scanned が進み enabled が呼ばれない')` を削除する。同じ理由である。
   - `it('live.maxAborts を 0 にした設定なら idle になる')` は残す。外から見える振る舞いを持つ。
3. `.pi/extensions/thinking-scrub/scrub/detect.test.ts`:
   - `it('結果にもう一度かければ removed が 0 になり本文が同一になる')` を削除する。本番では1回だけ適用するため、2回目の適用は起こらない。
4. `.pi/extensions/thinking-scrub/state/cell.test.ts`:
   - `it('addFailure すれば failures が 1 増え他が変わらない')` を削除する。`failures` の増分は `index.test.ts` の `it('message_end で例外があれば failures が 1 増えそのあとの agent_end は notify を呼ばない')` が外から見える形で確かめている。
5. `.pi/extensions/thinking-scrub/settings/schema.test.ts` は変えない。5本（`thresholdRatio` の上下限、`minPeriod` と `maxPeriod` の関係など）は統合せずに残す。

### Verify

- Always:
  - `pnpm test:related .pi/extensions/thinking-scrub/index.test.ts .pi/extensions/thinking-scrub/live/guard.test.ts .pi/extensions/thinking-scrub/scrub/detect.test.ts .pi/extensions/thinking-scrub/state/cell.test.ts`
  - `pnpm typecheck`
  - `pnpm lint`
  - `pnpm format:check`
  - `! grep -E '作成時の 1 回と message_end の 1 回|無効のときは間隔が来たスキャン|live.maxAborts に達したら scanned が進み|結果にもう一度かければ|addFailure すれば' .pi/extensions/thinking-scrub/index.test.ts .pi/extensions/thinking-scrub/live/guard.test.ts .pi/extensions/thinking-scrub/scrub/detect.test.ts .pi/extensions/thinking-scrub/state/cell.test.ts`
  - `test "$(grep -c 'live.maxAborts を 0 にした設定なら idle' .pi/extensions/thinking-scrub/live/guard.test.ts)" = 1`
  - `test "$(grep -c 'message_end で例外があれば failures が 1 増え' .pi/extensions/thinking-scrub/index.test.ts)" = 1`
  - `test "$(grep -c 'thresholdRatio\|minPeriod\|maxPeriod\|scanEvery\|tail' .pi/extensions/thinking-scrub/settings/schema.test.ts)" -ge 5`
- Added: なし

## 2.同じ分岐を確かめる組の統合

### Types

なし

### Steps

1. `.pi/extensions/thinking-scrub/command/scrub.test.ts`:
   - (happy) `on` を渡す → `writeEnabled(true)` が1回呼ばれ、`on` の行が返る。
   - (happy) `off` を渡す → `writeEnabled(false)` が1回呼ばれ、`off` の行が返る。
   - 上の2本を、`it('on と off は writeEnabled を 1 回呼び、その行を返す')` の1本に統合する。
   - (happy) `show` を渡す → `writeShow(true)` が1回呼ばれ、`writeEnabled` は呼ばれない。
   - (happy) `hide` を渡す → `writeShow(false)` が1回呼ばれ、`writeEnabled` は呼ばれない。
   - 上の2本を、`it('show と hide は writeShow を 1 回呼び、writeEnabled を呼ばない')` の1本に統合する。
2. `.pi/extensions/thinking-scrub/scrub/units.test.ts`:
   - (boundary) 周期 3 のラン → その 3 文を返す。
   - (boundary) 周期 1 のラン → その 1 文を返す。
   - 上の2本を、`it('周期が 3 以下なら、その周期の文だけを返す')` の1本に統合する。周期 4 は最頻 3 文の側に回るため、このテストでは扱わない。

### Verify

- Always:
  - `pnpm test:related .pi/extensions/thinking-scrub/command/scrub.test.ts .pi/extensions/thinking-scrub/scrub/units.test.ts`
  - `pnpm typecheck`
  - `pnpm lint`
  - `pnpm format:check`
  - `! grep -E 'off なら writeEnabled\(false\) が 1 回呼ばれ|on なら writeEnabled\(true\) が 1 回呼ばれ' .pi/extensions/thinking-scrub/command/scrub.test.ts`
  - `! grep -E 'show なら writeShow\(true\) が 1 回呼ばれ|hide なら writeShow\(false\) が 1 回呼ばれ' .pi/extensions/thinking-scrub/command/scrub.test.ts`
  - `test "$(grep -c 'on と off は writeEnabled を 1 回呼び' .pi/extensions/thinking-scrub/command/scrub.test.ts)" = 1`
  - `test "$(grep -c 'show と hide は writeShow を 1 回呼び' .pi/extensions/thinking-scrub/command/scrub.test.ts)" = 1`
  - `! grep -E '12 単位のランなら最頻の 3 文|1 単位の周期ならその 1 文だけ' .pi/extensions/thinking-scrub/scrub/units.test.ts`
  - `test "$(grep -c '周期が 3 以下なら、その周期の文だけを返す' .pi/extensions/thinking-scrub/scrub/units.test.ts)" = 1`
- Added: other — `pnpm test:run .pi/extensions/thinking-scrub` で件数を数え、140 から減った件数を ## Notes に書く

## Notes

### Slice 1: 本当に気づかれないテストの削除

- Findings:
- Unplanned:
- Commit:
- Stopped:

### Slice 2: 同じ分岐を確かめる組の統合

- Findings:
- Unplanned:
- Commit:
- Stopped:

### Cleanup: <what it cleaned>

- Findings:
- Unplanned:

## Work Review

### Round 1

- Stale:
- Unlisted:
- Gaps:
- Unproven:
- Noise:
- Doubts:

## Acceptance

- Ran:
- Findings:
- Doubts:
