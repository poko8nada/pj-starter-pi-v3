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

- Findings: なし
- Unplanned: なし
- Commit: 2d1c154 consult(thinking-scrub): remove unnoticeable tests
- Stopped:

### Slice 2: 同じ分岐を確かめる組の統合

- Findings: なし
- Unplanned: broken の off テスト名が Verify の除外パターンに触れたため、意味を変えずに `broken 設定でも off は writeEnabled(false) を 1 回呼び〜` へ改名した
- Commit: f2ea1b4 consult(thinking-scrub): merge same-branch tests
- Stopped:
- Count: pnpm test:run .pi/extensions/thinking-scrub は 132 件で、140 から 8 件減（Slice 1 で 5 件減、Slice 2 で 3 件減）

### Cleanup: followUpText の人工的な切り詰めテストの削除

- Findings: なし
- Unplanned: なし
- Count: pnpm test:run .pi/extensions/thinking-scrub は 131 件で、140 から 9 件減（Slice 1 で 5 件減、Slice 2 で 3 件減、Cleanup で 1 件減）

## Work Review

### Round 1

- Stale:
  - なし — 削除後の未使用 import・旧テスト名の残存・README の記述矛盾を確かめたが stale はなかった。
- Unlisted:
  - なし — diff は Files の更新 6 件のみで settings/schema.test.ts は不変であり Files 外の変更は計画 md の Notes 記入以外になかった。
- Gaps:
  - `.pi/extensions/thinking-scrub/state/cell.test.ts:24` は `addFailure` の戻り値を捨てて入力不変のみを見て `.pi/extensions/thinking-scrub/index.test.ts:781` は `failures==1` のみを見て `removed/lastAt` の保持を見ないため、削除された `addFailure すれば failures が 1 増え他が変わらない` のうち `他が変わらない` がどの検査にも運動せず `removed` を壊しても全緑になる。
    fixed: `state/cell.test.ts` に `addFailure は failures を 1 増やし removed と lastAt を保つ` を追加し、`removed`/`lastAt` の保持を検査した。
- Unproven:
  - なし — `.pi/extensions/thinking-scrub/command/scrub.test.ts:55` と `.pi/extensions/thinking-scrub/scrub/units.test.ts:217` は片方の分岐を壊せば失敗するため proven であることを確かめた。
- Noise:
  - なし — 統合後の表明は工場関数と印定数だけを使い魔数や硬直文字列の表明はなく、削除された `followUpText(sample,10)` の人工値も残っていないことを確かめた。
- Doubts:
  - `pnpm test:run/typecheck/lint/format` は subagent-guard で拒否されて実行できず Verify の Always は grep による文字列確認のみで代替した。
  - 周期 2 は名称「3 以下」に含まれるが前後とも未検査であり、同一分岐のため Test cases に従い finding にしなかった。

### Round 2

- Stale: なし — Round 1 の `fixed:` は `Gaps` の 1 件だけであり、`Stale` には `fixed:` がないため対象外である。
- Unlisted: なし — 同じ理由により、`Unlisted` には `fixed:` がないため対象外である。
- Gaps: 修正を確認した — `.pi/extensions/thinking-scrub/state/cell.test.ts:16-23` の「`addFailure は failures を 1 増やし removed と lastAt を保つ`」が、入力 `{ removed: 4, lastAt: 100, failures: 0 }` に対して `addFailure` の戻り全体を `{ removed: 4, lastAt: 100, failures: 1 }` と `toEqual` で断言しているため、Round 1 の指摘（:125 の `removed` を壊しても全緑）は閉じている。根拠は、実装 `.pi/extensions/thinking-scrub/state/cell.ts:39-41` が `{ ...status, failures: status.failures + 1 }` と `removed`/`lastAt` を引き継ぐ構造であり、`removed` を 0 化・加算したり `lastAt` を `null` 化・上書きしたりすればこの断言が失敗し、回帰を検出できることである。
- Unproven: なし — 同じ理由により、`Unproven` には `fixed:` がないため対象外である。
- Noise: なし — 同じ理由により、`Noise` には `fixed:` がないため対象外である。
- Doubts:
  - Doubts: なし — `fixed:` 以外を見ないため、新たな疑義は出さない。

## Acceptance

- Ran: `pnpm test:run`（62 本、778 件）と `pnpm typecheck` をワークツリーで実行し、緑。plan の `Always` は各スライスの `Verify` で実行済み。`Added` はなし。この plan は振る舞いを足さずテストを削るため、壊して赤を確かめる対象はない。差分を読み、テストの削除と統合だけであることを確かめた。
- Findings: なし
- Doubts: なし
