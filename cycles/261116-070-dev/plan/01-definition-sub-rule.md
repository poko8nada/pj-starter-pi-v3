# PLAN `definition-sub-rule`

- No: 01
- Place: worktree
- Boundary Plans: なし

## Goal

定義書の規則が、ユニットの下に、そのユニットがないと存在し得ない機能をサブとして 1 行ずつ書けるようになる。

## Refactor

- Inside:
  - Modules: なし。`rules/definition.rules.md` に `What may be a Sub` を足すが、規則は 1 ページで読める大きさのままで、分ける理由がない。
  - Dirs: なし。
- Outside:
  - Extract: なし。規則の文は `rules/` の外に出さない。
  - Colocate: なし。

## Files

```text
rules/
  definition.rules.md        update
  definition.format.md       update
scripts/
  product-ready/
    index.test.ts
    targets.mjs
    targets.test.ts
DEFINITION.md
```

## Slices

## 1. 規則がサブを許す

`rules/definition.rules.md` が、ユニットの下にサブを書き、名付け、判定する規則を持つ。

### Types

なし

### Steps

1. `rules/definition.rules.md`
   1. update: 冒頭の 1 文を、Unit と Sub を扱う文にする。
      ```md
      What may be a Unit or a Sub of `DEFINITION.md`, and how the Units, the Subs, the `Who` and the `Stack` are named and written.
      ```
   2. update: `## What may be a Unit` のセクションの末尾（`A directory is not a Unit.` の後、`## How the list is grouped` の前）に、`What may be a Sub` のセクションを足す。
      ```md
      ## What may be a Sub

      A Sub is one thing the `Who` can do with a Unit, below the Unit's main function. It is held to `Result` and `One loss` as a Unit is, and to these:

      1. **No life without the Unit** — taking the Unit away takes the Sub with it. A thing that stands without the Unit is a Unit, not a Sub.
      2. **Not the route, not a check** — the route to a function (the implementation, the steps, the command, the settings, the file layout) and the checks that hold it up do not become Subs.
      3. **Any number** — a Unit has no Sub, one Sub, or more. A Unit without Subs is written with its line alone.
      ```
   3. update: `One loss` を、行ごとに数える文にする。
      ```md
      4. **One loss** — taking the Unit's line away removes exactly one thing the `Who` could do: its main function. Two losses at the same level: two Units. No loss: it is not a Unit. A thing that cannot exist without the Unit is a Sub, and its own line carries its one loss.
      ```
   4. update: `The noun decides the split` を、自立する新しい名詞だけを別のユニットとする文にする。
      ```md
      5. **The noun decides the split** — one noun is one Unit; a new noun that stands on its own is another Unit. More verbs on the same noun stay inside it, on its line or on a Sub's line. A Sub keeps the Unit's noun and adds its own word after an underscore: it is not a new Unit.
      ```
   5. update: `How the list is grouped` の `- `Users can do`may stay flat, or be grouped under`####`headings. The hierarchy is at most 2:`### Users can do`and`####`.` の行を、見出しで数える文にする。
      ```md
      - `Users can do` may stay flat, or be grouped under `####` headings. The hierarchy is at most 2: `### Users can do` and `####`. The limit counts the headings; a Sub is an indented line, not a heading.
      ```
   6. update: `How the list is grouped` の `- Lines under a heading stay one line per Unit.` の行を、サブの行を含む文にする。
      ```md
      - A line under a heading is one Unit; a Sub is one more line under its Unit.
      ```
   7. update: `Each field` の `- A Unit's line — written from the `Who`'s side: `<Who> が、xxx する`. The name is the thing's name; the description is not.` の行に、サブの行の形と `Who` を足す。
      ```md
      - A Unit's line — written from the `Who`'s side: `<Who> が、xxx する`. The name is the thing's name; the description is not. A Sub's line takes the same form, and its `Who` may be a role other than the Unit's.
      ```
   8. update: `Each field` の `- A Unit's line is its main function. The route to that function — the implementation, the steps, the command, the settings, the file layout — does not go in it.` の行を、行が運ぶ機能の文にする。
      ```md
      - A line is the function it carries: a Unit's line is its main function, a Sub's line is its own. The route to that function — the implementation, the steps, the command, the settings, the file layout — does not go in it.
      ```
   9. update: `Each field` の `- So the line moves only when the main function itself changes. A change to the route or to a check leaves the line as it is.` の行を、行が運ぶ機能が変わるときだけ動く文にする。
      ```md
      - So a line moves only when the function it carries changes. A change to the route or to a check leaves the line as it is.
      ```
   10. update: `Naming` の `- The name is two or more words joined with hyphens. Two shapes:` の行を `A Unit's name` に変える。
       ```md
       - A Unit's name is two or more words joined with hyphens. Two shapes:
       ```
   11. add: `Naming` の `an object and its work: sound-notify` の行の後に、サブの名の行を足す。
       ```md
       - A Sub's name is the Unit's name, an underscore, and the Sub's own name: `subagent-consult_status`. The underscore appears once, and only in a Sub's name.
       ```
   12. add: `A Sub's name is the Unit's name, an underscore, and the Sub's own name: `subagent-consult_status`. The underscore appears once, and only in a Sub's name.` の行の後に、サブの側の名の行を足す。
       ```md
       - A Sub's own name is one word, or words joined with hyphens. One word is allowed: the Unit's name already makes the whole name two or more words.
       ```

### Policy

- Allowed:
  - ユニットはサブを 0 個でも、いくつでも持てる。
  - サブの `Who` は、親の主機能の `Who` と違ってよい。
  - 同じ機能が、あるユニットのサブにも、別のユニットにも現れてよい。
- Forbidden:
  - ユニットなしで存在し得るものをサブにしない - それはユニットである。
  - 経路（実装、手順、コマンド、設定、ファイルの配置）と検査をサブにしない - ユニットの行と同じ理由である。
  - サブの名をユニットの名で始めない - 親が名前で分からなくなる。

### Verify

- Always:
  - `pnpm test:run`
  - `pnpm typecheck`
  - `pnpm lint`
  - `pnpm format:check`
  - `rules/definition.rules.md` 全体と `rules/definition.format.md` 全体を読み、`DEFINITION.md` の 23 のユニットの行と、`adr` の `Definition` と `close` の `Verified` を読み、`What may be a Sub`、`One loss`、`The noun decides the split`、`How the list is grouped`、`Each field`、`Naming` の文が、サブの行を矛盾なく扱えるかを当て、不整合を直す。
- Added:
  - proofread: `node scripts/checks/ja-check.mjs rules/definition.rules.md` を通し、warn と error をゼロにし、読みで日本語を直す。

## 2. 形がサブの行を受ける

`rules/definition.format.md` が、`Users can do` のユニットの行の下にサブの行を書ける形になる。

### Types

なし

### Steps

1. `rules/definition.format.md`
   1. update: `Sections` の `Users can do` の行の 2 文目（`The name is the thing's name.`）を落とし、サブの行を含む 1 文にする。
      ```md
      - `Users can do` — one line per Unit, and one line per Sub under its Unit: what the `Who` can do with it.
      ```
   2. drop: `Sections` の `Users can do` may be grouped under `####` headings; a heading is not a Unit. の行。`How the list is grouped` が同じことを持つ。
   3. update: `Writing` の `One line is one Unit.` を、サブの行を含む形にする。
      ```md
      - One line is one Unit, or one Sub under its Unit.
      ```

### Policy

- Allowed:
  - ユニットはサブを 0 個でも、いくつでも持てる。
  - 同じ機能が、あるユニットのサブにも、別のユニットにも現れてよい。
- Forbidden:
  - 経路（実装、手順、コマンド、設定、ファイルの配置）と検査をサブにしない - ユニットの行と同じ理由である。

### Verify

- Always:
  - `pnpm test:run`
  - `pnpm typecheck`
  - `pnpm lint`
  - `pnpm format:check`
  - `rules/definition.format.md` 全体と `DEFINITION.md` を読み、`Sections` と `Writing` の文が、`rules/definition.rules.md` の `What may be a Sub` と `Naming` に合うかを当て、不整合を直す。
- Added:
  - proofread: `node scripts/checks/ja-check.mjs rules/definition.format.md` を通し、warn と error をゼロにし、読みで日本語を直す。

## Notes

### Slice 1: 規則がサブを許す

- Findings: なし
- Unplanned: なし
- Commit: 618cdb67
- Stopped: なし

### Slice 2: 形がサブの行を受ける

- Findings: なし
- Unplanned: なし
- Commit: a2c08cf8
- Stopped: なし

### Cleanup: なし

- Findings: なし
- Unplanned: なし

## Work Review

### Round 1

- Stale:
  - `rules/definition.format.md:70` — `What may be a Unit, and how a Unit is named and written, is in \`rules/definition.rules.md\`.` が古い範囲のまま残り、規則の新内容（`rules/definition.rules.md:3`の`What may be a Unit or a Sub ... Units, the Subs ...`）と矛盾する。理由: diff は冒頭文・Sections・Writing を Sub 対応に変えたのに、この相互参照だけ Unit のままなので、読み手は「形の側は Unit だけを扱う」と誤読できる。
    - fixed: `rules/definition.format.md:70` を `What may be a Unit or a Sub, and how a Unit or a Sub is named and written, is in \`rules/definition.rules.md\`.` に直し、規則の冒頭文と相互参照を一致させた。
- Unlisted: なし
- Gaps: なし
- Policy: なし
- Unproven: なし
- Noise: なし
- Doubts: なし

### Round 2

- Stale:
  - `rules/definition.format.md:70` の fixed を確認した — 現行の 70 行目が fixed 文どおりの Unit or a Sub の表記であり、Round 1 が指摘した Unit のみの旧表記は残っていない。理由: 現物の 70 行目を読み、fixed 文の文言と一致すること、および `rules/definition.rules.md:3` の Unit or a Sub の範囲と一致し、相互参照の矛盾が解消していることを当てたため。
- Unlisted: なし
- Gaps: なし
- Policy: なし
- Unproven: なし
- Noise: なし
- Doubts: なし

## Acceptance

- Goal: OK — 定義書の規則が、ユニットの下に、そのユニットがないと存在し得ない機能をサブとして 1 行ずつ書けるようになった。
- Ran: `pnpm test:run`（836 passed）、`pnpm typecheck`、`pnpm lint`、`pnpm format:check`、`git diff 90678005..HEAD` の読み、`ja-check`（`rules/definition.rules.md`、`rules/definition.format.md`）。
- Findings: なし
- Doubts: なし
