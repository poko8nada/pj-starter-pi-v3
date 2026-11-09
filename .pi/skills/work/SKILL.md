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

Steps:

1. Read the shape in `.pi/skills/plan/references/format.md` before reading the record.
2. Read `cycles/<YYMMDD>-<NNN>-<slug>/plan/<NN>-<plan id>.md` for a plan that has an `NN`.
3. Read `cycles/<YYMMDD>-<NNN>-<slug>/plan/<plan id>.md` for an `ex-` plan.
4. Read the plan md's `Files`, `## Goal`, each slice's `Types`, `Steps`, `Policy` and `Verify`, and `## Notes`.
5. Read the plan md's `Place`.

View:

| record          | state       |
| --------------- | ----------- |
| `Commit` filled | done        |
| `Stopped`       | interrupted |
| neither         | not started |

Notes:

- Work writes no file of its own.
- Work writes into the plan md: slices' records under `## Notes`, `## Work Review`, `## Acceptance`.
- The plan md's `Place` is worktree, or base.
- An `ex-` plan takes the default (a worktree).

### 2. Commit the documents

Steps:

1. Commit the cycle's files: `cycles/<YYMMDD>-<NNN>-<slug>/adr.md`, `affected.md` and `plan/*.md`.

Notes:

- The commit message is `update: NNN-<suffix>'s ADR, affected and plan`.
- `<suffix>` is the part right of the number in the cycle folder name (`261104-054-dev` gives `dev`).

### 3. Set the place

Steps:

1. Run `consult_worktree new <plan id>` for a worktree plan, and keep the base hash (`git rev-parse HEAD`) for the review.
2. Keep the base hash (`git rev-parse HEAD`) before the first slice for a `base` plan.

Notes:

- The agent works in its own tree for a `base` plan.

### 4. Run the slices

Steps:

1. Hand the plan md to one `code` subagent in the worktree.
2. Read its report and the worktree's plan md when it stops.
3. Continue it (`continue: true`) without calling the owner when it stopped only because the run ended and the work is sound.
4. Copy that plan md into the base's plan md as it is for a dropped worktree plan, commit it in the base, remove the worktree, and merge nothing.
5. Write `Stopped` and the reason in the base's plan md for a dropped `base` plan, and commit it in the base.

View:

| case                                                         | answer                                          |
| ------------------------------------------------------------ | ----------------------------------------------- |
| it stopped only because the run ended, and the work is sound | continue it without calling the owner           |
| the run disproves a premise                                  | triage it here with the owner                   |
| what work cannot absorb                                      | the owner decides, and the agent drops the plan |

Notes:

- The task is in the `Slices` section of `references/tasks.md`.
- The subagent runs its slices in order, as far as it can.
- The subagent runs each slice's check, and commits after it passes.
- The subagent writes that slice's record in the worktree's plan md.
- The subagent writes `Stopped` too, since it runs the check and sees it fail.
- The run is within tolerance, or it is a change the work absorbs.
- The plan is not rewritten to keep going.
- The subagent writes `Stopped` and the reason in the worktree's plan md for a dropped worktree plan.
- The agent continues it to write it when it did not.
- A `base` plan's agent does the slices in the base.
- The agent writes each slice's record in the base's plan md for a `base` plan.
- The agent shows the owner after each slice for a `base` plan.
- The agent waits for their OK before committing with `base(<plan id>): <subject>`.
- A dropped plan is not carried to the close.
- The close reads its record as a dropped plan.
- The agent closes no slice whose check the subagent did not run.
- `Commit` means the check passed.

### 5. Clean the tests

Steps:

1. Continue the `code` subagent that ran the slices.
2. Drop what it finds, and keep the suite green.

View:

- two or more tests that check the same behavior
- a test for a behavior that is gone
- a test for a branch this plan's change stops making
- a test the plan's `## Test cases` would not write

Notes:

- A `base` plan's agent does it in the base.
- It reads the plan md and the test files the plan's `Files` updates.
- The task is in the `Clean the tests` section of `references/tasks.md`.
- A premise a type, a schema or a DB constraint already settles is one the plan would not write.
- One nobody would notice is one the plan would not write.
- An `Add`, `Update` or `Drop` line with no case is one the plan would not write.
- It is not a slice.
- What went stale is known only after the change.
- A slice carries a `Verify` of its own.
- It writes it in the worktree's plan md, in `## Notes` as `### Cleanup: <what it cleaned>`.
- It writes it with `Findings` and `Unplanned`.
- It has no `Commit` and no `Stopped`.
- For a `base` plan, it writes it in the base's plan md.

### 6. Review

Steps:

1. Run a `review` subagent in the worktree in a new conversation with the plan md and `<base hash>` when the slices and the test cleanup are done.
2. Continue the fixing `code` subagent for the Round 1 findings.
3. Run Round 2 in the reviewer's own conversation.
4. Fix what is still open once more with the fixing subagent.

View:

| round   | conversation       | looks at                |
| ------- | ------------------ | ----------------------- |
| Round 1 | a new conversation | the diff and the plan   |
| Round 2 | the reviewer's own | the `fixed:` lines only |

Notes:

- The agent's tree is the place for a `base` plan.
- The reviewer runs `git diff <base hash>..HEAD` itself.
- The task is in the `Review` section of `references/tasks.md`.
- The reviewer writes `## Work Review`, `### Round 1` in the worktree's plan md.
- The reviewer writes it in the agent's tree for a `base` plan.
- The reviewer writes it under the five viewpoints and `Doubts`.
- The reviewer reads the test steps' cases by the plan's `## Test cases`.
- The reviewer reads each `Verify` by what it proves.
- `Gaps` reads the plan's `Policy` and `Goal`: a `Forbidden` the steps break, and a hole that misses the `Goal`.
- The fixing subagent reads the plan md.
- The fixing subagent writes a `fixed:` line for what it adopts under each Round 1 finding.
- The fixing subagent writes a `left:` line for what it leaves under each Round 1 finding.
- The fixing subagent writes in the worktree's plan md.
- The fixing subagent writes in the agent's tree for a `base` plan.
- A `base` plan commits with `base(<plan id>): round <N> fixes`.
- The task is in the `Fixes` section of `references/tasks.md`.
- The reviewer writes the verdict in `### Round 2` in the same plan md.
- A Round 1 that finds nothing ends the review.
- Round 2 is the last look.
- The review ends there.
- No third round.
- The fixing subagent writes what it cannot fix as `left: <why>` under the Round 1 finding in the same plan md.
- The close reads it as a leftover.
- A doubt or a note that is not a finding goes under `- Doubts:` in the round it came from, and nowhere else.

### 7. Acceptance

Steps:

1. Run the plan's checks the agent can run.
2. Break the code that carries two or three behaviors this plan adds, run the plan's executable check, confirm it goes red, and restore it.
3. Read what it changed for a plan that adds no behavior.
4. Write `## Acceptance` with `Ran`, `Findings` and `Doubts`.
5. Commit it in the worktree with `consult(<plan id>): acceptance`.
6. Repeat this step when a finding is fixed.

View:

| check                                  | who closes it |
| -------------------------------------- | ------------- |
| `Always` and the executable `Added`    | the agent     |
| the whole typecheck and test           | the agent     |
| the broken-and-restored behavior check | the agent     |
| the front in cmux-browser              | the owner     |
| a `base` plan's look after each slice  | the owner     |

Notes:

- The agent runs in the worktree (or the base).
- The executable `Added` is DB, auth and other.
- A plan that adds no behavior is a document or a setting.
- An owner's look is not broken and restored.
- Their OK is the check.
- A `yolo` plan passes that look.
- The agent's check stays in `Acceptance` for a `yolo` plan.
- A check that is red with the change in place is a `Findings` line, not a note.
- A check that stays green with the behavior removed is a finding.
- The merge's commit is not written there.
- The acceptance is committed before the merge.
- The agent writes the acceptance at the acceptance, in the worktree's plan md.
- A `Findings` line is a fix instruction for a `code` subagent.
- The subagent writes `fixed:` or `left:` under the line it was handed, in the same plan md.
- The task is in the `Acceptance's findings` section of `references/tasks.md`.
- The acceptance runs again and is written again in the same plan md when a finding is fixed.
- For a `base` plan, the agent writes it in the base's plan md.
- A `base` plan commits it in the base with `base(<plan id>): acceptance`.
- There is no worktree for a `base` plan.
- The field says `なし` when there is nothing.

### 8. The owner's confirmation

Steps:

1. Show the owner the `## Acceptance`'s `Ran`, `Findings` and `Doubts`.
2. Wait for their OK before the merge.
3. A `yolo` plan passes this confirmation: the agent's acceptance check is the confirmation.

View:

| case           | who closes it |
| -------------- | ------------- |
| the owner's OK | the owner     |
| a `yolo` plan  | the agent     |

Notes:

- The owner's word closes it.
- The merge does not start before it.
- A `yolo` plan passes this confirmation.

### 9. Merge

Steps:

1. Run `git merge --no-ff consult/<plan id>` in the agent's tree.
2. Resolve a conflict there.
3. Set the dependencies again in the base.
4. Run the whole typecheck and test on the base.
5. Undo the merge (`git reset --hard ORIG_HEAD`) when red, keep the worktree, fix it in the plan, and merge again when it is green.
6. Run `consult_worktree remove <plan id>` when green.

Notes:

- The agent takes no merge the acceptance did not pass.
- A plan that waits for another has not merged yet.
- The plan md's `Boundary Plans` names the wait.
- Nothing else fixes the order.
- A done plan merges when it is done.
- The command follows the lockfile.
- A `pnpm-lock.yaml` means `pnpm install`.
- The merge counts as done only when they are green.
- Red means the combination is broken.
- Green means done.
- A `base` plan has nothing to merge.

### 10. Report

Steps:

1. Report once to the owner: what the plan delivered, the holes the record holds, and what the next plan waits on.

## How not to write this

- Do not author the plan from the agent's side while a worktree is live.
- The subagents write their own records there.
- The agent writes the Acceptance section.
- A dropped plan's plan md is copied, not authored.
- Do not fix a hole silently.
- It goes in the record.
- Do not drop the plan's `Policy` and `Goal`: the task carries them, and `Gaps` holds their holes.
