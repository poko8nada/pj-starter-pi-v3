---
name: plan
description: Use when the ADR is settled and one of its plans has to become work — after the cut is presented and agreed, and a plan is ready to be handed to a subagent. It writes `cycles/<YYMMDD>-<NNN>-<slug>/plan/<NN>-<plan id>.md`, holding files, slices, types, steps and verify. The `NN-` is the file's order prefix and is not part of the plan id.
---

# plan

One plan is one worktree: a branch and a merge. It is written from the ADR and the affected, and it is what the work is done from — a subagent reads the plan, and nothing else, to do the work.

## File

`cycles/<YYMMDD>-<NNN>-<slug>/plan/<NN>-<plan id>.md`, in the shape `references/format.md` gives. The `NN-` is the file's order prefix and is not part of the plan id.

Read that file before writing. It holds the shape, the files and their structure, the slices, the type rules, the verify, the rules of a test case, and the record.

## Procedure

### 1. Read the ADR's entries

Read the ADR's adopted entries the plan cuts, in full. The `No` is the ADR's entry number; a normal plan writes it at the top of the plan md as it is. An `ex-` plan does not write `No`; the Triage line is the only source.

### 2. Read the affected

Read `affected.md` for those entries. It is the impact map: one heading per path, with the direction, the relation, the role, the role change and the adjustment; the checks and the generated things. The affected is the walk of the relations, so the plan does not walk them again.

### 3. Cut, and present

Cut the work into plans by what it reads, not by where it lives: the rules are in `references/cut.md`. Decide the split, the order, the boundary and the place. Present them to the owner in the fence `references/cut.md` gives: one block per plan (`ADR`, `Place`, `Summary`, `Why`), then the `Order` last, numbered, for all plans. The `Why` says which `Role change` and which `Adjustment` each plan takes. The owner agrees.

### 4. Write the plan md from the affected

Write the plan md in the shape `references/format.md` gives. Before writing, read the file the plan names again — the test files included.

- `No` — the ADR's entry number.
- `Place` — `worktree`, or `base` where the owner can look and decide.
- `Boundary Plans` — the plans this one stands on, and the order.
- `Files` — the affected's `Code` paths and their directions, with a marker for what changes and no marker for what follows. Do not walk the relations again.
- `Slices`, `Types`, `Steps`, `Verify`, `Notes` — the rest of the shape. One step is one file. A step's line starts with `add:`, `update:` or `drop:`. A test file's line is `<prefix>: (happy|error|empty|boundary) <given> → <result>`. The prefix and the `Files` tree's marker are the same word.

The `affected.md` is the plan's material: a path is a `Files` line, a `Role change` is a requirement the `Steps` carry (or the `Why` says why not), an `Adjustment` is a proposal the plan decides, a `Check` is a `Verify` line, and a `Generate` is a deliverable.

When the plan's `Files` has neither `add` nor `drop`, write in the `Steps` and the `Why` how the update is built into the existing, and how the whole is redesigned. A plan that only replaces words is not a plan.

**A boundary with no answer is a hole in the plan.** Stop, and decide the shape before writing on.

### 5. Research the lines the plan cannot write

For a line the plan cannot write, run one `research` subagent within the four kinds: the code's present shape, the contract of the thing it calls, the library's or the package's practice, and the shape of the test double. The task is in `references/tasks.md`.

- Write the facts in `Files`, `Types` and `Steps`.
- A missing fact the four kinds do not cover is a `Stopped` line with the reason, and the review reads it.
- Set the threshold for the question: the research is not a ritual at every plan.

The agent runs the research, and the plan's review reads the facts and the `Stopped` lines.

### 6. Review, one plan at a time

Write one plan md, and send it to its review at once: a `review` subagent does a read through of the plan md and every file it names, and reads the ADR's `Adopted` and `Scope`, and answers on these viewpoints:

- `Goal` — the steps and the checks that do not carry each line of the ADR's `Adopted`, and the `Scope`
- `Integration` — how the update is built into the existing, and how the whole is redesigned; a plan that only replaces words
- `Files` — a file the change needs but `Files` does not name, and a document, a comment or a test the change makes stale
- `Types` — a declaration the code uses but `Types` does not name, and a declaration against the type rules
- `Cases` — the test steps' cases against `## Test cases`
- `Checks` — a `Verify` that does not run as written, one that is red with the change in place, and a check that stays green with the behavior removed
- `Flow` — a contradiction, a circular flow, a duplication, an omission, an unnatural flow inside a file the change made

The task is in `references/tasks.md`. The plan is fixed from them, and the report to the owner says what was done with each finding. One subagent per plan, one round.

While that review runs, write the next plan file: the writing of one file and the review of the previous one overlap. A plan that is fixed from its review does not wait for the others.

### 7. Proofread

After every review is done, run one `proofreader` subagent per file in parallel with `cycles/<YYMMDD>-<NNN>-<slug>/plan/<NN>-<plan id>.md` and `.pi/skills/plan/references/format.md`; the role's policy applies; edit only the named files.

- read its report and `git diff` of the file
- if a slice's `Steps`, a `Verify` line, a test case or a field name changed meaning, or a section or field name moved, put the file back to `references/format.md`'s shape, in your own words
- say in your report to the owner what you repaired: `fixed: <what>`, or `left: <why>`
- one round: a repaired file does not go through the subagent again

### 8. Show the owner

Every plan of the cycle: files, slices, types, steps, verify. They read them, and answer.

### Changes after this

Plan is edited to match, and git holds the diff. The plan md's `Boundary Plans` is edited when a pair is cut again, and git holds that diff too.

## What is not here

| what                                        | where       |
| ------------------------------------------- | ----------- |
| product's picture                           | definition  |
| the research, the options, the decision     | cycle's ADR |
| cut into plans, their order, their boundary | plan        |
| work, and what it leaves behind             | work        |
| whether the cycle delivered                 | close       |

## How not to write this

- Do not copy the ADR: name it where it bites, and write what the reader has to do
- Do not write a plan that only replaces words: say how the update is built into the existing, and how the whole is redesigned
- Do not invent a check: `Always` holds the checks `references/format.md` lists, and `Added` holds the ones the change decides
- Do not write a case the type, the schema or the DB settles: it is noise, and the reviewer takes it out
- Do not leave a hole: a boundary with no answer stops the plan
- Do not write the plan from the agent's side while a worktree is live: the subagent writes its slice's record, and the agent writes at the acceptance
