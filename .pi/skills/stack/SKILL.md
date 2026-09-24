---
name: stack
description: 'Use when a definition has been approved and before the plan is written. Every cycle passes through here, even when nothing changes. Decides what the product is built with: the harness that comes for free, and the additions the product itself needs.'
---

# stack

Fill the `Stack` section of a definition that is already approved. The other sections are settled and frozen; this is the one section that is written after the freeze. **Every cycle passes through here**, even when the answer is that nothing changes.

## Step 1: read the sheet, and the stack before it

Read the definition as it stands. The constraints on the stack are already in it:

- `What` says what kind of thing this is (a CLI, a service, a library)
- `Goal` and `Non-goal` say what it must do and what it will not do, which cuts most of the space
- `What to build` says what it has to run

Do not ask the owner for facts that the sheet or the repository answers.

## Step 2: look at the base

The harness of the repository is given, not chosen. Read the repository and name it; its versions and its settings are readable from the code, so the sheet only needs the names.

```
- Base: Node / TypeScript / pnpm / lefthook
```

A fresh agent has to be able to tell what came for free and what was chosen. That is the whole point of writing the base down: reading the code later cannot tell the two apart.

## Step 3: list the candidates

Walk the checklist and ask, for each, whether this product needs something:

- language and runtime
- packages and the package manager
- checks (lint, format, typecheck, tests)
- hooks (what runs on commit and on push)
- distribution (how the thing is run or shipped)
- libraries and services

Most slots will be answered by the base. Only the additions become candidates; the harness is not a decision and does not belong in `Added`.

Do not write reasons in the sheet. The commit that fills the `Stack`, and the report from the trial below, are the record of why.

Start from the `Stack` of the previous sheet: lines that did not change are copied as they are, because a diff that shows a change where nothing changed is a lie. A candidate that has become unnecessary is removed.

## Step 4: try what is not obvious

When a candidate can be read off the repository, take it. When its dependency resolution, its configuration, or the shape of its API is not readable, try it before deciding: send a `trial` child, which runs in a worktree with the dependencies installed, and read its report.

Trying costs a child per attempt, and it downloads the package into the shared package store: that is outside the repository, on the owner's machine. **Ask the owner before running one.** Do not hand them a cleanup command afterwards, and do not propose a global operation: what a shared store holds, and what a cleanup would take with it, is not yours to measure. A trial that fails is a result: it belongs in the ticket's `Notes`, and it takes that candidate off the list.

## Step 5: write it

```
## Stack

- Base: Node / TypeScript / pnpm / lefthook
- Added:
  - <what was added, one line each>

Changes: keep / update **理由**
```

- **The marker is yours to write.** The definition left this section empty and said why; this step is what fills it, so this step decides the marker. On a product's **first sheet** it is `add`: there is nothing to carry over. From the second one on: nothing changed is `Changes: keep`, with the previous lines copied verbatim; something changed is `Changes: update`, with the reason in bold — the frame moved and this followed it, or the stack itself was re-decided
- `Added: なし` when nothing was needed. Saying "none" is a decision and looks different from leaving the line out
- The sheet's content is Japanese; the labels stay English
- Do not wrap the lines

## Step 6: review it

Before the owner sees it, put the filled `Stack` in front of a `review` child. Same shape as everywhere else: a checklist that is fixed, fix what comes back, repeat until it comes back clean, and cap it at three rounds. A fixed checklist is what makes this converge.

The task, verbatim:

- Check this Stack against the definition, and nothing else:
  - the base is names only, and they are the names the repository actually uses
  - what the product needs is there, and nothing is added that the definition does not ask for
  - the marker is right: `add` on a product's first sheet, `keep` or `update` after it
- Report findings only, each with its line, marked blocking or not. If there is nothing, say "no findings".

The input is the definition file. Do not show the result to the owner until this comes back clean.

## Step 7: put it to the owner

Do not commit yet. Show what was added — and, when something was tried, what the trial reported.

- a rejection sends you back to Step 3
- show the review's findings and what you did with each: fixed, or answered with a reason
- when they say yes, commit. The `Stack` is inside a frozen sheet, so this commit is what freezes it in turn, and it is not edited afterwards

## How not to do this

- Do not decide the stack before the definition is approved: the constraints come from it
- Do not write the harness into `Added`; it is the base
- Do not write reasons in the sheet, and do not describe the base beyond its names
- Do not leave a candidate undecided. The stack step ends with every candidate either added or answered with なし
