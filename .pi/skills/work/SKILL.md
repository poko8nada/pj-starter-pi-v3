---
name: work
description: Use when a plan md is agreed after the owner reads it. It runs the slices, review, acceptance and merge, leaving the record in the plan md.
---

# work

A plan runs in a worktree or in the base, as the plan md's `Place` says. A worktree plan is a branch and a merge; a base plan runs in the agent's own tree and has neither. Work is done from the plan md, and the record goes back into it.

Judgment belongs to the agent and the owner. In a worktree plan, a `code` subagent runs its slice's check and reports; the review and the acceptance are not its business. In a base plan, the agent does the slices itself. When the run disproves a premise, triage it with the owner first. Either it is within tolerance, or it is a change the work absorbs.

Work keeps its own business: slices, checks, commits, review, acceptance, merge and record.

## Procedure

### 1. Read the plan and its record

Steps:

1. Read the shape in `.pi/skills/plan/references/format.md` before reading the record.
2. Read the plan md: `cycles/<YYMMDD>-<NNN>-<slug>/plan/<NN>-<plan id>.md`.
3. Read its `Files`, `## Goal`, each slice's `Types`, `Steps`, `Policy` and `Verify`, and `## Notes`.
4. Read its `Place`.

View:

| record          | state       |
| --------------- | ----------- |
| `Commit` filled | done        |
| `Stopped`       | interrupted |
| neither         | not started |

Notes:

- Work writes no file of its own. It writes into the plan md: the slices' records under `## Notes`, and `## Work Review` and `## Acceptance`.
- `Place` is `worktree` or `base`.

### 2. Commit the documents

Steps:

1. Commit the cycle's files: `cycles/<YYMMDD>-<NNN>-<slug>/adr.md`, `affected/*.md` and `plan/*.md`.

Notes:

- The commit message is `update: NNN-<suffix>'s ADR, affected and plan`.
- `<suffix>` is the part right of the number in the cycle folder name (`261104-054-dev` gives `dev`).

### 3. Set the place

Steps:

1. Keep the base hash (`git rev-parse HEAD`) before the first slice, for the review.
2. Set up the place:
   - Worktree: run `consult_worktree new <plan id>`.
   - Base: make no worktree. The agent works in its own tree.

Notes:

- The base hash is the review's `<base hash>`.
- `Place` is read in step 1.

### 4. Run the slices

Steps:

1. Work the slices in order, as far as you can. Do each slice's `Steps` and `Policy`, run its `Verify`, and commit it after it passes.
   - Worktree: hand the plan md to one `code` subagent in the worktree. Read its report and the worktree's plan md when it stops. Continue it with `continue: true` when it stopped only because the run ended, or when it did not write the record.
   - Base: do the slices yourself in the base. Show the owner after each slice, wait for their OK, and commit with `base(<plan id>): <subject>`.
2. Write the slice's record in `## Notes` as `### Slice N: <name>`, in the shape `references/format.md` gives.

View:

| case                                                         | answer                                          |
| ------------------------------------------------------------ | ----------------------------------------------- |
| it stopped only because the run ended, and the work is sound | continue it without calling the owner           |
| the run disproves a premise                                  | triage it here with the owner                   |
| what work cannot absorb                                      | the owner decides, and the agent drops the plan |

When the plan is dropped:

- Worktree: copy the worktree's plan md into the base's plan md as it is, commit it in the base, remove the worktree, and merge nothing.
- Base: write `Stopped` and the reason in the base's plan md, and commit it in the base.

Notes:

- The task is in the `Slices` section of `references/tasks.md`.
- A `Commit` means the slice's check passed. The agent closes no slice whose check did not run.
- The plan is not rewritten to keep going. The run is within tolerance, or it is a change the work absorbs.
- A dropped plan is not carried to the close; the close reads its record as a dropped plan.

### 5. Clean the tests

Steps:

1. Work the cleanup:
   - Worktree: continue the `code` subagent that ran the slices.
   - Base: do it yourself in the base.
2. Read the plan md and the test files the plan's `Files` updates.
3. Drop the tests the View gives, fix the premises it gives, and keep the suite green.
4. Write the record in `## Notes` as `### Cleanup: <what it cleaned>`, with `Findings` and `Unplanned`. A fixed premise goes in `Unplanned`. It has no `Commit` and no `Stopped`.

View:

Drop:

- two or more tests that check the same behavior
- a test for a behavior that is gone
- a test for a branch this plan's change stops making
- a test `.pi/skills/plan/references/design.md`'s `## Test cases` would not write

Fix:

- a test that hides the premise the behavior needs: move the premise into the test, and leave only the values that do not affect the behavior in the setup.
- a test that builds a premise another test already shares: share it when nobody changes it, and keep a mutable premise in each test.

Notes:

- The task is in the `Clean the tests` section of `references/tasks.md`.
- A premise a type, a schema or a DB constraint already settles, a test nobody would notice, and an `Add`, `Update` or `Drop` line with no case are the ones the plan would not write.
- The cleanup is not a slice. What went stale is known only after the change.
- A slice carries a `Verify` of its own.

### 6. Review

Steps:

1. When the slices and the test cleanup are done, run a `review` subagent in a new conversation with the plan md and `<base hash>`. The reviewer runs `git diff <base hash>..HEAD` itself.
2. Read the Round 1 findings, and fix them:
   - Worktree: continue the fixing `code` subagent for them.
   - Base: fix them yourself.
3. Run Round 2 in the reviewer's own conversation. It looks only at the `fixed:` lines.
4. Fix what is still open once more:
   - Worktree: with the fixing subagent.
   - Base: yourself.

View:

| round   | conversation       | looks at                |
| ------- | ------------------ | ----------------------- |
| Round 1 | a new conversation | the diff and the plan   |
| Round 2 | the reviewer's own | the `fixed:` lines only |

Notes:

- The task is in the `Review` section of `references/tasks.md`; the fixes are in the `Fixes` section.
- The reviewer writes `## Work Review`, `### Round 1` and `### Round 2`, in the plan md of the place it reviews.
  - Worktree: the worktree's plan md.
  - Base: the agent's tree, the base's plan md.
- The reviewer writes under the six viewpoints and `Doubts`. A doubt or a note that is not a finding goes under `- Doubts:` in the round it came from, and nowhere else.
- The reviewer reads the test steps' cases by `.pi/skills/plan/references/design.md`'s `## Test cases`.
- The reviewer reads each `Verify` by what it proves.
- `Policy` reads the plan's `Policy`: an `Allowed` it forbids, and a `Forbidden` it does. `Gaps` reads the plan's `Goal`: a hole that misses it.
- The fixer reads the plan md, and writes a `fixed:` line for what it adopts and a `left:` line for what it leaves, under each Round 1 finding. The fixer is the fixing `code` subagent for a worktree, and the agent for a base.
- Worktree: the fixer writes in the worktree's plan md. Its fixes are committed by the `code` subagent as `consult(<plan id>): round <N> fixes`.
- Base: the fixer writes in the base's plan md, and commits with `base(<plan id>): round <N> fixes`.
- A Round 1 that finds nothing ends the review. Round 2 is the last look; the review ends there; no third round.
- The fixer writes what it cannot fix as `left: <why>` under the Round 1 finding in the same plan md. The close reads it as a leftover.

### 7. Acceptance

Steps:

1. Run the plan's checks the agent can run, in the place the plan runs.
2. For a plan that adds behavior, break the code that carries two or three of the behaviors, run the plan's executable check, confirm it goes red, and restore it.
3. For a plan that adds no behavior, read what it changed.
4. Say whether the implementation achieves the plan's `Goal`.
5. Write `## Acceptance` with `Goal`, `Ran`, `Findings` and `Doubts`. The field says `なし` when there is nothing.
6. Commit it:
   - Worktree: in the worktree, with `consult(<plan id>): acceptance`.
   - Base: in the base, with `base(<plan id>): acceptance`.
7. When a finding is fixed, run the acceptance again and write it again in the same plan md.

View:

| check                                  | who closes it |
| -------------------------------------- | ------------- |
| `Always` and the executable `Added`    | the agent     |
| the plan's `Goal`                      | the agent     |
| the whole typecheck and test           | the agent     |
| the broken-and-restored behavior check | the agent     |
| the front in cmux-browser              | the owner     |
| a `base` plan's look after each slice  | the owner     |

Notes:

- `Goal` is the plan's `Goal`. A gap between the `Goal` and the implementation is a `Findings` line.
- A check that is red with the change in place is a `Findings` line, not a note. A check that stays green with the behavior removed is a finding.
- The executable `Added` is DB, auth and other. A plan that adds no behavior is a document or a setting.
- An owner's look is not broken and restored; their OK is the check. A `yolo` plan passes that look; the agent's check stays in `Acceptance` for it.
- The merge's commit is not written there. Worktree: the acceptance is committed before the merge. Base: it is committed before the report.
- A `Findings` line is a fix instruction for a `code` subagent. The subagent writes `fixed:` or `left:` under the line it was handed, in the same plan md.
- The task is in the `Acceptance's findings` section of `references/tasks.md`.
- Worktree: the acceptance is written in the worktree's plan md. Base: the acceptance is written in the base's plan md; there is no worktree.

### 8. The owner's confirmation

Steps:

1. Show the owner the `## Acceptance`'s `Goal`, `Ran`, `Findings` and `Doubts`.
2. Wait for their OK:
   - Worktree: before the merge.
   - Base: before the report. There is no merge.
3. A `yolo` plan passes this confirmation: the agent's acceptance check is the confirmation.

View:

| case           | who closes it |
| -------------- | ------------- |
| the owner's OK | the owner     |
| a `yolo` plan  | the agent     |

Notes:

- The owner's word closes it.
- Worktree: the merge does not start before it.
- Base: there is no merge; the report follows it.
- A `yolo` plan passes this confirmation.

### 9. Merge

Steps:

Worktree:

1. Run `git merge --no-ff consult/<plan id>` in the agent's tree.
2. Resolve a conflict there.
3. Set the dependencies again in the base.
4. Run the whole typecheck and test on the base.
5. When red, undo the merge (`git reset --hard ORIG_HEAD`), keep the worktree, fix it in the plan, and merge again when it is green.
6. When green, run `consult_worktree remove <plan id>`.

Base:

- なし. A base plan has nothing to merge.

Notes:

- The agent takes no merge the acceptance did not pass.
- A plan that waits for another has not merged yet. The plan md's `Boundary Plans` names the wait. Nothing else fixes the order.
- A done plan merges when it is done.
- The command follows the lockfile. A `pnpm-lock.yaml` means `pnpm install`.
- The merge counts as done only when they are green. Red means the combination is broken; green means done.

### 10. Report

Steps:

1. Report once to the owner: what the plan delivered, the holes the record holds, and what the next plan waits on.

## How not to write this

- Worktree: while the worktree is live, do not author the plan from the agent's side. The `code` subagent writes its records there, and the agent writes only the Acceptance.
- Base: do not hand the slices to a subagent. The agent does them in the base and writes the records.
- When the plan is dropped: Worktree: do not author its plan md; it is copied as it is. Base: write `Stopped` and the reason in the base's plan md.
- When you clean the tests: do not drop a test that hides its premise. Move the premise into the test; the test itself is right.
- When you fix a hole: do not do it silently. It goes in the record.
- When you run the slices: do not drop the plan's `Policy` and `Goal`. The task carries them; `Policy` holds the `Policy`'s holes, and `Gaps` the `Goal`'s.
