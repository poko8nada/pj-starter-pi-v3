---
name: work
description: Use when a plan is agreed and its work has to be carried out — after the plan md is written and the owner has read it. It runs the slices, review, acceptance and merge, and leaves the record in the plan md.
---

# work

One plan is one worktree: a branch and a merge — or the base, when the design's `Where` says so. Work is done from the plan md, and the record goes back into it.

**Judgment is the agent's, and the owner's.** A subagent runs its own slice's check and reports; the review and the acceptance are not its business. A premise the run disproves is triaged here with the owner first — within tolerance, or a change the work absorbs.

Work keeps its own business: slices, checks, commits, review, acceptance, merge and record.

## File

Work writes no file of its own. It reads `cycles/<YYMMDD>-<NNN>-<slug>/plan/<plan id>.md` and writes into it: slices' records under `## Notes`, `## Review`, `## Acceptance`.

Texts handed to subagents are in `references/tasks.md`.

## Procedure

### 1. Read the plan and its record

- Plan md: `Files`, each slice's `Types`, `Steps` and `Verify`, and `## Notes`
- Design's `Where`: worktree, or base. An `ex-` plan has no design: it takes the default (a worktree)
- State: `Commit` filled is done, `Stopped` is interrupted, neither is not started

### 2. Commit the documents

- Commit the cycle's files: `cycles/<YYMMDD>-<NNN>-<slug>/adr.md`, `design.md` and `plan/*.md`.
- Commit message: `update: NNN's ADR, design and plan`

### 3. Set the place

- a worktree plan: `consult_worktree new <plan id>`, and keep the base hash (`git rev-parse HEAD`) for the review
- a `base` plan: nothing to make; the agent works in its own tree

### 4. Run the slices

- hand the plan md to one `code` subagent in the worktree: slices in order, as far as it can. Task: `references/tasks.md`
- the subagent runs each slice's check, commits after it passes, and writes that slice's record
- when it stops, read its report and the worktree's plan md. Three answers:
  - it only ran out (work is sound): continue it (`continue: true`), without calling the owner
  - a premise the run disproves is triaged here with the owner: within tolerance, or a change the work absorbs. Plan is not rewritten to keep going
  - what work cannot absorb: the owner decides. Drop the plan (write `Stopped` and the reason in the agent's plan md, commit it in the base, remove the worktree, no merge), or carry it to the close
- a `base` plan: the agent does the slices. Show the owner after each one, and wait for their OK before committing

### 5. Clean the tests

- the `code` subagent that ran the slices continues (a `base` plan's agent does it): it reads the plan md, and the test files the plan's `Files` updates
- in each of those files, what this change left: two or more tests that check the same behavior, a test for a behavior that is gone, a test for a branch this plan's change stops making
- it drops them, and keeps the suite green
- it is not a slice: what went stale is known only after the change, and a slice carries a `Verify` of its own
- it writes it in the plan md's `## Notes`, as a section that is not a slice

### 6. Review

- when the slices and the test cleanup are done: a `review` subagent, in the worktree (the agent's tree for a `base` plan), in a new conversation, with the plan md and `<base hash>`; it runs `git diff <base hash>..HEAD` itself
- it writes `## Review`, `### Round 1`, under the five viewpoints and `Doubts`
- it reads the test steps' cases by the plan's `## Test cases`, and each `Verify` by what closes its slice
- fixing subagent is a `code` subagent, continued: it reads the plan md and answers each finding, and what it adopts carries a `fixed:` line
- Round 2 continues the reviewer's own conversation and looks at the `fixed` lines only. A Round 1 that finds nothing ends the review
- Round 2 is the last look: the review ends there, and what is still open is fixed once more. No third round
- a doubt or a note that is not a finding goes under `- Doubts:` in the round it came from, and nowhere else

### 7. Acceptance

- the agent runs the plan's checks, and the whole typecheck and test, in the worktree (or the base)
- and for two or three behaviors this plan adds, break the code that carries them (flip a condition, drop a call), run the plan's check, and confirm it goes red. Restore it. A check that stays green is a finding
- write `## Acceptance`: `Ran`, `Findings` and `Doubts` (`なし` when there is nothing). Merge's commit is not written there: the acceptance is committed before the merge
- a `Findings` line is a fix instruction for a `code` subagent; when it is fixed, the acceptance runs again and is written again
- commit it in the worktree: `consult(<plan id>): acceptance`

### 8. Merge

- in the agent's tree: `git merge --no-ff consult/<plan id>`; resolve a conflict there
- one constraint rules the order: a plan that waits for another (the design's `Why`) has not merged yet. Nothing else fixes the order: a done plan merges when it is done
- then, in the base, set the dependencies again; the command follows the lockfile — a `pnpm-lock.yaml` means `pnpm install`
- then run the whole typecheck and test on the base: the merge counts as done only when they are green
- red means the combination is broken: undo the merge (`git reset --hard ORIG_HEAD`), keep the worktree, and fix it in the plan (its subagent continues); merge again when it is green
- green means done: `consult_worktree remove <plan id>`
- a `base` plan has nothing to merge

### 9. Report

- once, to the owner: what the plan delivered, the holes the record holds, and what the next plan waits on

## How not to do this

- Do not close a slice whose check the subagent did not run: `Commit` means the check passed
- Do not write the plan from the agent's side while a worktree is live: the subagent writes its slice's record, and the agent writes at the acceptance
- Do not fix a hole silently: it goes in the record
- Do not take a merge the acceptance did not pass
