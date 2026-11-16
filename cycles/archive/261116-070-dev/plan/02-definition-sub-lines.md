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

- Findings: なし
- Unplanned: なし
- Commit: 6cd7f6ef
- Stopped: なし

### Cleanup: なし

- Findings:
- Unplanned:

## Work Review

### Round 1

- Stale: なし — DEFINITION.md:51-60 の8行は ADR 02 Details が決めた文面どおりで、親行を冗長にせず、他文書のずれは ADR Scope Out（downstream は 03 が持つ）の想定内。解析コードはなく（ADR F10）、陳腐化するコメント・テストはない。
- Unlisted: なし — 差分は DEFINITION.md の8行追加と plan md の Notes 記録のみで、Files の `DEFINITION.md update` の範囲内。plan md の記録は定常業務であり、名指し外の変更はない。
- Gaps: なし — Goal（3ユニット下の8サブ行）の名・Who・インデント・親子並びは Verify Always の読み合わせが直接確かめる対象で、Added の ja-check が日本語を覆う。Types なしのため自動検査で覆うべき振る舞いの穴はない。
- Policy: なし — 8行は ADR が決めた機能であり、Allowed 3件（0個可・Who 相違可・他ユニットとの重複可）を保ち、Forbidden 3件（経路・検査・主機能の重複）に当たらない。
- Unproven: なし — 新規テストファイル・ケースがなく、振る舞いを名指すテストがないため、壊れても緑になるテストはない。
- Noise: なし — 追加・変更されたテストケースがないため、型等で決まる重複や magic number・ハードコード文字列のケースはない。
- Doubts: なし

### Round 2

- Stale: なし — Round 1 に指摘なしのため `fixed:` 行はなく、再確認の対象はない。
- Unlisted: なし — 同上。
- Gaps: なし — 同上。
- Policy: なし — 同上。
- Unproven: なし — 同上。
- Noise: なし — 同上。
- Doubts: なし

## Acceptance

- Goal: OK — `DEFINITION.md` の `Users can do` が、`subagent-consult`、`thinking-scrub`、`context-precompact` の下に 8 つのサブの行を持つ。
- Ran: `pnpm test:run`（836 passed）、`pnpm typecheck`、`pnpm lint`、`pnpm format:check`、`git diff 3db5ef4d..HEAD` の読み、`ja-check DEFINITION.md`。
- Findings: なし
- Doubts: なし
