---
name: design
description: Use when the definition and the cycle's ADR are settled and the work has to be cut — after the units that move are written and their entries are decided. It decides how many worktrees the cycle runs, in what order, and where each plan stops, and writes `cycles/<NNN>/design.md`.
---

# design

One cycle has one design: `cycles/<NNN-YYYY-MM-DD>/design.md`. It cuts the cycle's decided changes into plans, and says where each plan stops.

A plan is a worktree, a branch and a merge — the unit the work runs in. The plan md and the steps inside it are written from here, and the work is carried out there.

**The discussion does not happen here.** A fork about the cut — a plan added or dropped, an order the owner has to live with, a boundary that costs — belongs to the cycle's ADR (the `adr` skill). What is decided there comes back and is written here.

## The file

`cycles/<NNN-YYYY-MM-DD>/design.md`, in the shape `references/format.md` gives.

Read that file before writing. It holds the section per plan, the rules for the cut, and the `Boundary`'s two groups.

## What goes to adr

- **the promise changes** — a plan is added or dropped in a way that changes what the cycle delivers
- **the order** — a wait the owner lives with: a plan that several others wait for, or a chain that runs long
- **a boundary that costs** — a new service, a licence, a running cost, a permission
- **the owner's call** — how much runs at once, since each plan is an agent, a branch and a merge

The cut keeps its own business: which files a plan holds, the order inside a plan, the steps.

The bar is in the `adr` skill; these are the shapes it takes here.

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

### 5. Show the owner

One list of plans, each with its scope and its boundary. They read the cut, and answer.

### A change after this

A new `adr` entry records it. The design is edited to match, and git holds the diff.

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
- Do not decide policy here: open an `adr` entry, and let the owner answer
- Do not write the plan: this file says the cut, not the work
