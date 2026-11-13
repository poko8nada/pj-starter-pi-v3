# PLAN `plan-opinion`

- No: 04
- Place: worktree
- Boundary Plans: なし

## Goal

plan の `### 5.` が、エージェントの意見と理由を示し、オーナーが答える形になる

## Design

- Inside:
  - Modules: なし（`plan/SKILL.md` の `### 5.` を書き換えるだけで、ファイルやモジュールの統合・分割はない）
  - Dirs: なし（ディレクトリの統合・分割・移動はない）
- Outside:
  - Extract: なし（ほかの文書と共有する新しいモジュールはない）
  - Colocate: なし（コロケーションに変えるモジュールはない）

## Files

```text
.pi/
  skills/
    close/
      scripts/
        collect.mjs
    plan/
      references/
        format.md
        tasks.md
      scripts/
        index.mjs
        index.test.ts
        plan.mjs
      SKILL.md                 update
    work/
      SKILL.md
    yolo/
      SKILL.md
ROADMAP.md
```

## Slices

## 1.未決定の点への意見と回答

`### 5.` の報告に、各項目をどう扱うかの意見と理由を足し、プリンシプルを Note に置く。

### Types

なし

### Steps

1. `.pi/skills/plan/SKILL.md`
   1. update: `### 5.` の Step 2 を、報告に加えて、各項目をどう扱うかの意見と理由を述べる形にする。

      ```md
      2. Report them to the owner before the reviews and the proofread, with `なし` when there is nothing. For each, say what you would do with it and why.
      ```

   2. add: `### 5.` の Notes の末尾に、意見の根拠の Note を1本足す。

      ```md
      - The opinion's ground is YAGNI, KISS, DRY and SOLID.
      ```

### Policy

- Allowed:
  - 意見の根拠に、YAGNI、KISS、DRY、SOLID を使う
- Forbidden:
  - `### 5.` の既存の Notes（回答が plan を決める、affected にないファイルは報告なしに触らない、レビュー前に1回確認する）を変えない - いまの制約を保つ
  - 意見でオーナーの回答を置き換えない - 回答が最終決定であり、過去の plan md にステップ5の回答の記録はない
  - 未決定の点を記録する欄を plan md に足さない - 報告はレビューと校正の前のチャットで行い、未決定の点は `Notes` の `Unplanned` と `Work Review` の `Unlisted` に残る
  - `### 5.` の位置（レビューと校正の前、1 回だけ全体を確認する）を変えない - 全体の確認を1回にする

### Verify

- Always:
  - 関連テスト（`pnpm test:related .pi/skills/plan/SKILL.md`。関連がなければ `pnpm test:run`）
  - `pnpm typecheck`
  - `pnpm lint`
  - `pnpm format:check`
  - 変えたファイル全体と、名指すファイルを読み、読む者の順に手順をたどり、番号、パス、名前、形を当て、不整合を直す
- Added: なし

## Notes

### Slice 1: 未決定の点への意見と回答

- Findings: なし
- Unplanned: なし
- Commit:
- Stopped:

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
