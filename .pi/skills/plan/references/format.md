# Plan format

`cycles/<YYMMDD>-<NNN>-<slug>/plan/<NN>-<plan id>.md`. The `NN-` is the file's order prefix and is not part of the plan id.

Section and field names are English; the content is Japanese.

## Shape

````md
# PLAN `<plan id>`

- No: <NN>
- Place: <worktree|base>
- Boundary Plans: <the plans this one stands on, and the order>

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

1. `<ファイル>`:
   - update: <何がどうなるか。1 文>
     - Outside: `<affected.md の ### External の項目>`。<そこでどうするか>

     ```ts
     <ADR かチャットが決めた中身。決まっていないときは置かない>
     ```

2. `<path>#<module>`:
   - update: <何がどうなるか。1 文>

3. `<dir>/`:
   - add: <空の dir を作る、または、最後のファイルを消して dir を残す>

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

## Acceptance

- Ran:
- Findings:
- Doubts:
````

## One plan is one worktree

- The plan is one worktree, one branch and one merge — unless the plan md's `Place` says `base`: then the agent does the work in its own tree, with no branch and no merge. The plan id is the plan's name.
- A subagent (the agent itself, for a `base` plan) reads the plan, and nothing else, to do the work. What the ADR decided is named where it bites, never restated.

## No

- `No` is the ADR's entry number, copied as it is. A normal plan keeps `- No: <NN>` at the top.
- An `ex-` plan does not write `No`; the close reads the `ADR <NN>` of the Triage line. The Triage line is the only source.

## Files

- The tree holds what changes and what follows the change. A changed file ends with `add`, `update` or `drop`; a related file carries no marker.
- Read the affected before writing it: its paths are the candidates, and the plan reads each one and decides its mark — `add`, `update`, `drop`, or no mark. The dirs the plan makes or leaves carry `add` or `drop` on the tree's dir line.
- A new double or fixture is a file: it sits at the root of the feature whose shape it holds.
- A fixture that holds a shape the feature does not own — the host, the OS, a format several units share — goes in `test/`.
- `test/` is shared, not the harness's own: a project may keep its own files there.
- Name a fixture `<name>.fixture.ts`, wherever it sits.
- A helper that is not a double keeps its own name.
- A file in `test/` that a carried test imports is named in `scripts/harness/harness.json`'s `copy` (the pull list).
- Say how a double or a fixture behaves when it is run outside its test: refuse, do not hang.

### Structure

- A file lives in the dir of the concern the feature needs.
- A test file sits beside the file it tests.
- The way in is one: a feature keeps its `index` at its root, and the rest of the project comes in there.
- A feature whose files are very few may stay flat at its root.
- When an added or an updated feature grows the flat set, propose the dirs these rules give, before the file count is past reading.

## Slices

- One slice is one closing: work that ends when its check passes. A subagent may carry several in one run; the size is a hint, not a handoff.
- The subagent commits only after the check passes: a filled `Commit` means that slice's check passed.
- A `base` plan is cut where the owner can look and decide: its check carries the look, and their answer closes the slice.
- One step is one thing: a file, a module inside a file, or a dir. The line says what becomes what, and the content the ADR or the chat decided goes in a fence under it.
  - a file — `<prefix>: <what becomes what, in one sentence>`; the prefix is `add:`, `update:` or `drop:`
  - a module — `<path>#<module>: <what becomes what, in one sentence>`; the prefix says the module's change, and it may differ from the file's `Files` marker
  - a test file — one `<prefix>: (happy|error|empty|boundary) <given> → <result>` per case, with the same prefix as the `Files` tree's marker; each `Adopted` line's result is one of those cases
  - a dir — only two cases: an empty dir to make, or the last file dropped and the dir left; the tree's dir line carries `add` or `drop`
- A step that meets the outside carries `- Outside: <the affected.md ### External item>.<what to do there>`, after the line and before the fence.
- A step whose content the ADR or the chat decided carries it in a fence under the step: the language is `ts`, `md`, `json` or the like, and the content is copied as it was decided, markdown or code; a test step keeps its case lines, and the fence goes under them.
- The cases of a test file follow `## Test cases`.
- A shape a plan does not need is not written: a plan with no test file has no test step, and a code step that meets nothing outside carries no `Outside:` line.
- The steps are numbered; the order is the order of the work.
- A plan whose `Files` has neither `add` nor `drop` says in the `Steps` and the `Design` how the update is built into the existing, and how the whole is redesigned. A plan that only replaces words is not a plan.

## Types

- `Types` sits in the slice that moves it. It holds the declarations that move, as code: a type, a schema, a signature, a state.
- What a declaration leaves open, the `Steps` and the `Verify` settle. `なし` when nothing moves.
- The behaviour is written in the step that does it, not here.

### Type rules

- A state is a discriminated union. Never a combination of optionals.
- A `switch` over a union is exhaustive: the last branch assigns to `never`. No `default`.
- Fields are `readonly`, arrays are `readonly T[]`, and an argument object is not written to.
- A constraint the compiler cannot check — a brand, a template literal built from a runtime string, a value that must be validated — has one factory, and the check lives inside it.
- A failure is a state or a throw. Never a silent success.

## Verify

- `Verify` is what closes the slice: what has to pass, and the read-through that proves it — not what to test.
- It has two fields. `Always` is the same in every slice; `Added` is what the change decides.
- Each `Adopted` line's result is one of the related tests; a step that goes past the `Scope` is not written, and the review reads it. A target of the plan's questions 3 and 4 is written even past the `Scope`: the reason is in `## Design`.
- `Always:` — the bullets below, and nothing else.
  - the tests related to this slice, the ones it writes included (`pnpm test:related <changed files>`; `pnpm test:run` when nothing is related)
  - `pnpm typecheck`
  - `pnpm lint`
  - `pnpm format:check`
  - the read-through: read every changed file whole, and every file it names whole; follow the procedure in the order the file gives, as the one who acts on it; check the number, the path, the name and the shape at each place against what it points to; fix any inconsistency, and write the fix in `Unplanned`
- `Added:` — what the change decides. One bullet per check that applies; `なし` when nothing does.
  - DB — rows are written into the store and read back; a migration runs forward and back.
  - front (a component, and what it shows) — the agent reports in the chat what to open, and the owner starts the server and looks in cmux-browser; their OK in the chat closes it.
  - auth — the library's sandbox or test environment shows the behaviour that was intended.
  - a `base` plan's look — the owner reads the slice's change; their OK closes it.
  - a proofread — the Japanese document this slice amends; a file whose body is not Japanese (a code comment, a test description) is not one
  - other — a check the ADR's scope names that the checks above do not cover, by a throwaway script or a shell command.
- A check that counts a string says what it compares: a string the file carried before the change is counted in the diff, not in the file.
- A `Verify` that cannot be run, or that is red with the change in place, is a hole: fix it, or say why it does not apply.

## Test cases

- The cases are used where a test file's cases are decided: a step that writes one, the reviewer that reads one, and the work's cleanup that drops one. A case keeps its step's prefix. A `<given>` names a premise that can be built one way, and keeps the ADR's subject when the ADR names one.
- A premise the types, the spec, the schema or a DB constraint already guarantees is not reproduced in a test.
- An assertion carries neither a magic number nor a hardcoded string.
- A boundary value is not a test of its own: the test says the spec it belongs to is met.
- A behaviour that is unlikely to happen, and whose breakage nobody would notice, is not tested.
- A mock is made only where the outside gives the types of its input and its output; a mock whose shape is guessed is not made, and not tested.
- Dummy data comes from a factory function, not from a literal written at each test.

## Notes

- `## Notes` holds one `### Slice N: <name>` per slice. The name is copied from the slice's heading (`## 1.<name>`) as it is.
- A section that is not a slice — the test cleanup — is `### Cleanup: <what it cleaned>`, with `Findings` and `Unplanned`; it has no `Commit` and no `Stopped`.
- `Findings`: one bullet per hole the work could not close — the place, the state, what closes it. Under it, `left: <why>` says why it could not be closed here. `なし` when there is none.
- `Unplanned`: a hole found and fixed here — the place, what changed, and why it could not wait.
- `Commit`: the slice's commit hash. `なし（理由）` when the slice changed nothing.
- `Stopped`: only for a slice that stopped. It holds what the stop left:
  - the output of the check that failed
  - the files changed
  - the subagent's last text
  - how many times it ran, and the time
  - the id of the worktree it left
  - for a `base` plan, the worktree id is `なし`, because there is no worktree
- A line the plan cannot write, and the four kinds do not cover the missing fact, is a `Stopped` line. It holds the line, the question, and the reason. The review reads it.
- **The subagent writes its own slice's record** in the worktree's plan md. `Stopped` too, since the subagent runs the check and sees it fail.
- For a `base` plan, the agent writes the slice's record in the base's plan md. `Stopped` too, since the agent runs the check and sees it fail.
- The agent does not author a worktree plan's plan md before the acceptance. The agent writes it at the acceptance, from the worktree.
- When a worktree plan is dropped, the agent copies the subagent's plan md to the base as it is.
- The three states: `Commit` filled is done; `Stopped` is interrupted; neither is not started.
- `Commit` is the slice's own commit, and it is not rewritten.

## Work Review

- The reviewer writes here, and the fixing subagent answers here. Two rounds: `### Round 1` (the findings) and `### Round 2` (the check of the fixes).
- A finding sits under the viewpoint it came from:
  - `Stale` — what this change made stale: a doc, a comment, a test, or a sentence the change makes redundant
  - `Unlisted` — a change the plan's `Files` does not name
  - `Gaps` — a hole the slices passed over, a behavior the checks do not exercise; a decided value is not a gap
  - `Unproven` — a test that would stay green if the behavior it names were removed
  - `Noise` — a test step a type, a schema or a DB constraint already settles, or one nobody would notice
- `Doubts` — a note that is not a finding, and still worth keeping: one bullet each. Nothing fixes it, and the close reads it as a leftover. `なし` when there is none.
- A finding is one bullet. What the fixing subagent did with it is a bullet under it: `fixed: <what was done>` for one it adopted, `left: <why>` for one it left. The close reads the `left` lines.
- `なし` when the viewpoint found nothing; a note may follow it (`なし — 何を確かめたか`). The close reads only the leftovers, so the note does not become one.
- Round 1 is a new conversation; Round 2 continues the reviewer's own, and looks at the `fixed` lines only. A Round 1 that finds nothing ends the review; a Round 2 that still finds the same thing is written as `left:` and the close reads it.

## Acceptance

- The agent writes it, after the review's fixes: `Ran` (the checks that were run) and `Findings` (one bullet per finding, and under it `fixed: <what was done>` or `left: <why>`; `なし` when there is nothing). The merge's commit is not written here: the acceptance is committed before the merge, and git holds the merge.
- `Doubts` — the same as the review's: a note that is not a finding. It is the agent's, and the close reads it as a leftover.
- A `Findings` line without a `fixed:` is handed to a `code` subagent as the fix instruction; when it is fixed, the acceptance runs again and is written again.

## Writing

- One bullet is one sentence.
- A file name is written from the project root. The tree, the steps and the checks use the same name.
- Do not write what the reader can look up.
- Keep a table short: a wide one breaks with long text.
- A field whose content cannot be written yet keeps its name and stays empty.
- Do not copy the ADR. Name it where it bites.
