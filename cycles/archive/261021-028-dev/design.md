# DESIGN 028

## Possibly related files

### 01: ループした thinking をどの時点で、どの形に書き換えるか

- `cycles/261021-028-dev/adr.md` — 01 の決定、閾値と実測値
- `memo-scan-thinking.mjs` — 16-gram と distinct 比でセッションの thinking を走査した一時スクリプト
- `memo-scan-threshold.mjs` — 周期と被覆率を測った一時スクリプト
- `memo-scan-runs.mjs` — 帯の一覧を出した一時スクリプト
- `memo-scan-variants.mjs` — 畳み方 4 案を比べた一時スクリプト
- `memo-scan-demo.mjs` — 同じコーパスの見本を出した一時スクリプト
- `.pi/extensions/intent-router/index.ts` — entry の配線と `pi.on` 登録の前例
- `.pi/extensions/intent-router/route/hook.ts` — 値を返すフックの前例（返すか `undefined` か）
- `.pi/extensions/intent-router/route/hook.test.ts` — フックのテストの形
- `.pi/extensions/consult/sub/spec.ts` — `message_end` の assistant を見る既存の読み手
- `.pi/extensions/consult/sub/spec.test.ts` — `message_end` を扱うテストの形
- `.pi/extensions/quality-gate/index.ts` — 複数フックの配線の前例
- `.pi/extensions/sound-notify/index.ts` — 単一ファイルの配線の前例
- `node_modules/@earendil-works/pi-coding-agent/docs/extensions.md` — `message_end` の差し替え契約
- `node_modules/@earendil-works/pi-coding-agent/docs/message-types.md` — メッセージと thinking ブロックの形
- `node_modules/@earendil-works/pi-coding-agent/docs/session-format.md` — セッション JSONL の形
- `node_modules/@earendil-works/pi-coding-agent/docs/sessions.md` — セッションの読み直し
- `node_modules/@earendil-works/pi-coding-agent/docs/tui.md` — TUI の表示
- `.pi/extensions/consult/sub/spec.ts` — 確定後の assistant を読む側
- `.pi/extensions/consult/tool/render.ts` — 同じく確定後のメッセージを読む側
- `.pi/extensions/quality-gate/index.ts` — `agent_end` でメッセージを読む側
- `.pi/extensions/intent-router/index.ts` — セッションから assistant の文を読む側
- `.pi/extensions/intent-router/state/payload.ts` — owner と assistant の文から状態を作る側
- `package.json` — lint / format / typecheck / test の入口
- `.oxlintrc.json` — lint の規則（`.pi` とテストの上書きを含む）
- `.oxfmtrc.json` — 整形の設定
- `tsconfig.json` — root の型検査（`.pi` を除外）
- `.pi/tsconfig.json` — `.pi` 配下の型検査
- `scripts/checks/typecheck.mjs` — root と scopes の型検査
- `scripts/checks/typecheck-staged.mjs` — staged の型検査
- `scripts/checks/scopes.json` — 型検査の対象一覧
- `vitest.config.ts` — product のテスト除外
- `vitest.starter.config.ts` — starter の全件テスト
- `test/setup.ts` — テストの足場
- `lefthook.yaml` — commit と push の検査
- `.pi/extensions/quality-gate/checks.ts` — 検査を走らせる側
- `.pi/extensions/quality-gate/targets.ts` — 対象の絞り込み
- `.pi/extensions/quality-gate/report.ts` — 失敗の知らせ
- `.pi/extensions/intent-router/logs/` — 日別 JSONL の生成先
- `.pi/extensions/intent-router/record/log.ts` — 日別 JSONL の実装
- `DEFINITION.md` — `Users can do` に 1 行増える
- `definition/rules.md` — Unit の可否と命名
- `definition/format.md` — DEFINITION の書式
- `README.md` — 拡張の一覧
- `README.ja.md` — 拡張の一覧（日本語）
- `.pi/extensions/intent-router/README.md` — フック・コマンド・設定・記録の書き方の前例
- `.pi/extensions/quality-gate/README.md` — フックと段階の書き方の前例
- `.pi/extensions/consult/README.md` — ツールと設定の書き方の前例
- `.pi/extensions/sound-notify/README.md` — 引き金と設定の書き方の前例
- `AGENTS.md` — サイクルの流れと一時ファイルの後始末
- `test/README.md` — テストの足場の説明

### 02: 畳んだ跡に何を残すか

- `.pi/extensions/intent-router/route/decide.ts` — 純関数のモジュールの置き方
- `.pi/extensions/intent-router/route/decide.test.ts` — 同居するテストの名前と形
- `.pi/extensions/intent-router/judge/decide.ts` — 純関数のモジュールの置き方
- `.pi/extensions/intent-router/judge/decide.test.ts` — 同居するテストの形
- `.pi/extensions/quality-gate/report.ts` — 文字列を組み立てる純関数の前例
- `.pi/extensions/quality-gate/report.test.ts` — 純関数のテストの形
- `.pi/extensions/quality-gate/targets.ts` — 純関数の絞り込みの前例
- `.pi/extensions/quality-gate/targets.test.ts` — そのテストの形
- `.pi/extensions/quality-gate/index.ts` — 同居モジュールを読む entry の前例
- `.pi/extensions/intent-router/index.ts` — 同居モジュールを読む entry の前例
- `.pi/extensions/consult/index.ts` — entry の形
- `.pi/extensions/sound-notify/index.ts` — 単一ファイルの entry の形
- `.pi/extensions/intent-router/index.test.ts` — entry の配線のテスト
- `.pi/extensions/sound-notify/index.test.ts` — 単一ファイルの entry のテスト
- `vitest.config.ts` — product の設定とハーネスの除外
- `vitest.starter.config.ts` — starter の設定
- `package.json` — `test` / `test:run` / `test:related`
- `lefthook.yaml` — commit 時の関連テスト、push 時の全体
- `scripts/harness/list.mjs` — 除外の組み立て
- `scripts/harness/harness.json` — 除外を駆動する写しの一覧
- `test/setup.ts` — 両方の設定が読む足場
- `test/tmp.ts` — FS を触るテストの一時ディレクトリ
- `test/env.test.ts` — 足場と `tmpDir` の検査
- `.pi/extensions/quality-gate/checks.test.ts` — `test/tmp.ts` を読むテストの例
- `lib/git-env.mjs` — git を呼ぶテストの環境の掃除
- `tsconfig.json` — 型検査の対象
- `scripts/checks/scopes.json` — staged の型検査の範囲
- `scripts/checks/typecheck.mjs` — 型検査の走らせ方
- `scripts/checks/typecheck-staged.mjs` — staged の走らせ方
- `.oxlintrc.json` — テスト向けの上書きを含む lint 規則
- `.oxfmtrc.json` — 整形の設定
- `.pi/extensions/intent-router/logs/2026-10-21.jsonl` — 実行時に生成される記録の例
- `.pi/extensions/intent-router/logs/2026-10-20.jsonl` — 同じ
- `.pi/extensions/quality-gate/README.md` — Tests の節の書き方
- `.pi/extensions/consult/README.md` — コードの地図と Tests の表
- `.pi/extensions/intent-router/README.md` — コードの地図
- `.pi/extensions/sound-notify/README.md` — 導入と設定の形
- `test/README.md` — starter と product の分け方

### 03: どのブロックを書き換えの対象にするか

- `node_modules/@earendil-works/pi-coding-agent/docs/message-types.md` — `ThinkingContent` と `AssistantMessage` の契約
- `node_modules/@earendil-works/pi-coding-agent/docs/session-format.md` — assistant が `api` / `provider` / `model` を持つこと
- `node_modules/@earendil-works/pi-coding-agent/dist/core/messages.d.ts` — `AgentMessage` の拡張と `convertToLlm` の型
- `node_modules/@earendil-works/pi-coding-agent/examples/extensions/custom-provider-anthropic/index.ts` — `thinkingSignature` を読む例
- `node_modules/.pnpm/@earendil-works+pi-ai@1.3.0_*/node_modules/@earendil-works/pi-ai/dist/types.d.ts` — `ThinkingContent` と `AssistantMessage` の型形状
- `node_modules/.pnpm/@earendil-works+pi-ai@1.3.0_*/node_modules/@earendil-works/pi-ai/dist/api/openai-completions.js` — replay 先のフィールド名の一覧
- `node_modules/.pnpm/@earendil-works+pi-ai@1.3.0_*/node_modules/@earendil-works/pi-ai/dist/api/transform-messages.js` — `redacted` と `thinkingSignature` の分岐
- `node_modules/.pnpm/@earendil-works+pi-ai@1.3.0_*/node_modules/@earendil-works/pi-ai/dist/api/openai-completions.js` — 結合した thinking を送る側
- `node_modules/@earendil-works/pi-coding-agent/dist/core/agent-session.js` — 差し替えたメッセージを次ターンに読む側
- `node_modules/.pnpm/@earendil-works+pi-agent-core@1.3.0_*/node_modules/@earendil-works/pi-agent-core/dist/agent-loop.js` — メッセージ列を読むループ
- `.pi/extensions/intent-router/state/payload.ts` — `content` の `type === 'text'` を読む既存コード
- `.pi/extensions/intent-router/judge/hook.ts` — ブロックの型を読む既存コード
- `.pi/extensions/sound-notify/index.ts` — `part.type === 'text'` を読む既存コード
- `.pi/extensions/consult/sub/spec.ts` — 自前の型でメッセージを読む既存コード
- `.pi/extensions/intent-router/ask/ask.ts` — `model.provider` / `model.id` を読む既存コード
- `tsconfig.json` — root の型検査
- `.pi/tsconfig.json` — `.pi` の型検査
- `scripts/checks/scopes.json` — 型検査の対象
- `scripts/checks/typecheck.mjs` — 型検査の走らせ方
- `scripts/checks/typecheck-staged.mjs` — staged の走らせ方
- `package.json` — `typecheck` の入口
- `lefthook.yaml` — commit と push の型検査
- `cycles/261021-028-dev/adr.md` — 03 の決定

### 04: 操作の口と Unit の `Who`

- `.pi/extensions/intent-router/index.ts` — `settings.json` の所在と `registerCommand` の配線
- `.pi/extensions/intent-router/command/intent.ts` — コマンドの解析と登録
- `.pi/extensions/intent-router/settings/read.ts` — `settings.json` を読み直す形
- `.pi/extensions/intent-router/settings/schema.ts` — 既定値と部分上書きの検証
- `.pi/extensions/intent-router/settings.json` — 拡張に隣接する設定ファイルの形
- `.pi/extensions/intent-router/state/run.ts` — モードを保持する形
- `.pi/extensions/intent-router/record/log.ts` — 日別 JSONL の前例
- `.pi/extensions/consult/index.ts` — 複数コマンドの登録
- `.pi/extensions/consult/types.json` — 拡張に隣接する別の設定ファイル
- `.pi/extensions/intent-router/command/intent.test.ts` — コマンド登録と設定の書き換えの検査
- `.pi/extensions/intent-router/settings/read.test.ts` — 読み直しの検査
- `.pi/extensions/intent-router/settings/schema.test.ts` — 部分上書きと拒否の検査
- `.pi/extensions/intent-router/index.test.ts` — コマンド 1 件の登録の検査
- `.pi/extensions/intent-router/README.md` — `Commands` と `Settings` の表の前例
- `.pi/extensions/consult/README.md` — コマンドの対応表の前例
- `.pi/extensions/intent-router/logs/` — 日別 JSONL の生成先
- `.pi/extensions/intent-router/logs/2026-10-21.jsonl` — 生成物の実例
- `README.md` — 拡張の一覧
- `README.ja.md` — 拡張の一覧
- `DEFINITION.md` — `Users can do` と `Who`
- `definition/format.md` — `Users can do` の書式
- `definition/rules.md` — Unit の可否と命名
- `tsconfig.json` — root の型検査
- `.pi/tsconfig.json` — `.pi` の型検査
- `scripts/checks/scopes.json` — 型検査の対象
- `scripts/checks/typecheck.mjs` — 型検査の走らせ方
- `scripts/checks/typecheck-staged.mjs` — staged の走らせ方
- `vitest.starter.config.ts` — 全件のテスト
- `vitest.config.ts` — product のテスト除外
- `test/tmp.ts` — 一時ディレクトリの helper
- `test/setup.ts` — テストの足場
- `test/README.md` — starter と product の検査範囲
- `lefthook.yaml` — commit と push の検査
- `package.json` — `test` と `typecheck`

## `thinking-scrub`

### ADR & Where

- No: 01, 02, 03, 04
- Why: 4 つの entry が同じ新しい拡張の同じファイル群を読み書きし、コマンドと状態は 01〜03 が作る検出結果と状態の形に依存するので、1 つの worktree で 1 つの subagent が順にやる。
- Where: worktree

### Scope

- `Unit.thinking-scrub`: `DEFINITION.md` の `Users can do` に「エージェントが、ループした thinking を取り除き、次のターンに持ち越さない」を足す。

### Boundary

- Plans: なし
- External:
  - `@earendil-works/pi-coding-agent`: `message_end` の差し替え契約と `registerCommand` の署名
    - Version: 1.3.0
  - `opencode-go/deepseek-v4.1-flash`: thinking を `reasoning_content` として replay する形状
    - Contract: 対象ブロックの `thinkingSignature` が reasoning のフィールド名であること
