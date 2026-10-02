---
name: plan
description: Use when the design is agreed and one of its plans has to become work — after the cut is settled and a plan is ready to be handed to a child. It writes `cycles/<NNN>/plan/<plan id>.md`, holding the files, the slices, the shapes and the checks.
---

# plan

One plan is one worktree: a branch and a merge. It is written from the cycle's design and ADR, and it is what the work is done from — a child reads the plan, and nothing else, to do the work.

**The discussion does not happen here.** A fork the plan meets — a shape that has no answer, a file whose structure has to be fixed, a boundary that costs — belongs to the cycle's ADR (the `adr` skill). What is decided there comes back and is written here.

## The file

`cycles/<NNN-YYYY-MM-DD>/plan/<plan id>.md`, in the shape `references/format.md` gives.

Read that file before writing. It holds the sections, the slice, the `I/O`, the type rules, the checks and the record.

## What goes to adr

- **a shape with no answer** — the walk found a boundary the shape cannot state: a failure path with no state, an optional whose meaning is undecided. The shape is decided before the plan is written, and the entry records it when it meets the bar
- **a reversal** — a shape, a boundary or a layout already accepted, now changed by this plan
- **a file or folder layout** — a refactor this plan touches that moves, renames, or changes what stands where
- **the owner pays** — a new dependency, a service, a permission the plan needs
- **the owner's call** — a trade-off this plan would make the owner live with

The plan keeps its own business: the steps, the order inside the plan, the names, the test cases, and the record.

The bar is in the `adr` skill; these are the shapes it takes here.

## Procedure

### 1. Read what the plan carries

- the design's section for this plan: the head sentence, `ADR`, `Where`, `Scope`, `Boundary`
- the entries the plan's `ADR` names, in full

### 2. Walk the relations, and write `Files`

Walk what the change touches: what imports it, calls it, renders it, documents it, checks it. Write the tree: what changes, with a marker, and what follows, without one.

A file whose structure does not follow the project's rules, and that the plan touches anyway, is fixed in this plan — the step says why.

### 3. Cut the work into slices

One slice is one closing: work that ends when its check passes, sized so that a child can carry it in one run. Inside a slice, one step is one file: what to do in it.

The place is the design's: a `base` plan is cut where the owner can look and decide, and the parent does it.

### 4. Write the `I/O` of each slice

Look at every input and output the slice touches, and write the ones that move: the shapes, and the signatures. The rules for the shapes are in `references/format.md`.

### 5. Walk the shapes, and write the cases

For each shape, walk its boundaries and write a case, or the reason it does not apply. The walk is in `references/format.md`.

**A boundary with no answer is a hole in the plan.** Stop, and decide the shape before writing on.

### 6. Write the checks

Every slice carries one `Verify`: a type from the closed list, and its content — the file, the command and the cases for a `test`; the child and the document for a `read`. A check that is not runnable is a hole: fix it, or say why it does not apply.

### 7. Write the record

`## Notes`, one `### Slice N` per slice, with the fields empty. The parent fills them as the work goes; a child never writes the plan.

### 8. Show the owner

One plan: the files, the slices, the shapes, the checks. They read it, and answer.

### A change after this

A new `adr` entry records it. The plan is edited to match, and git holds the diff.

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
- Do not let a child write the plan: a record written in a worktree rides into the merge
