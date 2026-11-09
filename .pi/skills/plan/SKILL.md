---
name: plan
description: Use when the ADR entries are decided and the work has to be cut into plans. It presents the cut for agreement, writes cycles/<YYMMDD>-<NNN>-<slug>/plan/<NN>-<plan id>.md per plan, and reviews each.
---

# plan

One plan is one worktree. It is one branch and one merge. When the plan md's `Place` says `base`, the agent works in its own tree. Then there is no branch and no merge.

It is written from the ADR and the affected. The work is done from it. A subagent reads the plan, and nothing else, to do the work. For a `base` plan, the agent itself does the work.

## Procedure

### 1. Read the ADR's entries

Steps:

1. Read `cycles/<YYMMDD>-<NNN>-<slug>/adr.md`.
2. Read every accepted entry in full.
3. Write `No` at the top of a normal plan md as it is.
4. Read the Triage line in `close.md` for an `ex-` plan, and do not write `No`.

View:

| plan   | source                  | `No`                      |
| ------ | ----------------------- | ------------------------- |
| normal | the ADR's entries       | the entry number as it is |
| `ex-`  | the close's Triage line | none                      |

Notes:

- Each entry's `Definition` is the scope boundary.
- The Triage line is the only source for an `ex-` plan.
- A normal plan's `Goal` comes from the ADR's `Adopted` one-liner.
- An `ex-` plan's `Goal` comes from the close's Triage line.

### 2. Read the affected

Steps:

1. Read `cycles/<YYMMDD>-<NNN>-<slug>/affected.md` for those entries.
2. Read the shape in `.pi/skills/adr/references/affected.format.md`.

View:

| part           | what it holds                             |
| -------------- | ----------------------------------------- |
| `Path` block   | one `Path` with its `Kind` and its `Edge` |
| `### External` | the `### External` items                  |

Notes:

- The affected is the impact map.

### 3. Cut, and present

Steps:

1. Read `references/cut.md` before cutting.
2. Cut the work into plans by what it reads, not by where it lives.
3. Decide the split, the place of each plan, the order, and the boundary. Propose the place with the reason. When unsure of the place, propose worktree.
4. Present them to the owner in the fence `references/cut.md` gives: one block per plan (`ADR`, `Place`, `Goal`, `Summary`, `Why`), then the `Order` last, numbered, for all plans.
5. Wait for the owner's agreement. On disagreement, revise and present again until they agree.

Notes:

- The owner's answer decides the place.
- The `Why` reads the `Kind` and the `Edge`. It says what those mean and why the entries make one plan. The field names alone are not enough.
- The `Goal` is one line, and `Goal` and `Summary` both stay.
- The owner agrees before any plan md is written.

### 4. Write the plan md from the affected

Steps:

1. Read `references/format.md` before writing.
2. Read the map's every path whole.
3. Read each file those paths directly name: what it imports, what it re-exports, and the tests beside it.
4. Decide each path's mark: `add`, `update`, `drop`, or no mark.
5. Write `## Goal` above `## Design` as one line.
6. Answer the four questions in `## Design` of `references/format.md`.
7. Decide the slices by the check that closes them.
8. Order the slices by dependency.
9. Keep the same place together.
10. Put a slice that reads another slice's output after it.
11. Keep steps that touch the same place in one slice. Write `Steps` as a file and its substeps, one change per line, carrying the ADR's `Add`, `Update` and `Drop` without omission.
12. Write `### Policy` between the `Steps` and the `Verify`, copying the ADR's `Policy` that the slice needs without omission and without `C`/`F`.
13. Leave a line the plan cannot write with its name and an empty field.
14. Stop when a boundary has no answer.

View:

| affected             | plan                                    |
| -------------------- | --------------------------------------- |
| `Edge: checks`       | an `Always` line with the related tests |
| `Kind: artifact`     | a path in `Files` with its mark         |
| a generated artifact | the step says how it is generated       |
| `### External` item  | the step's `Outside:`                   |
| a path               | a `Files` line                          |

| `Adopted` | mark     |
| --------- | -------- |
| `Add`     | `add`    |
| `Update`  | `update` |
| `Drop`    | `drop`   |

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

- A module for questions 3 and 4 goes into `Files` even when it is past the ADR's `Scope`.
- The reason goes into `## Design`.
- The `Added` field says `なし` when nothing applies.
- The agent writes a change of `Who`, `Stack` or `What` as steps on `DEFINITION.md` when the `Definition` changes one of them.
- One slice closes with one `Verify`.
- Different checks mean different slices.
- One check closes the parts together.
- A subagent may carry several slices in one run.
- The agent cuts a `base` plan where the owner can look and decide.
- Its check carries the look.
- Their answer closes the slice.
- The agent writes in the `Steps` how the update is built into the existing when the plan's `Files` has neither `add` nor `drop`.
- The agent writes in the `Design` how the whole is redesigned in that case.
- A plan that only replaces words is not a plan.
- A boundary with no answer is a hole in the plan.
- A `Verify` that cannot run as written is a hole too.
- A `Verify` that is red with the change in place is a hole too.
- The agent decides the shape before writing on.
- The agent says why a hole does not apply.
- Step 6 fills the left line.

### 5. Confirm what the plan leaves open

Steps:

1. List what making the slices and the steps found: what the ADR does not decide, and what file the work would touch that the affected does not name.
2. Report them to the owner before the review and the proofread, with `なし` when there is nothing.
3. Wait for the owner's answer, and follow it before going on.

Notes:

- The owner's answer decides what the plan carries.
- A file the affected does not name is not touched without the owner's report.
- The whole is confirmed here once before the review.

### 6. Research the lines the plan cannot write

Steps:

1. Run one `research` subagent for a line the plan cannot write.
2. Write the missing fact the four kinds do not cover as a `Stopped` line with the reason.
3. Write it to `## Notes` as `### Slice N` in the base's plan md.

View:

- the code's present shape
- the contract of the thing it calls
- the library's or the package's practice
- the shape of the test double

Notes:

- The agent researches only the lines that block the plan.
- A line that can wait is a `Stopped` line.
- The agent skips what is already in hand.
- The agent writes facts about paths and marks in `Files`.
- The agent writes facts about declarations in `Types`.
- The agent writes facts about behavior in `Steps`.
- The review reads the `Stopped` line.
- The task is in `references/tasks.md`.
- The agent sets the threshold for the question.
- The research is not a ritual at every plan.

### 7. Review, one plan at a time

Steps:

1. Write one plan md, and send it to Round 1 at once: the plan md, every file it names, and the ADR's `Adopted`, `Policy`, `Scope` and `Definition`.
2. Read the Round 1 report, and fix the plan from the findings.
3. Send the fixed plan to Round 2, which checks each Round 1 finding: fixed, or left with the reason.
4. Report to the owner what was done with each finding.

View:

- `Goal` — the plan's `Goal` against the ADR's `Adopted`; can the plan achieve it?
- `Design` — the four questions.
- `Files` — the files the affected names, and a file it does not name.
- `Slice` — the slice that closes with its check.
  - `Types` — a declaration the code uses but `Types` does not name, and a declaration against the type rules.
  - `Steps` — the target files from the affected or the `External`; the ADR's `Add`, `Update` and `Drop` without omission.
  - `Policy` — the ADR's `Policy` without omission.
  - `Verify` — a `Verify` that does not run as written, one that is red with the change in place, and a check that stays green with the behavior removed.
  - `Cases` — the test steps' cases against `## Test cases`.
- `Other` — a contradiction, a circular flow, a duplication, an omission.

Notes:

- The task is in `references/tasks.md`.
- One subagent per plan.
- When a fix changes another plan's boundary, `Files` or order, update that plan before its review. A plan already reviewed goes through review again.
- With two or more plans, while that review runs, write the next plan file. A plan that is fixed from its review does not wait for the others.
- Round 2 checks the Round 1 fixes. It does not review the whole plan again.

### 8. Japanese Proofread

Steps:

1. Run one `proofreader` subagent per file in parallel with the fixed plan mds for the Japanese proofread of each plan md.
2. Have it read `.pi/skills/plan/references/format.md`.
3. Read its report and the `git diff` of the file.
4. Put the file back to `references/format.md`'s shape in your own words when the meaning changed or a name moved.
5. Say in your report to the owner what you repaired.

View:

- a slice's `Steps`, a `Verify` line, a test case or a field name that changed meaning
- a section or field name that moved

Notes:

- `NN` is the file's order prefix in `references/format.md`.
- An `ex-` plan has no prefix.
- The role's policy is in `.pi/extensions/consult/types.json`.
- It edits only the Japanese wording of the plan md.
- It does not change record fields.
- The wording of a quoted passage is not a change of meaning.
- The agent keeps that correction.
- The report says `fixed: <what>`, or `left: <why>`.
- One round.
- A repaired file does not go through the subagent again.

### 9. Show the owner

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

Notes:

- The owner answers approval or fixes.
- The agent edits the plan to match the owner's answers, and git holds the diff.
- The plan md's `Boundary Plans` is written in step 4 from the cut's order.
- It is edited when a pair is cut again, and git holds that diff too.

## How not to write this

- Do not copy the ADR: name it where it bites, and write what the reader has to do
- Do not invent a check: `Always` holds the checks `references/format.md` lists, and `Added` holds the ones the change decides
- Do not write a case the type, the schema or the DB settles: it is noise, and the reviewer takes it out
- Do not leave a hole.
- Do not write one line per file: write one change per substep line, carrying the ADR's `Add`, `Update` and `Drop`
- Do not leave the slice's `Policy` out: copy the ADR's `Policy` without omission and without `C`/`F`
- Do not touch a file the affected does not name without reporting it to the owner in step 5
- Do not review the whole plan again in Round 2: check only the Round 1 fixes
