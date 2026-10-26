---
name: plan
description: Use when design is agreed and one of its plans has to become work — after cut is settled and a plan is ready to be handed to a subagent. It writes `cycles/<YYMMDD>-<NNN>-<slug>/plan/<plan id>.md`, holding files, slices, types, steps and verify.
---

# plan

One plan is one worktree: a branch and a merge. It is written from the cycle's design and ADR, and it is what the work is done from — a subagent reads the plan, and nothing else, to do the work.

## File

`cycles/<YYMMDD>-<NNN>-<slug>/plan/<plan id>.md`, in the shape `references/format.md` gives.

Read that file before writing. It holds the shape, the files and their structure, the slices, the type rules, the verify, the rules of a test case, and the record.

## Procedure

### 1. Read what the plan carries

- design's section for this plan: `No`, `Why`, `Where`, `Summary`, `Goal`, `Non-goal`, `Paths`, `Boundary`
- entries the plan's `No` names, in full
- `No` is the design's plan section's `No`; a normal plan writes it at the top of the plan md as it is
- An `ex-` plan does not write `No`; the Triage line is the only source

### 2. Research the lines the plan cannot write

For a line the plan cannot write, run one `research` subagent within the four kinds: the code's present shape, the contract of the thing it calls, the library's or the package's practice, and the shape of the test double. The task is in `references/tasks.md`.

- Write the facts in `Files`, `Types` and `Steps`.
- A missing fact the four kinds do not cover is a `Stopped` line with the reason, and the review reads it.
- Set the threshold for the question: the research is not a ritual at every plan.

The agent runs the research, and the plan's review reads the facts and the `Stopped` lines.

### 3. Walk the relations, and write `Files`

Walk what the change touches: what imports it, calls it, renders it, documents it, checks it. Write the tree: what changes, with a marker, and what follows, without one. The dirs follow the structure rules: a concern per dir, the tests beside the file, one `index` as the way in.

### 4. Cut the work into slices

One slice is one closing: work that ends when its check passes. A subagent may carry several in one run. Inside a slice, one step is one file: what to do in it.

The place is the design's: a `base` plan is cut where the owner can look and decide, and the agent does it.

### 5. Write the `Types` of each slice

Write the declarations the slice moves: a type, a schema, a signature, a state. `なし` when nothing moves. The rules are in `references/format.md`.

### 6. Write the `Steps` of each slice

One step is one file. The shape follows the file: a code file says what to do, a test file carries its cases as `(<mark>) <given> → <result>`, a document says what to do.

The cases of a test file follow `## Test cases` in `references/format.md`: what the types, the schema or the DB already guarantee is not a case, a case nobody would notice is not a case, and a mock is written only where the outside gives its types.

The plan writes the `Goal`'s result as a test case, and no step that goes past the `Non-goal`.

**A boundary with no answer is a hole in the plan.** Stop, and decide the shape before writing on.

### 7. Write the `Verify` of each slice

`Verify` is what closes the slice: what has to pass. It has two groups, the same in every plan:

- `Always` — the five: the related tests, the typecheck, the lint, the format, and the `grep` for stale wording
- `Added` — what the change adds: DB, front, auth, the base plan's look, or another check of the ADR's scope

A `Verify` that cannot be run is a hole: fix it, or say why it does not apply. A check that needs a consult subagent is run by the agent, and the agent reads it again at the acceptance as a precaution.

### 8. Write the record

`## Notes`, one `### Slice N` per slice, with the fields empty; a subagent fills its own slice's record as the work goes, and for a `base` plan the agent fills it. `## Review` and `## Acceptance` keep their names and stay empty: the reviewer writes `## Review`, and the agent writes `## Acceptance`, in the work stage.

### 9. Cycle's plans, together

When every plan of the cycle is written, read them together — the `Types` each one moves, its `Files`, and its slice names: two plans that would make the same thing under two names (a component, a helper, a type, a fixture, a double, a module). A shared path is a hint, not the test.

A pair found is a change to cut. The owner decides, the design's `Boundary.Plans` is updated to name the shared piece, and the plans are written again: one makes the shared piece, and the others use it, naming it where it bites in their `Files` and `Steps`.

### 10. Review of each plan

A `review` subagent reads one plan's slices — each `Verify` and the test steps' cases — and the design's `Goal` and `Non-goal`, and answers on five viewpoints:

- `Goal` — the steps and the checks that do not carry the design's `Goal`/`Non-goal`
- `Files` — a file the change needs but `Files` does not name, and a document, a comment or a test the change makes stale
- `Types` — a declaration the code uses but `Types` does not name, and a declaration against the type rules
- `Cases` — the test steps' cases against `## Test cases`
- `Checks` — a `Verify` that does not run as written, and a check that stays green with the behavior removed

The task is in `references/tasks.md`. The plan is fixed from them, and the report to the owner says what was done with each finding. One subagent per plan, one round; the plans do not wait for each other.

### 11. Show the owner

Every plan of cycle: files, slices, types, steps, verify. They read them, and answer.

### Changes after this

Plan is edited to match, and git holds the diff. The design's `Boundary.Plans` is edited when a pair is cut again, and git holds that diff too.

## What is not here

| what                                             | where       |
| ------------------------------------------------ | ----------- |
| product's picture                                | definition  |
| the design's research, the options, the decision | cycle's ADR |
| cut into plans, their order, their boundary      | design      |
| work, and what it leaves behind                  | work        |
| whether the cycle delivered                      | close       |

## How not to write this

- Do not copy the design or the ADR: name them where they bite, and write what the reader has to do
- Do not invent a check: `Always` is the five, and `Added` is the list `references/format.md` gives
- Do not write a case the type, the schema or the DB settles: it is noise, and the reviewer takes it out
- Do not leave a hole: a boundary with no answer stops the plan
- Do not write the plan from the agent's side while a worktree is live: the subagent writes its slice's record, and the agent writes at the acceptance
