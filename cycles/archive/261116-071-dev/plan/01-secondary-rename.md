# PLAN `secondary-rename`

- No: 01
- Place: worktree
- Boundary Plans: なし

## Goal

ADR の `Decision` の関心事が、`Main` と `Secondary` で区別して読める。

## Refactor

- Inside:
  - Modules: なし。6 つのファイルは同じ語の変更で、分けても読むものが同じになる。
  - Dirs: なし。
- Outside:
  - Extract: なし。語の変更を共有する新しいモジュールは作らない。
  - Colocate: なし。

## Files

```text
.pi/
  skills/
    adr/
      references/
        adr.format.md          update
      scripts/
        adr.mjs                update
        index.test.ts          update
      SKILL.md                 update
    close/
      references/
        format.md
      SKILL.md
    plan/
      references/
        tasks.md               update
      SKILL.md                 update
rules/
  definition.format.md
  definition.rules.md
```

## Slices

## 1. ADR が Secondary で読む

`adr` の `Decision` の関心事を `Main` と `Secondary` で書き、`adr` と `plan` の文書、`adr.mjs` のテンプレート、`index.test.ts` のフィクスチャがそれに従う。

### Types

なし

### Steps

1. `.pi/skills/adr/references/adr.format.md`
   1. update: `Decision` の項目 `- Sub:` を `- Secondary:` にする。
      ```md
      - Secondary: <この関心事は、何がどうなるか>
      ```
   2. update: 個数の文の `Sub` を `Secondary` にする。
      ```md
      - `Secondary` is from 0 to multiple.
      ```
   3. update: 行の列挙の `Sub` を `Secondary` にする。
      ```md
      - A line under `Main`, `Secondary`, `Add`, `Update`, `Drop` or `Policy` ends with the items it settles, in parentheses: `（C1, F2）`.
      ```
2. `.pi/skills/adr/SKILL.md`
   1. update: `Decision` の注意の 1 文目の `Sub` を `Secondary` にする。
      ```md
      - An entry has one `Main` concern and sometimes `Secondary` concerns.
      ```
   2. update: 2 文目の `Sub` を `Secondary` にする。
      ```md
      - A `Secondary` is only when its change follows from the `Main`'s change or addition.
      ```
3. `.pi/skills/plan/SKILL.md`
   1. update: `Main` / `Sub` の表の行を `Main` / `Secondary` にする。
      ```md
      | `Main` / `Secondary` | mark |
      ```
   2. update: `review` に送る ADR の部分の列挙の `Sub` を `Secondary` にする。
      ```md
      Send the plan md and the ADR's `Main`, `Secondary`, `Policy`, `Scope` and `Definition` to one `review` subagent.
      ```
4. `.pi/skills/plan/references/tasks.md`
   1. update: 読む物の列挙の `Sub` を `Secondary` にする。
      ```md
      Read the plan md, the files it names, the ADR's `Main`, `Secondary`, `Policy`, `Scope` and `Definition`, and `.pi/skills/plan/references/design.md`.
      ```
   2. update: 調べ物の task 文の `Sub` を `Secondary` にする。
      ```md
      The task names the line, the ADR's `Main` and `Secondary` and `Scope`, and what the plan holds so far.
      ```
5. `.pi/skills/adr/scripts/adr.mjs`
   1. update: `entrySkeleton` のテンプレートの `- Sub:` を `- Secondary:` にする。
      ```ts
      - Secondary: <この関心事は、何がどうなるか>
      ```
6. `.pi/skills/adr/scripts/index.test.ts`
   1. update: テスト名の `Sub` を `Secondary` にし、行の残りはそのままにする。
      ```ts
      it('(happy) Secondary の行が C を運ぶ → 抜けは空', () => {
      ```
   2. update: フィクスチャの文字列の中の `- Sub: 追加の関心事` を `- Secondary: 追加の関心事` にし、残りはそのままにする。
      ```ts
      - Secondary: 追加の関心事
      ```

### Policy

- Allowed:
  - `Secondary` を、エントリの `Main` に次ぐ関心事に使う。
  - 定義書の `Sub` を、ユニットの下位機能に使い続ける。
- Forbidden:
  - `adr` の `Decision` で `Sub` を使わない - 定義書の `Sub` と重なる。
  - 過去の記録の `Sub` を直さない - 過去の記録はそのまま残す。

### Verify

- Always:
  - `pnpm test:related .pi/skills/adr/scripts/adr.mjs`
  - `pnpm typecheck`
  - `pnpm lint`
  - `pnpm format:check`
  - `adr.format.md`、`adr/SKILL.md`、`plan/SKILL.md`、`plan/references/tasks.md`、`adr.mjs`、`index.test.ts` を全体で読み、`Main` と `Secondary` の語がそろい、定義書の `Sub`（`rules/definition.rules.md`、`rules/definition.format.md`、`close/SKILL.md`、`close/references/format.md`）が残っていることを当て、不整合を直す。
- Added:
  - proofread: `node scripts/checks/ja-check.mjs .pi/skills/adr/scripts/adr.mjs .pi/skills/adr/scripts/index.test.ts` を通し、warn と error をゼロにする。

## Notes

### Slice 1: ADR が Secondary で読む

- Findings: なし
- Unplanned: なし
- Commit: 350b060d
- Stopped: なし

### Cleanup: なし

- Findings: なし
- Unplanned: なし

## Work Review

### Round 1

- Stale: なし — `- Sub:` は `.pi/` と `rules/` に残らず（grep で確認）、残る `Sub` は定義書用法のみ（`.pi/skills/adr/references/adr.format.md:142`、`.pi/skills/adr/SKILL.md:229,246`）で、plan の `Allowed` が残すと決めた値のため。
- Unlisted: なし — diff は `Files` の `update` 6 件（`adr.format.md`、`adr/SKILL.md`、`plan/SKILL.md`、`plan/references/tasks.md`、`adr.mjs`、`index.test.ts`）のみで、`close/` と `rules/` は不変。plan md 自体の `Notes` 更新（`cycles/261116-071-dev/plan/01-secondary-rename.md:136-139`）は手順の記録であり、plan が決めた値のため。
- Gaps: なし — ADR の F1 が数えた Decision 用法 12 か所はすべて `Secondary` に変わり（`git diff 4c779213..HEAD` で確認）、定義書用法（F2）は不変で、`Goal`（`Main` と `Secondary` の区別）に穴はない。`Verify` の全体読みが求める不整合確認をレビューとして再実施済みのため。
- Policy: なし — `Allowed` 2 件（`Secondary` の関心事用法、定義書の `Sub` 継続）を保ち、`Forbidden` 2 件（Decision の `Sub` はゼロ件に、`cycles/` の過去記録は不変）も破らないため。ADR 071 自身の `- Sub: なし`（`cycles/261116-071-dev/adr.md:51`）は記録であり、直さないことが `Forbidden` の決定値のため。
- Unproven: なし — `.pi/skills/adr/scripts/index.test.ts:324,327` の改名は plan の `Steps` 6.1/6.2 が一字一句決めた値であり、除外規定により所見にしないため。
- Noise: なし — フィクスチャ内の固定文字列（`追加の関心事` 等）も plan の `Steps` 6.2 が残すと決めた値であり、除外規定により所見にしないため。
- Doubts: なし

### Round 2

- Stale: なし — Round 1 で所見なしのため `fixed:` 行はなく、確認対象がないため。
- Unlisted: なし — 同上。
- Gaps: なし — 同上。
- Policy: なし — 同上。
- Unproven: なし — 同上。
- Noise: なし — 同上。
- Doubts: なし

## Acceptance

- Goal: OK — ADR の `Decision` の関心事が、`Main` と `Secondary` で区別して読める。
- Ran: `pnpm test:related .pi/skills/adr/scripts/adr.mjs`（70 passed）、`pnpm typecheck`、`pnpm lint`、`pnpm format:check`、`ja-check`（`adr.mjs`、`index.test.ts`）、`git diff 4c779213..HEAD` の読み。
- Findings: なし
- Doubts: なし
