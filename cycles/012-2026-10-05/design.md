# DESIGN 012

## `consult-nudge`

consult の促しだけを読み、second-opinion とは重ならないので単独で走る。

- ADR: 02-1
- Where: worktree（owner が見る物ではない。子が1人で走り、マージで入る）
- Scope:
  - consult.run: 促しが上限を越えず、子が促しを無視しても書かれた本文が失われない（02-1）
- Boundary:
  - Plans: なし
  - External:
    - `pi`: 子のターンの終わりに、続きを1つ許す口が要る
      - Contract: `turn_end` の handler が `{entries, continue}` を返せる（`dist/core/extensions/types.d.ts:609-618`）。`turnIndex` は 0 始まりで、終了したターンを指す（`agent-session.js:711-730`）

## `second-opinion-usable`

second-opinion の拡張だけを読み、consult の促しの写しを取るので `consult-nudge` の後ろに置く。

- ADR: 01-1, 01-2, 01-3, 01-4, 01-5, 01-6, 01-7, 01-8
- Where: worktree（owner が見る物ではない。子が1人で走り、マージで入る）
- Scope:
  - second-opinion: 子の記録を残し（01-7）、`conversation.ts` と `answer.ts` を `tool/` に移す（01-8）
  - second-opinion.opinion: 道具の名前が拡張を名乗り（01-1）、reload をまたいでも会話を材料にでき（01-2）、待っている間の様子が見え（01-3）、途中で打ち切られても最後の本文が返り（01-4）、促しが上限を越えず（01-5）、ターン数が窓に見合う（01-6）
- Boundary:
  - Plans: なし
  - External:
    - `pi`: セッションの会話を拡張に見せ、道具の進行を出させる口が要る
      - Contract: `on("context")` は `messages: AgentMessage[]`（システム文を除く）を渡す（`types.d.ts:514-524`）。道具の `execute` は `onUpdate` を受け取る（`types.d.ts:373`）
