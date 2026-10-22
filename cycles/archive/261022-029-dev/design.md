# DESIGN 029

## Possibly related files

### 01: 古い履歴をどの単位で、どの形で送る文脈から外すか

- `memo-extention.md` — 求めの出所
- `node_modules/@earendil-works/pi-coding-agent/dist/core/session-manager.js` — `projectContextEntry` の `replacement` 分岐
- `node_modules/@earendil-works/pi-coding-agent/dist/core/session-manager.d.ts` — `ContextEditEntry` と `SessionEntry` の型
- `node_modules/@earendil-works/pi-coding-agent/dist/core/agent-session.js` — 境界で返したエントリをコミットする実装
- `node_modules/@earendil-works/pi-coding-agent/dist/core/extensions/types.d.ts` — フック返り値の型
- `node_modules/@earendil-works/pi-coding-agent/dist/bundle/chunks/chunk-2JW42LFQ.js` — 孤立した tool call を補う処理
- `.pi/extensions/intent-router/index.ts` — 拡張の配線と `pi.on` 登録の前例
- `.pi/extensions/intent-router/route/hook.ts` — 値を返すフックの前例
- `.pi/extensions/intent-router/judge/hook.ts` — `turn_end` でまとめて聞く前例
- `.pi/extensions/thinking-scrub/index.ts` — メッセージ書換え系の配線の前例
- `.pi/extensions/consult/sub/budget.ts` — `turn_end` から値を返す前例
- `.pi/extensions/consult/index.ts` — コマンド登録を含む配線の前例
- `.pi/extensions/quality-gate/index.ts` — 複数フックの配線の前例
- `.pi/extensions/sound-notify/index.ts` — 単一ファイルの配線の前例
- `package.json` — lint / format / typecheck / test の入口
- `.oxlintrc.json` — lint の規則
- `.oxfmtrc.json` — 整形の設定
- `tsconfig.json` — root の型検査
- `.pi/tsconfig.json` — `.pi` 配下の型検査
- `scripts/checks/scopes.json` — 型検査の対象一覧
- `scripts/checks/typecheck.mjs` — 型検査の走らせ方
- `scripts/checks/typecheck-staged.mjs` — staged の型検査
- `vitest.config.ts` — product のテスト除外
- `vitest.starter.config.ts` — starter の全件テスト
- `test/setup.ts` — テストの足場
- `lefthook.yaml` — commit と push の検査
- `.pi/extensions/quality-gate/checks.ts` — ターン変更分の検査
- `.pi/extensions/quality-gate/targets.ts` — 検査対象の絞り込み
- `.pi/extensions/quality-gate/report.ts` — 検査失敗の通知
- `cycles/261022-029-dev/adr.md` — 01 の決定
- `DEFINITION.md` — `Users can do` に 1 行増える先
- `definition/rules.md` — Unit の可否と命名
- `definition/format.md` — DEFINITION の書式
- `README.md` — 拡張の一覧
- `README.ja.md` — 拡張の一覧（日本語）
- `AGENTS.md` — サイクルと一時ファイルの後始末
- `test/README.md` — テスト範囲の説明
- `node_modules/@earendil-works/pi-coding-agent/docs/extensions.md` — 境界と `context_edit` 返却の契約
- `node_modules/@earendil-works/pi-coding-agent/docs/session-format.md` — `replacement` の意味
- `node_modules/@earendil-works/pi-coding-agent/docs/message-types.md` — `ToolResultMessage` の形
- `node_modules/@earendil-works/pi-coding-agent/docs/compaction.md` — 既定圧縮と `context_edit`
- `.pi/extensions/intent-router/README.md` — フックと設定の書き方
- `.pi/extensions/quality-gate/README.md` — フックと段階の書き方
- `.pi/extensions/consult/README.md` — ツールと設定の書き方
- `.pi/extensions/sound-notify/README.md` — 引き金と設定の書き方
- `.pi/extensions/thinking-scrub/README.md` — 書換え拡張の書き方

### 02: いつ発動し、いつ反映するか

- `node_modules/@earendil-works/pi-coding-agent/dist/core/extensions/types.d.ts` — `ContextUsage`・`getContextUsage`・`turn_end`・`agent_before_settle`・`agent_settled`・`context_edit` の型
- `node_modules/@earendil-works/pi-coding-agent/dist/core/agent-session.js` — `getContextUsage` の算出と境界の確定
- `node_modules/@earendil-works/pi-coding-agent/dist/core/extensions/runner.js` — 境界ハンドラの await と文脈の再構築
- `node_modules/@earendil-works/pi-coding-agent/examples/extensions/trigger-compact.ts` — `turn_end` で `getContextUsage` を読む前例
- `.pi/extensions/intent-router/judge/hook.ts` — `turn_end` に登録し戻り値で差し込む前例
- `.pi/extensions/consult/sub/budget.ts` — `turn_end` から値を返し `continue: true` を返す前例
- `.pi/extensions/quality-gate/index.ts` — `agent_end` に登録する前例
- `.pi/extensions/sound-notify/index.ts` — `agent_settled` に登録し通知だけ送る前例
- `.pi/extensions/intent-router/index.ts` — 設定を読み直して `turn_end` に配線する前例
- `.pi/extensions/intent-router/settings.json` — 拡張隣の設定ファイル
- `.pi/extensions/intent-router/settings/schema.ts` — 範囲外と未知キーを弾く形
- `.pi/extensions/intent-router/settings/read.ts` — 不在時は既定、破損時は投げる読み方
- `node_modules/@earendil-works/pi-coding-agent/dist/core/session-manager.js` — `context_edit` の投影
- `.pi/extensions/intent-router/judge/hook.test.ts` — `turn_end` の分岐のテスト
- `.pi/extensions/intent-router/index.test.ts` — 配線順のテスト
- `.pi/extensions/intent-router/settings/read.test.ts` — 設定の読みのテスト
- `.pi/extensions/intent-router/settings/schema.test.ts` — 閾値と範囲のテスト
- `.pi/extensions/consult/sub/budget.test.ts` — 1 度だけ促す振る舞いのテスト
- `.pi/extensions/sound-notify/index.test.ts` — `agent_settled` ハンドラのテスト
- `node_modules/@earendil-works/pi-coding-agent/docs/extensions.md` — 境界の契約
- `node_modules/@earendil-works/pi-coding-agent/docs/compaction.md` — 既定の発動式と回復の順序
- `node_modules/@earendil-works/pi-coding-agent/docs/session-format.md` — `context_edit` の効き方
- `.pi/extensions/intent-router/README.md` — `turn_end` の judge と設定の再読
- `.pi/extensions/quality-gate/README.md` — `agent_end` を使う理由
- `.pi/extensions/sound-notify/README.md` — `agent_settled` の意味

### 03: Jev に何を渡し、要約をどこに置くか

- `.pi/extensions/intent-router/ask/ask.ts` — `state` と複数 `questions` を `registry.classify` に渡す前例
- `.pi/extensions/intent-router/ask/questions.ts` — 問いの形の前例
- `.pi/extensions/intent-router/state/payload.ts` — `state` の組み立てと本文の短縮
- `.pi/extensions/intent-router/state/run.ts` — `Run` 型と上限値
- `.pi/extensions/intent-router/settings/schema.ts` — 閾値と上限の設定形
- `.pi/extensions/intent-router/settings/read.ts` — `settings.json` の読み
- `.pi/extensions/intent-router/settings.json` — 分類器の候補としきい値
- `node_modules/@earendil-works/pi-coding-agent/dist/core/model-registry.d.ts` — `classify` と `complete` の署名
- `node_modules/@earendil-works/pi-coding-agent/examples/extensions/custom-compaction.ts` — `complete` で要約する前例
- `node_modules/@earendil-works/pi-coding-agent/examples/extensions/summarize.ts` — `complete` で要約する前例
- `node_modules/@earendil-works/pi-coding-agent/examples/extensions/jev-router.ts` — `state` と `questions` で分類する前例
- `node_modules/@earendil-works/pi-coding-agent/dist/core/compaction/compaction.d.ts` — `generateSummary` の署名
- `node_modules/@earendil-works/pi-coding-agent/dist/core/compaction/utils.d.ts` — `serializeConversation` の署名
- `node_modules/@earendil-works/pi-coding-agent/dist/index.d.ts` — 要約と直列化の公開 export
- `node_modules/.pnpm/@earendil-works+pi-ai@1.3.0_@aws-sdk+credential-provider-node@3.972.83_@smithy+signatur_7677b878fb802f1a0a294f90bd71c16c/node_modules/@earendil-works/pi-ai/dist/models.d.ts` — `classify` の型
- `.pi/extensions/intent-router/judge/decide.ts` — `confidence` を閾値で読む前例
- `.pi/extensions/intent-router/route/decide.ts` — `confidence` を閾値で読む前例
- `.pi/extensions/intent-router/judge/hook.ts` — 複数の答えを読む前例
- `.pi/extensions/intent-router/route/hook.ts` — 1 つの答えを読む前例
- `.pi/extensions/intent-router/index.ts` — `ask` と `askBatch` の配線
- `.pi/extensions/intent-router/ask/ask.test.ts` — `ask` と `askBatch` のテスト
- `.pi/extensions/intent-router/state/payload.test.ts` — `state` の組み立てのテスト
- `.pi/extensions/intent-router/state/run.test.ts` — `Run` の操作のテスト
- `.pi/extensions/intent-router/settings/schema.test.ts` — 設定値の検証のテスト
- `.pi/extensions/intent-router/settings/read.test.ts` — 設定の読みのテスト
- `.pi/extensions/intent-router/judge/decide.test.ts` — 閾値の判定のテスト
- `.pi/extensions/intent-router/route/decide.test.ts` — 閾値の判定のテスト
- `.pi/extensions/intent-router/judge/hook.test.ts` — 判定の実行のテスト
- `.pi/extensions/intent-router/route/hook.test.ts` — 判定の実行のテスト
- `.pi/extensions/intent-router/index.test.ts` — 配線のテスト
- `node_modules/@earendil-works/pi-coding-agent/docs/compaction.md` — 要約と直列化の仕様
- `.pi/extensions/intent-router/README.md` — state の上限の記録
- `memo-extention.md` — 直近の 50,000 トークンの要約と Jev の要求元

### 04: 失敗と誤判定にどう備え、どう操作するか

- `.pi/extensions/intent-router/index.ts` — 設定の読み直しとコマンド登録の配線
- `.pi/extensions/intent-router/command/intent.ts` — 引数なしの表示と `on` / `off` / `set` の解釈
- `.pi/extensions/intent-router/settings/read.ts` — 拡張隣の `settings.json` の読みと破損時の送出
- `.pi/extensions/intent-router/settings/schema.ts` — 未知キーと範囲外を投げる検証
- `.pi/extensions/intent-router/settings.json` — 拡張隣に置く設定
- `.pi/extensions/consult/index.ts` — 複数コマンドの登録
- `.pi/extensions/consult/types.json` — 呼ぶたびに読む設定
- `.pi/extensions/thinking-scrub/index.ts` — `on` / `off` と状態表示の配線
- `.pi/extensions/thinking-scrub/command/scrub.ts` — 引数なしの状態表示と `on` / `off` の解釈
- `.pi/extensions/thinking-scrub/settings/read.ts` — 設定の読み
- `.pi/extensions/thinking-scrub/settings/schema.ts` — 設定の形
- `.pi/extensions/thinking-scrub/settings.json` — 置き場
- `.pi/extensions/sound-notify/index.ts` — 拡張隣の設定の読みと既定値の運用
- `.pi/extensions/intent-router/ask/ask.ts` — 分類の失敗を `failed` で返す形
- `.pi/extensions/intent-router/route/hook.ts` — 失敗時に何も差し込まない前例
- `.pi/extensions/intent-router/judge/hook.ts` — `turn_end` で失敗時に何も差し込まない前例
- `node_modules/@earendil-works/pi-coding-agent/docs/extensions.md` — `registerCommand` の仕様
- `node_modules/@earendil-works/pi-coding-agent/docs/settings.md` — 設定の仕様
- `node_modules/@earendil-works/pi-coding-agent/docs/compaction.md` — 既定のコンパクションの発動条件
- `.pi/extensions/intent-router/logs/2026-10-22.jsonl` — 日ごとに足される生成物の実例
- `.pi/extensions/intent-router/settings.json` — `set` で書き換わる対象の実例
- `.pi/extensions/thinking-scrub/settings.json` — `on` / `off` で書き換わる対象の実例
- `.pi/extensions/intent-router/command/intent.test.ts` — コマンドの解釈と表示のテスト
- `.pi/extensions/intent-router/settings/read.test.ts` — 設定の読みのテスト
- `.pi/extensions/intent-router/settings/schema.test.ts` — 検証と既定の重ねのテスト
- `.pi/extensions/intent-router/index.test.ts` — 破損した設定の送出を含む配線のテスト
- `.pi/extensions/thinking-scrub/command/scrub.test.ts` — コマンドの解釈のテスト
- `.pi/extensions/thinking-scrub/settings/read.test.ts` — 設定の読みのテスト
- `.pi/extensions/thinking-scrub/settings/schema.test.ts` — 設定の解釈のテスト
- `.pi/extensions/thinking-scrub/index.test.ts` — コマンドと設定の再読の配線のテスト
- `.pi/extensions/quality-gate/index.ts` — ターンの変更分の検査の配線
- `.pi/extensions/quality-gate/checks.ts` — 検査の実行
- `lefthook.yaml` — commit と push の検査
- `package.json` — `lint`・`typecheck`・`test` の脚本
- `vitest.starter.config.ts` — ハーネスを含む検査対象
- `vitest.config.ts` — product 側の検査対象
- `scripts/checks/typecheck.mjs` — 型検査の実行
- `scripts/checks/typecheck-staged.mjs` — 変更分の型検査
- `.pi/extensions/intent-router/README.md` — `/intent` と設定表の文書化
- `.pi/extensions/thinking-scrub/README.md` — `/thinking-scrub` と設定の文書化
- `.pi/extensions/consult/README.md` — 複数コマンドと設定の文書化
- `.pi/extensions/sound-notify/README.md` — 設定の文書化
- `README.md` — 拡張の一覧
- `README.ja.md` — 拡張の一覧（日本語）
- `DEFINITION.md` — `Users can do` の置き場
- `memo-extention.md` — 要求元

### 05: 差し込んだ結果を TUI にどう出すか

- `node_modules/@earendil-works/pi-coding-agent/examples/extensions/entry-renderer.ts` — `appendEntry` と `registerEntryRenderer` の前例
- `node_modules/@earendil-works/pi-coding-agent/dist/modes/interactive/components/compaction-summary-message.js` — 標準カードの形
- `node_modules/@earendil-works/pi-coding-agent/dist/modes/interactive/components/custom-entry.js` — `custom` エントリの描画
- `node_modules/@earendil-works/pi-coding-agent/dist/modes/interactive/interactive-mode.js` — `entry_appended` の振り分け
- `node_modules/@earendil-works/pi-coding-agent/dist/core/extensions/types.d.ts` — `EntryRenderer`・`registerEntryRenderer`・`appendEntry` の署名
- `node_modules/@earendil-works/pi-coding-agent/dist/core/extensions/loader.js` — `@earendil-works/pi-tui` のエイリアス解決
- `node_modules/@earendil-works/pi-coding-agent/dist/core/session-manager.d.ts` — `custom` が文脈に参加しない契約
- `node_modules/@earendil-works/pi-coding-agent/dist/modes/interactive/theme/theme.js` — renderer に渡る `Theme`
- `node_modules/@earendil-works/pi-coding-agent/dist/modes/interactive/theme/theme-tokens.js` — `customMessageBg` と `customMessageLabel`
- `node_modules/.pnpm/@earendil-works+pi-tui@1.3.0/node_modules/@earendil-works/pi-tui/dist/components/box.js` — カードの外枠
- `node_modules/.pnpm/@earendil-works+pi-tui@1.3.0/node_modules/@earendil-works/pi-tui/dist/components/text.js` — ラベルと折りたたみの行
- `node_modules/.pnpm/@earendil-works+pi-tui@1.3.0/node_modules/@earendil-works/pi-tui/dist/components/markdown.js` — 展開時の要約
- `node_modules/.pnpm/@earendil-works+pi-tui@1.3.0/node_modules/@earendil-works/pi-tui/dist/components/mouse-region.js` — クリックでの展開
- `node_modules/.pnpm/@earendil-works+pi-tui@1.3.0/node_modules/@earendil-works/pi-tui/dist/components/spacer.js` — カード内の余白
- `node_modules/@earendil-works/pi-coding-agent/docs/extensions.md` — `appendEntry` とコマンド登録の契約
- `node_modules/@earendil-works/pi-coding-agent/docs/tui.md` — 部品の組み立て方
- `node_modules/@earendil-works/pi-coding-agent/docs/packages.md` — pi-tui の供給形態と `peerDependencies`
- `node_modules/@earendil-works/pi-coding-agent/docs/session-format.md` — `custom` エントリと renderer の関係
- `package.json` — 依存の宣言
- `pnpm-workspace.yaml` — 版の固定
- `tsconfig.json` — root の型検査
- `.pi/tsconfig.json` — `.pi` 配下の型検査
- `scripts/checks/typecheck.mjs` — 型検査の実行
- `scripts/checks/scopes.json` — 型検査の対象一覧
- `scripts/checks/typecheck-staged.mjs` — staged の型検査
- `.oxlintrc.json` — lint の規則
- `.oxfmtrc.json` — 整形の設定
- `vitest.starter.config.ts` — starter の全件テスト
- `vitest.config.ts` — product のテスト除外
- `test/setup.ts` — テストの足場
- `lefthook.yaml` — commit と push の検査
- `cycles/261022-029-dev/adr.md` — 05 の決定
- `memo-extention.md` — 求めの出所
- `DEFINITION.md` — 製品の絵
- `definition/rules.md` — Unit の可否と命名
- `definition/format.md` — DEFINITION の書式

### 06: 閾値を待たずに、その場で走らせる口をどう持つか

- `.pi/extensions/intent-router/command/intent.ts` — `/intent` の引数の分解と登録の前例
- `.pi/extensions/intent-router/index.ts` — `pi.registerCommand` への橋渡し
- `.pi/extensions/thinking-scrub/command/scrub.ts` — 引数なし・`on`・`off` の分解
- `.pi/extensions/thinking-scrub/index.ts` — `registerCommand` の登録と通知の配線
- `.pi/extensions/consult/index.ts` — 複数コマンドの登録
- `node_modules/@earendil-works/pi-coding-agent/docs/extensions.md` — `registerCommand`・`ExtensionCommandContext`・`appendEntry`
- `node_modules/@earendil-works/pi-coding-agent/dist/core/extensions/types.d.ts` — `registerCommand`・`ExtensionCommandContext`・`getContextUsage`・`appendEntry`・`context_edit`
- `node_modules/@earendil-works/pi-coding-agent/dist/core/session-manager.d.ts` — `ReadonlySessionManager` と `ContextEditEntry`
- `node_modules/@earendil-works/pi-coding-agent/dist/core/session-manager.js` — 蓄積された `custom` と `context_edit` から送る文脈を作る実装
- `node_modules/@earendil-works/pi-coding-agent/dist/core/agent-session.js` — 境界の返りをその場でコミットする実装
- `.pi/extensions/intent-router/command/intent.test.ts` — コマンドの分解と登録のテスト
- `.pi/extensions/intent-router/index.test.ts` — コマンド登録を含む配線のテスト
- `.pi/extensions/thinking-scrub/command/scrub.test.ts` — コマンドの分解と実行のテスト
- `.pi/extensions/thinking-scrub/index.test.ts` — コマンド実行の配線のテスト
- `.pi/extensions/consult/tool/consult.test.ts` — 停止の口のテスト
- `cycles/261022-029-dev/adr.md` — 06 の決定
- `memo-extention.md` — 求めの出所
- `.pi/extensions/intent-router/README.md` — コマンド一覧の記載
- `.pi/extensions/thinking-scrub/README.md` — コマンド一覧の記載
- `.pi/extensions/consult/README.md` — コマンド一覧の記載
- `README.md` — 拡張の一覧
- `README.ja.md` — 拡張の一覧（日本語）

## `context-prune`

### ADR & Where

- No: 01, 02, 03, 04, 05, 06
- Why: 6 つの entry が同じ新しい拡張の同じファイル群（型、設定、entry、フック、コマンド、カード）を読み書きし、05 と 06 は 01〜04 が決める状態の形の上に立つので、1 つの worktree で 1 つの subagent が順にやる。
- Where: worktree

### Scope

- `Unit.context-prune`: `DEFINITION.md` の `Users can do` に「エージェントが、古いツール結果のうち要らないものを送る文脈から外し、コンテキストを空けられる」を足す。

### Boundary

- Plans: なし
- External:
  - `@earendil-works/pi-coding-agent`: 拡張 API が求める形（`turn_end` と `agent_before_settle` の返り値、`context_edit`、`appendEntry` と `registerEntryRenderer`、`registerCommand`、`getContextUsage`、`modelRegistry.complete` と `classify`、公開の `estimateTokens` / `serializeConversation` / `generateSummary`）
    - Version: 1.3.0
  - `@earendil-works/pi-tui`: カードを描く部品（`Box`、`Container`、`Text`、`Markdown`、`MouseRegion`、`Spacer`）と `Theme`
    - Version: 1.3.0
  - `opencode/jev-1.13-free`: state と questions を受けて、問いごとの答えを返す
    - Contract: state ＋ 最長の問いで 32k、全体で 64k に収まること
    - Limit: 32k（state ＋ 最長の問い）
