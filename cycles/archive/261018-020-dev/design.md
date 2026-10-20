# DESIGN 020

## `intent-questions`

### ADR & Where

- No: 01, 02, 03, 04, 05, 06, 07, 08
- Why: 8 つの entry はどれも同じ入力（設定・問い・状態・hook・コマンド）を読み、互いに相手の形を必要とするので、1 つの worktree で続けて行う。
- Where: worktree

### Scope

- `Unit.intent-router`: 行を「エージェントが、owner の発言の意図通りに動ける」に変える

### Boundary

- Plans: なし
- External:
  - `pi 本体`: `modelRegistry.classify`、`before_agent_start` と `turn_end`、`registerCommand` が使えること。
    - Contract: `state` は object、`stopReason` は `stop` / `error` / `aborted`
  - `opencode` と `openrouter`: classifier として `jev-1.13` 系が引けること。
    - Version: `jev-1.13-free` / `~typesafe/jev-latest`
  - `TypeSafe`: 渡す state と questions が上限に収まること。
    - Limit: per-question 32k、per-request 64k トークン
