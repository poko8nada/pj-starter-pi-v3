---
name: close
description: Use when every plan of a cycle is done (merged in the base, or dropped by the owner). It collects what the plans left, triages it with the owner, and closes the cycle.
---

# close

Each plan carries its own acceptance, and every merge runs the whole suite, so the inside of a plan and the combination of them are both looked at.
What no plan looks at is the cycle itself: a change an entry decided that no plan carried, and the holes the plans left behind.
This skill collects them, triages them with the owner, and closes the cycle.

## File

`cycles/<YYMMDD>-<NNN>-<slug>/close.md`, in the shape `references/format.md` gives.

## Procedure

### 1. Check the trigger

- every plan is done: its `Commit:` is filled and its work is merged, or the owner dropped it (the record sits in the agent's plan md)
  - merged: every hash in the plan's `## Notes` `Commit:` is an ancestor of `HEAD` (`git merge-base --is-ancestor <commit> HEAD`); a `Commit:` of `なし` is skipped. The log holds the merge itself (`git log --merges --grep "consult/<plan id>"`)
- a plan that is still open is the work skill's business, not this close's

### 2. Read the cycle

- the ADR: the `accepted` entries, and what each `Definition Change` decides
- the design: the cut, and the `Boundary.Plans`
- each plan md: its `## Acceptance` and its `## Notes`
- do not read the criteria from memory: the files hold them
- a change an entry decided that no plan's `Files` or `Scope` carries is a hole: it goes into `## Collected` by hand, in the same shape

### 3. Collect

- `node .pi/skills/close/scripts/collect.mjs cycles/<YYMMDD>-<NNN>-<slug>` writes `close.md` and its `## Collected`. It creates the file
- the script lists the leftovers of every plan md with their plan and line; it does not judge
- read the plan md and the diff for each line, and write its `Doing` / `Left` / `Cost`
- fill every `未特定` from the design, and show the completed `## Collected` to the owner

### 4. Triage, with the owner

- one destination per leftover, and the owner confirms. The shape is in `references/format.md`
  - `ex-plan`: it breaks the criteria, and the fix is code. Explain the outline and the fix to the owner first, then write the plan md directly, named `ex-<what it fixes>` (no design). Run its work, and resume this close when it is merged: its line carries `done <commit>`
  - `proposed`: it breaks nothing, but leaving it makes things worse. The next cycle carries it: its ADR decides, and a plan writes
  - `dropped`: rare, and the fix weighs more
- a leftover that moves a line of `DEFINITION.md` is not an `ex-` plan: it goes to `proposed`
- a leftover that needs facts nobody has gets a `research` subagent; the rest do not

### 5. Write close.md

- `## Collected` and `## Triage`, in that order
- after an `ex-` plan merged, run the script again: it keeps the lines that are there, and write `done <commit>` on the line it closed

### 6. Owner

- they confirm the triage. A missing line comes back
- a rejection sends you back to step 4

### 7. Commit

- `close.md` and the `ex-` plans, in one commit. That commit closes the cycle, and nothing about that cycle is edited afterwards

### 8. Leftovers

- after the commit: `consult_worktree list`, and remove what no plan and no line keeps
- nothing is decided here: what this step finds that step 4 did not decide goes back to step 4, before the commit

## How not to do this

- Do not write a test: the plan's acceptance and the merge gate already ran. The close judges, it does not check again
- Do not fix a hole silently, and do not write the fix into `DEFINITION.md`, the design or a plan
- Do not leave a leftover without a line in the `Triage`: the cycle closes only when every one of them has a destination
- Do not copy by hand what the script collects: a line left out is a hole nobody finds again
