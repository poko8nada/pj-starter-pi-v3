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
   - `it('live.maxAborts に達したら scanned が進み enabled が呼ばれない')` を削除する。同じ理由である。`it('live.maxAborts を 0 にした設定なら idle になる')` は、外から見える振る舞いを持つため残す。
3. `.pi/extensions/thinking-scrub/scrub/detect.test.ts`:
   - `it('結果にもう一度かければ removed が 0 になり本文が同一になる')` を削除する。本番では1回だけ適用するため、2回目の適用は起こらない。
4. `.pi/extensions/thinking-scrub/state/cell.test.ts`:
   - `it('addFailure すれば failures が 1 増え他が変わらない')` を削除する。`failures` は `command/scrub.ts` の表示に使われない。

### Verify

- Always:
  - `pnpm test:related .pi/extensions/thinking-scrub/index.test.ts .pi/extensions/thinking-scrub/live/guard.test.ts .pi/extensions/thinking-scrub/scrub/detect.test.ts .pi/extensions/thinking-scrub/state/cell.test.ts`
  - `pnpm typecheck`
  - `pnpm lint`
  - `pnpm format:check`
  - `! grep -n '作成時の 1 回と message_end の 1 回\|無効のときは間隔が来たスキャン\|live.maxAborts に達したら scanned が進み\|結果にもう一度かければ\|addFailure すれば' .pi/extensions/thinking-scrub/index.test.ts .pi/extensions/thinking-scrub/live/guard.test.ts .pi/extensions/thinking-scrub/scrub/detect.test.ts .pi/extensions/thinking-scrub/state/cell.test.ts`
  - `grep -c 'live.maxAborts を 0 にした設定なら idle' .pi/extensions/thinking-scrub/live/guard.test.ts` が 1 である
- Added: なし

## 2.同じ分岐を確かめる組の統合

### Types

なし

### Steps

1. `.pi/extensions/thinking-scrub/command/scrub.test.ts`:
   - `it('off なら writeEnabled(false) が 1 回呼ばれ off の行が返る')` と `it('on なら writeEnabled(true) が 1 回呼ばれ on の行が返る')` を1本に統合する。統合したテストは、`on` と `off` が `writeEnabled` を1回呼び、その行を返すことを確かめる。
   - `it('show なら writeShow(true) が 1 回呼ばれ writeEnabled は呼ばれず show の行が返る')` と `it('hide なら writeShow(false) が 1 回呼ばれ writeEnabled は呼ばれず hide の行が返る')` を1本に統合する。統合したテストは、`show` と `hide` が `writeShow` を1回呼び、`writeEnabled` を呼ばないことを確かめる。
2. `.pi/extensions/thinking-scrub/scrub/units.test.ts`:
   - `it('12 単位のランなら最頻の 3 文で sampleChars 以下になる')` と `it('1 単位の周期ならその 1 文だけになる')` を1本に統合する。統合したテストは、周期が 3 以下なら、その文だけを返すことを2つの周期数で確かめる。

### Verify

- Always:
  - `pnpm test:related .pi/extensions/thinking-scrub/command/scrub.test.ts .pi/extensions/thinking-scrub/scrub/units.test.ts`
  - `pnpm typecheck`
  - `pnpm lint`
  - `pnpm format:check`
  - `grep -c 'off なら writeEnabled(false) が 1 回呼ばれ\|on なら writeEnabled(true) が 1 回呼ばれ' .pi/extensions/thinking-scrub/command/scrub.test.ts` が 0 である
  - `grep -c 'show なら writeShow(true) が 1 回呼ばれ\|hide なら writeShow(false) が 1 回呼ばれ' .pi/extensions/thinking-scrub/command/scrub.test.ts` が 0 である
  - `grep -c 'on と off は writeEnabled を 1 回呼び' .pi/extensions/thinking-scrub/command/scrub.test.ts` が 1 である
  - `grep -c 'show と hide は writeShow を 1 回呼び' .pi/extensions/thinking-scrub/command/scrub.test.ts` が 1 である
  - `grep -c '周期が 3 以下なら、その文だけを返す' .pi/extensions/thinking-scrub/scrub/units.test.ts` が 1 である
- Added: なし

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
