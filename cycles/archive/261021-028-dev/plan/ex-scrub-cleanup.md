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
  - なし
- Unplanned:
  - なし
- Commit: 14c95f5 consult(ex-scrub-cleanup): single command write path

### Slice 2: 空になる差し替えを止める

- Findings:
  - なし
- Unplanned:
  - なし
- Commit: 8dff5c7 consult(ex-scrub-cleanup): skip blank scrub results

### Slice 3: 統合: thinking-scrub が緑のまま

- Findings:
  - なし
- Unplanned:
  - なし
- Commit: 9a491a8 consult(ex-scrub-cleanup): pass full checks for thinking-scrub

### Test cleanup

- Dropped: なし（単一書き込み化で消えた二重書き込みの枝を数える test は元から無く、空差し替え止めで消えた空置換を期待する test も無かった。新規の全消し 3 件は fixture と主張が重ならない）
- Suite: 65 tests, `test:run` と `typecheck` と `lint` と `format:check` は緑

## Review

### Round 1

- Stale:
  - なし
- Unlisted:
  - なし
- Gaps:
  - なし
- Unproven:
  - なし
- Doubts:
  - なし

## Acceptance

- Ran:
  - `pnpm test:run .pi/extensions/thinking-scrub` → exit 0（65 件）
  - `pnpm test:run` → exit 0（50 ファイル 838 件）
  - `pnpm typecheck` → exit 0（root: ok、.pi: ok）
  - `pnpm lint` → exit 0
  - `pnpm format:check` → exit 0
  - 3 つの振る舞いを壊して、plan の検査が赤になることを確かめて戻した。
    - `scrub/message.ts` の空白の guard を外す → `本文が 1 つの区間だけ → undefined` と `本文が区間と空白だけ → undefined` が赤。
    - `index.ts` の `writeEnabled` を空にする → `コマンド off` と `コマンド on` が赤。
    - `scrub/message.ts` の `removed += scrubbed.removed` を `+= 1` にする → 最初は緑だった（下の Findings）。直した後は `2 ブロックのうち片方が全部区間` が赤。
- Findings:
  - `removed += 1` に壊しても緑だった。混在 case の畳まれるブロックが区間 1 つだけで、数え間違いを区別できていなかった。
    - fixed: その case のブロックを区間 2 つに変え、`removed` が 2 であることを固めた（`5f39cce`）。壊すと赤になることを確かめた。
- Doubts:
  - なし
