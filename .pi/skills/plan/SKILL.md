---
name: plan
description: Use when the ADR entries are decided and the work has to be cut into plans. It presents the cut for agreement, writes cycles/<YYMMDD>-<NNN>-<slug>/plan/<NN>-<plan id>.md per plan, and reviews each.
---

# plan

One plan is one worktree. It is one branch and one merge. When the plan md's `Place` says `base`, the agent works in its own tree. Then there is no branch and no merge.

It is written from the ADR and the affected. The work is done from it. A subagent reads the plan, and nothing else, to do the work. For a `base` plan, the agent itself does the work.

## Procedure

### 1. Read the ADR's entries

Read the ADR's adopted entries the plan cuts, in full. The `No` is the ADR's entry number. A normal plan writes it at the top of the plan md as it is. An `ex-` plan does not write `No`. The Triage line is the only source.

### 2. Read the affected

Read `affected.md` for those entries. It is the impact map. One `Path` per block, with its `Kind` and its `Edge`. Plus the `### External` items.

### 3. Cut, and present

- Before cutting, read `references/cut.md`.
- Cut the work into plans by what it reads, not by where it lives.
- Decide the split, the order, the boundary and the place.
- Present them to the owner in the fence `references/cut.md` gives. One block per plan (`ADR`, `Place`, `Summary`, `Why`). Then the `Order` last, numbered, for all plans.
- The `Why` reads the `Kind` and the `Edge`. It says what those mean and why the entries make one plan. The field names alone are not enough.
- The owner agrees before any plan md is written.

### 4. Write the plan md from the affected

- Before writing, read `references/format.md`.
- Read the map's every path, and the files around them. Decide each path's mark: `add`, `update`, `drop`, or no mark.
- Answer the four questions in `## Design` of `references/format.md`.
- A target of questions 3 and 4 goes into `Files` even when it is past the ADR's `Scope`. The reason goes into `## Design`.
- The affected is the plan's material. An `Edge: checks` is a `Verify` line. A `Kind: artifact` is a deliverable. An `### External` item is the step's `Outside:`. A path is a `Files` line.
- Cut slices so each one closes when its check passes. A subagent may carry several slices in one run. The size is a hint, not a handoff. Cut a `base` plan where the owner can look and decide. Its check carries the look, and their answer closes the slice.

When the plan's `Files` has neither `add` nor `drop`, write in the `Steps` and the `Design` how the update is built into the existing, and how the whole is redesigned. A plan that only replaces words is not a plan.

**A boundary with no answer is a hole in the plan.** A `Verify` that cannot be run, or that is red with the change in place, is a hole too. Stop, and decide the shape before writing on. Say why a hole does not apply.

### 5. Research the lines the plan cannot write

For a line the plan cannot write, run one `research` subagent within the four kinds. The kinds are the code's present shape, the contract of the thing it calls, the library's or the package's practice, and the shape of the test double. The task is in `references/tasks.md`.

- Write the facts in `Files`, `Types` and `Steps`.
- A missing fact the four kinds do not cover is a `Stopped` line with the reason, and the review reads it.
- Set the threshold for the question. The research is not a ritual at every plan.

The agent runs the research, and the plan's review reads the facts and the `Stopped` lines.

### 6. Review, one plan at a time

Write one plan md, and send it to its review at once. A `review` subagent reads through the plan md and every file it names. It also reads the ADR's `Adopted`, `Denied` and `Scope`. It answers on these viewpoints:

- `Goal` — the steps and the checks that do not carry each line of the ADR's `Adopted`, and the `Scope`. A step or a check that does what `Denied` says not to do
- `Integration` — how the update is built into the existing, and how the whole is redesigned; a plan that only replaces words
- `Files` — a file the change needs but `Files` does not name, and a document, a comment or a test the change makes stale
- `Types` — a declaration the code uses but `Types` does not name, and a declaration against the type rules
- `Cases` — the test steps' cases against `## Test cases`
- `Checks` — a `Verify` that does not run as written, one that is red with the change in place, and a check that stays green with the behavior removed
- `Flow` — a contradiction, a circular flow, a duplication, an omission, an unnatural flow inside a file the change made

The task is in `references/tasks.md`. The plan is fixed from them, and the report to the owner says what was done with each finding. One subagent per plan, one round.

While that review runs, write the next plan file. The writing of one file and the review of the previous one overlap. A plan that is fixed from its review does not wait for the others.

### 7. Japanese Proofread

After every review is done, run one `proofreader` subagent per file in parallel with `cycles/<YYMMDD>-<NNN>-<slug>/plan/<NN>-<plan id>.md` for the Japanese proofread of the plan md. Have it read `.pi/skills/plan/references/format.md`. The role's policy applies. It edits only the plan md.

- Read its report and the `git diff` of the file.
- If a slice's `Steps`, a `Verify` line, a test case or a field name changed meaning, or a section or field name moved, put the file back to `references/format.md`'s shape, in your own words.
- The wording of a quoted passage is not a change of meaning. Keep that correction.
- Say in your report to the owner what you repaired: `fixed: <what>`, or `left: <why>`.
- One round. A repaired file does not go through the subagent again.

### 8. Show the owner

Every plan of the cycle: files, slices, types, steps, verify. They read them, and answer.

### Changes after this

Plan is edited to match, and git holds the diff. The plan md's `Boundary Plans` is edited when a pair is cut again, and git holds that diff too.

## How not to write this

- Do not copy the ADR: name it where it bites, and write what the reader has to do
- Do not write a plan that only replaces words: say how the update is built into the existing, and how the whole is redesigned
- Do not invent a check: `Always` holds the checks `references/format.md` lists, and `Added` holds the ones the change decides
- Do not write a case the type, the schema or the DB settles: it is noise, and the reviewer takes it out
- Do not leave a hole: a boundary with no answer stops the plan
- Do not write the plan from the agent's side while a worktree is live.
- The subagent writes its slice's record, and the agent writes at the acceptance
