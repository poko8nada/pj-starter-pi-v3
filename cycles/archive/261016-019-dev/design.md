# DESIGN 019

## `consult-vocabulary`

### ADR & Where

- No: 01, 02, 03, 04, 05
- Why: 01〜05 は、consult 拡張の呼び方を揃える変更で、触るファイルと直す所が重なるので、1 つの worktree にする。
- Where: worktree

### Scope

- `Unit.subagent-consult`:
  - 呼び方を `agent` / `subagent` と `base` / `worktree` に揃える
  - ツールの名前を `consult_subagents` にする
  - `child/` を `sub/`、`run/child.ts` を `run/subagent.ts`、`tool/children.ts` を `tool/subagents.ts` にする
  - この repo で古い呼び方が残っている所（`.pi/extensions/consult` の全部、root の `README.md`、`README.ja.md`）を全部直す。`DEFINITION.md` の行は動かない

### Boundary

- Plans: なし
- External:
  - `pi`: ツールの名前を登録する先
    - Contract: 名前はこの拡張の `index.ts` の `name` が決める。実行中のセッションは `/reload` まで古い名前のままで、次回の起動は新しい名前になる
