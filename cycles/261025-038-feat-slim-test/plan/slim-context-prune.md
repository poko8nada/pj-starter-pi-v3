# PLAN `slim-context-prune`

- No: 01

## Files

```text
.pi/
  extensions/
    context-prune/
      apply/
        drafts.test.ts       update
      command/
        prune.test.ts        update
      doc.test.ts            update
      entry/
        data.test.ts         update
        render.test.ts       update
      format/
        count.test.ts        drop
      index.test.ts          update
      prune/
        collect.test.ts      update
        judge.test.ts        update
        plan.test.ts         update
        ports.test.ts        update
        run.test.ts          update
      settings/
        read.test.ts         update
        schema.test.ts       update
test/
  pi-fixture.ts
  prune-fixture.ts           add
```

## Slices

## 1.設定と記録

### Types

なし

### Steps

1. `test/prune-fixture.ts`:
   - 設定の JSON、`custom` のエントリ、prune の記録を工場で作る。期待値は `defaultSettings()` と工場に渡した値から取る。
   - pi の `usage` とメッセージは `test/pi-fixture.ts`（`slim-thinking-scrub` が作る）から読む。同じ物を作らない。
   - 印の文（`markerText`）を 1 か所に集める。
   - 値と文字列を組み立てるだけで、プロセスも FS も開かない。テストの外から読まれても、何も起きずに止まらない。
2. `.pi/extensions/context-prune/format/count.test.ts`:
   - 削除する。`toLocaleString('ja-JP')` の出力を写しているだけで、桁区切りは Node の ICU が保証する。
3. `.pi/extensions/context-prune/settings/schema.test.ts`:
   - 入力と期待する設定を組にした表を作り、断言は表の値から取る。
   - (empty) `{}` → 既定と同じ。
   - (boundary) `ratio` は 0.2 と 0.8 を通し、0.19 と 0.81 を拒む。
   - (boundary) `threshold` は 0 と 1 を通し、1.1 を拒む。
   - (boundary) `rearmRatio` は 0.001 と 0.999 を通し、0 と 1 を拒む。
   - (boundary) `recentTokens` は 1 を通し、0 と 1.5 を拒む。
   - (error) 型違い（`enabled: "yes"`、`classifier.allowPaid: 1`、`provider` が数値）→ broken。
   - (error) `classifier.models` の要素に知らないキー → broken。
   - (error) 空の `classifier.models` / 空の `marker` → broken。
   - (error) 知らないキー → broken で、理由にそのキーが入る。
   - (error) JSON でない → broken で、理由にその旨が入る。
   - 落とす: 「既定に summaryTokens が無い」「既定に maxQuestions が無い」（型が保証する前提）。
   - 落とす: 「`{"summaryTokens": 2000}` → broken」「`{"maxQuestions": 40}` → broken」（知らないキーのケースと同じ仕様）。
   - 落とす: 「既定が enabled 真・しきい値・印・分類器 2 件を持つ」（既定は `defaultSettings()` が持ち、他のケースが前提にする）。
4. `.pi/extensions/context-prune/settings/read.test.ts`:
   - (happy) ファイルが無い → ok で既定。期待値は `defaultSettings()` から。
   - (error) JSON でないファイル → broken。
   - (happy) `enabled` を false に書いて読み、true に書き換えて読み直す → それぞれの値。
   - 落とす: 「拡張の実在の `settings.json` を読む → ratio 0.5・classifier 2 件」（リポジトリの設定値の写しで、設定を変えれば誰でも気づく）。
5. `.pi/extensions/context-prune/command/prune.test.ts`:
   - 状態の行は工場の設定と記録から組み、断言に文を書かない。
   - (empty) `''` → status。
   - (happy) `on` / `off` / `now` → それぞれの命令。
   - (happy) `' on '` → 前後の空白を落として on。
   - (error) `'ON'` / `'on now'` / `'stop'` → 使い方。
   - (happy) ファイルが無い状態で `on` → `{ enabled: true }` ができて ok。
   - (happy) `{ ratio: 0.6 }` に `off` → ratio が残り、enabled が偽で ok。
   - (error) `'{'` に `on` → failed で、ファイルは `'{'` のまま。
   - (error) `'[]'` に `on` → failed で、ファイルは `'[]'` のまま。
   - (happy) 既に `enabled: true` で `on` → ok で同じ内容。
   - (happy) 状態の 5 行（prune、ratio、last、dropped、failures）を出す。
   - (empty) 直近のパスが無い → last と dropped の行を出さない。
   - (happy) off・ratio 0.6・failures 2・直近パスあり → 5 行。
   - (error) `lastFailure` あり → 最後の失敗の行に経過秒と理由。
   - 落とす: 「`lastFailure` なし → 失敗の行が出ない」（直近のパスが無いケースと同じ、無い側の仕様）。

### Verify

- Always:
  - 既定の 5 つ
- Added: なし

## 2.候補の選別

### Types

なし

### Steps

1. `.pi/extensions/context-prune/entry/data.test.ts`:
   - エントリは工場で作り、期待値は工場に渡した値から取る。
   - (happy) 正しい `custom` の 2 件 → 2 件、エントリの順。
   - (empty) `customType` が違う / `type` が message → 0 件。
   - (error) `data` が欠けている → 0 件。
   - (error) 数値が 0 以上の整数でない（文字列、負、`Infinity`）→ 0 件。
   - (error) `dropped` が配列でない → 0 件。
   - (happy) `droppedTokens` を持たない古い記録 → 0 件。
   - (error) 正しい記録と壊れた記録が混ざる → 正しい物だけを残す（途中で打ち切らない）。
2. `.pi/extensions/context-prune/entry/render.test.ts`:
   - 期待する文は `formatCount` と渡した値から組む。
   - (happy) 折りたたみ → 前後のトークン数と展開キーを出す。
   - (happy) 展開 → 見出し、要約、秒数の順。
   - (empty) 落としたトークンが 0 → 前と後が同じ。
   - (empty) 展開で dropped 0 件 → 省略 0 件 / 0 トークン / 0 文字。
   - (happy) 偽の Theme で `render(80)` → 折りたたみに印と前後のトークン。
   - 落とす: 「peerDependencies が `*`、devDependencies が `^1.3.0`」（`package.json` の写しで、版を上げれば誰でも気づく）。
   - 落とす: 「round 64 / 71 の独立した 2 本」（上の 0 のケースに畳む）。
3. `.pi/extensions/context-prune/prune/collect.test.ts`:
   - (happy) 古い `toolResult` と直近の 1 件 → 候補は古い 1 件。
   - (boundary) 直近の合計が `recentTokens` ちょうど → 境目のエントリは直近に残る。
   - (happy) `recent` が直近 2 件を古い順に持ち、`tokens` が全件の合計。
   - (empty) エントリが空 → 候補 0、tokens 0。
   - (empty) 古いエントリが user と assistant だけ → 候補 0。
   - (happy) `done` にある id は落ち、未知の id は他を変えない。
   - (error) 対応する `toolCall` が無い → `args` は空文字で、候補には残る。
   - (boundary) 引数が 199 / 200 / 201 文字 → 200 までそのまま、201 は 200 に切れる。
   - (empty) 結果が空の text ブロック → `chars` 0 で候補に残る。
   - (happy) text 2 つと `toolCall` が混ざる → text だけを連結。
   - (empty) text ブロックが無い → 空文字。
   - (happy) 長い結果 → 先頭 500 と末尾 500 を残し、注記を挟む。
   - (boundary) 1000 文字ちょうど → 注記なしで全文。
   - (happy) 候補の `excerpt` は結果の抜粋。
4. `.pi/extensions/context-prune/prune/judge.test.ts`:
   - 期待する文は候補の `label` と `view` から組む。
   - (happy) 候補 2 件 → `questions` の鍵が `keep_a` と `keep_b`、`state` は summary だけ。
   - (happy) `keep_a` の criteria が keep と drop を持つ。
   - (happy) 質問の instructions と criteria に日本語が含まれない。
   - (happy) 要約の view を `state` に入れ、候補の抜粋は質問文に付ける。
   - (empty) 候補 0 件 → `questions` が空で、`state` は summary だけ。
   - (happy) 抜粋 1000 文字は 500 文字より大きい。
   - (happy) 見出しのある要約 → Goal と Progress と Next Steps だけ残す。
   - (empty) 見出しが無い / その 3 つが無い → 全文。
   - (happy) 字数の見積もり → 単調増加。
   - (empty) 空 → 0。
   - (happy) `probabilities` の keep を読み、threshold で真偽を決める。
   - (boundary) keep がちょうど 0.5 → 真、0.49 → 偽。
   - (empty) 答えが無い候補 → keep 真、`keepProbability` 0。
   - (happy) 大きい候補 100 件 → 予算で 2 束以上に割れる。
   - (boundary) 候補 1 件が予算を超える / 予算が 1 件分より小さい → 1 件だけの束。
   - (empty) 空 → 空。
5. `.pi/extensions/context-prune/prune/plan.test.ts`:
   - (happy) 有効・threshold 以上・候補あり → run。
   - (error) 無効 → disabled。
   - (empty) 候補 0 → empty。
   - (boundary) tokens / 枠がちょうど ratio → run、未満 → below-ratio。
   - (happy) `lastTokens` が無い → 初回として run。
   - (error) 割合未満で `lastTokens` も無い → below-ratio。
   - (boundary) 前回から枠の 1 割が増えていなければ cooling、増えていれば run。
   - (error) tokens が null → unknown。
   - (error) 走っている → running。
   - (error) 無効と走行中が同時 → disabled。
   - 落とす: 「割合以上 + `lastTokens` 未定義 → run」（初回のケースと同じ仕様）。
6. `.pi/extensions/context-prune/prune/ports.test.ts`:
   - 期待する値は要約の入力と `usage` から取る。
   - (error) 設定破損 / registry かモデルが無い / 認証が取れない / 要約が投げる / 要約が空 → どれも failed。
   - (happy) ok のとき要約と usage を返し、pi の要約関数にメッセージと session id を渡す。
   - (happy) 要約から割合を逆算し、下限と上限で代替する。
   - (happy) `stopReason` が error → 次の候補へ進む。
   - (error) `aborted` → 止まる。
   - (error) 答えの形が違う → 次の候補へ進む。
   - (error) `allowPaid` が false で有料しか無い → failed。
   - 落とす: 「-1 と 1001 → 1252」（0 のケースと同じ代替の計算）。
7. `.pi/extensions/context-prune/prune/run.test.ts`:
   - (happy) 要約と答え → done、dropped と kept の件数。
   - (happy) 束が 2 つ以上に割れる。
   - (happy) 要約の view が大きい → `fixed` が効いて束が増え、`state` に view が入る。
   - (error) 2 束目の classify が failed → failed。
   - (error) summarize が failed / 空文字 → failed。
   - (empty) 候補 0 件 → summarize を呼ばず done、dropped 0、kept 0、summary は空。
   - (error) 1 件の答えが欠けている → その候補は keep で done。
   - (happy) 201 文字を 2 件落とす → `droppedTokens` は合計してから割った値。

### Verify

- Always:
  - 既定の 5 つ
- Added: なし

## 3.配線と記録

### Types

なし

### Steps

1. `.pi/extensions/context-prune/apply/drafts.test.ts`:
   - (happy) 3 件の drop、`edited` 空 → 3 つの draft。内容は `markerText` から組む。
   - (happy) 印の置き換え。数は `formatCount` で組み、直書きしない。
   - (happy) 2 つのパスが同じ id → draft は 1 つで、最初のパスの `chars`。
   - (empty) `edited` に全部入っている → draft 0。
   - (empty) パスが無い → draft 0。
2. `.pi/extensions/context-prune/doc.test.ts`:
   - (happy) `DEFINITION.md` に context-prune の行が 1 件。
   - 落とす: 「`README.md` に 3 つの語が各 1 件以上」（先頭の一覧の行だけで満たされ、本文を消しても緑のまま）。
   - (happy) Settings の表の `ratio` と `recentTokens` の既定が `defaultSettings()` と同じ。
   - 落とす: 「`README.ja.md` に … が各 1 件以上」（汎用の語で、欠けても気づかれない）。
   - 落とす: 「拡張の README に 4 つの見出しが各 1 件」（見出しの写し）。
3. `.pi/extensions/context-prune/index.test.ts`:
   - 通知と印の文は工場の印と件数から組む。
   - (happy) `turn_end`、`agent_before_settle`、prune コマンド、1 つの renderer を登録する。
   - (empty) gate が below-ratio（枝にパスが無い）→ `undefined`。
   - (happy) `turn_end` が裏のパスを始め、flush のあと `appendEntry` が 1 回。
   - (error) 走っている間の `now` → 通知に running、`appendEntry` は増えない。
   - (error) 設定が壊れている → 2 回の `turn_end` で通知が 1 回だけ。
   - (empty) `getContextUsage()` が `undefined` → 何も始まらない。
   - (happy) パスが積まれた枝 → `context_edit` を返し、同じ境界の 2 回目は `undefined`。
   - (happy) 次の境界で `context_edit` が 1 件、`targetId` が落とした結果の id。
   - (empty) 同じ境界の 2 回目 → `entries` が空。
   - (happy) 走行中の `turn_end` → 裏の開始を抑え、drafts は返す。
   - (happy) `agent_before_settle` → 同じ `context_edit`。
   - (error) classify が失敗する → `appendEntry` されず、`failures` が 1。
   - (error) 失敗 → `lastFailure` に `at` と `tokens` と理由が入る。
   - (happy) 失敗の直後で tokens が変わらない → 要約を呼ばない。
   - (boundary) 失敗のあと枠の `rearmRatio` 以上増えた → 要約を呼ぶ。
   - (happy) 成功のあと失敗 → 失敗の tokens から冷える。
   - (happy) 失敗のあと成功 → 成功の `tokensBefore` から冷える。
   - (empty) 文脈に効いたあとの境界 → `entries` が空。
   - (happy) classify は answers から type と probabilities を取り出す。
   - (happy) idle の `now` → 1 パス走り、`appendEntry` と状態通知。
   - (error) `now` で分類が失敗 → 失敗の通知と `lastFailure` の記録。
   - (happy) status → 状態の 5 行を通知。
   - (happy) on と off → 設定ファイルの `enabled` が切り替わる。
   - (error) 壊れた設定で on → 通知に理由が出て、ファイルが変わらない。
   - (error) 壊れた設定で `now` → 無効の旨を通知し、何も積まない。
   - (empty) 候補 0 → 何も無い旨の通知。

### Verify

- Always:
  - 既定の 5 つ
- Added: なし

## Notes

### Slice 1: 設定と記録

- Findings:
- Unplanned:
- Commit:
- Stopped:

### Slice 2: 候補の選別

- Findings:
- Unplanned:
- Commit:
- Stopped:

### Slice 3: 配線と記録

- Findings:
- Unplanned:
- Commit:
- Stopped:

## Review

### Plan review

- `settings/schema.ts:69` の、`classifier.models` の要素の知らないキーをはじく分岐が、どの step にもありませんでした。
  - fixed: `(error)` のケースを足した。
- `prune/judge.test.ts:51` の、`instructions` に `need` が入ることを直書きで見ているのは、製品の文言の写しです。
  - fixed: criteria が keep と drop を持つことだけを見るケースに直した。
- `entry/data.ts:91` の、正しい記録と壊れた記録が混ざる場合の選別が、落とされていました。
  - fixed: 「混ざる → 正しい物だけを残す（途中で打ち切らない）」をケースとして戻した。
- `doc.test.ts:37` の `README.md` の「1 件以上」は、先頭の一覧の行だけで満たされるため、本文を消しても緑のままでした。
  - fixed: 落とすことにした。
- `apply/drafts.test.ts:60` の `1,234` と `1,234,567` は、`formatCount` から組むべき数でした。
  - fixed: 「数は `formatCount` で組み、直書きしない」に直した。
- `index.ts:312` の、壊れた設定で `now` を打つ分岐が、どの step にもありませんでした。
  - fixed: 「無効の旨を通知し、何も積まない」を足した。

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
