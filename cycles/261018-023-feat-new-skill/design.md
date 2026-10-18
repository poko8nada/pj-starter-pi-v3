# DESIGN 023

## `route-user-start`

### ADR & Where

- No: 01
- Why: port と入口と包みとテストが同じ union を読み、「誰が走り出したか」の 1 つの区別を決めるので、1 つの plan にする。
- Where: worktree

### Scope

- `Unit.intent-router`: route が `custom` の走り出しを素通りし、owner の発言の時だけ判定する。

### Boundary

- Plans: なし
- External:
  - `@earendil-works/pi-coding-agent`: 拡張を動かすホスト。型は `devDependencies` から来るので、実行時と同じ契約にする。`peerDependencies` の `"*"` と `dependencies` には触らない。
    - Version: ^1.3.0
