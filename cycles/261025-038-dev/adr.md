# ADR 038

## 01: 標準コンパクションの待ち時間を、Jev を使わずに、非同期の前準備でなくす形をどうするか

### Context

- Pi の標準コンパクションは、コンテキストが `contextWindow - reserveTokens` を超えると走り、要約が終わるまでエージェントを待たせる。
- 今の `context-prune` は、標準コンパクションの置き換えではなく、その前のツール結果削除である。古い領域は残したまま、Jev が要らないと判断した `toolResult` を 1 行のマーカーに変える。
- そのため、今の prune の削減は実測で 4.1〜24.7% に留まる。古い思考、ツール呼び出しの引数、Jev が keep したツール結果は残る。
- owner は、標準コンパクションを置き換えるのではなく、標準コンパクションを閾値の手前で裏で作り、境界で差し込むことで、待ち時間をなくしたい。
- Jev は使わない。標準の書式、cut point、`previousSummary`、`turnPrefixMessages`、`fileOps` は Pi のものを使う。
- 今の Jev 型 prune は削除し、完全に乗り換える。

### Scope

- 変更:
  - behaviour: in — 標準コンパクションを閾値の手前でバックグラウンドに作り、`turn_end`、`session_before_compact`、`agent_before_settle` の境界で差し込む。
  - refactor: in — 今の `context-prune` を削除し、新しい `context-precompact` 拡張を作る。旧 prune のコード、settings、tests、card は削除し、標準の compaction card は残す。
  - dependency: in — Jev への依存を削除する。`prepareCompaction` は Pi 1.3.0 からコピーし、`compact` は公開 API を使う。
  - naming: in — `Unit.context-prune` を落とし、`Unit.context-precompact` を追加する。`/prune` を `/precompact` に置き換える。
  - format: in — settings を `enabled`、`keepRecentTokens`、`thresholdRatio` の 3 つに置き換える。
  - prose: in — README と `DEFINITION.md` を更新する。
  - tui: in — プレコンパクトの準備中と完了を `ctx.ui.setStatus` でフッターに表示し、完了の ready には `tokensBefore → tokensAfter` を出す。最終結果とフォールバックを `ctx.ui.notify` で知らせる。
- 品質:
  - speed: in — 通常ケースで、標準コンパクションの待ち時間をなくす。
  - compatibility: in — 標準コンパクションの書式、cut point、`previousSummary`、`turnPrefixMessages`、`fileOps` を維持する。Pi の `compaction.enabled` を尊重し、Pi の自動コンパクションは無効化しない。手動 `/compact` と overflow の復旧は Pi の既定のままにする。
  - errors: in — 準備の失敗、stale、照合の不一致、`firstKeptEntryId` の不在では、draft を捨てて Pi の既定のコンパクションに任せる。壊れた settings は 1 度だけ知らせる。
  - security: out — 認証と秘密の扱いは変えない（理由: Pi の認証経路をそのまま使う）。
- 運用:
  - deploy: out — ローカルの拡張で、配備はない（理由: プロダクトは配備しない）。
  - migration: out — 旧セッションの移行はしない（理由: compaction entry は標準で、古い custom entry はモデルに送られない）。
  - logs: in — 準備、適用、フォールバック、照合の不一致、settings の破損を記録する。
  - monitoring: out — 外部の監視は追加しない（理由: ローカルの拡張で、カードとログで足りる）。

### Research & Trial

- 今の prune の削減は、実セッションのパス記録で 505,057 → 54,916（10.9%）、601,703 → 24,718（4.1%）、500,198 → 123,555（24.7%）、501,640 → 53,762（10.7%）、538,524 → 23,664（4.4%）だった。標準コンパクションの置き換えではないため、削減は小さい。
- `prepareCompaction` は `dist/core/compaction/compaction.js:606` にあるが、パッケージのルートから export されていない。`dist/index.js:8` の再 export にも含まれない。`package.json` の `exports` は `.` と `./rpc-entry` だけなので、`dist/core/compaction/compaction.js` の subpath import は `ERR_PACKAGE_PATH_NOT_EXPORTED` で拒否される。Node で確認した。
- `compact` は `dist/core/compaction/compaction.js:685` にあり、ルートから import できる。
- `prepareCompaction` は `pathEntries` と `settings` だけから作る純粋計算で、session id や leaf id を持たない（`compaction.js:606-659`）。cut point より後ろに entry が増えても、要約する古い領域は変わらない。branch の移動や新しい compaction は、準備を stale にし得る。
- `compact()` は `session_before_compact` を発火せず、セッションに書き込まない。LLM 呼び出しと失敗時の throw だけが副作用である（`compaction.js:685-722`）。
- `prepareCompaction` は、最新の `compaction` エントリの `summary` を `previousSummary` として読む。`fromHook: true` でも読む（`compaction.js:615-621`）。
- `prepareCompaction` が前回の `compaction` の `details.readFiles` / `modifiedFiles` を `fileOps` に含めるのは、`!prevCompaction.fromHook` のときだけである（`compaction.js:21`）。境界で積む `CompactionEntryDraft` は `fromHook: true` 固定なので（`agent-session.js:595`）、こちらの compaction のファイル一覧は次の `prepareCompaction` に自動では引き継がれない。
- `compact()` は `summary`、`firstKeptEntryId`、`tokensBefore`、`usage`、`details: { readFiles, modifiedFiles }` を返す。`estimatedTokensAfter` は返さない（`compaction.js:715-721`）。summary の末尾には `<read-files>` / `<modified-files>` が付く（`compaction.js:710-711`）。
- `appendCompaction` は `firstKeptEntryId` の存在を検証しない（`session-manager.js:880-898`）。`buildContextEntries` は id が branch に見つからないと、`compaction` とその後の entry だけを返す（`session-manager.js:216-228`）。古い id を渡すと kept tail が黙って消える。
- `turn_end` の draft は、次のターンの自動コンパクション確認より先に適用される（`agent-session.js:488-521`, `540-541`）。`agent_before_settle` の draft は、実行終了後の `_checkCompaction` より後に適用される（`agent-session.js:1500-1536`）。
- `session_before_compact` は、拡張が返した `CompactionResult` の `summary`、`firstKeptEntryId`、`tokensBefore`、`usage`、`details` をそのまま使う。`tokensBefore` の再計算も `firstKeptEntryId` の検証もない（`agent-session.js:2503-2532`, `2213-2255`）。
- `isCompacting` は Pi の手動、自動、分岐要約の制御子だけを見る（`agent-session.js:1209-1212`）。こちらのバックグラウンドの `compact()` は見えない。Pi の自動コンパクションと同時に走る可能性がある。
- `getSettings()` は `ExtensionAPI` にあり、イベントの `ExtensionContext` にはない（`types.d.ts:1285-1286`, `213-253`）。Pi の `compaction.enabled`、`reserveTokens`、`keepRecentTokens` を読める。
- `ExtensionUIContext` には `notify(message, type?)` と `setStatus(key, text | undefined)` がある（`types.d.ts:79-84`）。`setStatus` はフッター/ステータスバーの表示で、カードではない。
- fork は session id を新しくする（`session-manager.js:1374-1413`）。switch は別のセッションを開く（`agent-session-runtime.js:128-146`）。branch の移動は session id を変えない（`session-manager.js:1155-1166`）。reload は session manager を置き換えない（`agent-session.js:2969-3003`）。stale の判定には session id と leaf id の両方が要る。
- 今の `context-prune` は `session_before_compact` を購読していない（`index.ts:356-360`）。`previousSummary`、`fileOps`、`session_before_compact`、`fromHook` の記載はない。`summarize` の `previousSummary` は `undefined` で、signal も渡していない（`ports.ts:82-99`）。

### Decision

- Status: **accepted**
- Adopted:
  - B: `prepareCompaction` とその補助関数（projected cut point、projected entry からのメッセージ取り出し、file operation の抽出）を Pi 1.3.0 からコピーし、1 つのモジュールに閉じ込める。`compact()` は公開 API を使い、要約プロンプトは Pi の `compact()` に任せる。
  - 新しい拡張 `context-precompact` を作り、今の `context-prune` を削除する。両者は同じ plan で入れ替え、同時に動かさない。
  - コピーした `prepareCompaction` には、`ctx.sessionManager.buildSessionProjection()` の projection と `ctx.sessionManager.getBranch()` の pathEntries を渡す。`tokensBefore` は準備時点の `getContextUsage()` を使い、`turn_end` の境界 draft では `_applyBoundaryDrafts` が再計算する。`session_before_compact` で返すときは、その時点の `getContextUsage()` で `tokensBefore` を更新する。
  - 標準コンパクションは置き換えない。`thresholdRatio - LEAD_RATIO` から裏で準備し、`turn_end` を主経路、`session_before_compact` を競合時の経路、`agent_before_settle` を補助にして差し込む。
  - 準備の失敗、stale、照合の不一致、`firstKeptEntryId` の不在では、draft を捨てて Pi の既定のコンパクションに任せる。
  - `session_before_compact` では、Pi の `preparation` とこちらの preparation を照合する。`firstKeptEntryId`、`messagesToSummarize` の件数、`turnPrefixMessages` の件数、`previousSummary`、`fileOps` が一致しなければ捨てる。
  - 前回の `fromHook: true` の compaction の `details` から `readFiles` / `modifiedFiles` を読み、`fileOps` に merge する。`readFiles` は `read` に、`modifiedFiles` は `edited` に入れる。`compact()` の `computeFileLists` が読み取り専用と変更済みを分ける。
  - 適用時に `firstKeptEntryId` が現在の branch にあるかを確認する。session id と準備時の leaf id を保持し、現在の branch にその leaf が含まれるかを確認する。
  - 適用前に、準備後に新しい `compaction` が積まれていないかを確認する。積まれていれば、その準備は古いので捨てる。
  - `fileOps` の照合は `read`、`written`、`edited` の集合で行う。
  - 設定は `enabled`、`keepRecentTokens`、`thresholdRatio` の 3 つにする。`thresholdRatio` は適用閾値で、準備の lead は内部定数にする。`reserveTokens`、timeout、rearm も内部にする。`SUMMARY_TIMEOUT_MS` は 5 分（300,000 ms）にし、失敗時は既定のコンパクションへフォールバックする。
  - Pi の `compaction.enabled` を `getSettings()` で読み、false なら自動のプレコンパクトを動かさない。拡張の `enabled` と Pi の `compaction.enabled` の両方が true のときだけ動く。
  - 準備の開始時に `preparing…`、完了時に `ready (X → Y)`、適用時に `applied (X → Y)` をフッターとチャットの両方に出す。`/precompact now` も同じ経路で即時に `preparing…` を返し、結果は背景で出し、次の `turn_end` と `agent_before_settle` では閾値を見ずに適用する。枝は `precompact: off`、`precompact: nothing to prepare`、`precompact: running` を出す。要約失敗時は `precompact: failed (<reason>); default compaction will run`、stale と不一致の破棄時は `precompact: failed; default compaction will run` を `ctx.ui.notify` の warning で出す。`info` は最新の 1 行に上書きされ、`warning` / `error` は残る。chat が本体で、`/precompact` の `status` は保険とする。
  - 記録の口は通知とフッターとセッション entry とし、`console` は使わない。失敗理由の通知は要約失敗に限り、stale と不一致は汎用文面のままにする。
  - `tokensAfter` は、切れ目から後ろのメッセージの推定と要約の推定の和にする。実測から別の物差しの概算を引かない。`ready` の前は準備時の使用量、`applied` の前は適用時の使用量とし、`session_before_compact` では `before` を現在値に更新し、`after` は準備時の推定のままにする。
  - 今の `context-prune` を削除する。`Stack.Agent.Classifier` の Jev 1.13 を落とす。
- Options:
  - A: 内部モジュールをファイル URL で import する（Pi の破壊的変更に弱い。owner が B を選んだ）。
  - C: 公開の `findCutPoint` で前置きの要約を作り、イベントで差分を要約して合成する（要約が 2 回になり、差分の合成形式が独自で、標準コンパクションから外れる）。
  - D: Pi が `prepareCompaction` を export するまで待つ（このサイクルでは出せず、今の prune を残すことになる）。
  - `session_before_compact` で `cancel: true` を返し、バックグラウンドで要約する（閾値に達した後にキャンセルするので、overflow の危険がある）。
  - 今の `context-prune` の中身を置き換える（新しい主機能は非同期の標準コンパクションで、Jev のツール結果削除とは別物になる。旧い名前、settings、tests が残り、削除が不明瞭になる。owner が新規作成を選んだ）。
  - 今の Jev prune を残して並べる（二つの機構が同時にコンテキストを変え、どちらが効いたかわからなくなる。owner が完全な乗り換えを選んだ）。

### Definition

- `Unit.context-prune`(dropped):
- `Unit.context-precompact`(added): context-precompact: エージェントが、コンパクションを待たずに、コンテキストを空けられる
- `Stack.Agent.Classifier`(dropped):
- `Who.agent`(kept): エージェントが 1 人で進められること、判断は owner に来ることは変わらない
- `Who.owner`(kept): 判断をする役割は変わらない
- `What`(kept): ハーネス付きスターターという絵は変わらない
- `Product`(kept): ハーネス付きスターターのまま
- `Stack.Agent.Host`(kept): Pi をホストに使うことは変わらない
- `Stack.Agent.Schema`(kept): typebox を使うことは変わらない
