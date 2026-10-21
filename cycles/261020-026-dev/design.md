# DESIGN 026

## Possibly related files

### 01: consult が「サブエージェントが走っているか」をどう決めるか

- `.pi/extensions/consult/sub/spec.ts`
- `.pi/extensions/consult/run/log.ts`
- `.pi/extensions/consult/run/place.ts`
- `.pi/extensions/consult/run/run.ts`
- `.pi/extensions/consult/run/subagent.ts`
- `.pi/extensions/consult/tool/consult.ts`
- `.pi/extensions/consult/run/delivery.ts`
- `.pi/extensions/consult/index.ts`
- `.pi/extensions/consult/tool/sound.ts`
- `.pi/extensions/consult/tool/subagents.ts`
- `.pi/extensions/consult/tool/worktree.ts`
- `.pi/extensions/consult/run/log.test.ts`
- `.pi/extensions/consult/sub/spec.test.ts`
- `.pi/extensions/consult/run/subagent.test.ts`
- `.pi/extensions/consult/run/delivery.test.ts`
- `.pi/extensions/consult/run/place.test.ts`
- `.pi/extensions/consult/tool/consult.test.ts`
- `.pi/extensions/consult/tool/subagents.test.ts`
- `.pi/extensions/consult/tool/worktree.test.ts`
- `.pi/extensions/consult/tool/sound.test.ts`
- `.pi/extensions/consult/README.md`
- `DEFINITION.md`
- `cycles/261020-026-dev/adr.md`

### 02: `scripts/harness/index.mjs` の重複をどう消すか

- `scripts/harness/starter.json`
- `scripts/harness/list.mjs`
- `scripts/harness/harness.json`
- `scripts/harness/index.mjs`
- `scripts/harness/index.test.ts`
- `package.json`
- `vitest.starter.config.ts`
- `vitest.config.ts`
- `lefthook.yaml`
- `scripts/checks/typecheck.mjs`
- `cycles/261020-026-dev/adr.md`
- `cycles/261020-025-dev/close.md`
- `README.md`
- `README.ja.md`
- `DEFINITION.md`
- `test/README.md`

## `consult-liveness`

### ADR & Where

- No: 01
- Why: 01 の記録・判定・読み手は 1 つの入力（同じ subagent の生存）で、02 とは道が重ならない。
- Where: worktree

### Scope

- `Unit.subagent-consult`:
  - 行は動かない。
  - 実行ごとの token で同一性を確かめ、subagent 単位に読み、終了行の無い記録を閉じる。

### Boundary

- Plans: なし
- External:
  - `pi`: `--name` が `session_info` の行を足すだけで、`--session` と併用できること。
    - Version: 1.3.0

## `harness-duplicate`

### ADR & Where

- No: 02
- Why: 02 の入力は `scripts/harness/index.mjs` だけで、振る舞いを変えない片付けなので、01 と同時に走れる。
- Where: worktree

### Scope

- `Unit.harness-copy`:
  - 行は動かない。
  - `scripts/harness/index.mjs` の重複した `~` の枝と、両枝同一の三項を消す。

### Boundary

- Plans: なし
- External: なし
