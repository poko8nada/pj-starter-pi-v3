---
name: design
description: Use when the cycle's entries are decided and the work has to be cut. It decides how many worktrees the cycle runs, in what order, and where each plan stops, and writes `cycles/<YYMMDD>-<NNN>-<slug>/design.md`.
---

# design

One cycle has one design: `cycles/<YYMMDD>-<NNN>-<slug>/design.md`. It cuts the cycle's decided changes into plans, and says where each plan stops.

A plan is a worktree, a branch and a merge — the unit the work runs in. The plan md and the steps inside it are written from here, and the work is carried out there.

## File

`cycles/<YYMMDD>-<NNN>-<slug>/design.md`, in the shape `references/format.md` gives.

Read that file before writing. It holds section per plan, rules for the cut, and `Boundary`'s two groups.

## Procedure

### 1. Read what is behind the cycle

- `DEFINITION.md`: the product's picture
- this cycle's `adr.md`: every `accepted` entry names, in its `Definition Change`, the lines it moves

### 2. Cut the cycle's changes into plans

Rules are in `references/format.md`. One plan is one worktree: the unit of a branch and a merge.

### 3. Name each plan

The plan id is the name of the change (`worktree-cleanup`), not the Unit's name. A plan may span Units.

### 4. Write each plan's section

- `ADR & Where` — `No` (the entries this plan cuts), `Why` (one sentence), `Where`
- `Scope` — the names of the definition it changes
- `Boundary` — the edge: `Plans` and `External`

### 5. Propose where each plan runs, and ask the owner

The default is a worktree: a branch, a subagent, a merge. A plan whose work needs the owner's eyes — a browser, a screen, a look — runs in the base instead: the agent does it in its own tree, and the changes land as they are made.

Propose one place per plan, with the reason. The owner answers, and the answer can be any of three:

- as proposed
- left to you: they take no side, and the proposal stands
- the other one: a plan that meets the worktree conditions, and the owner wants to be in it → the base

### 6. Show the owner

One list of plans, each with its scope and its boundary. They read the cut, and answer.

### Changes after this

Design is edited to match, and git holds the diff.

A plan found while the plans are written comes back here: the top of this file gains `## Refactor`, and the plans that use it name it in their `Boundary.Plans`.

## What is not here

| what                                                               | where       |
| ------------------------------------------------------------------ | ----------- |
| product's picture                                                  | definition  |
| options, the research, the decision                                | cycle's ADR |
| files, the internal dependencies, the types, the steps, the checks | plan        |
| whether the cycle delivered                                        | close       |

## How not to write this

- Do not cut by Unit: the cut follows the change and the merge, not the folder a thing lives in
- Do not split for the sake of parallelism: two halves that read the same input stay in one worktree
- Do not write the plan: this file says the cut, not the work
