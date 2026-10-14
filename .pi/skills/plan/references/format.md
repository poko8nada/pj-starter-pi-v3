# Plan format

`cycles/<YYMMDD>-<NNN>-<slug>/plan/<plan id>.md`.

Section and field names are English; the content is Japanese.

## Shape

````md
# PLAN `<plan id>`

## Files

```text
<dir>/
  <dir>/
    <file>                update
    <file>
<file>
```

## Slices

## 1.<スライス名>

### Types

```ts
<型・スキーマ・署名・状態の宣言。無ければ なし>
```

### Steps

1. `<file>`:
   - <何をどうするか。1 文>
     - Outside: design の `<Boundary の項目>`。<そこでどうするか>

### Verify:

- <型>: <コマンド / 相手 / 場所>
  - (<印>) <given> → <result>
  - _no case_: <walk の行> — <理由>

## 2.<スライス名>

## Notes

### Slice 1: <スライス名>

- Findings:
- Unplanned:
- Commit:

## Review

### Round 1

- Stale:
- Unlisted:
- Gaps:

## Acceptance

- Ran:
- Findings:
````

## One plan is one worktree

- The plan is one worktree, one branch and one merge — unless the design says `base`: then the agent does the work in its own tree, with no branch and no merge. The plan id is the name the design gave it.
- A subagent reads the plan, and nothing else, to do the work. What the design and the ADR decided is named where it bites, never restated.

## Files

- The tree holds what changes and what follows the change. A changed file ends with `add`, `update` or `drop`; a related file carries no marker.
- Walk the relations before writing it: what imports the thing that changes, calls it, renders it, migrates with it, seeds with it, documents it, checks it. A follower that is not written is a follower that gets missed.
- A file whose structure does not follow the project's rules, and that this plan touches anyway, is fixed in the same plan. The step carries the reason: what the build makes worse.
- A new double or fixture is a file: it goes in the tree, and `test/` is where the doubles live. Say how it behaves when it is run outside its test: refuse, do not hang.

## Slices

- One slice is one closing: work that ends when its check passes. A subagent may carry several in one run; the size is a hint, not a handoff.
- The subagent commits only after the check passes: a filled `Commit` means that slice's check passed.
- A `base` plan is cut where the owner can look and decide: its check carries the look (`look`, `browser`, `use`), and their answer closes the slice.
- One step is one file: what to do in it. A step that meets the outside carries an `Outside:` line: the design's condition, named, and what to do there.
- The last slice is the integration slice: its check covers what the plan delivers as a whole, not one file. Its name is `統合: <what the plan delivers>`.
- The steps are numbered; the order is the order of the work.

## Types

- `Types` sits in the slice that moves it. It holds the declarations that move, as code: a type, a schema, a signature, a state.
- It is the source of the slice's cases: what a declaration leaves open, `Verify` proves. `なし` when nothing moves.
- The behaviour is written in the step that does it, not here.

### Type rules

- A state is a discriminated union. Never a combination of optionals.
- A `switch` over a union is exhaustive: the last branch assigns to `never`. No `default`.
- Fields are `readonly`, arrays are `readonly T[]`, and an argument object is not written to.
- A constraint the compiler cannot check — a brand, a template literal built from a runtime string, a value that must be validated — has one factory, and the check lives inside it.
- A failure is a state or a throw. Never a silent success.

## Verify

- `Verify` proves what `Types` and the `Steps` decide, and only what the types cannot: a value that arrives from outside, the side effects, the errors, the integration.
- One `Verify` per slice. It names one type from the list below, and its content. Pick the type that decides the work; do not invent a check.

### Kinds

- `test` — a machine runs the tests: the file, the command, and the cases
  - the cases are written on top of that test file: read it first, and follow the way it already works (its fixtures, its doubles, the seam it uses)
- `api` — a request is sent to the interface, and the response is read
- `browser` — a person walks the screens, and reports what was seen
- `visual` — a screenshot of the screens is compared against the agreed look
- `compat` — the same walk on another browser or width
- `a11y` — the screens are walked with a screen reader, or the tree, the contrast and the labels are checked
- `cli` — a command is run, and its output is read
- `perf` — a machine reads the time or the load of the product while it runs
- `data` — rows are written into the store and read back, and a migration runs forward and back
- `security` — a request that should be refused is sent, and the refusal is read
- `form` — a machine checks a length, a count, or compares two files
- `read` — a subagent reads a document and reports: which subagent, which document, and what it reports. The subagent reads it itself; a check that needs a consult subagent is run by the agent, and the agent reads it again at the acceptance as a precaution
- `use` — a subagent uses the document, and reports what it does with it
- `look` — a person reads a value: a screen, a log, a DB, a file

### Cases

- Every `Verify` carries cases: the lines the walk below writes, and at least one `(happy)`.
- A case is `<given> → <expected result>`, marked with the walk's line: `(happy)`, `(error)`, `(empty)`, `(boundary values)`. The result is a value, an error type or a state.
- What is given is the input that tells the behavior from its absence. A case whose input would give the same result with the behavior removed is not a case: a value the plan or the ADR decided is not a case.
- A line the compiler or the schema already settles takes no case: write the reason it does not apply. A line whose breakage nobody would notice takes no case either.
- A line that takes no case stands in the same list, as `- _no case_: <the walk's line> — <why>`, so a reader can tell a decision from a hole.
- A slice with `Types: なし` (a script, a document, a data file) takes its cases from its `Steps`: one case per rule the step writes, or the reason it does not apply.
- A case reads by the kind: `cli` — the command and its premises → the lines and the exit code; `browser` / `visual` — the screen → what must be seen; `read` — the document → what the subagent reports; `look` — the value → the shape it must have; `form` — the input → the count, the length or the match.

#### Walk

Walk the slice's `Types` — or its `Steps`, when `Types` is `なし` — and write a case for each line, or a `_no case_` line with the reason:

- the happy path — the nominal input, and the result the step promises
- every branch of a union
- every optional, present and absent
- the states, and the legal and illegal transitions between them
- empty and missing
- the boundary values
- invalid input
- the expected error path
- permission
- a second call
- concurrency

**A boundary with no answer is a hole in the plan.** When the shape cannot say what happens, the shape is not decided: stop, decide it, and write the plan after.

## Notes

- `## Notes` holds one `### Slice N: <name>` per slice. The name is copied from `## Slices` as it is.
- `Findings`: one bullet per hole the work could not close — the place, the state, what closes it. Under it, `left: <why>` says why it could not be closed here. `なし` when there is none.
- `Unplanned`: a hole found and fixed here — the place, what changed, and why it could not wait.
- `Commit`: the slice's commit hash. `なし（理由）` when the slice changed nothing.
- `Stopped`: only for a slice that stopped — the output of the check that failed, the files changed, the subagent's last text, how many times it ran, the time, and the id of the worktree it left.
- **The subagent writes its own slice's record**, in the worktree's plan md — `Stopped` too, since the subagent runs the check and sees it fail. The agent writes the plan md only at the acceptance, from the worktree.
- The three states: `Commit` filled is done; `Stopped` is interrupted; neither is not started.
- `Commit` is the slice's own commit, and it is not rewritten.

## Review

- The reviewer writes here, and the fixing subagent answers here. Two rounds: `### Round 1` (the findings) and `### Round 2` (the check of the fixes).
- A finding sits under the viewpoint it came from: `Stale` (what this change made stale — a doc, a comment, a test), `Unlisted` (a change the plan's `Files` does not name), `Gaps` (a hole the slices passed over — a behavior the checks do not exercise; a decided value is not a gap), `Unproven` (a test that would stay green if the behavior it names were removed).
- A finding is one bullet. What the fixing subagent did with it is a bullet under it: `fixed: <what was done>` for one it adopted, `left: <why>` for one it left. The close reads the `left` lines.
- `なし` when the viewpoint found nothing; a note may follow it (`なし — 何を確かめたか`). The close reads only the leftovers, so the note does not become one.
- Round 1 is a new conversation; Round 2 continues the reviewer's own, and looks at the `fixed` lines only. A Round 1 that finds nothing ends the review; a Round 2 that still finds the same thing goes to the owner.

## Acceptance

- The agent writes it, after the review's fixes: `Ran` (the checks that were run) and `Findings` (one bullet per finding, and under it `fixed: <what was done>` or `left: <why>`; `なし` when there is nothing). The merge's commit is not written here: the acceptance is committed before the merge, and git holds the merge.
- A `Findings` line without a `fixed:` is handed to a `code` subagent as the fix instruction; when it is fixed, the acceptance runs again and is written again.

## Writing

- One bullet is one sentence.
- A file name is written from the project root. The tree, the steps and the checks use the same name.
- Do not write what the reader can look up.
- Keep a table short: a wide one breaks with long text.
- A field whose content cannot be written yet keeps its name and stays empty.
- Do not copy the design or the ADR. Name them where they bite.
