---
name: plan
description: Use when the design is agreed and one of its plans has to become work — after the cut is settled and a plan is ready to be handed to a subagent. It writes `cycles/<YYMMDD>-<NNN>-<slug>/plan/<plan id>.md`, holding the files, the slices, the shapes and the checks.
---

# plan

One plan is one worktree: a branch and a merge. It is written from the cycle's design and ADR, and it is what the work is done from — a subagent reads the plan, and nothing else, to do the work.

## File

`cycles/<YYMMDD>-<NNN>-<slug>/plan/<plan id>.md`, in the shape `references/format.md` gives.

Read that file before writing. It holds the sections, the slice, the `Types`, the type rules, the checks and the record.

## Procedure

### 1. Read what the plan carries

- the design's section for this plan: `No`, `Why`, `Where`, `Scope`, `Boundary`
- the entries the plan's `No` names, in full

### 2. Walk the relations, and write `Files`

Walk what the change touches: what imports it, calls it, renders it, documents it, checks it. Write the tree: what changes, with a marker, and what follows, without one.

A file whose structure does not follow the project's rules, and that the plan touches anyway, is fixed in this plan — the step says why.

### 3. Cut the work into slices

One slice is one closing: work that ends when its check passes. A subagent may carry several in one run. Inside a slice, one step is one file: what to do in it.

The place is the design's: a `base` plan is cut where the owner can look and decide, and the agent does it.

### 4. Write the `Types` of each slice

Write the declarations the slice moves: a type, a schema, a signature, a state. They are the source of the slice's cases; `なし` when nothing moves. The rules are in `references/format.md`.

### 5. Walk the `Types`, and write the cases

Walk each declaration — or the slice's `Steps`, when `Types` is `なし` — and write a case for each line, or the reason it does not apply. The walk is in `references/format.md`.

**A boundary with no answer is a hole in the plan.** Stop, and decide the shape before writing on.

### 6. Write the checks

Every slice carries one `Verify`, which proves what `Types` and the `Steps` decide, and only what the types cannot: a type from the list, and its cases. A check that is not runnable is a hole: fix it, or say why it does not apply.

A `test` check is written on top of the test file it names: read that file first, and write the cases the way it already works — its fixtures, its doubles, the seam it uses. A `read` check is read by the subagent itself; a check that needs a consult subagent is run by the agent, and the agent reads it again at the acceptance as a precaution.

### 7. Write the record

`## Notes`, one `### Slice N` per slice, with the fields empty; a subagent fills its own slice's record as the work goes. `## Review` and `## Acceptance` are written by the reviewer and by the agent.

### 8. The cycle's plans, together

When every plan of the cycle is written, read them together — the `Types` each one moves, its `Files`, and its slice names: two plans that would make the same thing under two names (a component, a helper, a type, a fixture, a double, a module). A shared path is a hint, not the test.

A pair found is a change to the cut. The owner decides. Then write:

- the design: `## Refactor` at the top, and the plans that use it name it in their `Boundary.Plans`
- the plans that used to make it: their `Files` drop it, and the step that made it becomes a step that uses it
- the refactor plan's own md: its `Files`, `Slices` and checks

### 9. The review of each plan

A `review` subagent reads one plan's `Verify` — each slice's check — and answers with its findings. The task is in `references/tasks.md`. The plan is fixed from them, and the report to the owner says what was done with each finding. One subagent per plan, one round; the plans do not wait for each other.

### 10. Show the owner

Every plan of the cycle: the files, the slices, the shapes, the checks. They read them, and answer.

### Changes after this

The plan is edited to match, and git holds the diff.

## What is not here

| what                                            | where           |
| ----------------------------------------------- | --------------- |
| the product's picture                           | the definition  |
| the options, the research, the decision         | the cycle's ADR |
| the cut into plans, their order, their boundary | the design      |
| the work, and what it leaves behind             | the work        |
| whether the cycle delivered                     | the close       |

## How not to write this

- Do not copy the design or the ADR: name them where they bite, and write what the reader has to do
- Do not invent a check: the types are a closed list
- Do not leave a hole: a boundary with no answer stops the plan
- Do not write the plan from the agent's side while a worktree is live: the subagent writes its slice's record, and the agent writes at the acceptance
