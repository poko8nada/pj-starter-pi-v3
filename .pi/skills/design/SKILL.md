---
name: design
description: Use when the definition and the cycle's ADR are settled and the work has to be cut — after the units that move are written and their entries are decided. It decides how many worktrees the cycle runs, in what order, and where each plan stops, and writes `cycles/<NNN>/design.md`.
---

# design

One cycle has one design: `cycles/<NNN-YYYY-MM-DD>/design.md`. It cuts the cycle's decided changes into plans, and says where each plan stops.

A plan is a worktree, a branch and a merge — the unit the work runs in. The plan md and the steps inside it are written from here, and the work is carried out there.

**The discussion does not happen here.** A fork the cut cannot resolve — an accepted entry that cannot be cut as accepted — belongs to the cycle's ADR (the `adr` skill). What is decided there comes back and is written here.

## The file

`cycles/<NNN-YYYY-MM-DD>/design.md`, in the shape `references/format.md` gives.

Read that file before writing. It holds the section per plan, the rules for the cut, and the `Boundary`'s two groups.

## What goes to adr

- **an accepted entry cannot be cut as accepted** — its premise fails, or two entries contradict. The entry is reopened, and the owner answers.

The cut keeps its own business: the plans, their order, how many run at once, where each one runs, and the steps inside a plan.

## Procedure

### 1. Read what is behind the cycle

- the definition's `Users can do`: the units and the features that moved
- this cycle's `adr.md`: every `accepted` entry names what to change

### 2. Cut the cycle's changes into plans

The rules are in `references/format.md`. One plan is one worktree: the unit of a branch and a merge.

### 3. Name each plan

The plan id is the name of the change (`worktree-cleanup`), not the unit's id. A plan may span units.

### 4. Write each plan's section

- the head sentence: why this plan — the input it shares, the condition that applies, and what it waits for
- `ADR`, `Scope` (what it changes), `Boundary` (the interface with other plans, and the outside)

### 5. Propose where each plan runs, and ask the owner

The default is a worktree: a branch, a child, a merge. A plan whose work needs the owner's eyes — a browser, a screen, a look — runs in the base instead: the parent does it in its own tree, and the changes land as they are made.

Propose one place per plan, with the reason. The owner answers, and the answer can be any of three:

- as proposed
- left to you: they take no side, and the proposal stands
- the other one: a plan that meets the worktree conditions, and the owner wants to be in it → the base

### 6. Show the owner

One list of plans, each with its scope and its boundary. They read the cut, and answer.

### A change after this

The design is edited to match, and git holds the diff.

A plan found while the plans are written comes back here: the top of this file gains `## Refactor`, and the plans that use it name it in their `Boundary.Plans`.

## What is not here

| what                                                                   | where           |
| ---------------------------------------------------------------------- | --------------- |
| the product's picture                                                  | the definition  |
| the options, the research, the decision                                | the cycle's ADR |
| the files, the internal dependencies, the types, the steps, the checks | the plan        |
| whether the cycle delivered                                            | the close       |

## How not to write this

- Do not cut by unit: the cut follows the change and the merge, not the folder a thing lives in
- Do not split for the sake of parallelism: two parts that read the same input stay in one worktree
- Do not write the plan: this file says the cut, not the work
