# PLAN `reader-sub-handling`

- No: 03
- Place: worktree
- Boundary Plans: 01, 02

## Goal

`adr` の `Definition` と `close` の `Verified` が、サブを 1 つの名として扱い、親と同じように記録し、確かめる。

## Refactor

- Inside:
  - Modules: なし。`adr` と `close` の文書に、それぞれ 1 つの規則を足す。ファイルを分ける理由がない。
  - Dirs: なし。
- Outside:
  - Extract: なし。
  - Colocate: なし。

## Files

```text
.pi/
  skills/
    adr/
      references/
        adr.format.md          update
      SKILL.md                 update
    close/
      references/
        format.md              update
      SKILL.md                 update
    plan/
      SKILL.md
DEFINITION.md
rules/
  definition.format.md
  definition.rules.md
```

## Slices

## 1. adr がサブを名指す

`adr` の `Definition` が、サブを独立した名として書き、`Related Definition` の部分の一覧がサブを含む。

### Types

なし

### Steps

1. `.pi/skills/adr/references/adr.format.md`
   1. add: `Definition` セクションの箇条書きの末尾に、サブの名と親の `(kept)` の規則を足す。親の行は `(kept)` のままとし、サブの行だけを `(added)`、`(updated)`、`(dropped)` で書く。
      ```md
      - A Sub is a name of its own: `Unit.<unit>_<sub>`. The parent's line stands when only the Sub's line moves.
      ```
2. `.pi/skills/adr/SKILL.md`
   1. update: `Related Definition` の部分の一覧に `Sub` を足す。
      ```md
      2. Name the parts of `DEFINITION.md` the entry relates to: `Unit`, `Sub`, `Who`, `Stack`, `What`.
      ```
   2. update: 注意の文を `A Unit or a Sub` にする。
      ```md
      - A Unit or a Sub that `rules/definition.rules.md` does not allow is not a part.
      ```

### Policy

- Allowed:
  - `plan` は `Definition` のサブの行を 1 つの仕事として読む。いまの扱いのままでよい。
  - `product-ready`、`README`、`close` の `collect.mjs` は `Users can do` の行を数えないので、変更しない。
- Forbidden:
  - `adr` の `--check` に `Definition` の検査を足さない - いま検証していない。
  - サブを親の `Definition` の行にまとめない - 名が分からなくなる。

### Verify

- Always:
  - `pnpm test:run`
  - `pnpm typecheck`
  - `pnpm lint`
  - `pnpm format:check`
  - `adr.format.md`、`adr/SKILL.md`、`DEFINITION.md`、`rules/definition.rules.md`、`rules/definition.format.md` を全体で読み、`Unit.<unit>_<sub>` の書き方と `Related Definition` の一覧と注意の文を、`Naming` と 02 が書くサブの名に当て、不整合を直す。
- Added:
  - proofread: `node scripts/checks/ja-check.mjs .pi/skills/adr/references/adr.format.md .pi/skills/adr/SKILL.md` を通し、warn と error をゼロにし、読みで日本語を直す。

## 2. close がサブを確かめる

`close` の `Verified` が、サイクルが触れた Unit と、変更が触れたサブを、名ごとのセクションで確かめる。

### Types

なし

### Steps

1. `.pi/skills/close/references/format.md`
   1. update: `Verified` の導入文を、触れた Unit と、変更が触れたサブの文にする。
      ```md
      The Units the cycle touched, the Subs the change touched, and what the owner answered for each.
      ```
   2. update: `## Verified` の直後の見出し `### Unit` を `### Name` に変える。`### <Unit>` の行は次の substep で扱う。
   3. update: `### <Unit>` の行を、触れた Unit と、変更が触れたサブの形にする。
      ```md
      - `### <name>` holds one section per Unit this cycle touched, and per Sub the change touched, among the names listed in `Users can do`.
      ```
   4. update: `A Unit is a line under ...` の行を、Unit と Sub の行の形にする。
      ```md
      - A Unit is a top-level line under `Users can do`; a Sub is an indented line under its Unit. A `####` heading is neither.
      ```
   5. update: `Product` / `What` / `Who` / `Stack` の行を、`names` の形にする。
      ```md
      - `Product` / `What` / `Who` / `Stack` are not names and are not verified.
      ```
   6. update: `Plans` の行を、その名を名指したエントリの形にする。
      ```md
      - `Plans` holds one bullet per plan that cuts an entry that names it, taken from the plan md's `No`.
      ```
2. `.pi/skills/close/SKILL.md`
   1. update: セクションの見出しを `Verify, by Unit and Sub` に変える。
      ```md
      ### 6. Verify, by Unit and Sub
      ```
   2. update: `1. Take one Unit at a time:` を、触れた Unit と、変更が触れた Sub にする。
      ```md
      1. Take one Unit the cycle touched, and one Sub the change touched, at a time:
      ```
   3. update: `5. Move to the next Unit.` を、Unit か Sub にする。
      ```md
      5. Move to the next Unit or Sub.
      ```
   4. update: 表の見出し行を `| the name | the check |` に変える。
   5. update: 表の 1 行目を `| a Unit or a Sub under its Unit | its function, and the change that plans made |` に変える。
   6. update: 表の 2 行目を `| a `Product`, `What`, `Who`, `Stack` | not a name |` に変える。
   7. update: 注意の文を `The Units and Subs` にする。
      ```md
      - The Units and Subs are as `references/format.md` says.
      ```

### Policy

- Allowed:
  - 変更が触れたサブは、`Verified` で親とは別のセクションを持つ。
- Forbidden:
  - サブを Unit として数えない - 01 の規則が Unit と Sub を分ける。

### Verify

- Always:
  - `pnpm test:run`
  - `pnpm typecheck`
  - `pnpm lint`
  - `pnpm format:check`
  - `close/references/format.md`、`close/SKILL.md`、`DEFINITION.md`、`rules/definition.rules.md`、`rules/definition.format.md` を全体で読み、`Verified` のセクションの名、`Users can do` の行の種類、表の行、`Plans` の文を、サブの行の形に当て、不整合を直す。
- Added:
  - proofread: `node scripts/checks/ja-check.mjs .pi/skills/close/references/format.md .pi/skills/close/SKILL.md` を通し、warn と error をゼロにし、読みで日本語を直す。

## Notes

### Slice 1: adr がサブを名指す

- Findings:
- Unplanned:
- Commit:
- Stopped:

### Slice 2: close がサブを確かめる

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
