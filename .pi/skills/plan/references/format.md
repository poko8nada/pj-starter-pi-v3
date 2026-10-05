# The plan's format

`cycles/<NNN-YYYY-MM-DD>/plan/<plan id>.md`.

Section and field names are English; the content is Japanese.

## The shape

````md
# PLAN `<plan id>`

## Files

```text
<unit の根>/
  <dir>/
    <file>                update
    <file>
<unit の外のファイル>
```

## Slices

1. <スライス名>
   - I/O:
     ```ts
     <型のコード、または関数の署名1行>
     ```
   - Verify:
     - <型>: <コマンド / 相手 / 場所>
       - <ケース、または何を見るか>
   - Steps:
     1. `<file>`: <何をどうするか>
        - Outside: design の `<Boundary の項目>`。<そこでどうするか>
2. <スライス名>

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

- The plan is one worktree, one branch and one merge — unless the design says `base`: then the parent does the work in its own tree, with no branch and no merge. The plan id is the name the design gave it.
- A child reads the plan, and nothing else, to do the work. What the design and the ADR decided is named where it bites, never restated.

## Files

- The tree holds what changes and what follows the change. A changed file ends with `add`, `update` or `drop`; a related file carries no marker.
- Walk the relations before writing it: what imports the thing that changes, calls it, renders it, migrates with it, seeds with it, documents it, checks it. A follower that is not written is a follower that gets missed.
- A file whose structure does not follow the project's rules, and that this plan touches anyway, is fixed in the same plan. The step carries the reason: what the build makes worse.
- A new double or fixture is a file: it goes in the tree, and `test/` is where the doubles live. Say how it behaves when it is run outside its test: refuse, do not hang.

## Slices

- One slice is one closing: work that ends when its check passes. A child may carry several in one run; the size is a hint, not a handoff.
- The child commits only after the check passes: a filled `Commit` means that slice's check passed.
- A `base` plan is cut where the owner can look and decide: its check carries the look (`look`, `browser`, `use`), and their answer closes the slice.
- One step is one file: what to do in it. A step that meets the outside carries an `Outside:` line: the design's condition, named, and what to do there.
- The last slice is the integration slice: its check covers what the plan delivers as a whole, not one file. Its name is `統合: <what the plan delivers>`.
- The steps are numbered; the order is the order of the work.

## I/O

- `I/O` sits in the slice that moves it. It holds the shapes, as code, and the signatures of functions whose inputs or outputs move, as one line.
- Look at every input and output the slice touches. Write the ones that move; leave the ones that do not.

### The type rules

- A state is a discriminated union. Never a combination of optionals.
- A `switch` over a union is exhaustive: the last branch assigns to `never`. No `default`.
- Fields are `readonly`, arrays are `readonly T[]`, and an argument object is not written to.
- A constraint the compiler cannot check — a brand, a template literal built from a runtime string, a value that must be validated — has one factory, and the check lives inside it.
- A failure is a state or a throw. Never a silent success.

## Verify

`Verify` names one type from this list, and its content. Pick the types that decide the work; do not invent a check.

- `test` — a machine runs the tests: the file, the command, and the cases
  - a case is `<入力> → <結果>`, marked with the walk's line: `(happy)`, `(error)`, `(empty)`, `(boundary values)`
  - the cases are written on top of that test file: read it first, and follow the way it already works (its fixtures, its doubles, the seam it uses)
  - the result is a value, an error type or a state
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
- `read` — a child reads a document and reports: which child, which document, and what it reports
- `use` — a child uses the document, and reports what it does with it
- `look` — a person reads a value: a screen, a log, a DB, a file

### The walk

For every slice that moves an input or an output, walk the shape and write a case for each line, or the reason it does not apply:

- every branch of a union
- every optional, present and absent
- empty and missing
- the boundary values
- invalid input
- the expected error path
- permission
- a second call
- concurrency

**A boundary with no answer is a hole in the plan.** When the shape cannot say what happens, the shape is not decided: stop, decide it — an `adr` entry when it meets the bar in the `adr` skill — and write the plan after.

## Notes

- `## Notes` holds one `### Slice N: <name>` per slice. The name is copied from `## Slices` as it is.
- `Findings`: one bullet per hole the work could not close — the place, the state, what closes it. Under it, `left: <why>` says why it could not be closed here. `なし` when there is none.
- `Unplanned`: a hole found and fixed here — the place, what changed, and why it could not wait.
- `Commit`: the slice's commit hash. `なし（理由）` when the slice changed nothing.
- `Stopped`: only for a slice that stopped — the output of the check that failed, the files changed, the child's last text, how many times it ran, the time, and the id of the worktree it left.
- **The child writes its own slice's record**, in the worktree's plan md — `Stopped` too, since the child runs the check and sees it fail. The parent writes the plan md only at the acceptance, from the worktree.
- The three states: `Commit` filled is done; `Stopped` is interrupted; neither is not started.
- The commits are not squashed: `Commit` is the slice's own commit.

## Review

- The reviewer writes here, and the fixing child answers here. One `### Round N` per round, three rounds at most.
- A finding sits under the viewpoint it came from: `Stale` (what this change made stale — a doc, a comment, a test), `Unlisted` (a change the plan's `Files` does not name), `Gaps` (a hole the slices passed over).
- A finding is one bullet. What the fixing child did with it is a bullet under it: `fixed: <what was done>` for one it adopted, `left: <why>` for one it left. The close reads the `left` lines.
- `なし` when the viewpoint found nothing; a note may follow it (`なし — 何を確かめたか`). The close reads only the leftovers, so the note does not become one.
- Round 1 is a new conversation; the rounds after it continue the reviewer's own, and look at the `fixed` lines only.

## Acceptance

- The parent writes it, after the review's fixes: `Ran` (the checks that were run) and `Findings` (one bullet per finding, and under it `fixed: <what was done>` or `left: <why>`; `なし` when there is nothing). The merge's commit is not written here: the acceptance is committed before the merge, and git holds the merge.
- A `Findings` line without a `fixed:` is handed to a `code` child as the fix instruction; when it is fixed, the acceptance runs again and is written again.

## Writing

- A file name is written from the project root. The tree, the steps and the checks use the same name.
- Do not write what the reader can look up.
- Keep a table short: a wide one breaks with long text.
- A field whose content cannot be written yet keeps its name and stays empty.
- Do not copy the design or the ADR. Name them where they bite.
