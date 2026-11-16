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

- Findings: なし
- Unplanned: なし
- Commit: 8d1bf1b5
- Stopped: なし

### Slice 2: close がサブを確かめる

- Findings: なし
- Unplanned: なし
- Commit: 64439c84
- Stopped: なし

### Cleanup: なし

- Findings: なし
- Unplanned: なし

## Work Review

### Round 1

- Stale:
  - `.pi/skills/close/SKILL.md:8` — 導入文が `each Unit's function` のままで Sub に触れていない。Slice 2 の Goal（Sub も確かめる）と矛盾し、読むと Unit だけ確かめればよいと誤読できるため。
    - fixed: 導入文を `each Unit's or Sub's function` に直し、Sub も確かめる対象であることを明示した。
  - `.pi/skills/close/SKILL.md:93` — `before the next Unit` のままで `or Sub` がない。直下の手順 5 は `next Unit or Sub` に直したのにここだけ旧文言が残り、手順が割れるため。
    - fixed: `before the next Unit or Sub` に直し、手順 5 の `Move to the next Unit or Sub` と揃えた。
  - `.pi/skills/close/SKILL.md:112` — Notes が `the Unit's function` のままで Sub の検査の定義がない。表は `a Unit or a Sub` に広げたのに定義が Unit だけで、Sub の `Result` が何を指すか決まらないため。
    - fixed: Notes を `the Unit's or Sub's function` に直し、Sub の `Result` が Sub の機能を指すことを定義した。
  - `.pi/skills/close/references/format.md:41` — Shape 例が `### <Unit>` のままで、説明側の `### Name` / `### <name>` と食い違う。Shape を写す利用者が Unit 欄だけ作り Sub 欄を作らない恐れがあるため。
    - fixed: Shape 例を `### <name>` に直し、説明側の `### Name` / `### <name>` と一致させた。
  - `.pi/skills/close/references/format.md:125` — `Result` の定義が `the Unit's function` のままで Sub のセクションの合否基準がない。`Verified` が Sub のセクションを持つ新規則と矛盾し、Goal の「親と同じように確かめる」が Sub で定義不足になるため。
    - fixed: `Result` の定義を `the Unit's or Sub's function` に直し、Sub のセクションの合否基準を Unit と同じ形で定義した。
- Unlisted: なし — 差分は `Files` が `update` と書く 4 ファイル（adr の SKILL と format、close の SKILL と format）だけで、残りは Notes の commit 記入という定型作業のため。
- Gaps: なし — 新しい振る舞い（Sub を名として書く・確かめる）は `Verify` の全体読みと `ja-check` が対象に含めており、手順に対応する検査がない項目はないため。残った旧文言は検査の抜けではなく実行の漏れであり、`Stale` で扱ったため。
- Policy: なし — `Allowed`（Sub は親と別セクション、`plan` の読み方は現状維持、未変更物の不変更）を破らず、`Forbidden`（`--check` 追加なし、親行への統合なし、Sub の Unit 数えなし）をいずれも行っていないため。
- Unproven: なし — Sub の振る舞いを名指す新規テストがなく、既存の `pnpm test:run` 等や `ja-check` も Sub の英文を名指さないため、壊れても緑になる「名指すテスト」が存在しないため。
- Noise: なし — 新規テストがなく、型・スキーマ・DB 制約が不要に再検査される箇所も、マジックナンバーやハードコード文字列の事例もないため。
- Doubts:
  - `.pi/skills/adr/SKILL.md:168` / `.pi/skills/adr/references/adr.format.md:43` — ADR の `Decision` の `Main` / `Sub`（関心事の親子）と `DEFINITION.md` の `Unit` / `Sub`（名の親子）が同じ `Sub` という語で並立する。今回の差分は後者に `Sub` を足しただけで、前者と後者の呼び方の区別を決めていない。読む人が混同するか、注意書きの追記が要るかはオーナー判断が要るため。

### Round 2

- Stale:
  - `.pi/skills/close/SKILL.md:8` の fixed を確認した — 現行 8 行目が `each Unit's or Sub's function` であり、Round 1 が指摘した旧文言は残っていない。理由: 現物を読み、fixed 文どおりの文言であることと、Slice 2 の Goal と一致することを当てたため。
  - `.pi/skills/close/SKILL.md:93` の fixed を確認した — 現行 93 行目が `before the next Unit or Sub` であり、手順 5 の `Move to the next Unit or Sub` と揃っている。理由: 現物を読み、fixed 文どおりであることと、手順間の文言割れが解消していることを当てたため。
  - `.pi/skills/close/SKILL.md:112` の fixed を確認した — 現行 112 行目が `the Unit's or Sub's function` であり、表の `a Unit or a Sub` と定義が一致している。理由: 現物を読み、fixed 文どおりであることと、Sub の `Result` が指す先が決まることを当てたため。
  - `.pi/skills/close/references/format.md:41` の fixed を確認した — 現行 41 行目が `### <name>` であり、説明側の `### Name` / `### <name>` と一致している。理由: 現物を読み、Shape 例と説明の食い違いが解消していることを当てたため。
  - `.pi/skills/close/references/format.md:125` の fixed を確認した — 現行 125 行目が `the Unit's or Sub's function` であり、Sub の合否基準が Unit と同じ形で定義されている。理由: 現物を読み、fixed 文どおりであることと、Goal の「親と同じように確かめる」と一致することを当てたため。
- Unlisted: なし — Round 1 で指摘がなく fixed 行がないため、確認対象がないため。
- Gaps: なし — Round 1 で指摘がなく fixed 行がないため、確認対象がないため。
- Policy: なし — Round 1 で指摘がなく fixed 行がないため、確認対象がないため。
- Unproven: なし — Round 1 で指摘がなく fixed 行がないため、確認対象がないため。
- Noise: なし — Round 1 で指摘がなく fixed 行がないため、確認対象がないため。
- Doubts: なし — fixed の確認からは新たな判断事項が生じず、Round 1 の Doubts は fixed 行を持たないため確認対象外であるため。

## Acceptance

- Goal: OK — `adr` の `Definition` と `close` の `Verified` が、サブを 1 つの名として扱い、親と同じように記録し、確かめる。
- Ran: `pnpm test:run`（836 passed）、`pnpm typecheck`、`pnpm lint`、`pnpm format:check`、`git diff 9775f1cd..HEAD` の読み、`ja-check`（変更した 4 文書）。
- Findings: なし
- Doubts: なし
