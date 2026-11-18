# PLAN `definition-rules`

- No: 01
- Place: worktree
- Boundary Plans: なし

## Goal

`definition.rules.md` が、重複を `definition.format.md` に寄せた 6 セクションの規則になり、Unit と Sub の判定、行の書き方、名付けをこのファイルで決められる。

## Refactor

- Inside:
  - Modules: `rules/definition.rules.md` のセクションを組み直す。答えは、ファイルを分割せずに 1 ファイルの中で `## What may be a Unit` を 4 つの原理の下の入れ子にし、`Each field` を `How a line is written` に置き換え、`Naming` を 4 つの見出しに組み直すこと。理由は、規則が 1 つの判断の連なりで、読む人が Unit と Sub の判定から名付けまでを 1 ファイルで決めるため。
  - Dirs: なし。`rules/` の構成は変えない。
- Outside:
  - Extract: なし。重複する規則は新しい共有モジュールを作らず、`definition.format.md` に寄せる。
  - Colocate: なし。`definition.format.md` のセクションと欄の定義は format に残す。

## Files

```text
.pi/
  skills/
    adr/
      SKILL.md
rules/
  definition.format.md    update
  definition.rules.md     update
```

## Slices

## 1.format の 1 行 1 Unit/Sub を 1 つにする

`definition.format.md` の `## Sections` から規則を外し、1 行 1 Unit/Sub を `## Writing` の 1 行だけにする。

### Types

なし

### Steps

1. `rules/definition.format.md`
   1. update: `## Sections` の `Users can do` から 1 行 1 Unit/Sub の規則を外し、セクションが何を持つかの説明だけにする。`## Writing` の `- One line is one Unit, or one Sub under its Unit.` が唯一の規則として残る。

      ```md
      - `Users can do` — what the `Who` can do with each Unit and Sub.
      ```

### Policy

- Allowed:
  - セクションの統合、分割、順序の変更、見出しの改名（C3, F2, F4）
- Forbidden:
  - 規則の条件を変えること - 意味を変えないと決めたため（C3）
  - `cycles/` の記録を直すこと - 記録はその時点の事実であるため（C5）

### Verify

- Always:
  - `pnpm test:related rules/definition.format.md`（関連がなければ `pnpm test:run`）
  - `pnpm typecheck`
  - `pnpm lint`
  - `pnpm format:check`
  - `rules/definition.format.md` と、それが指す `rules/definition.rules.md` と `rules/roadmap.md` を読み、読む者の順にたどり、番号、パス、名前、形を当て、不整合を直す
- Added: なし

## 2.rules のセクションを組み直す

`definition.rules.md` を 6 セクションの新しい順に組み直し、`Who`、`Stack`、1 行 1 Unit/Sub の重複を落とす。

### Types

なし

### Steps

1. `rules/definition.rules.md`
   1. update: 冒頭を、役割を宣言する 2 文に変える。

      ```md
      # Definition rules

      Read this when a line is added, moved or dropped. It holds what may be a Unit or a Sub of `DEFINITION.md`, and how the Units, the Subs, the `Who` and the `Stack` are named and written; the shape of the file and its fields are in `rules/definition.format.md`.
      ```

   2. update: `## What may be a Unit` を、4 つの原理の下の入れ子にする。

      ```md
      ## What may be a Unit

      ### One noun

      - The `Who` calls the thing by one noun. A capability, a state or an internal mechanism has no noun of its own: it is not a Unit.
      - One noun is one Unit. More verbs on the same noun stay inside it, on its line or on a Sub's line.
      - A new noun that stands on its own is another Unit.
      - A Sub keeps the Unit's noun and adds its own word after an underscore: it is not a new Unit.
      - A Unit may span many directories. A directory is not a Unit.

      ### Reach and result

      - The `Who` can reach it and do one thing with it. Another Unit's capability is not a precondition. Data or content is fine as a precondition.
      - Using it changes something the `Who` can see, and the `Who` can stop there. If the work has to continue, the rest is inside the same Unit.

      ### One loss

      - Taking the Unit's line away removes exactly one thing the `Who` could do: its main function.
      - Two losses at the same level: two Units. No loss: it is not a Unit.
      - A thing that cannot exist without the Unit is a Sub, and its own line carries its one loss.

      ### Internal work

      - Aligning, refactoring, syncing are not Units. When they happen, the Unit they touch moves.

      The kinds below are how the Units of this product happen to appear. They are examples, not a rule: an extension, a skill, a gate, a document, a command.
      ```

   3. update: `## Each field` を `## How a line is written` に置き換え、`Who` と `Stack` の定義を落とす。

      ```md
      ## How a line is written

      ### A line is the function it carries

      - A Unit's line is its main function. A Sub's line is its own.
      - The route to that function does not go in it: the implementation, the steps, the command, the settings, the file layout.
      - The checks that hold it up do not go in it either: whatever runs to prove it.
      - So a line moves only when the function it carries changes. A change to the route or to a check leaves the line as it is.

      ### A line is written from the `Who`'s side

      - The form is `<Who> が、xxx する`.
      - The name is the thing's name; the description is not.
      - A Sub's line takes the same form, and its `Who` may be a role other than the Unit's.
      ```

   4. drop: `## How the list is grouped` から `- A line under a heading is one Unit; a Sub is one more line under its Unit.` を落とす（`definition.format.md` の `## Writing` に残る）。

   5. update: `## How the list is grouped` の `A heading is not a Unit: by test 04, ...` を、番号ではなく理由を書く文に変える。

      ```md
      - A heading is not a Unit: taking it away loses more than one thing, and a Unit carries exactly one loss.
      ```

   6. update: `## Naming` を 4 つの見出しに組み直し、綴り一覧の導入を format の `Who` と `Stack` の定義を指す形にする。

      ```md
      ## Naming

      ### Name

      - The name is the `Who`'s word for the thing.
      - The name says what the Unit is. The feature layer is gone, so the name is the only place that says it.

      ### A Unit's name

      - A Unit's name is two or more words joined with hyphens. Two shapes:
        - a thing and its kind: `lefthook-gate`, `adr-skill`, `agent-rules`
        - an object and its work: `sound-notify`
      - A bare word is not written: `lint`, `test`, `consult`, `readme`.
      - The tool's name belongs to the `Stack`: `oxlint` is written there, and the Unit is named for what the `Who` uses.

      ### A Sub's name

      - A Sub's name is the Unit's name, an underscore, and the Sub's own name: `subagent-consult_status`. The underscore appears once, and only in a Sub's name.
      - A Sub's own name is one word, or words joined with hyphens. One word is allowed: the Unit's name already makes the whole name two or more words.

      ### Spelling lists

      - The lists below are the spelling. They are not a gate: a name that is not in them is decided in the ADR entry, and written in `DEFINITION.md`. The list gains the name later, outside a cycle.
      - `Who` and `Stack` themselves are defined in `rules/definition.format.md`.
      - `Who`:
        - people: owner / administrator / operator / moderator / staff / member / user / customer / subscriber / guest / visitor / author / editor / reader / viewer / buyer / seller / player / student / teacher
        - developers, for a library, a framework, an API or a CLI: developer / integrator / plugin author
        - not a person: another service / the side that sends a webhook / agent / a team
      - `Stack`:
        - Ground: Language / Runtime / Package manager / Deploy
        - Checks: Typechecker / Test runner / Linter / Formatter / Git hooks / Build
        - Agent: Host / Schema
        - Product: Full-stack framework / Web framework / View / Router / Styling / State / Data / Auth / Server / API / Job / Mail / Search / Payments / Analytics / i18n
      ```

   7. update: セクションを `What may be a Unit`、`What may be a Sub`、`How a line is written`、`How the list is grouped`、`Naming`、`What does not come here` の順に並べる。`What does not come here` の内容は変えない。

### Policy

- Allowed:
  - セクションの統合、分割、順序の変更、見出しの改名（C3, F2, F4）
- Forbidden:
  - 規則の条件を変えること - 意味を変えないと決めたため（C3）
  - `cycles/` の記録を直すこと - 記録はその時点の事実であるため（C5）

### Verify

- Always:
  - `pnpm test:related rules/definition.rules.md`（関連がなければ `pnpm test:run`）
  - `pnpm typecheck`
  - `pnpm lint`
  - `pnpm format:check`
  - `rules/definition.rules.md` と、それが指す `DEFINITION.md` と `rules/definition.format.md` と、affected が指す `.pi/skills/adr/SKILL.md` を読み、読む者の順にたどり、番号、パス、名前、形を当て、不整合を直す
- Added:
  - other: `git show HEAD:rules/definition.rules.md` の各行を、新しいファイルの見出しと読み合わせ、落ちた規則がないことを確かめる

## Notes

### Slice 1: format の 1 行 1 Unit/Sub を 1 つにする

- Findings:
- Unplanned:
- Commit:
- Stopped:

### Slice 2: rules のセクションを組み直す

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
