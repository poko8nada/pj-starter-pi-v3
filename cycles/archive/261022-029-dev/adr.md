# ADR 029

## 01: 古い履歴をどの単位で、どの形で送る文脈から外すか

### Context

- `memo-extention.md` の `async-jev-compaction` は、既定のコンパクションを上書きし、コンテキストの割合で非同期に発動し、直近の 50,000 トークンをメインのモデルに要約させ、その要約を Jev の state に置いて、それより古い会話とツール履歴を 1 件ずつ「関係あるか」と判定させ、要らないものを落とす形を求めている。
- owner の求める落とし方は、生の記録は残し、送る文脈からだけ外すことである。
- ツール結果を `replacement: null` で外すと、送信直前に pi が `No result provided`（`isError: true`）の結果を合成する。モデルはそれを「失敗した」と読む。
- 内容だけ差し替える口（`replacement: { content }`）では、呼び出しと結果の対応を保ったまま本文だけ短くできる。
- Jev の state には上限がある（state ＋ 最長の問いで 32k、全体で 64k。第三者のレビュー）。

### Decision

- Status: **accepted**
- Adopted:
  - 落とす単位は、古いツール結果の本文だけにする。会話の本文は落とさない。
  - 落とす形は `replacement: { content: <印> }`。印は「古いツール結果（N 文字）を省略」の 1 行。
  - 生の記録は消さない。session の生エントリは残る。
- Options:
  - エントリ全体を `replacement: null` で外す（削減量は最大だが、`No result provided` が合成され、モデルが失敗と読む可能性がある。会話本文が飛ぶと文脈も切れる）。
  - `context` フックで毎回合わせる（可逆だが、再起動で印が消え、メッセージからエントリ id への対応付けを自前で作ることになる）。
  - 要約に置き換える `CompactionEntry` を書く（切れるのが連続した前置きだけで、散らばった項目を選べない）。
  - 要約を作らず直近の依頼から話題を作る（fast-jev-compaction 型。要約の往復が減るが、直近の 50,000 トークンの要約という求めを満たさない）。

### Research & Trial

- `replacement: null` は `projectContextEntry` が `[]` を返し、そのエントリの寄与を丸ごと消す（`dist/core/session-manager.js:235-254`）。
- 孤立した tool call は、送信前の `transformMessages` が `No result provided`（`isError: true`）の結果で補う（`dist/bundle/chunks/chunk-2JW42LFQ.js:2`）。
- `replacement: { content }` は `{...message, content}` でメタデータを保ったまま本文だけ置換する（`dist/core/session-manager.js:242-253`）。
- `turn_end` と `agent_before_settle` は、返したエントリをその場でコミットし、文脈を作り直す（`dist/core/agent-session.js:506-515, 1543-1544`）。
- `agent_settled` は通知だけで、エントリは足せない（`dist/core/agent-session.js:684-708`）。
- 消すたびにプロンプトキャッシュが無効になり、書き戻しの課金が出る（Anthropic の context editing の記載）。
- 同じ形の実例（`fast-jev-compaction`）は、ツール呼び出しごとに 2 問をバッチで聞き、閾値 0.5 で keep／結果の短縮／呼び出しごとの削除を決める（同リポジトリ `src/compact.ts`）。
- 結果の本文を state に入れない設計では、本文を見ずに重要度を決めることになる（同リポジトリのレビュー）。

### Definition Change

- `Unit.context-prune`(added): エージェントが、古いツール結果のうち要らないものを送る文脈から外し、コンテキストを空けられる

## 02: いつ発動し、いつ反映するか

### Context

- 既定のコンパクションは `contextTokens > contextWindow - reserveTokens` で同期的に走る。owner の求めるのは、ターンを止めずに裏で走らせ、次の境界で反映することである。
- `turn_end` はターンごとに来る。`agent_before_settle` は実行の最後に来る。`agent_settled` は通知だけである。
- 毎ターン走らせると、要約と Jev の往復が積み上がる。
- owner は割合の既定を 0.5 とした。

### Decision

- Status: **accepted**
- Adopted:
  - 発動の判定は `turn_end` に置く。`getContextUsage().tokens` が「コンテキスト枠 × 割合」を超えていたら、要約と判定を裏で投げる。
  - 割合は 0.2〜0.8 の間で設定できる。既定は 0.5。分母はモデルのコンテキスト枠。
  - 結果を積むのは、次に来た `turn_end` か `agent_before_settle` の早い方。判定が揃っていなければ何もしない。
  - 一度走ったら、使用量がコンテキスト枠の 10% 増えるまで走らせない。
- Options:
  - `agent_before_settle` だけで発動し、反映する（実行の最後にしか来ないので、長い実行では反映が遅れる）。
  - `context` で毎リクエスト見る（発動は早いが、毎回の往復になる）。
  - 既定のコンパクションの閾値に合わせる（`contextWindow - reserveTokens`。割合で指定するという求めを満たさない）。

### Research & Trial

- `getContextUsage()` は `{ tokens, contextWindow, percent }` を返し、分母はそのモデルの `contextWindow` である（`dist/core/extensions/types.d.ts:197-203`、`dist/core/agent-session.js:3471-3504`）。
- コンパクション直後は、次の LLM 応答まで `tokens: null` になる（`dist/core/extensions/types.d.ts:198`）。
- `percent` は `tokens / contextWindow * 100` である（`dist/core/agent-session.js:3498-3504`）。
- `turn_end` と `agent_before_settle` のハンドラは await されるが、ハンドラの中で Promise を投げっぱなしにすれば、そのターンは待たない（`dist/core/extensions/runner.js:774,789`）。
- 投げっぱなしの仕事が次のリクエストを待たせないことは、一次コードでは追い切れていない。試作で確かめる。

### Definition Change

- なし

## 03: Jev に何を渡し、要約をどこに置くか

### Context

- memo は、直近の 50,000 トークンをメインのモデルに裏で要約させ、その要約を Jev の state に入れ、それより古い会話やツール履歴を 1 件ずつ「関係あるか」と聞く形を求めている。
- Jev の state には上限がある（state ＋ 最長の問いで 32k、全体で 64k）。50,000 トークンの要約をそのまま入れると入らない。
- owner は、Jev へはバッチで聞き、要約は state にだけ置き、上限を 2,000 トークンとすることを求めた。

### Decision

- Status: **accepted**
- Adopted:
  - 直近の 50,000 トークン（設定で変更可）を、メインのモデルに裏で要約させる。要約の上限は 2,000 トークン。
  - 要約は Jev の state にだけ入れる。モデルの文脈には入れない。直近の 50,000 トークンは生のまま残す。
  - それより古いツール結果を候補にし、1 リクエストに複数問をまとめて聞く。閾値は 0.5。
  - state には要約と、候補のメタ（ツール名、引数の要約、結果の文字数）を入れる。結果の本文は state に入れない。
- Options:
  - 1 件ずつ 1 リクエストで聞く（往復が件数分になり、遅く高い）。
  - 結果の本文も state に入れる（判定は正確になるが、32k の上限に収まらない）。
  - 要約をモデルの文脈の先頭にも置く（50,000 トークンを生のまま残すので、二重になる）。
  - 要約を省き、直近の依頼から話題を作る（往復が減るが、直近の 50,000 トークンの要約という求めを満たさない）。

### Research & Trial

- `generateSummary` と `generateSummaryWithUsage` が公開されている（`dist/index.d.ts:6`、`dist/core/compaction/compaction.d.ts:112-117`）。
- 拡張からは `ctx.modelRegistry.complete(...)` で要約できる前例がある（`examples/extensions/custom-compaction.ts:77-88`）。
- 要約の要求はプロンプトキャッシュの書き込みを切る（`docs/compaction.md:23`）。
- `classify` は state と questions を受け取り、失敗しても reject せず `stopReason` で返す（`dist/core/model-registry.d.ts`、`@earendil-works/pi-ai` の `models.d.ts:196-197`）。
- Jev の上限は第三者のレビューに「state ＋ 最長の問いで 32k、全体で 64k」とある（jevlist.ai の fast-jev-compaction レビュー）。一次資料は未取得である。
- `classify` の questions 数の上限は、SDK のコードで確認できていない（`openai-decisions` の画像上限 128 だけが見つかっている）。試作で確かめる。

### Definition Change

- なし

## 04: 失敗と誤判定にどう備え、どう操作するか

### Context

- 要約も Jev の判定も失敗しうる。判定は閾値の近くで誤る。
- owner は、既定のコンパクションを保険として残すことを求めた。
- owner は、コマンドで on/off を切り替え、off のときは既定のコンパクションだけにし、直近の結果をステータスで見られることを求めた。

### Decision

- Status: **accepted**
- Adopted:
  - 要約か Jev が失敗したら、何も積まない（fail-open）。既定のコンパクションが保険として働く。
  - 既定のコンパクションは止めない。
  - `prune` のコマンドを持つ。引数なしで状態、`on` と `off` で切り替える。その場で走らせる `now` は 06 が持つ。
  - 状態は、有効か、割合、直近の実行（いつ、何件落としたか、何文字減ったか、要約と判定の所要）を出す。
  - 設定は `.pi/extensions/context-prune/settings.json` に置く。範囲外の値と未知のキーは投げる。
- Options:
  - 既定のコンパクションを止める（保険を失う）。
  - 失敗したら前回の判定を使い回す（古い判定で落とすことになり、誤りの害が増える）。
  - `settings.json` だけで切り替える（状態が見えず、off にしたくても手で書き換えることになる）。
  - 落としたものを戻すコマンドを持つ（A は結果の本文を印に置き換えるだけで害が小さく、戻す口は要らない）。

### Research & Trial

- 拡張のコマンドは `pi.registerCommand()` で登録する（`docs/extensions.md`）。
- 設定を拡張の隣に置く形は既にある（`.pi/extensions/intent-router/settings.json`）。
- Jev の判定を fail-open にする前例がある（`pi-jev-classifier` は認証・HTTP・時間切れ・中断で素通しにする）。
- 既定のコンパクションは `contextTokens > contextWindow - reserveTokens` で走る（`dist/core/compaction/compaction.js:173-177`、`docs/compaction.md:29-37`）。
- 分類器の誤判定は閾値の近くで起き、上流に棄権の区間がない（jevlist.ai の fast-jev-compaction レビュー）。

### Definition Change

- なし

## 05: 差し込んだ結果を TUI にどう出すか

### Context

- 標準のコンパクションのカードは、`compaction` エントリが積まれたときにだけ出る。こちらの差し込みは `context_edit` なので、そのままでは何も出ない。
- owner は、差し込んだときに、標準と同じ仕様のカードを出してほしいと求めた。
- `custom` エントリはモデルの文脈に入らず、積んだ瞬間に TUI に出る。
- カードを出す時点と、送る文脈に効く時点は別にできる。owner は、カードはすぐ出し、文脈へは次の境界で積む形を選んだ。

### Decision

- Status: **accepted**
- Adopted:
  - 1 回のパスの結果を、`custom` エントリ（`context-prune`）として書く。パスが終わった時点で書き、次の境界は待たない。
  - `registerEntryRenderer` で、標準のコンパクションのカードと同じ形に描く。背景は `customMessageBg`、ラベルは `[prune]`、折りたたみで、クリックで展開する。
  - 折りたたみの行は、標準と同じく `Compacted from N tokens` を出す。
  - 展開した中身は、要約と、落とした件数と文字数。
  - 送る文脈への反映は、次の境界で `context_edit` として積む。
- Options:
  - `compaction` エントリを書く（標準のカードがそのまま出るが、切れるのは連続した前置きだけで、散らばった項目を選べない）。
  - `sendMessage` のカスタムメッセージで出す（カードは出るが、モデルの文脈に乗る）。
  - 何も出さない（owner が差し込みに気づけず、`/prune` で状態を見に行くことになる）。
  - 境界で積んだときに書く（押した直後に何も出ず、次のターンが終わるまで見えない）。

### Research & Trial

- 標準のカードは、`compaction` エントリの `entry_appended` から作られる（`dist/modes/interactive/interactive-mode.js:2793-2803`）。
- カードの形は `CompactionSummaryMessageComponent` が持つ。背景 `customMessageBg`、ラベル `customMessageLabel`、折りたたみ時は `Compacted from N tokens (キー to expand)`、展開時は `**Compacted from N tokens**` と要約の Markdown、クリックで切り替える（`dist/modes/interactive/components/compaction-summary-message.js:8-53`）。
- `custom` エントリは `entry_appended` でその場で描かれ（`interactive-mode.js:2778-2784`、`components/custom-entry.js`）、モデルの文脈に入らない（`dist/core/session-manager.d.ts:186-188`）。
- 拡張の renderer は `{ expanded }` を受け取る（`dist/core/extensions/types.d.ts:1166-1170`）。クリックで切り替えるには、自前で `MouseRegion` を置く。
- `@earendil-works/pi-tui` は pi が拡張に供給するパッケージである（`docs/packages.md:80-88`）。`peerDependencies` に `"*"` で書き、`dependencies` には置かない。物理コピーはクラスの二重化を招く（同 `:90`）。
- 実行時はローダーがエイリアスで解決する（`dist/core/extensions/loader.js:62-65`）。型検査のために `devDependencies` に `^1.3.0` を足す。既存の `@earendil-works/pi-coding-agent` と同じ扱いである。

### Definition Change

- なし

## 06: 閾値を待たずに、その場で走らせる口をどう持つか

### Context

- owner は、割合を超えるのを待たずに、その場で 1 回走らせるコマンドを求めた。
- コマンドはアイドル中に走る。境界（`turn_end` / `agent_before_settle`）は、エージェントの実行中にしか来ない。
- コマンドから `context_edit` を直接積む口は公開されていない。`ctx.sessionManager` は読み取り専用で、`pi.appendEntry` は `custom` エントリしか書かない。

### Decision

- Status: **accepted**
- Adopted:
  - `/prune now` で、割合とクールダウンを見ずに、要約と判定をその場で走らせる。
  - 結果は 05 の `custom` エントリとして書き、カードを出す。
  - `context_edit` は次の境界で積む。押した直後の 1 リクエストには効かない。
  - 走っている間に `now` が来たら、二重に走らせずに断る。
- Options:
  - `context` フックでも適用して、直後のリクエストに効かせる（メッセージからエントリへの対応付けが増える）。
  - セッションを書き換えて直接 `context_edit` を積む（`ReadonlySessionManager` の型を破ることになる）。
  - `now` を次の境界まで遅らせる（押した意味が薄れる）。
  - 走っている間に来た `now` を待たせる（コマンドが終わらず、二重に走る危険がある）。

### Research & Trial

- `registerCommand` のハンドラは `ExtensionCommandContext` を受け取る（`dist/core/extensions/types.d.ts:1231, 286-291`）。
- `ctx.sessionManager` は `ReadonlySessionManager` で、読む口だけを持つ（`dist/core/session-manager.d.ts:178`）。
- `pi.appendEntry` は `custom` エントリだけを書く（`dist/core/extensions/types.d.ts:1271-1272`）。
- `context_edit` は境界の返り値としてしか積めない（`dist/core/extensions/types.d.ts:753-778`、`dist/core/agent-session.js:506-515, 1543-1544`）。
- コマンドの中でも `getContextUsage()` は取れる（`dist/core/extensions/types.d.ts:247-248`）。

### Definition Change

- なし
