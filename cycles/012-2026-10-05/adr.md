# ADR 012

## 01: second-opinion

### 01-1: second-opinion.opinion

1. Agenda:
   - Title: 道具の名前をどうするか
   - Proposal: ツールとコマンドを `second_opinion` にする（いまは `opinion`）
2. Highlight:
   - consult の道具は拡張名が前に付く（`consult_run` / `consult_children` / `consult_worktree` / `consult_commit`）。`opinion` は名前だけではどの拡張の物か分からない
   - 011 の plan で `TOOL_NAME = 'opinion'` と決めたのは私で、規則がどこにも無いまま短い形を選んだ。owner の判断は通っていない
   - 011 の作業中、owner が「ツール名がオピニオンなの？」と問い、由来を説明できなかった
3. Research:
   - なし
4. Trial: なし
5. Decision: **accepted**

### 01-2: second-opinion.opinion

1. Agenda:
   - Title: 再開の時に、セッションのどこまでを別モデルに渡してよいか
   - Proposal: そのセッションの会話すべて（owner の発言・エージェントの発言・道具の結果。ファイルの中身は道具の結果として既に切り詰められている物だけ）を材料にする
2. Highlight:
   - いまは `message_end` と `input` で貯めるだけで、reload やセッション再開の後は窓が空になり「文脈がない」と言われる。011 の plan はその2つだけを指定し、セッションに既にある会話を読んでいなかった
   - 何を別モデルに渡すかは owner の判断。会話には道具の結果としてファイルの中身も入る
3. Research:
   - mechanism: `context` は各 LLM 呼び出しの前に発火し、`messages: AgentMessage[]`（システム文を除く）を渡す。Pi は handler の戻りで**そのリクエストだけ**を差し替え、事後に復元する（`dist/core/extensions/types.d.ts:514-524`、`runner.js:897-916`、`docs/extensions.md:105-109`）
   - mechanism: 材料はセッションの projection（永続化済みの分岐）から作られる。`prepareRequest` が `sessionManager.buildSessionProjection().messages` を正規 context にする（`agent-session.js:309-317`）ので、**reload 直後の初回要求でもセッションの会話が渡る**
   - mechanism: 拡張はそれを読んで自分の状態に写せる（`transformContext: messages => runner.emitContext(messages)`、`sdk.js:248-253`）。戻り値での差し替えはリクエスト局所で、永続化ではない
   - 条件: `system` は渡されない（全 transcript は別イベント `context_with_system`）。二重に貯めないよう、seed と live の `message_end` / `input` を寄せる必要がある
4. Trial: なし
5. Decision: **accepted**

### 01-3: second-opinion.opinion

1. Agenda:
   - Title: 待っている間、何をどこまで見せるか
   - Proposal: 道具が動いている間、進行を出す（`onUpdate` を呼ぶ）
2. Highlight:
   - いまは何も出ず、数十秒後に結果だけが突然出る。`execute` は `onUpdate` を受け取っているが一度も呼んでいない
   - 011 の ADR にも plan にも「実行中に何を見せるか」は無く、同期で待たせる形だけが決まっていた
3. Research:
   - mechanism: `execute(toolCallId, params, signal, onUpdate, ctx)` の `onUpdate` を呼ぶと、pi が `tool_execution_update` を拡張へ流し、TUI が実行中の表示を更新する（`types.d.ts:373`、`agent-session.js:775-783`、`modes/interactive/interactive-mode.js:2828-2833`）
   - mechanism: `bash` 道具が実例。開始直後に空の更新を出し、その後も複数回呼ぶ（`dist/core/tools/bash.js:166-203`）。partial は `isPartial` として別の色で描かれる（`components/tool-execution.js:129-133,224-229`）
   - 条件: 呼び出し回数の上限は仕様に明記が無い。throttle するかは道具側の裁量（`docs/json.md:106-113`）
4. Trial: なし
5. Decision: **accepted**

### 01-4: second-opinion.opinion

1. Agenda:
   - Title: 子が打ち切られた時に、書かれた本文を返すか
   - Proposal: `done` でなくても、最後の本文があれば返し、打ち切られたことを添える
2. Highlight:
   - `bodyOf` は `done` 以外で必ず例外を投げる。子が答えを書いた後にターン上限へ当たると run は `stopped` になり、**書かれた答えごと捨てられる**。owner が見た「結果が返らない」がこれ
   - 011 の plan は「非 done は投げる」と決めた（空の本文を黙って返さないため）が、本文がある場合を分けていなかった
3. Research:
   - なし（コードの分岐の話で、外部の事実を要さない）
4. Trial: なし
5. Decision: **accepted**

### 01-5: second-opinion.opinion

1. Agenda:
   - Title: 上限に当たる前に、いつ促すか
   - Proposal: 促しを上限の2つ前に出し、子が促しを無視しても本文は返る形にする（01-4 と対で効く）
2. Highlight:
   - `child/budget.ts` は `turnIndex >= turns - 1` で促す。`turnIndex` は0始まりで終了したターンを指すので、8 なら**8ターン目の終わり**に出る。run は `spent.turns > limits.turns` で打ち切るため、子が9ターン目に書いた本文は `stopped` になり捨てられる（off-by-one）
   - 余地は1ターンしかなく、窓が20件（道具の結果込み）なので、読みだけで数ターン使う
   - 観測: 011 の consult の子は `turn limit reached (80)` で終わっており、nudge は実際には効いていない
3. Research:
   - mechanism: `turn_end` から `{continue: true}` は「次の model 要求1つ」を要求できる（`docs/extensions.md:109`、`types.d.ts:609-618`）
   - mechanism: ただし門がある。`boundary.continue && !this._buildBoundaryContext([], "turn_end").canContinue` で棄却され、`canContinue` は `contextCanContinue || pendingCustomContext || hasQueuedMessages`（`agent-session.js:360,463-495`）。門は handler が返した `entries` を見ない（`[]` で呼ぶ）
   - mechanism: `turnIndex` は 0 始まり（`agent-session.js:111,711-730`）
   - 条件: 促しのターンが上限を越えないこと。越えても 01-4 が本文を救うので、門を通す深追いはしない
4. Trial: なし
5. Decision: **accepted**

### 01-6: second-opinion.opinion

1. Agenda:
   - Title: 子のターン数と出力の上限
   - Proposal: `turns: 8` を上げる（consult のロールは 40 / 40 / 60 / 80）
2. Highlight:
   - 8 は私が plan の I/O で決めた値。consult と比べず、窓の大きさ（20件・道具の結果込み）とも突き合わせていない
   - モデルの消費は owner が払う物
3. Research:
   - なし
4. Trial: なし
5. Decision: **accepted**

### 01-7: second-opinion.opinion

1. Agenda:
   - Title: 子の記録を残すか
   - Proposal: consult と同じように `log.jsonl` に開始1行と終了1行を残す（子のイベント全文ではない）
2. Highlight:
   - second-opinion は子のイベントも記録もどこにも残さない。だから「ターン上限でエラーになった」時に、何が起きたかを後から確かめられなかった
   - 011 の ADR は「consult は `log.jsonl` を持つ」と書いたが、私の plan は何も残さなかった
3. Research:
   - mechanism: consult が残すのは `RunRecord` の開始1行と終了1行（`child, role, worktree?, pid, started, ended?, state?, reason?, files?, turns?, spend?, notice?`）で、`<root>/<unit>/log.jsonl` に追記する（`run/log.ts:20-56`）。親が `onStarted` で先行追記し、`closeRecord` で閉じる（`tool/consult.ts:259-340`）
   - mechanism: 子のイベント全文は残していない。`parseEvents` はメモリ上で parse するだけ（`child/spec.ts:100-114`）。子のセッションは `--no-session` なので、記録が無ければ何も残らない
   - 条件: root は `/tmp/pi-consult/<project>-<stamp>/`（`CONSULT_ROOT` で可変、`run/worktree.ts:18-29`）。second-opinion は worktree を持たないので、unit dir の扱いを決める必要がある
4. Trial: なし
5. Decision: **accepted**

### 01-8: second-opinion

1. Agenda:
   - Title: 新しく書いたファイルの置き場
   - Proposal: `conversation.ts` と `answer.ts` を `tool/` に移す
2. Highlight:
   - 私が plan の `Files` で `index.ts` と同じ所に平らに置いた。consult は役割ごとに分けている（`tool/` は道具の中身、`run/` は子の起動、`child/` は子の仕様、`policy/` はロールの定義）
   - `conversation.ts`（窓を組む）と `answer.ts`（既定の質問と答えの形）は、どちらも道具の中身
   - owner の指示で `tool/` に置く
3. Research:
   - なし
4. Trial: なし
5. Decision: **accepted**

## 02: consult

### 02-1: consult.run

1. Agenda:
   - Title: 促しが効かず、上限で打ち切られる
   - Proposal: 促しを上限の2つ前に出し、子が促しを無視しても、書かれた本文が失われない形にする
2. Highlight:
   - `child/budget.ts` は `turnIndex >= turns - 1` で促す。`turnIndex` は0始まりで終了したターンを指すので、40 なら**40ターン目の終わり**に出る。促しが使わせる1ターンは、上限を越えている
   - `continue: true` の門が handler の `entries` を見ない（`_buildBoundaryContext([], "turn_end")`）ので、素の続行は棄却される
   - 観測: 011 の consult の子は `turn limit reached (80)`、今回の research の子も `turn limit reached (40)` で終わった。促しは一度も効いていない
   - second-opinion の 01-5 と同じ機構。`child/budget.ts` は consult と second-opinion に別々のコピーとして在る
3. Research:
   - mechanism: `turnIndex` は 0 始まり（`agent-session.js:111,711-730`）。門は `boundary.continue && !this._buildBoundaryContext([], "turn_end").canContinue`（同 `:360`）
4. Trial: なし
5. Decision: **accepted**
