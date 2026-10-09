---
name: work
description: Use when a plan is agreed and its work has to be carried out — after the plan md is written and the owner has read it. It runs the slices, the review, the acceptance and the merge, and leaves the record in the plan md.
---

# work

One plan is one worktree: a branch and a merge — or the base, when the design's `Where` says so. The work is done from the plan md, and the record goes back into it.

**The judgment is the parent's, and the owner's.** A child runs its own slice's check and reports; the review and the acceptance are not its business. A premise the run disproves is triaged here with the owner first — within tolerance, or a change the work absorbs. When it cannot be absorbed, the cycle's ADR (the `adr` skill) decides: drop the plan, or take another approach.

The work keeps its own business: the slices, the checks, the commits, the review, the acceptance, the merge, and the record.

## The file

The work writes no file of its own. It reads `cycles/<NNN-YYYY-MM-DD>/plan/<plan id>.md` and writes into it: the slices' records under `## Notes`, `## Review`, `## Acceptance`.

The texts handed to children are in `references/tasks.md`.

## Procedure

### 1. Read the plan and its record

- the plan md: `Files`, `Slices` (the checks and the steps), `## Notes`
- the design's `Where`: worktree, or base
- the state: `Commit` filled is done, `Stopped` is interrupted, neither is not started

### 2. Commit the documents

- Commit the files associated with this cycle: `definition.md`, `adr.md`, `design.md`, and `plan/*.md`.
- Use the commit message: `update: NNN's definition, ADR, design and plan`

### 3. Set the place

- a worktree plan: `consult_worktree new <plan id>`, and keep the base hash (`git rev-parse HEAD`) for the review
- a `base` plan: nothing to make; the parent works in its own tree

### 4. Run the slices

- hand the plan md to one `code` child in the worktree: the slices in order, as far as it can. The task is in `references/tasks.md`
- the child runs each slice's check, commits after it passes, and writes that slice's record
- when it stops, read its report and the worktree's plan md. Three answers:
  - it only ran out (the work is sound): continue it (`continue: true`), without calling the owner
  - a premise the run disproves is triaged here with the owner: within tolerance, or a change the work absorbs. The plan is not rewritten to keep going
  - what the work cannot absorb goes to the ADR, which decides: drop the plan (write `Stopped` and the reason in the parent's plan md, commit it in the base, remove the worktree, no merge), or take another approach
- a `base` plan: the parent does the slices. Show the owner after each one, and wait for their OK before committing

### 5. The review

- when the slices are done: a `review` child, in the worktree (the parent's tree for a `base` plan), in a new conversation, with the plan md and the diff `<base hash>..HEAD`
- it writes `## Review`, `### Round 1`, under the four viewpoints
- the fixing child is a `code` child, continued: it reads the plan md and answers each finding, and what it adopts carries a `fixed:` line
- Round 2 continues the reviewer's own conversation and looks at the `fixed` lines only. Two rounds: a Round 1 that finds nothing ends the review, and a Round 2 that still finds the same thing goes to the owner

### 6. The acceptance

- the parent runs the plan's checks (the integration slice included) and the whole typecheck and test, in the worktree (or the base)
- and for two or three of the behaviors this plan adds, break the code that carries them (flip a condition, drop a call), run the plan's check, and confirm it goes red. Restore it. A check that stays green is a finding
- write `## Acceptance`: `Ran` and `Findings` (`なし` when there is nothing). The merge's commit is not written there: the acceptance is committed before the merge
- a `Findings` line is a fix instruction for a `code` child; when it is fixed, the acceptance runs again and is written again
- commit it in the worktree: `consult(<plan id>): acceptance`

### 7. The merge

- in the parent's tree: `git merge --no-ff consult/<plan id>`; resolve a conflict there
- one constraint rules the order: a plan that waits for another (the head sentence's "what it waits for") has not merged yet. Nothing else fixes the order: a done plan merges when it is done
- then run the whole typecheck and test on the base: the merge counts as done only when they are green
- red means the combination is broken: undo the merge (`git reset --hard ORIG_HEAD`), keep the worktree, and fix it in the plan (its child continues); merge again when it is green
- green means done: `consult_worktree remove <plan id>`
- a `base` plan has nothing to merge

### 8. Report

- once, to the owner: what the plan delivered, the holes the record holds, and what the next plan waits on
- when every plan of the cycle is done: the cycle goes to `close`

## How not to do this

- Do not close a slice whose check the child did not run: `Commit` means the check passed
- Do not write the plan from the parent's side while a worktree is live: the child writes its slice's record, and the parent writes at the acceptance
- Do not fix a hole silently: it goes in the record
- Do not take a merge the acceptance did not pass
