# PLAN `slim-thinking-scrub`

- No: 01

## Files

```text
.pi/
  extensions/
    thinking-scrub/
      command/
        scrub.test.ts        update
      index.test.ts          update
      live/
        guard.test.ts        update
      scrub/
        detect.test.ts       update
        message.test.ts      update
        units.test.ts        update
      settings/
        read.test.ts         update
        schema.test.ts       update
      state/
        cell.test.ts         update
test/
  pi-fixture.ts              add
  scrub-fixture.ts           add
```

## Slices

## 1.検出と畳み込み

### Types

なし

### Steps

1. `test/pi-fixture.ts`:
   - pi の `usage` と assistant のメッセージを工場で作る。`assistantMessage()` をここに置く。`slim-context-prune` もこれを読む。
   - 値と文字列を組み立てるだけで、プロセスも FS も開かない。テストの外から読まれても、何も起きずに止まらない。
2. `test/scrub-fixture.ts`:
   - thinking の本文を工場で作る。`degenerate()`、`loopSentence()` をここへ移す。
   - 通知文と指示文の印（`thinking-scrub: removed`、指示の見出し）を 1 か所に集める。
   - 値と文字列を組み立てるだけで、プロセスも FS も開かない。テストの外から読まれても、何も起きずに止まらない。
3. `.pi/extensions/thinking-scrub/scrub/units.test.ts`:
   - (happy) 工場の 2 行の英語 → 4 単位で offset を保つ。
   - (happy) `。` と `！` の日本語 1 行 → その印で分かれ、offset を保つ。
   - (happy) フェンス囲み → 柵の行と中身が不透明。
   - (happy) 表の行と `diff --git` の行 → 不透明。
   - (boundary) 略語で終わる行 → 略語が 1 単位になり、前後がずれない。
   - (happy) `MIN_CYCLES` 周期ぶんの 3 文 → 周期 3 の run が 1 つ。
   - (happy) 周期 6 と 12 が重なる並び → 周期 6 の run が 1 つ。
   - (boundary) `MIN_CYCLES - 1` 周期 → run が無い。
   - (boundary) `MIN_CYCLES` 周期でも `MIN_RUN_CHARS` 未満 → run が無い。
   - (boundary) `MAX_PERIOD_UNITS + 1` の周期 → run が無い。
   - (happy) 柵を含む繰り返し → run が無い。
   - (empty) 普通の文章 → run が無い。
   - (happy) 12 単位の run の `sampleOf` → 最頻の 3 文で `SAMPLE_CHARS` 以下。
   - (boundary) 3 文が `SAMPLE_CHARS` を超える → `SAMPLE_CHARS` で切れる。
   - (happy) 1 単位の周期の `sampleOf` → その 1 文。
4. `.pi/extensions/thinking-scrub/scrub/detect.test.ts`:
   - (happy) 離れた 2 か所 → 2 区間で昇順。
   - (happy) 区間が改行 2 つ / 改行 1 つ / 改行なし を含む → 繋ぎ目にその改行を戻す。
   - (happy) `the *` の 12 回 → 1 区間で、並びが消える。
   - (happy) `foo` + 5 回 + `bar` → 1 区間で `foo bar`。
   - (boundary) 周期 4 文字は 5 回で消え 4 回では消えず、30 文字の周期は 3 回で消え 2 回では消えない（周期の長さと繰り返しの数は別々に効く）。
   - (boundary) 周期 3 文字は消さず、120 文字は消し、121 文字は消さない。
   - (empty) 空文字 → 消さず、本文が同じ。
   - (happy) 反復の無い文章 → 消さない。
   - (happy) 境目の前後がどちらも非空白 → 空白 1 個を入れる。片方が空白 → 足さない。
   - (happy) 区間が本文の先頭 / 末尾 → 詰めるだけで改行を足さない。
   - (happy) 結果にもう一度かける → 消さず、本文が同じ。
   - (happy) 文ループ 3 周期 → 最初の 1 周期だけ残る。
   - (happy) 各周期が文字ループを持つ文ループ → 文が先で `removed` が 2。
   - (happy) 柵を含む文ループ → 消さない。
   - (empty) 3 周期でも 400 文字未満 → 消さない。
   - (happy) 消える周期の改行 → 繋ぎ目に同じ改行を戻す。
   - 落とす: 「同じ 30 文字を 2 回」「周期 4 文字を 5 回 / 4 回」「周期 3 / 120 / 121 文字」「空文字」の独立した 6 本（上の境目のケースに畳む）。
   - 落とす: 「周期 4 文字を 5 回（20 文字）」のうち 20 文字という数（`MIN_RUN_CHARS` のケースが押さえる）。
5. `.pi/extensions/thinking-scrub/scrub/message.test.ts`:
   - (happy) `reasoning_content` の退化 → 差し替えが返り、区間を含まない。
   - (happy) `thinkingSignature` が `reasoning` / `reasoning_text` → 対象。
   - (error) `thinkingSignature` が無い / JSON 文字列 → 対象外。
   - (empty) 対象ブロックが無い配列 → `undefined`。
   - (error) `redacted` が真 → 対象外。
   - (error) `role` が assistant 以外 → 対象外。
   - (error) `content` が配列でない assistant → 対象外。
   - (happy) 2 ブロックのうち 1 つだけ退化 → その 1 つだけ書き換わる。
   - (happy) 差し替えても `thinkingSignature`、`usage`、`stopReason`、`timestamp` が同じ。
   - (empty) 本文が 1 つの区間だけ → `undefined`。
   - (happy) 2 ブロックのうち片方が全部区間 → 片方は元のまま、`removed` は畳んだ分。
   - (happy) `chars` は元の長さから畳んだ長さを引いた値。
   - 落とす: 「51 文字が 25 文字に畳まれる → chars は 26」（上の `chars` のケースと同じ仕様で、数だけを写している）。
6. `.pi/extensions/thinking-scrub/live/guard.test.ts`:
   - (happy) `MIN_THINKING` 文字に `MIN_CYCLES` 周期の run → 止め、見本を付ける。
   - (boundary) `MIN_THINKING - 1` 文字 → 止めない。
   - (boundary) `SCAN_EVERY` 未満だけ足す → 止めない。
   - (boundary) `TAIL` の外に run がある → 止めない。
   - (happy) `2 × MIN_THINKING` のあと短い thinking → 走査が戻り、`MIN_THINKING` で止まる。
   - (boundary) `MAX_ABORTS` 回のあと `2 × MIN_THINKING` → 止めない。
   - (happy) 空に戻ると、また止まれる。
   - (happy) 2 回止める → 最新が見本で、1 回だけ取れる。
   - (happy) 指示と見本を含み、長い見本は切れる。

### Verify

- Always:
  - 既定の 5 つ
- Added: なし

## 2.設定と記録

### Types

なし

### Steps

1. `.pi/extensions/thinking-scrub/settings/schema.test.ts`:
   - JSON の入力と期待する設定を組にした表を作り、断言は表の値から取る。
   - (happy) `{"enabled":true}` → `enabled` が真、`show` が既定の真。
   - (empty) `{}` → `{ enabled: true, show: true }`。期待値は表に書き、`defaultSettings()` と比べない（既定ごと変わるのを隠さない）。
   - (happy) `{"enabled":true,"show":false}` → `show` が偽。
   - (happy) `{"enabled":false}` → `enabled` が偽で `show` が真。
   - (error) `{"enabled":` → broken。
   - (error) `{"enabled":"no"}` / `{"show":"yes"}` → broken。
   - (error) `null` / `[]` → broken。
   - (error) 知らない鍵だけの文書 → 無視して既定で ok。
   - 落とす: 「`{"show":false}` → …」の独立した 1 本（`{"enabled":true,"show":false}` と同じ仕様）。
2. `.pi/extensions/thinking-scrub/settings/read.test.ts`:
   - (happy) ファイルが無い → ok で既定。期待値は `defaultSettings()` から取る。
   - (error) ファイルがディレクトリ → broken。
   - (error) 途中で切れた JSON → broken。入力は工場で作る。
3. `.pi/extensions/thinking-scrub/state/cell.test.ts`:
   - (happy) 使われた状態に `addScrub` → `removed` が増え、`lastAt` がその値。
   - (happy) `addFailure` → `failures` が 1 増え、他が変わらない。
   - (empty) `emptyStatus()` → `removed` 0、`lastAt` null、`failures` 0。
   - (empty) `emptyTally()` → `runs` 0、`chars` 0。
   - (happy) 3 つのどれを呼んでも、渡した状態の値が変わらない。
   - (happy) `addTally` を 2 回 → 合計になり、渡した値は変わらない。
   - 落とす: 「`addScrub` を 3 と 2 で 2 回 → 5」（1 回のケースと同じ加算の仕様）。
4. `.pi/extensions/thinking-scrub/command/scrub.test.ts`:
   - 出力の文は工場の印と回数から組み、断言に文を書かない。
   - (happy) `off` → `writeEnabled(false)` が 1 回、off の行。
   - (happy) `on` → `writeEnabled(true)` が 1 回、on の行。
   - (happy) `show` → `writeShow(true)` が 1 回、`writeEnabled` は呼ばれない。
   - (happy) `hide` → `writeShow(false)` が 1 回、`writeEnabled` は呼ばれない。
   - (empty) 空文字と空白だけ → どちらも呼ばれず、状態の行。
   - (error) `foo` → どちらも呼ばれず、使い方の 1 行。
   - (happy) `" off "` → set で偽、`ON` → set で真、`SHOW` → display で真。
   - (happy) `lastAt` が null の状態 → まだ無い旨の行。
   - (happy) `lastAt` が数値の状態 → その時刻の行。
   - (happy) `enabled:false` の status → off と回数と時刻の行。
   - (happy) `show:false` の status → 行に off の印が入る。
   - (error) `broken` の status → 壊れている旨と既定で動いている旨。
   - (error) `broken` の off → `writeEnabled(false)` が 1 回、off の行。
5. `.pi/extensions/thinking-scrub/index.test.ts`:
   - 通知文は回数と `removed` から組み、断言に文を書かない。
   - (happy) `on` が 5 つの事件を登録し、`registerCommand` が 1 回。
   - (happy) 退化した thinking を handler に渡す → 差し替えが返り、区間が消えている。
   - (error) 退化の無い assistant → `undefined`。
   - (error) role が assistant 以外 / 対象でない署名 → `undefined`。
   - (error) `enabled: false` → `undefined`。
   - (error) 設定が壊れている → 既定で差し替え、`failures` は増えない。
   - (happy) 2 回畳む → `removed` が合計。
   - (happy) 1 回の `message_end` → `readSettings` を 1 回。
   - (boundary) `MIN_THINKING` 未満 → `readSettings` を 0 回。以上 → 1 回。
   - (error) `enabled` が偽 → abort しない。
   - (happy) 署名の無い thinking でも run → abort。
   - (happy) `sendMessage` に `customType`、表示、`triggerTurn` が渡る。
   - (error) `aborted: false` → 何も送らない。
   - (empty) `aborted: true` でも pending が無い → 何も送らない。
   - (happy) user で戻り、`MAX_ABORTS` 回のあともまた止まれる。custom では戻らない。
   - (happy) 2 回の `message_end` のあと `agent_end` → notify が 1 回、文は回数から。
   - (empty) 何も消していない `agent_end` → notify を呼ばない。
   - (empty) `show` が偽 → notify を呼ばない。
   - (happy) notify のあと再度 `agent_end` → 2 回目は呼ばない。
   - (happy) notify のあと `message_end` → `agent_end` → もう一度 1 回、その実行の分だけ。
   - (error) `message_end` で例外 → `failures` が 1 増え、`agent_end` は notify を呼ばない。
   - (happy) 改行を含む細切れの退化 → 畳んで 1 行に `removed` 1。
   - (empty) `The **` の 2 回（12 文字）→ `undefined`、notify も呼ばない。
   - (happy) コマンド `off` → 次の `message_end` は `undefined`。
   - (happy) コマンド `on` → 差し替えを返す。
   - (happy) コマンドが引数無し → notify が 1 回、使い方の行。
   - (happy) コマンド `hide` → `show` が偽、`enabled` はそのまま。
   - (happy) コマンド `off` / `on` → 既存の `show:false` が保たれる。
   - 落とす: 「hide を書いた設定で細切れの退化 → 1 行も出ない」（`show` が偽のケースと同じ仕様）。

### Verify

- Always:
  - 既定の 5 つ
- Added: なし

## Notes

### Slice 1: 検出と畳み込み

- Findings: なし
- Unplanned: なし
- Commit: c086709
- Stopped:

### Slice 2: 設定と記録

- Findings:
- Unplanned:
- Commit:
- Stopped:

## Review

### Plan review

- `:79` の「同じ 30 文字を 2 回」を畳むと、繰り返しの数の判定（3 回以上）を外しても緑のままでした。
  - fixed: 境目のケースに「30 文字の周期は 3 回で消え 2 回では消えない」を入れた。
- `:61` の `units.ts` の生の NUL の検査は、振る舞いではなく、起きにくく壊れても気づかれません。
  - fixed: 落とすことにした。
- `scrub/message.ts:13` の `REPLAY_FIELDS` は 3 つですが、`reasoning_text` を運ぶ step がありませんでした。
  - fixed: `reasoning` / `reasoning_text` のケースに広げた。
- `:123` の `{}` を `defaultSettings()` と比べると、既定ごと変わっても緑のままでした。
  - fixed: 期待値 `{ enabled: true, show: true }` を表に書き、既定関数と比べないことにした。
- `index.test.ts:420` の投げる偽物は、外が形を与えた口ではなく、推測で作ったものです。
  - fixed: そのケースを落とすことにした。
- `settings/schema.ts:37` の、知らない鍵を無視する規則を押さえる step がありませんでした。
  - fixed: 「知らない鍵だけの文書 → 無視して既定で ok」を足した。

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
