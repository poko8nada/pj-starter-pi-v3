---
name: plan
description: Use when the ADR entries are decided and the work has to be cut into plans. It presents the cut for agreement, writes cycles/<YYMMDD>-<NNN>-<slug>/plan/<NN>-<plan id>.md per plan, and reviews each.
---

# plan

One plan is one worktree. It is one branch and one merge. When the plan md's `Place` says `base`, the agent works in its own tree. Then there is no branch and no merge.

It is written from the ADR and the affected. The work is done from it. A subagent reads the plan, and nothing else, to do the work. For a `base` plan, the agent itself does the work.

## Procedure

### 1. Read the ADR's entries & the affected

Steps:

1. Read `cycles/<YYMMDD>-<NNN>-<slug>/adr.md`.
2. Read `cycles/<YYMMDD>-<NNN>-<slug>/affected/<NN>.md` for each entry.

Notes:

- The plan's `Goal` comes from the `Main` lines of the entries it carries, composed into one line.
- The affected is the impact map.
- `### Keywords` is the search range, not the impact map.

### 2. Cut and present

Steps:

1. Read `references/cut.md` before cutting.
2. Cut the work into plans by what it reads, not by where it lives.
3. Decide the split, the place of each plan, the order, and the boundary. Propose the place with the reason. When unsure of the place, propose worktree.
4. Present them as markdown (not a fence) to the owner in the format `references/cut.md` gives.
5. Wait for the owner's agreement. On disagreement, revise and present again until they agree.

### 3. Write the plan md from the affected

Steps:

1. Read `references/format.md` and `references/design.md` before writing.
2. Create all the plan file with the scaffold: `node .pi/skills/plan/scripts/index.mjs <plan id> --order <NN> (--place <worktree|base> | -w | -b) --entries <NN[,NN...]> [--root <dir>]`. Take the plan id, the order, the place and the entries from the cut.

Steps for each plan:

0. Write `Boundary Plans:` that is already confirmd in cut step.
1. Write `## Goal` and `## Refactor`.
2. Read each file that the map has. Those paths directly name: what it imports, what it re-exports, and the tests beside it.
3. Decide each path's mark: `add`, `update`, `drop`, or no mark.
4. Decide and order the slices by the concern the change carries
5. Name the concern in the slice's heading as one sentence.
6. Write `Steps` as a file and its substeps, one change per line, carrying the ADR's `Add`, `Update` and `Drop` without omission.
7. Write `### Policy` copying the ADR's `Policy` that the slice needs.

View:

| affected             | plan                                    |
| -------------------- | --------------------------------------- |
| `Edge: checks`       | an `Always` line with the related tests |
| `Kind: artifact`     | a path in `Files` with its mark         |
| a generated artifact | the step says how it is generated       |
| `### External` item  | the step's `Outside:`                   |
| a path               | a `Files` line                          |

| `Main` / `Secondary` | mark     |
| -------------------- | -------- |
| `Add`                | `add`    |
| `Update`             | `update` |
| `Drop`               | `drop`   |

| work                           | check     |
| ------------------------------ | --------- |
| work on rows                   | DB        |
| a component the owner must see | front     |
| auth behavior                  | auth      |
| an amended Japanese document   | proofread |
| anything else the scope names  | other     |

| `Definition` line                   | work     |
| ----------------------------------- | -------- |
| `(added)`, `(updated)`, `(dropped)` | the work |
| `(kept)`                            | context  |

Notes:

- A change of `Who`, `Stack` or `What` in the `Definition` is written as steps on `DEFINITION.md`.
- When you write `Steps`: do not write one line per file. Write one change per substep line, carrying the ADR's `Add`, `Update` and `Drop`.
- `Verify`
  - It cannot run as written is a hole too.
  - It is red with the change in place is a hole too.
  - `Always` holds the checks `references/format.md` lists, and `Added` holds the ones the change decides.

### 4. Confirm what the plan leaves open

Steps:

1. List what making the slices and the steps found: what the ADR does not decide, and what file the work would touch that the affected does not name.
2. Report them to the owner before the reviews and the proofread, with `なし` when there is nothing. For each, say what you would do with it and why.
3. Wait for the owner's answer, and follow it before going on.

Notes:

- The whole is confirmed here by YOU once before the review.
- The opinion's ground is your principles. **Existing code is not the ground.**

### 5. Review the plan for a first-time subagent

Steps:

1. Read the `First review of a plan` section of `references/tasks.md`.
2. Send one plan md to one `review` subagent. Give it the plan md only: no ADR, no affected, no chat, no `design.md`. The codebase is readable.
3. Read the report. For every `迷うが実装できる` and `実装できない`, fix the plan from the ADR. When the ADR does not hold it, decide the supplement by your own principles, and write it in the existing format.
4. Do not send the fixed plan to the first review again.

Note: the first review asks whether a subagent with only the plan md can implement each substep. It does not check the ADR.

### 6. Review the plan against the ADR

Steps:

1. Read the `Review of a plan against the ADR` section of `references/tasks.md`.
2. Send the plan md and the ADR's `Main`, `Secondary`, `Policy`, `Scope` and `Definition` to one `review` subagent. The reviewer reads the files the plan names and `references/design.md`.
3. Read the report, and fix the plan from the findings.
4. Report to the owner what was done with each finding.

Notes:

- The task is in `references/tasks.md`.
- One subagent per plan.
- One round. The fixed plan is not reviewed again.
- The report says `fixed: <what was done>` for one it adopted, and `left: <why>` for one it did not.
- With two or more plans, while that review runs, fix the other plan that is reviewd.

### 7. Japanese Proofread

Steps:

1. Run one `proofreader` subagent per file in parallel with the fixed plan mds for the Japanese proofread of each plan md.
2. Have it read `.pi/skills/plan/references/format.md`.
3. Read its report and the `git diff` of the file.
4. Put the file back to `references/format.md`'s shape in your own words when the meaning changed or a name moved.
5. Say in your report to the owner what you repaired.

Notes:

- The wording of a quoted passage is not a change of meaning. Keep that correction.
- The report says `fixed: <what>`, or `left: <why>`.
- One round. The repaired file does not go through the subagent again.

### 8. Show the owner

Steps:

1. Show every plan of the cycle: goal, files, slices, types, steps, policy, verify.
2. Fix what the owner points at in the base's plan md.
3. Show it again.
4. Repeat until the owner approves.

View:

| fix                  | where it goes back                                 |
| -------------------- | -------------------------------------------------- |
| a fix to the cut     | step 3, and the affected plans are presented again |
| a fix to the content | step 4, and through review and proofread again     |

## How not to do this

- The agent says why a hole does not apply.
- A boundary with no answer is a hole in the plan.
- When you write a plan:
  - do not leave a hole. A boundary with no answer stops the work.
  - do not write one that only replaces words. A plan writes the change, not the wording.
