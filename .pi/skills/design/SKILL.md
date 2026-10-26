---
name: design
description: Use when the cycle's entries are decided and the work has to be cut. It walks what each entry touches, decides the cut and the order, and proposes where each plan runs; the owner answers. It writes `cycles/<YYMMDD>-<NNN>-<slug>/design.md`.
---

# design

One cycle has one design: `cycles/<YYMMDD>-<NNN>-<slug>/design.md`. It walks what the cycle's decided changes touch, cuts them into plans, and says where each plan stops.

A plan is a worktree, a branch and a merge — the unit the work runs in. The plan md and the steps inside it are written from here, and the work is carried out there.

## File

`cycles/<YYMMDD>-<NNN>-<slug>/design.md`, in the shape `references/format.md` gives.

Read that file before writing. It holds the section for the related files, a section per plan (`Summary`, `Goal`, `Non-goal`, `Paths` and `Boundary`), the rules for the cut, and `Boundary`'s two groups.

## Procedure

### 1. Read what is behind the cycle

- `DEFINITION.md`: the product's picture
- this cycle's `adr.md`: every `accepted` entry names its `Scope` (what is in and out) and its `Definition` (the parts of the picture it relates to, each changed or kept)
- the code the entries' `Definition` and `Scope` point to: the files the entry rewrites — the subject
- read the code before the research: the subject is what the research is handed

### 2. Walk what the change affects, and find what it talks to

Run two `research` subagents per `accepted` entry, at once: one walks the paths the change affects, the other finds what the change talks to outside the repository. Hand both the entry and the files the entry rewrites — the subject. The tasks are in `references/tasks.md`.

- the paths: what reads the result of the change, what checks it, what is generated from it
- the outside: a service, a contract, an environment, data, a limit; a thing and what the entry does with it, not a path
- paths: generated files, vendor files, build artifacts, what `.gitignore` covers, and `cycles/` are not reported
- the dependencies are followed one step, not transitively
- the subject is handed in, not reported back
- an entry with nothing to report carries `なし`, in either section

Write the answers at the top of design.md: one `### <NN>: <entry's question>` per entry under `## Affected` for the paths, and the same under `## External` for the outside. Keep the repeats.

### 3. Cut the cycle's changes into plans

Rules are in `references/format.md`. One plan is one worktree: the unit of a branch and a merge.

The list is the material: entries that share a path are one plan's candidates, an entry that reads another plan's paths comes later, and a plan whose paths many entries read comes first.

### 4. Name each plan

The plan id is the name of the change (`worktree-cleanup`), not the Unit's name. A plan may span Units.

### 5. Write each plan's section

- `ADR & Where` — `No` (the entries this plan cuts), `Why` (one sentence), `Where`
- `Goal` — one sentence a check can make red, from the entry's items: `Adopted` is the content, the `Scope`'s `in` the range, `Research & Trial` how it is observed
- `Non-goal` — the `Scope`'s `out` that touches this plan, and the `Options` a worker would mistake, with the reason
- `Summary` — what this plan does, as a digest of the entries it cuts
- `Paths` — the files this plan changes, from the entries' subjects and the followers that change with them
- `Boundary` — the edge: `Plans` and `External`. `External` is what the research reported as outside; `なし` when the change talks to nothing outside

### 6. Propose where each plan runs, and ask the owner

The default is a worktree: a branch, a subagent, a merge. A plan whose work needs the owner's eyes — a browser, a screen, a look — runs in the base instead: the agent does it in its own tree, and the changes land as they are made. A yolo plan is worktree; the base condition does not apply.

Propose one place per plan, with the reason. The owner answers, and the answer can be any of three:

- as proposed
- left to you: they take no side, and the proposal stands
- the other one: the other place, when the plan meets that place's condition and the owner wants it

### 7. Review the design

A `review` subagent reads design.md and what it names, and answers on six viewpoints. The task is in `references/tasks.md`.

- the viewpoints: a decided line (the `Goal` and `Non-goal` carry the `Adopted`'s rows and the `out`, the `Goal` is checkable, and the `Goal` does not go past the `Non-goal`), the cut's reason, the outside, the followers, the readers, the checks
- coverage: every follower in `## Affected` that changes is in some plan's `Paths`, and every outside thing in `## External` is in some plan's `External`
- one subagent, one round: the design is fixed from the findings, and the report to the owner says what was done with each
- the review is not the owner's look: it runs before step 9, and it does not wait

### 8. Proofread

Before the owner reads design.md, it goes through one proofread.

- the document: `cycles/<YYMMDD>-<NNN>-<slug>/design.md`
- run one `proofreader` subagent, and name that file in the task
- read its report and `git diff` of the file
- if a plan's `Goal`, `Non-goal` or `Why` changed meaning, or a section or field name moved, put the file back to `references/format.md`'s shape, in your own words
- say in your report to the owner what you repaired: `fixed: <what>`, or `left: <why>`
- one round: the repaired file does not go through the subagent again

### 9. Show the owner

One list of plans, each with its summary, its `Goal`, its `Non-goal`, its paths and its boundary. They read the cut, and answer.

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
- Do not write the definition's names in `Summary`: it is a digest of the work
- Do not split for the sake of parallelism: two halves that read the same input stay in one worktree
- Do not write the plan: this file says the cut, not the work
