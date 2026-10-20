# DESIGN 021

## `record-jsonl`

### ADR & Where

- No: 02
- Why: entry 02 は記録のファイルの形だけを変え、問いと state を読まない。先に出すと、owner が次の判定の記録を読みやすくなる。
- Where: worktree

### Scope

- `Unit.intent-router`: 記録を JSONL にし、1 件に渡した state の字数と切ったかどうかを足す（`DEFINITION.md` の行は動かない）

### Boundary

- Plans: なし
- External: なし

## `judge-questions`

### ADR & Where

- No: 01
- Why: 問い・state・hook・設定の形を互いに合わせて変えるので 1 つの worktree で続け、記録の 1 件の形は `record-jsonl` に乗る。
- Where: worktree

### Scope

- `Unit.intent-router`: 途中の判定を `reply` の往復だけにし、問いを「関係あるか」「答えられるか」にして、state を 4 つに分ける（`DEFINITION.md` の行は動かない）

### Boundary

- Plans:
  - `record-jsonl`: 記録の 1 件の形（渡した state の字数と切ったかどうか）を使う。
- External:
  - `pi 本体`: `turn_end` の道具の結果、`ctx.sessionManager` のメッセージ、`modelRegistry.classify` が使えること。
    - Contract: `state` は object、`stopReason` は `stop` / `error` / `aborted`
  - `opencode` と `openrouter`: classifier として `jev-1.13` 系が引けること。
    - Version: `jev-1.13-free` / `~typesafe/jev-latest`
  - `TypeSafe`: 渡す state と questions が上限に収まること。
    - Limit: per-question 32k、per-request 64k トークン
