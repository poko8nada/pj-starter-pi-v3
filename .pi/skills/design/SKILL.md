---
name: design
description: Use when the cycle's entries are decided and the work has to be cut. It walks what each entry touches, decides how many worktrees the cycle runs, in what order, and where each plan stops, and writes `cycles/<YYMMDD>-<NNN>-<slug>/design.md`.
---

# design

One cycle has one design: `cycles/<YYMMDD>-<NNN>-<slug>/design.md`. It walks what the cycle's decided changes touch, cuts them into plans, and says where each plan stops.

A plan is a worktree, a branch and a merge — the unit the work runs in. The plan md and the steps inside it are written from here, and the work is carried out there.

## File

`cycles/<YYMMDD>-<NNN>-<slug>/design.md`, in the shape `references/format.md` gives.

Read that file before writing. It holds the section for the related files, a section per plan, the rules for the cut, and `Boundary`'s two groups.

## Procedure

### 1. Read what is behind the cycle

- `DEFINITION.md`: the product's picture
- this cycle's `adr.md`: every `accepted` entry names, in its `Definition Change`, the lines it moves

### 2. Walk the relations, and write `## Possibly related files`

Run one `research` subagent per `accepted` entry, at once. Each walks what its entry touches across Units, and reports the paths that exist now. The task is in `references/tasks.md`.

Write the answers at the top of design.md: one `### <NN>: <the entry's question>` per entry, with the paths under it. Keep the repeats: the same path under two entries is a fact.

### 3. Cut the cycle's changes into plans

Rules are in `references/format.md`. One plan is one worktree: the unit of a branch and a merge.

The list is the material: entries that share a path are one plan's candidates, an entry that reads another plan's paths comes later, and a plan whose paths many entries read comes first.

### 4. Name each plan

The plan id is the name of the change (`worktree-cleanup`), not the Unit's name. A plan may span Units.

### 5. Write each plan's section

- `ADR & Where` — `No` (the entries this plan cuts), `Why` (one sentence), `Where`
- `Scope` — the names of the definition it changes
- `Boundary` — the edge: `Plans` and `External`

### 6. Propose where each plan runs, and ask the owner

The default is a worktree: a branch, a subagent, a merge. A plan whose work needs the owner's eyes — a browser, a screen, a look — runs in the base instead: the agent does it in its own tree, and the changes land as they are made.

Propose one place per plan, with the reason. The owner answers, and the answer can be any of three:

- as proposed
- left to you: they take no side, and the proposal stands
- the other one: a plan that meets the worktree conditions, and the owner wants to be in it → the base

### 7. Show the owner

One list of plans, each with its scope and its boundary. They read the cut, and answer.

### Changes after this

Design is edited to match, and git holds the diff.

## What is not here

| what                                                                                | where       |
| ----------------------------------------------------------------------------------- | ----------- |
| product's picture                                                                   | definition  |
| options, the research, the decision                                                 | cycle's ADR |
| files the plan changes, the internal dependencies, the types, the steps, the checks | plan        |
| whether the cycle delivered                                                         | close       |

## How not to write this

- Do not cut by Unit: the cut follows the change and the merge, not the folder a thing lives in
- Do not split for the sake of parallelism: two halves that read the same input stay in one worktree
- Do not write the plan: this file says the cut, not the work
