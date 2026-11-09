# Plan format

`cycles/<YYMMDD>-<NNN>-<slug>/plan/<NN>-<plan id>.md`. The `NN-` is the file's order prefix and is not part of the plan id. An `ex-` plan omits the `NN-` prefix.

Section and field names are English; the content is Japanese.

## Shape

````md
# PLAN `<plan id>`

- No: <NN>
- Place: <worktree|base>
- Boundary Plans: <the plans this one stands on, and the order>

## Goal

<何が> が <どうなる>、1 行。

## Design

- Inside:
  - Modules: <統合・分割するファイルやモジュール。答えと、なぜその形なのか。なければ なし>
  - Dirs: <統合・分割・移動するディレクトリ。答えと、なぜその形なのか。なければ なし>
- Outside:
  - Extract: <共通化するモジュール。答えと、なぜその形なのか。なければ なし>
  - Colocate: <共通化をやめ、コロケーションするモジュール。答えと、なぜその形なのか。なければ なし>

## Files

```text
<dir>/
  <dir>/
    <file>                update
    <file>                add
    <file>                drop
    <file>
<file>
```

## Slices

## 1.<スライス名>

### Types

```ts
<型・スキーマ・署名・状態の宣言。なければ なし>
```

### Steps

1. `<ファイル>`
   1. update: <1 つの変更>
   2. update: <1 つの変更>

      ```ts
      <ADR かチャットが決めた中身>
      ```

   3. drop: <1 つの変更>
2. Outside: `<affected.md の ### External の項目>`
   1. update: <1 つの変更>

### Policy

- Allowed:
  - <して良いこと>
- Forbidden:
  - <してはいけないこと> - <しない理由>

### Verify

- Always:
  - <関連テスト（`pnpm test:related <changed files>`。関連がなければ `pnpm test:run`）>
  - <`pnpm typecheck`>
  - <`pnpm lint`>
  - <`pnpm format:check`>
  - <変えたファイル全体と、名指すファイルを読み、読む者の順に手順をたどり、番号、パス、名前、形を当て、不整合を直す>
- Added: <DB / front / auth / base / other。当たるものを 1 本ずつ、なければ なし>

## 2.<スライス名>

## Notes

### Slice 1: <スライス名>

- Findings:
- Unplanned:
- Commit:
- Stopped:

### Cleanup: <what it cleaned>

- Findings:
- Unplanned:

## Work Review

### Round 1

- Stale:
- Unlisted:
- Gaps:
- Unproven:
- Noise:
- Doubts:

### Round 2

- Stale:
- Unlisted:
- Gaps:
- Unproven:
- Noise:
- Doubts:

## Acceptance

- Ran:
- Findings:
- Doubts:
````

## Goal

What the plan achieves, in one line.

- `## Goal` sits above `## Design`, in one line.
- A normal plan's `Goal` comes from the ADR's `Adopted` one-liner.
- An `ex-` plan's `Goal` comes from the close's Triage line.
- The cut's `Goal` and its `Summary` both stay.

## Design

The four questions the plan answers about shape, and why that shape.

- `Inside.Modules` — within the plan's scope, is there a file or a module inside a file (code or doc) to merge or split?
- `Inside.Dirs` — within the plan's scope, is there a directory to merge, split or move?
- `Outside.Extract` — outside the plan's scope, does this plan's work create a module (code or doc) that should be shared?
- `Outside.Colocate` — outside the plan's scope, does this plan's work make a module that should no longer be shared and should sit beside its user?
- Each answer says the answer and why that shape.
- `なし` when there is none.

## No

The ADR entry the plan carries.

- `No` is the ADR's entry number, copied as it is.
- A normal plan keeps `- No: <NN>` at the top.
- An `ex-` plan does not write `No`.
- The close reads the `ADR <NN>` of the Triage line.
- The Triage line is the only source.

## Files

What the plan changes, and what follows the change.

### Tree

- The tree holds what changes and what follows the change.
- A changed file ends with `add`, `update` or `drop`.
- A related file carries no marker.
- The map's paths are the candidates for the tree.
- The dirs the plan makes or leaves carry `add` or `drop` on the tree's dir line.

### Doubles and fixtures

- A new double or fixture is a file.
- It sits at the root of the feature whose shape it holds.
- A fixture that holds a shape the feature does not own goes in `test/`, such as the host, the OS, or a format several units share.
- `test/` is shared, not the harness's own.
- A project may keep its own files there.
- Name a fixture `<name>.fixture.ts`, wherever it sits.
- A helper that is not a double keeps its own name.
- A file in `test/` that a carried test imports is named in `scripts/harness/harness.json`'s `copy` (the pull list).
- Say how a double or a fixture behaves when it is run outside its test: refuse, do not hang.

### Structure

Where a file lives.

- A file lives in the dir of the concern the feature needs.
- A test file sits beside the file it tests.
- The way in is one.
- A feature keeps its `index` at its root, and the rest of the project comes in there.
- A feature whose files are very few may stay flat at its root.
- A feature that outgrows its flat set uses dirs, one per concern.

## Slices

How the work is cut into slices, one concern per slice.

- The slice's heading names its concern, and its first line says the concern in one sentence.
- One step is one file, and its substeps are its changes.
- A file step names the file, and each substep is one change in one line.
- A substep starts with `add:`, `update:` or `drop:`.
- The content the ADR or the chat decided goes in a fence under the file step.
- The language is `ts`, `md`, `json` or the like.
- The content is copied as it was decided, markdown or code.
- A step that meets the outside carries `2. Outside: <the affected.md ### External item>` with its substeps.
- A test step keeps its case lines, and the fence goes under them.
- The cases of a test file follow `## Test cases`.
- A plan with no test file has no test step.
- The steps are numbered in the order of the work.

## Types

The declarations the slice moves, as code.

- `Types` sits in the slice that moves it.
- It holds the declarations that move, as code: a type, a schema, a signature, a state.
- What a declaration leaves open, the `Steps` and the `Verify` settle.
- `なし` when nothing moves.
- The behaviour is written in the step that does it, not here.

### Type rules

How a declaration is written.

- A state is a discriminated union, never a combination of optionals.
- A `switch` over a union is exhaustive.
- The last branch assigns to `never`.
- It has no `default`.
- Fields are `readonly`.
- Arrays are `readonly T[]`.
- An argument object is not written to.
- A constraint the compiler cannot check has one factory, and the check lives inside it, such as a brand, a template literal built from a runtime string, or a value that must be validated.
- A failure is a state or a throw, never a silent success.

## Policy

The ADR's `Policy` each slice needs, copied without omission.

- `### Policy` sits between the `Steps` and the `Verify` in each slice.
- It copies the ADR's `Policy` that the slice needs without omission, and repetition across slices is allowed.
- A policy that hits only one slice goes only there.
- It carries no `C`/`F` reference.

## Verify

What proves that the slice is closed, and what the proof holds.

- `Verify` proves that the slice is closed.
- It holds what has to pass, and the read-through that proves it.
- It is not what to test.
- It has two fields.
- `Always` is the same in every slice.
- `Added` is what the change decides.
- Each `Add`, `Update` and `Drop` line's result is one of the related tests.
- A step that goes past the `Scope` is not written.
- A step that does what the `Policy`'s `Forbidden` says not to do is not written.
- The review reads it.
- A module for the plan's questions 3 and 4 is written even past the `Scope`.
- The reason is in `## Design`.
- `Always:` — the bullets below, and nothing else.
  - the tests related to this slice, the ones it writes included (`pnpm test:related <changed files>`; `pnpm test:run` when nothing is related)
  - `pnpm typecheck`
  - `pnpm lint`
  - `pnpm format:check`
  - the read-through: read every changed file whole, and every file it names whole.
  - Follow the procedure in the order the file gives, as the one who acts on it.
  - Check the number, the path, the name and the shape at each place against what it points to.
  - Fix any inconsistency, and write the fix in `Unplanned`.
- `Added:` — what the change decides.
- One bullet per check that applies.
- `なし` when nothing does.
  - DB — rows are written into the store and read back.
  - DB — a migration runs forward and back.
  - front (a component, and what it shows) — the agent reports in the chat what to open.
  - front — the owner starts the server and looks in cmux-browser.
  - front — their OK in the chat closes it.
  - auth — the library's sandbox or test environment shows the behaviour that was intended.
  - a `base` plan's look — the owner reads the slice's change.
  - Their OK closes it.
  - a proofread — the Japanese document this slice amends, not a file whose body is not Japanese.
  - other — a check the ADR's scope names that the checks above do not cover, by a throwaway script or a shell command.
- A check that counts a string says what it compares.
- A string the file carried before the change is counted in the diff, not in the file.

## Test cases

The cases a test file carries, and what they must hold.

- A case is `<prefix>: (happy|error|empty|boundary) <given> → <result>`.
- Each `Add`, `Update` and `Drop` line's result is one of those cases.
- The cases are used where a test file's cases are decided.
- A step writes one, the reviewer reads one, and the work's cleanup drops one or fixes its premise.
- A case keeps its step's prefix.
- A `<given>` names a premise that can be built one way.
- It keeps the ADR's subject when the ADR names one.
- A premise the types, the spec, the schema or a DB constraint already guarantees is not reproduced in a test.
- An assertion carries neither a magic number nor a hardcoded string.
- A boundary value is not a test of its own.
- The test says the spec it belongs to is met.
- A behaviour that is unlikely to happen, and whose breakage nobody would notice, is not tested.
- A mock is made only where the outside gives the types of its input and its output.
- A mock whose shape is guessed is not made, and not tested.
- Dummy data comes from a factory function, not from a literal written at each test.

## Notes

The work's record, one section per slice and one for the cleanup.

- `## Notes` holds one `### Slice N: <name>` per slice.
- The name is copied from the slice's heading (`## 1.<name>`) as it is.
- A section that is not a slice — the test cleanup — is `### Cleanup: <what it cleaned>`, with `Findings` and `Unplanned`.
- It has no `Commit` and no `Stopped`.

### Fields

- `Findings`: one bullet per hole the work could not close — the place, the state, what closes it.
- Under it, `left: <why>` says why it could not be closed here.
- `なし` when there is none.
- `Unplanned`: a hole found and fixed here — the place, what changed, and why it could not wait.
- `Commit`: the slice's commit hash.
- `なし（理由）` when the slice changed nothing.
- `Stopped`: only for a slice that stopped.
- A line the plan cannot write, and the four kinds do not cover the missing fact, is a `Stopped` line.
- A `Stopped` line holds the line, the question, and the reason.
- The review reads it.

### Stop

What a `Stopped` line holds when the slice stopped.

- the output of the check that failed
- the files changed
- the subagent's last text
- how many times it ran, and the time
- the id of the worktree it left
- for a `base` plan, the worktree id is `なし`, because there is no worktree

### States

| `Commit` | `Stopped` | the slice   |
| -------- | --------- | ----------- |
| filled   |           | done        |
|          | filled    | interrupted |
|          |           | not started |

- `Commit` is the slice's own commit, and it is not rewritten.

## Work Review

The two rounds of the work's review, and the findings under their viewpoints.

- Two rounds: `### Round 1` (the findings) and `### Round 2` (the check of the fixes).
- A finding sits under the viewpoint it came from:
  - `Stale` — what this change made stale: a doc, a comment, a test, or a sentence the change makes redundant
  - `Unlisted` — a change the plan's `Files` does not name
  - `Gaps` — a hole the slices passed over, a behavior the checks do not exercise; a decided value is not a gap
  - `Unproven` — a test that would stay green if the behavior it names were removed
  - `Noise` — a test step a type, a schema or a DB constraint already settles, or one nobody would notice
- `Doubts` — a note that is not a finding, and still worth keeping: one bullet each.
- The reviewer writes it under `- Doubts:` in the round it came from.
- Nothing fixes it, and the close reads it as a leftover.
- `なし` when there is none.
- A finding is one bullet.
- What the fixing subagent did with it is a bullet under it: `fixed: <what was done>` for one it adopted, `left: <why>` for one it left.
- The close reads the `left` lines.
- `なし` when the viewpoint found nothing.
- A note may follow it (`なし — 何を確かめたか`).
- The close reads only the leftovers, so the note does not become one.
- A Round 1 that finds nothing ends the review.
- What the final fix cannot close, the fixing subagent writes as `left:`, and the close reads it.

### Round 1

### Round 2

## Acceptance

What the acceptance ran, and what it found.

- `Ran` holds the checks that were run.
- `Findings` holds one bullet per finding, and under it `fixed: <what was done>` or `left: <why>`.
- `なし` when there is nothing.
- The merge's commit is not written here.
- The acceptance is committed before the merge.
- Git holds the merge.
- `Doubts` — the same as the review's: a note that is not a finding.
- The agent writes the Acceptance's `Doubts`.
- The close reads it as a leftover.

## Writing

- One bullet is one rule.
- A file name is written from the project root.
- The tree, the steps and the checks use the same name.
- Keep a table short: a wide one breaks with long text.
- A field whose content cannot be written yet keeps its name and stays empty.
