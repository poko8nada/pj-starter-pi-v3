---
name: work
description: Use when a plan md is agreed after the owner reads it. It runs the slices, review, acceptance and merge, leaving the record in the plan md.
---

# work

One plan is one worktree: a branch and a merge — or the base, when the plan md's `Place` says so. Work is done from the plan md, and the record goes back into it.

Judgment belongs to the agent and the owner. A subagent runs its own slice's check and reports. The review and the acceptance are not its business. When the run disproves a premise, triage it here with the owner first. Either it is within tolerance, or it is a change the work absorbs.

Work keeps its own business: slices, checks, commits, review, acceptance, merge and record.

## Procedure

### 1. Read the plan and its record

- Read `cycles/<YYMMDD>-<NNN>-<slug>/plan/<NN>-<plan id>.md` for a plan that has an `NN`, and `cycles/<YYMMDD>-<NNN>-<slug>/plan/<plan id>.md` for an `ex-` plan. Work writes no file of its own. It writes into the plan md: slices' records under `## Notes`, `## Work Review`, `## Acceptance`.
- Before reading the record, read its shape in `.pi/skills/plan/references/format.md`.
- Plan md: `Files`, each slice's `Types`, `Steps` and `Verify`, and `## Notes`
- Plan md's `Place`: worktree, or base. An `ex-` plan takes the default (a worktree)
- State: `Commit` filled is done, `Stopped` is interrupted, neither is not started

### 2. Commit the documents

- Commit the cycle's files: `cycles/<YYMMDD>-<NNN>-<slug>/adr.md`, `affected.md` and `plan/*.md`.
- Commit message: `update: NNN-<suffix>'s ADR, affected and plan`. `<suffix>` is the part right of the number in the cycle folder name (`261104-054-dev` gives `dev`).

### 3. Set the place

- a worktree plan: `consult_worktree new <plan id>`, and keep the base hash (`git rev-parse HEAD`) for the review
- a `base` plan: keep the base hash (`git rev-parse HEAD`) before the first slice; the agent works in its own tree

### 4. Run the slices

- hand the plan md to one `code` subagent in the worktree: slices in order, as far as it can. The task is in the `Slices` section of `references/tasks.md`.
- the subagent runs each slice's check, commits after it passes, and writes that slice's record in the worktree's plan md. `Stopped` too, since the subagent runs the check and sees it fail.
- when it stops, read its report and the worktree's plan md. Three answers:
  - it stopped only because the run ended, and the work is sound: continue it (`continue: true`), without calling the owner
  - the run disproves a premise: triage it here with the owner. Either it is within tolerance, or it is a change the work absorbs. The plan is not rewritten to keep going
  - what work cannot absorb: the owner decides. Drop the plan.
    - For a worktree plan, the subagent writes `Stopped` and the reason in the worktree's plan md. If it did not, continue it to write it.
    - The agent copies that plan md into the base's plan md as it is, commits it in the base, removes the worktree, and merges nothing.
    - For a `base` plan, the agent writes `Stopped` and the reason in the base's plan md, and commits it in the base.
- a `base` plan: the agent does the slices, writes each slice's record in the base's plan md, shows the owner after each slice, and waits for their OK before committing with `base(<plan id>): <subject>`.
- A dropped plan is not carried to the close. The close reads its record as a dropped plan.

### 5. Clean the tests

- the `code` subagent that ran the slices continues (a `base` plan's agent does it): it reads the plan md, and the test files the plan's `Files` updates. The task is in the `Clean the tests` section of `references/tasks.md`.
- in each of those files, what this change left: two or more tests that check the same behavior, a test for a behavior that is gone, a test for a branch this plan's change stops making
- and the tests the plan's `## Test cases` would not write: a premise a type, a schema or a DB constraint already settles, one nobody would notice, and an `Adopted` line with no case
- it drops them, and keeps the suite green
- it is not a slice: what went stale is known only after the change, and a slice carries a `Verify` of its own
- it writes it in the worktree's plan md, in `## Notes` as `### Cleanup: <what it cleaned>`, with `Findings` and `Unplanned`; it has no `Commit` and no `Stopped`. For a `base` plan, in the base's plan md.

### 6. Review

- when the slices and the test cleanup are done: a `review` subagent, in the worktree (the agent's tree for a `base` plan), in a new conversation, with the plan md and `<base hash>`; it runs `git diff <base hash>..HEAD` itself. The task is in the `Review` section of `references/tasks.md`.
- it writes `## Work Review`, `### Round 1` in the worktree's plan md (the agent's tree for a `base` plan), under the five viewpoints and `Doubts`
- it reads the test steps' cases by the plan's `## Test cases`, and each `Verify` by what closes its slice
- fixing subagent is a `code` subagent, continued: it reads the plan md and writes a `fixed:` line for what it adopts, and a `left:` line for what it leaves, under each Round 1 finding in the worktree's plan md (the agent's tree for a `base` plan); a `base` plan commits with `base(<plan id>): round <N> fixes`. The task is in the `Fixes` section of `references/tasks.md`.
- Round 2 continues the reviewer's own conversation and looks at the `fixed` lines only. The reviewer writes the verdict in `### Round 2` in the worktree's plan md (the agent's tree for a `base` plan). A Round 1 that finds nothing ends the review
- Round 2 is the last look: the review ends there, and what is still open is fixed once more by the fixing subagent. No third round. What the fixing subagent cannot fix it writes as `left: <why>` under the Round 1 finding, in the same plan md, and the close reads it as a leftover
- a doubt or a note that is not a finding: the reviewer writes it under `- Doubts:` in the round it came from, and nowhere else

### 7. Acceptance

**What the agent runs**

- the plan's checks that the agent can run: `Always`, and the executable `Added` (DB, auth, other)
- the whole typecheck and test, in the worktree (or the base)
- for two or three behaviors this plan adds, break the code that carries them (flip a condition, drop a call), run the plan's executable check, and confirm it goes red, then restore it
- a plan that adds no behavior (a document, a setting): the agent reads what it changed

**What the owner closes**

- the `Added` checks that close by the owner's OK: the front in cmux-browser, and a `base` plan's look after each slice
- an owner's look is not broken and restored; their OK is the check
- a `yolo` plan passes that look, and the agent's check stays in `Acceptance`

**What counts as red**

- a check that is red with the change in place is a `Findings` line, not a note
- a check that stays green with the behavior removed is a finding

**What is written**

- `## Acceptance`: `Ran`, `Findings` and `Doubts` (`なし` when there is nothing); the merge's commit is not written there, because the acceptance is committed before the merge. The agent writes the acceptance at the acceptance, in the worktree's plan md. For a `base` plan, in the base's plan md.
- a `Findings` line is a fix instruction for a `code` subagent. The subagent writes `fixed:` or `left:` under the line it was handed, in the same plan md. When it is fixed, the agent repeats this step: the acceptance runs again and is written again in the same plan md. The task is in the `Acceptance's findings` section of `references/tasks.md`.
- commit it in the worktree: `consult(<plan id>): acceptance`; a `base` plan commits it in the base with `base(<plan id>): acceptance`, and there is no worktree

### 8. Merge

- in the agent's tree: `git merge --no-ff consult/<plan id>`; resolve a conflict there
- one constraint rules the order: a plan that waits for another (the plan md's `Boundary Plans`) has not merged yet. Nothing else fixes the order: a done plan merges when it is done
- then, in the base, set the dependencies again; the command follows the lockfile — a `pnpm-lock.yaml` means `pnpm install`
- then run the whole typecheck and test on the base: the merge counts as done only when they are green
- red means the combination is broken: undo the merge (`git reset --hard ORIG_HEAD`), keep the worktree, and fix it in the plan (its subagent continues); merge again when it is green
- green means done: `consult_worktree remove <plan id>`
- a `base` plan has nothing to merge

### 9. Report

- once, to the owner: what the plan delivered, the holes the record holds, and what the next plan waits on

## How not to do this

- Do not close a slice whose check the subagent did not run: `Commit` means the check passed
- Do not author the plan from the agent's side while a worktree is live. The subagents write their own records there, and the agent writes the Acceptance section. A dropped plan's plan md is copied, not authored
- Do not fix a hole silently: it goes in the record
- Do not take a merge the acceptance did not pass
