# Close 033

## Collected

### record-delivery (ADR 01)

1. 377 / Review Round 1 / `isWaiting` の `record.delivered !== undefined → false`（`.pi/extensions/consult/run/log.ts:291`）に名指しの試験が無い。現行の書き手は両持ち行（`ended`＋`notice`＋`delivered`）を書かないため、到達不能な防御か死枝かの切り分けが付かなかった。
   - Doing: 完了の行が印も持つ場合の判定を書く。
   - Left: 書き手がその形の行を作らないため、到達不能か死枝かを切り分けずに残した。
   - Cost: 結果は変わらない。試験が無いので、行を消しても緑のまま。

2. 379 / Review Round 1 / 印だけの行のみの入力に対する `listText`（`.pi/extensions/consult/tool/subagents.ts:179`）の専用試験が無い。
   - Doing: 一覧の行が 0 本の時の文言を決める。
   - Left: `[]` の試験はあり、印のみ 1 件は実入力で起きないと判断した。
   - Cost: 印のみの入力で文言が変わるが、その入力は作られない。

3. 381 / Review Round 1 / 私的な `deliverUnread`（`.pi/extensions/consult/index.ts:67`）の `session_start` 配線を叩く試験が無い。
   - Doing: セッションの起動時に、未読の報告を渡す。
   - Left: 論理は `flushPending` と同形で、Verify の名指しは tick 側だった。
   - Cost: 配線が外れても 5 秒後の tick が渡す。遅れだけが見え、試験は緑。同じ処理が 2 か所にあった。

4. 401 / Review Round 2 / `tool/consult.ts:101` に「走っている間だけ」の文言が残るが、pid 欄の注で Sound 節とは別物。
   - Doing: 走っているサブエージェントの pid を持つ。
   - Left: メモリー上の `RunningSubagent` の話で、記録の話ではない。
   - Cost: なし。注は今の型に合っている。

5. 402 / Review Round 2 / `deliveredKeys` は集合なので印の重ね書きでも大きさは 1 のままだが、行数 2 の断定が重複を落とす。
   - Doing: 印の行から、渡し済みの走行の集合を作る。
   - Left: 集合の大きさでは重複を検出できないので、試験は行数で見ている。
   - Cost: なし。重複した印の行は残るが、判定は変わらない。

6. 403 / Review Round 2 / 作業ツリー現物の確認のみ（commit 差分の照合はしていない）。
   - Doing: Round 1 の修正を確認する。
   - Left: レビューは作業ツリーを見た。commit の差分は見ていない。
   - Cost: なし。merge の前に acceptance が差分を含めて確かめている。

### ex-session-start-flush (ADR 未特定)

7. 53 / Review Round 1 / Verify の「2 行」は、厳密には注（`.pi/extensions/consult/index.ts:101`）と `startTick` の呼び出し（`:110`）にも当たり、4 行出る。`_no case_` が行数えを対象外にしているため、存在確認として通る。
   - Doing: `grep` の出力を読み、`deliverUnread` が無いことと `session_start` の呼び出しがあることを確かめる。
   - Left: 行数を数える check ではなく、行の存在を読む check にした。
   - Cost: なし。check は `session_start` の行の有無を見ており、行数は見ていない。

## Triage

- 1: dropped (ADR 01 / `Unit.subagent-consult`): 書き手が印も持つ完了の行を作らないため、死枝か防御かは決まらない。結果は変わらず、試験を足す重さに見合わない。
- 2: dropped (ADR 01 / `Unit.subagent-consult`): 印だけの行は実入力で作られない。`[]` の試験が文言の分岐を覆っている。
- 3: done cf5d5ad (ADR 01 / `Unit.subagent-consult`): `ex-session-start-flush` で `deliverUnread` を消し、`session_start` が `flushPending` を呼ぶ形にした。処理が 1 つになった。
- 4: dropped (ADR 01 / `Unit.subagent-consult`): `tool/consult.ts:101` の注は、メモリー上の `RunningSubagent.pid` について今も正しい。
- 5: dropped (ADR 01 / `Unit.subagent-consult`): 試験は印の行数を見ており、重複した印を落とせる。
- 6: dropped (ADR 01 / `Unit.subagent-consult`): レビューの見た範囲の話で、製品の穴ではない。acceptance が差分を見ている。
- 7: dropped (ADR 01 / `Unit.subagent-consult`): check の書き方の話で、見ているのは行の存在。行数は見ていない。
