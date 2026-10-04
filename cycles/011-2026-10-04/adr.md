# ADR 011

## 01: consult

### 01-1: .run

1. Agenda:
   - Title: 子が報告を書いた後もプロセスが終わらないことがある（010 の work で3回中1回）。親への配達は子の終了が起点なので、報告が届かない
   - Proposal: 終わらない子を、親が検出して片付ける。`agent_end`（pi が stdout に出す）を見たら30秒の静かさを待ち、その間に出力が来なければ最後の本文を配達してから殺す（出力が来たら続けさせる）
2. Highlight:
   - 010 の `consult-3`（`code`、Round 1 の修正）は、所見2つを直し検査を回し `ac34d6e` をコミットし、報告文まで書いた（最後の assistant メッセージは道具呼び出しの無い `stopReason: stop`）。しかしプロセスは終わらず、9分以上待機のままだった
   - 配達は子の終了が起点（`run/run.ts` の `child.on('close')` → `tool/consult.ts` の `deliver`）。中断・失敗の時は `failureOutcome` だけを配達し、子が書いた最後の本文は捨てる
   - 記録（`log.jsonl`）に `ended` が書かれないので、`consult_children` は今も running と出す。`consult_worktree remove` は通った
   - 同じ形で走った `consult-1`（70ターン）と `consult-2`（18ターン）は正常に終わった。だから「ホストの拡張が子に読み込まれているせい」だけでは説明できない
   - 落とした案: 実行時間の上限は「時間の切り方」が難しく、長い道具（テストなど）を途中で切る。子に `--no-extensions` を渡すのは原因の説明にならない。何もしないと、書かれた報告が親に届かない
   - **`agent_end` は pi 自身が出すので、タイマーの推測が要らず、道具の途中で切る危険も無い**（30秒の静かさを見てから切るので、動き出した子はそのまま続く）
3. Research:
   - mechanism: `pi --mode json` はセッションのイベントを**全部** stdout に JSONL で出す（`dist/modes/print-mode.js` の subscribe、`dist/modes/json-event.js` は素通し）。だから `agent_end`（ループの終わりの印）と `turn_end` が親から見える
   - mechanism: 終わらない場所は print モードの後片付け（`dist/modes/print-mode.js` の `finally { disposeRuntime(); flushRawStdout(); }`）。prompt は終わっているので、報告が出た後に固まる、という観測と一致する
   - mechanism: pi の通常の終了は `process.exit()` ではなく `process.exitCode`（`dist/main.js`）。イベントループが空にならないと終わらない
   - mechanism: `--no-extensions`（`-ne`）があり「拡張の探索を止める。明示の `-e` は効く」（`dist/cli/args.js`）
4. Trial: なし
5. Decision: **accepted**

## 02: plan-skill

### 02-1: Acceptance

1. Agenda:
   - Title: plan md の `Acceptance` の `Merge` は、受け入れのコミットがマージの前なので、その時点では書けない
   - Proposal: `Acceptance` から `Merge` の欄を落とし、`Ran` と `Findings` だけにする（マージのコミットは git が持つ）
2. Highlight:
   - 010 では受け入れを `762497c` でコミットし、マージは `444735a`、`Merge` の記録は `241cd6a` と3つに分かれた（記録を埋めるのに別コミットが要った）
   - plan の format は `Merge` を「マージのコミット」と定め、`work` スキルは受け入れのコミットをマージの前に置いている。`## Writing` は空の field を許すので違反ではないが、**誰がいつ埋めるか**をどのスキルも書いていない
   - 落とした案: (a) マージ後に親が記録するのは、plan ごとにコミットが1つ増える。(c) 受け入れのコミットをマージの後に移すのは、枝に入れた物とマージ済みの内容がずれる
   - **マージのコミットは git が持っている。plan md が写しを持つ必要は無い**
3. Research: なし
4. Trial: なし
5. Decision: **accepted**

## 03: sound-notify

### 03-1: .compact

1. Agenda:
   - Title: コンテキストの圧縮（compact）が終わったことに気づけない。音が欲しい（音はターン終了と同じでよい）
   - Proposal: `sound-notify` に `.compact` を足す。pi の `session_compact` をフックし、`agent_settled` と同じ音（既定 `Glass`）を鳴らす
2. Highlight:
   - いまの `sound-notify` がフックしているのは `ui_prompt_start`（入力待ち）/ `agent_settled`（ターン終了、`.done`）/ `tool_execution_end`（commit、`.commit`）。compact は長くかかり、終わった事も失敗した事も分からない
   - 音は `sounds` の設定で差し替えられる（既定 `permission: Blow` / `question: Ping` / `done: Glass` / `commit: Pop`）。`.compact` の既定は `done` と同じ `Glass` にする
3. Research:
   - mechanism: pi の拡張イベントに `session_compact` がある（型は `SessionCompactEvent`。`reason: manual | threshold | overflow` と `willRetry` を持つ）。`session_compact_failed` と `session_before_compact` もある（`dist/core/extensions/types.d.ts`）
   - mechanism: `on("session_compact", handler)` として登録できる（同じファイルの `on()` 一覧）
4. Trial: なし
5. Decision: **proposed**
