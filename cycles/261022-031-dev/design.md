# DESIGN 031

## Possibly related files

### 01: 要約の生成に、独自の出力上限を持つか

- 読む: `.pi/extensions/context-prune/settings/schema.ts`、`.pi/extensions/context-prune/settings.json`、`.pi/extensions/context-prune/settings/read.ts`
- 読む: `.pi/extensions/context-prune/prune/ports.ts` — `summaryTokens` から `reserveTokens` を作って要約関数へ渡す
- 読む: `node_modules/@earendil-works/pi-coding-agent/dist/core/compaction/compaction.js`、`node_modules/@earendil-works/pi-coding-agent/dist/core/compaction/compaction.d.ts`
- 読まれる: `.pi/extensions/context-prune/prune/run.ts`、`.pi/extensions/context-prune/prune/judge.ts`、`.pi/extensions/context-prune/entry/data.ts`、`.pi/extensions/context-prune/entry/render.ts`、`.pi/extensions/context-prune/index.ts`
- 検査: `.pi/extensions/context-prune/prune/ports.test.ts`、`.pi/extensions/context-prune/index.test.ts`、`.pi/extensions/context-prune/settings/schema.test.ts`、`.pi/extensions/context-prune/doc.test.ts`
- 生成: `.pi/extensions/context-prune/settings.json` — `command/prune.ts` の `writeEnabled` が書く先
- 文書: `.pi/extensions/context-prune/README.md`、`cycles/261022-029-dev/plan/context-prune.md`、`node_modules/@earendil-works/pi-coding-agent/docs/compaction.md`

### 02: Jev に渡す state をどう作るか

- 読む: `.pi/extensions/context-prune/prune/collect.ts`、`.pi/extensions/context-prune/prune/judge.ts`、`.pi/extensions/context-prune/prune/ports.ts`
- 読む: `.pi/extensions/context-prune/settings/schema.ts`、`.pi/extensions/context-prune/settings/read.ts`、`.pi/extensions/context-prune/settings.json`、`.pi/extensions/context-prune/index.ts`
- 読む: `node_modules/@earendil-works/pi-coding-agent/dist/core/compaction/compaction.js`
- 読まれる: `.pi/extensions/context-prune/prune/run.ts`、`.pi/extensions/context-prune/entry/data.ts`、`.pi/extensions/context-prune/entry/render.ts`、`.pi/extensions/context-prune/apply/drafts.ts`、`.pi/extensions/context-prune/command/prune.ts`
- 検査: `.pi/extensions/context-prune/prune/judge.test.ts`、`.pi/extensions/context-prune/prune/collect.test.ts`、`.pi/extensions/context-prune/prune/run.test.ts`、`.pi/extensions/context-prune/prune/ports.test.ts`、`.pi/extensions/context-prune/index.test.ts`、`.pi/extensions/context-prune/settings/schema.test.ts`、`.pi/extensions/context-prune/settings/read.test.ts`、`.pi/extensions/context-prune/entry/data.test.ts`、`.pi/extensions/context-prune/entry/render.test.ts`、`.pi/extensions/context-prune/apply/drafts.test.ts`、`.pi/extensions/context-prune/command/prune.test.ts`
- 生成: `.pi/extensions/context-prune/settings.json` — `writeEnabled` が書く先
- 文書: `.pi/extensions/context-prune/README.md`、`DEFINITION.md`、`README.md`、`README.ja.md`、`cycles/261022-029-dev/plan/context-prune.md`

### 03: 分類器への指示と要約の言語

- 読む: `.pi/extensions/context-prune/prune/judge.ts` — 日本語の instructions と criteria を持つ
- 読む: `.pi/extensions/context-prune/prune/ports.ts` — `summarize` と `classify` の口
- 読む: `.pi/extensions/context-prune/prune/run.ts` — summary を `judgeRequest` に渡す
- 読まれる: `.pi/extensions/context-prune/entry/data.ts`、`.pi/extensions/context-prune/entry/render.ts`
- 検査: `.pi/extensions/context-prune/prune/judge.test.ts`、`.pi/extensions/context-prune/prune/ports.test.ts`、`.pi/extensions/context-prune/prune/run.test.ts`、`.pi/extensions/context-prune/index.test.ts`
- 文書: `.pi/extensions/context-prune/README.md`

### 04: 失敗したパスをどう扱うか

- 読む: `.pi/extensions/context-prune/prune/plan.ts`、`.pi/extensions/context-prune/prune/run.ts`、`.pi/extensions/context-prune/index.ts`、`.pi/extensions/context-prune/prune/ports.ts`
- 読む: `.pi/extensions/context-prune/entry/data.ts`、`.pi/extensions/context-prune/settings/schema.ts`、`.pi/extensions/context-prune/settings/read.ts`
- 読まれる: `.pi/extensions/context-prune/index.ts`、`.pi/extensions/context-prune/command/prune.ts`、`.pi/extensions/context-prune/entry/data.ts`、`.pi/extensions/context-prune/entry/render.ts`、`.pi/extensions/context-prune/apply/drafts.ts`
- 検査: `.pi/extensions/context-prune/prune/plan.test.ts`、`.pi/extensions/context-prune/prune/run.test.ts`、`.pi/extensions/context-prune/index.test.ts`、`.pi/extensions/context-prune/command/prune.test.ts`、`.pi/extensions/context-prune/entry/data.test.ts`、`.pi/extensions/context-prune/prune/ports.test.ts`、`.pi/extensions/context-prune/entry/render.test.ts`、`.pi/extensions/context-prune/apply/drafts.test.ts`
- 文書: `.pi/extensions/context-prune/README.md`

## `prune-pass-rework`

### ADR & Where

- No: 01, 02, 03, 04
- Why: 4 つの entry が同じパス（`prune/ports.ts`、`prune/judge.ts`、`settings/schema.ts`、`index.ts` とその検査）を読み、1 回のパス実行の形をまとめて変える。半分に割ると同じファイルを 2 つの作業が触り、途中でテストが落ちる。
- Where: worktree

### Scope

- なし

### Boundary

- Plans: なし
- External:
  - Jev（TypeSafe System One）: per-question 32k / per-request 64k の上限
    - Limit: per-question 32,000 トークン
    - Contract: 超過は `400 max_tokens_exceeded`
  - `@earendil-works/pi-coding-agent`: 要約は `generateSummaryWithUsage` を呼ぶ
    - Version: 1.3.0
