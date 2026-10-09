---
name: plan
description: Use when the design is agreed and one of its plans has to become work — after the cut is settled and a plan is ready to be handed to a child. It writes `cycles/<NNN>/plan/<plan id>.md`, holding the files, the slices, the shapes and the checks.
---

# plan

One plan is one worktree: a branch and a merge. It is written from the cycle's design and ADR, and it is what the work is done from — a child reads the plan, and nothing else, to do the work.

**The discussion does not happen here.** A fork the plan cannot resolve — an accepted entry that cannot be written as accepted — belongs to the cycle's ADR (the `adr` skill). What is decided there comes back and is written here.

## The file

`cycles/<NNN-YYYY-MM-DD>/plan/<plan id>.md`, in the shape `references/format.md` gives.

Read that file before writing. It holds the sections, the slice, the `I/O`, the type rules, the checks and the record.

## What goes to adr

- **an accepted entry cannot be written as accepted** — the walk finds its premise fails, or two entries contradict. The entry is reopened, and the owner answers.

The plan keeps its own business: the steps, the order inside the plan, the names, the test cases, and the record.

## Procedure

### 1. Read what the plan carries

- the design's section for this plan: the head sentence, `ADR`, `Where`, `Scope`, `Boundary`
- the entries the plan's `ADR` names, in full

### 2. Walk the relations, and write `Files`

Walk what the change touches: what imports it, calls it, renders it, documents it, checks it. Write the tree: what changes, with a marker, and what follows, without one.

A file whose structure does not follow the project's rules, and that the plan touches anyway, is fixed in this plan — the step says why.

### 3. Cut the work into slices

One slice is one closing: work that ends when its check passes. A child may carry several in one run. Inside a slice, one step is one file: what to do in it.

The place is the design's: a `base` plan is cut where the owner can look and decide, and the parent does it.

### 4. Write the `I/O` of each slice

Look at every input and output the slice touches, and write the ones that move: the shapes, and the signatures. The rules for the shapes are in `references/format.md`.

### 5. Walk the shapes, and write the cases

For each shape, walk its boundaries and write a case, or the reason it does not apply. The walk is in `references/format.md`.

**A boundary with no answer is a hole in the plan.** Stop, and decide the shape before writing on.

### 6. Write the checks

Every slice carries one `Verify`: a type from the closed list, and its content — the file, the command and the cases for a `test`; the child and the document for a `read`. A check that is not runnable is a hole: fix it, or say why it does not apply.

A `test` check is written on top of the test file it names: read that file first, and write the cases the way it already works — its fixtures, its doubles, the seam it uses. A `read` check is read by the child itself; a check that needs a consult child is run by the parent, and the parent reads it again at the acceptance as a precaution.

### 7. Write the record

`## Notes`, one `### Slice N` per slice, with the fields empty; a child fills its own slice's record as the work goes. `## Review` and `## Acceptance` are written by the reviewer and by the parent.

### 8. The cycle's plans, together

When every plan of the cycle is written, read them together — the `I/O` each one moves, its `Files`, and its slice names: two plans that would make the same thing under two names (a component, a helper, a type, a fixture, a double, a module). A shared path is a hint, not the test.

A pair found is a change to the cut. The owner decides. Then write:

- the design: `## Refactor` at the top, and the plans that use it name it in their `Boundary.Plans`
- the plans that used to make it: their `Files` drop it, and the step that made it becomes a step that uses it
- the refactor plan's own md: its `Files`, `Slices` and checks

### 9. The review of each plan

A `review` child reads one plan's core — `I/O`, `Verify`, `Files` — and answers with its findings. The task is in `references/tasks.md`. The plan is fixed from them, and the report to the owner says what was done with each finding. One child per plan; the plans do not wait for each other.

### 10. Show the owner

Every plan of the cycle: the files, the slices, the shapes, the checks. They read them, and answer.

### A change after this

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
- Do not write the plan from the parent's side while a worktree is live: the child writes its slice's record, and the parent writes at the acceptance
