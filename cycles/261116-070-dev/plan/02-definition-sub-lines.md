# PLAN `definition-sub-lines`

- No: 02
- Place: worktree
- Boundary Plans: 01

## Goal

`DEFINITION.md` の `Users can do` が、`subagent-consult`、`thinking-scrub`、`context-precompact` の下に 8 つのサブの行を持つ。

## Refactor

- Inside:
  - Modules: なし。`DEFINITION.md` の 1 ファイルに 8 行を足すだけで、分ける理由がない。
  - Dirs: なし。
- Outside:
  - Extract: なし。
  - Colocate: なし。

## Files

```text
DEFINITION.md                update
```

## Slices

## 1. 定義書がサブの行を持つ

`DEFINITION.md` の `Users can do` が、3 つのユニットの下に、それぞれの機能を書いたサブの行を持つ。

### Types

なし

### Steps

1. `DEFINITION.md`
   1. add: `subagent-consult` の行の直後に、2 スペースでインデントした `subagent-consult_status` の行を足す。
      ```md
      - subagent-consult_status: オーナーまたはエージェントが、走っているサブエージェントとその進み具合を見られる
      ```
   2. add: `subagent-consult_status` の行の直後に、2 スペースでインデントした `subagent-consult_cancel` の行を足す。
      ```md
      - subagent-consult_cancel: オーナーまたはエージェントが、走っているサブエージェントを 1 つ止められる
      ```
   3. add: `subagent-consult_cancel` の行の直後に、2 スペースでインデントした `subagent-consult_notify` の行を足す。
      ```md
      - subagent-consult_notify: オーナーが、コンサルの稼働と終了を音で気づける
      ```
   4. add: `thinking-scrub` の行の直後に、2 スペースでインデントした `thinking-scrub_switch` の行を足す。
      ```md
      - thinking-scrub_switch: オーナーが、ループした thinking を取り除く動作を止めたり戻したりできる
      ```
   5. add: `thinking-scrub_switch` の行の直後に、2 スペースでインデントした `thinking-scrub_status` の行を足す。
      ```md
      - thinking-scrub_status: オーナーが、いまの状態と、取り除いた量を確かめられる
      ```
   6. add: `context-precompact` の行の直後に、2 スペースでインデントした `context-precompact_now` の行を足す。
      ```md
      - context-precompact_now: オーナーが、しきい値を待たずに、コンパクションの準備を始められる
      ```
   7. add: `context-precompact_now` の行の直後に、2 スペースでインデントした `context-precompact_switch` の行を足す。
      ```md
      - context-precompact_switch: オーナーが、コンパクションの準備を止めたり戻したりできる
      ```
   8. add: `context-precompact_switch` の行の直後に、2 スペースでインデントした `context-precompact_status` の行を足す。
      ```md
      - context-precompact_status: オーナーが、準備の状態と最後に適用した量を確かめられる
      ```

### Policy

- Allowed:
  - ユニットはサブを 0 個でも、いくつでも持てる。
  - サブの `Who` は、親の主機能の `Who` と違ってよい。
  - 同じ機能が、あるユニットのサブにも、別のユニットにも現れてよい。
- Forbidden:
  - 経路（コマンド、スクリプト、設定）をサブにしない - それは機能への経路である。
  - 検査をサブにしない - それは機能を確かめる手段である。
  - 主機能の行がすでに名指ししている機能をサブにしない - 同じことを 2 回書くことになる。

### Verify

- Always:
  - `pnpm test:run`
  - `pnpm typecheck`
  - `pnpm lint`
  - `pnpm format:check`
  - `DEFINITION.md` 全体と、`adr` の `Definition`、`close` の `Verified`、`plan` の `Definition` の写しを読み、8 つのサブの行の名、`Who`、インデント、親の行との並びを当て、不整合を直す。
- Added:
  - proofread: `node scripts/checks/ja-check.mjs DEFINITION.md` を通し、warn と error をゼロにし、読みで日本語を直す。

## Notes

### Slice 1: 定義書がサブの行を持つ

- Findings:
- Unplanned:
- Commit:
- Stopped:

### Cleanup: なし

- Findings:
- Unplanned:

## Work Review

### Round 1

- Stale:
- Unlisted:
- Gaps:
- Policy:
- Unproven:
- Noise:
- Doubts:

### Round 2

- Stale:
- Unlisted:
- Gaps:
- Policy:
- Unproven:
- Noise:
- Doubts:

## Acceptance

- Goal:
- Ran:
- Findings:
- Doubts:
