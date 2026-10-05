---
name: close
description: Use when every plan of a cycle is done (merged in the base, or dropped by the owner). It writes the cycle's integration test, triages what the plans left, and closes the cycle.
---

# close

A cycle is one definition, and it is judged as one thing.
Each plan carries its own acceptance, so the inside of a plan has an eye on it.
What no plan looks at is the handoff between plans: the design's `Boundary.Plans`.
This skill writes that test, triages what the plans left, and closes the cycle.

Two rules hold the whole way through.

- It does not change the product. A hole that breaks the criteria goes back as an `ex-` plan, and the cycle waits. The integration test is the one thing this close writes.
- It does not invent criteria. The criteria are the definition's `Users can do`, the design, and the plans' acceptances. A criterion that is missing is a hole, not something to add here.

## The file

`cycles/<NNN-YYYY-MM-DD>/close.md`, in the shape `references/format.md` gives.

## Procedure

### 1. Check the trigger

- every plan is done: its `Commit:` is filled and its work is merged, or the owner dropped it (the record sits in the parent's plan md)
  - merged: every hash in the plan's `## Notes` `Commit:` is an ancestor of `HEAD` (`git merge-base --is-ancestor <commit> HEAD`); a `Commit:` of `なし` is skipped. The log holds the merge itself (`git log --merges --grep "consult/<plan id>"`)
- a plan that is still open is the work skill's business, not this close's

### 2. Read the cycle

- the definition: the `Users can do` lines the cycle promised
- the design: the cut, and the `Boundary.Plans`
- each plan md: its `## Acceptance` (the checks that ran and what they found) and its `## Notes`
- do not read the criteria from memory: the files hold them

### 3. The integration test

- the target is what the design's `Boundary.Plans` names: the handoff between plans. `なし` everywhere means no test, and `## Integration` is `なし`
- look first: a test that already covers the handoff is updated (`updated`); with none, write one where this project keeps its tests — beside the code it exercises (`new`)
- the cases are the happy path and the most likely error path, and nothing more
- it touches nothing real: it writes under a temporary directory, and its doubles live in `.pi/test/`
- run it on the base. A `fail` is a hole: it goes to step 5

### 4. Collect

- `node .pi/skills/close/scripts/collect.mjs cycles/<NNN-YYYY-MM-DD>` prints the `## Collected` body. Paste it as it is
- the script lists the leftovers of every plan md; it does not judge

### 5. Triage, with the owner

- one destination per leftover, and the owner confirms. The shape is in `references/format.md`
  - `ex-plan`: it breaks the criteria. Explain the outline and the fix to the owner first, then write the plan md directly, named `ex-<what it fixes>` (no design). Run its work, and resume this close when it is merged
  - `proposed`: it breaks nothing, but leaving it makes things worse. The next cycle's ADR reads it
  - `dropped`: rare, and the fix weighs more
- a leftover that needs facts nobody has gets a `research` child; the rest do not

### 6. Write close.md

- `## Integration`, `## Collected`, `## Triage`, in that order
- after an `ex-` plan merged, run the script again, paste the new `## Collected`, and put `done` on the line it closed

### 7. The owner

- they confirm the triage. A missing line comes back
- a rejection sends you back to step 5

### 8. Commit

- the integration test and close.md, in one commit. That commit closes the cycle, and nothing about that cycle is edited afterwards

### 9. The leftovers

- after the commit: `consult_worktree list`, and remove what no plan and no line keeps
- nothing is decided here: what this step finds that step 5 did not decide goes back to step 5, before the commit

## How not to do this

- Do not implement: a hole that breaks the criteria goes back as an `ex-` plan, and the cycle waits
- Do not invent criteria: the definition, the design and the acceptances are the whole of it
- Do not fix a hole silently, and do not write the fix into the definition, the design or a plan: they are the cycle's record
- Do not re-run the whole suite: the merge gate already did, and the close is not a second acceptance
- Do not copy by hand what the script collects: a line left out is a hole nobody finds again
