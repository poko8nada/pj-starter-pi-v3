# DESIGN 027

## Possibly related files

### 01: consult が子の生存をどう見るか

- `.pi/extensions/consult/run/proc.ts`
- `.pi/extensions/consult/run/log.ts`
- `.pi/extensions/consult/run/place.ts`
- `.pi/extensions/consult/sub/spec.ts`
- `.pi/extensions/consult/run/subagent.ts`
- `.pi/extensions/consult/run/run.ts`
- `.pi/extensions/consult/tool/consult.ts`
- `.pi/extensions/consult/tool/subagents.ts`
- `.pi/extensions/consult/tool/worktree.ts`
- `.pi/extensions/consult/index.ts`
- `.pi/extensions/consult/run/delivery.ts`
- `.pi/extensions/consult/tool/sound.ts`
- `.pi/extensions/consult/run/proc.test.ts`
- `.pi/extensions/consult/run/log.test.ts`
- `.pi/extensions/consult/sub/spec.test.ts`
- `.pi/extensions/consult/run/subagent.test.ts`
- `.pi/extensions/consult/tool/consult.test.ts`
- `.pi/extensions/consult/tool/subagents.test.ts`
- `.pi/extensions/consult/tool/worktree.test.ts`
- `.pi/extensions/consult/tool/sound.test.ts`
- `.pi/extensions/consult/run/place.test.ts`
- `.pi/extensions/consult/run/delivery.test.ts`
- `.pi/extensions/consult/README.md`
- `package.json`
- `vitest.starter.config.ts`
- `lefthook.yaml`
- `scripts/checks/typecheck.mjs`
- `DEFINITION.md`

## `liveness-start-token`

### ADR & Where

- No: 01
- Why: 変更の入口は記録の開始行と `ps` の読みで、026 の `checkPid` と `RunRecord` の置き換えに閉じる。
- Where: worktree

### Scope

- `Unit.subagent-consult`:
  - 行は動かない。
  - 開始行に `startToken` を残し、`ps -p <pid> -o lstart=` の文字列で同一性を確かめる。

### Boundary

- Plans: なし
- External:
  - `ps`: `-p <pid> -o lstart=` が `%c` のローカル表記を返すこと。
    - Version: macOS 26
