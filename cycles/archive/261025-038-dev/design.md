# DESIGN 038

## Affected

### 01: 標準コンパクションの待ち時間を、Jev を使わずに、非同期の前準備でなくす形をどうするか

#### Reads

- `package.json` — `@earendil-works/pi-coding-agent` のバージョン契約を含むためです。
- `.pi/skills/adr/SKILL.md` — `DEFINITION.md` と `definition/` を読むためです。
- `.pi/skills/design/SKILL.md` — `DEFINITION.md` を読むためです。
- `.pi/skills/propose/SKILL.md` — `DEFINITION.md` と `definition/rules.md` を読むためです。
- `.pi/skills/yolo/SKILL.md` — `DEFINITION.md` と ADR を読むためです。
- `.pi/skills/plan/SKILL.md` — `definition` を product's picture として読むためです。
- `definition/rules.md` — `DEFINITION.md` の規則を読むためです。
- `definition/format.md` — `DEFINITION.md` の形を読むためです。

#### Checks

- `package.json` — `test`、`lint`、`typecheck`、`test:run`、`test:related`、`typecheck:staged` のスクリプトを持つためです。
- `vitest.starter.config.ts` — `vitest.config.ts` の `testConfig(true)` を使うためです。
- `vitest.config.ts` — `passWithNoTests` とテスト設定を持つためです。
- `.pi/tsconfig.json` — `.pi` 配下の型チェックの設定を持つためです。
- `scripts/checks/typecheck.mjs` — `scopes.json` を読み、`tsc -p` を回すためです。
- `scripts/checks/scopes.json` — `[".pi"]` を含むためです。
- `lefthook.yaml` — pre-commit と pre-push の検査を持つためです。
- `.oxlintrc.json` — `.pi/**/*.{ts,mts,cts}` の lint 設定を持つためです。
- `.oxfmtrc.json` — format の設定を持つためです。
- `.pi/extensions/quality-gate/` — 変更分を検査するためです。
- `.pi/extensions/context-prune/doc.test.ts` — 既存の doc test が `DEFINITION.md` と README の文言を数えるためです。

#### Generated

- なし

## External

### 01: 標準コンパクションの待ち時間を、Jev を使わずに、非同期の前準備でなくす形をどうするか

- Pi の `compact()` 公開 API — 要約を生成します。
- Pi の `session_before_compact` イベント — 競合時に precomputed result を返します。
- Pi の拡張ローダー / イベントホスト（`turn_end`、`agent_before_settle`、`session_before_compact`） — 差し込みの経路です。
- Pi の `ExtensionUIContext.setStatus` / `notify` — フッターと通知に使います。
- Pi の settings（`compaction.enabled`） — `getSettings()` で読み、false なら自動のプレコンパクトを動かしません。
- Pi 1.3.0 の `prepareCompaction` ソース — コピー元のバージョン契約です。
- モデルプロバイダの認証 / API — `compact()` が要約を生成するときに使います。
- モデルの `contextWindow` / `maxTokens` — `thresholdRatio` と `keepRecentTokens` の判定、`getContextUsage()` に使います。
- セッション JSONL ストア — この変更は直接書かず、`CompactionEntry` を Pi に渡します。
- Pi の `registerCommand` — `/prune` を `/precompact` に置き換えます。

## `async-precompact`

### ADR & Where

- No: 01
- Why: この plan は、新しい `context-precompact` の追加と今の `context-prune` の削除を同じ入力（ADR 01 と `context-prune`）から行い、分けると二つの機構が同時に動く期間ができるため 1 plan にまとめ、待つ plan はないためです。
- Where: worktree（owner は close で reload して確かめる）

### Summary

- 新しい `context-precompact` 拡張を作り、今の `context-prune` を削除します。両者は同じ plan で入れ替え、同時に動かしません。
- B: `prepareCompaction` と補助関数を Pi 1.3.0 から 1 つのモジュールにコピーします。`compact()` は公開 API を使い、要約プロンプトは Pi の `compact()` に任せます。projection は `buildSessionProjection()`、pathEntries は `getBranch()` から渡します。
- `tokensBefore` は準備時点の `getContextUsage()` を使います。`turn_end` の境界 draft では Pi が再計算し、`session_before_compact` で返すときはその時点の `getContextUsage()` で更新します。
- 標準コンパクションは置き換えません。`thresholdRatio - LEAD_RATIO` から裏で準備し、`turn_end` を主経路、`session_before_compact` を競合時の経路、`agent_before_settle` を補助にします。失敗、stale、照合不一致、`firstKeptEntryId` 不在では Pi の既定に任せます。
- `session_before_compact` では、`firstKeptEntryId`、`messagesToSummarize` の件数、`turnPrefixMessages` の件数、`previousSummary`、`fileOps` の集合を照合し、一致しなければ捨てます。前回の `fromHook: true` の `details` から `readFiles` / `modifiedFiles` を `read` / `edited` に merge します。
- 適用前に `firstKeptEntryId` の存在、session id と準備時の leaf id、準備後の新しい `compaction` の不在を確認します。
- 設定は `enabled`、`keepRecentTokens`、`thresholdRatio` です。`thresholdRatio` は適用閾値で、lead、`reserveTokens`、timeout、rearm は内部です。Pi の `compaction.enabled` と拡張の `enabled` の両方が true のときだけ動きます。
- status line は `setStatus` で preparing / ready / failed を出し、適用、破棄、session 切替で clear します。`notify` で applied とフォールバックを知らせます。`tokensAfter` は `tokensBefore - oldTokens + summaryTokens` の概算とし、ready の数字は概算としてログに残します。README、`DEFINITION.md`、`definition/format.md` も更新します。
- 新しい拡張の tests で、gate / lead、3 経路、5 項目照合、`fileOps` merge、stale / session / leaf / 新しい `compaction`、両 `enabled`、status / notify、`tokensAfter`、doc の文言を確かめます。

### Paths

- `.pi/extensions/context-precompact/` — 新しい拡張です。`prepare` / `run` / `apply` / `ui` / `command` / `settings` / tests を含みます。
- `.pi/extensions/context-prune/` — 今の Jev prune を削除します。
- `README.md` — `context-precompact` と `/precompact` の説明に更新します。
- `README.ja.md` — 同じ説明を日本語で更新します。
- `DEFINITION.md` — `Unit.context-prune` を落とし、`Unit.context-precompact` を追加し、`Stack.Agent.Classifier` を落とします。
- `definition/format.md` — Defaults の Stack 表から `Agent | Classifier | Jev 1.13` を落とします。

### Boundary

- Plans: なし
- External:
  - Pi の `compact()` 公開 API: 要約を生成します。
    - Contract: ルートから import できる。`session_before_compact` を発火しない。
  - Pi の `session_before_compact` イベント: 競合時に precomputed result を返します。
    - Contract: `preparation` を渡す。`tokensBefore` を再計算しない。
  - Pi の拡張ローダー / イベントホスト: `turn_end`、`agent_before_settle`、`session_before_compact` を購読します。
    - Contract: Pi の extension event の形に従う。
  - Pi の `ExtensionUIContext.setStatus` / `notify`: フッターと通知に使います。
    - Contract: `setStatus(key, text | undefined)`、`notify(message, type?)`。
  - Pi の settings（`compaction.enabled`）: `getSettings()` で読みます。
    - Contract: `getSettings()` は `ExtensionAPI` にあり、イベント context にはない。
  - Pi 1.3.0 の `prepareCompaction` ソース: コピー元です。
    - Contract: `package.json` の `^1.3.0`。コピーが event preparation と一致すること。
  - モデルプロバイダの認証 / API: `compact()` が使います。
    - Contract: Pi の認証経路をそのまま使う。
  - モデルの `contextWindow` / `maxTokens`: 設定の判定に使います。
    - Contract: `getContextUsage()` の `tokens` / `contextWindow`。
  - セッション JSONL ストア: `CompactionEntry` を積みます。
    - Contract: この変更は直接書かず、Pi に渡す。
  - Pi の `registerCommand`: 新しいコマンドを登録します。
    - Contract: `pi.registerCommand(name, { description, handler })`。
