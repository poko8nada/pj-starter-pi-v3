---
name: close
description: Use when every plan of a cycle is done (done, or dropped by the owner). It collects what the plans left, triages it with the owner, and then asks the owner, Unit by Unit, whether they will verify the function.
---

# close

Each plan carries its own acceptance, and every merge runs the whole suite, so the inside of a plan and the combination of them are both looked at.
What no plan looks at is the cycle itself: a change an entry decided that no plan carried, and the holes the plans left behind.
This skill collects the holes, triages them with the owner, and closes the cycle: after the triage and its fixes, it asks the owner, Unit by Unit, whether they will verify the function.

Texts handed to subagents are in `references/tasks.md`.

## File

`cycles/<YYMMDD>-<NNN>-<slug>/close.md`, in the shape `references/format.md` gives.

## Procedure

### 1. Check the trigger

- every plan is done: its `Commit:` is filled and the work is done (`work` step 8 green), or the owner dropped it (`Stopped`, no merge)
- a plan that is still open is the work skill's business, not this close's

### 2. Read the cycle

- the ADR: the `accepted` entries, and what each `Definition` decides
- the design: the cut, and the `Boundary.Plans`
- each plan md: its `## Acceptance`, its `## Review` and its `## Notes`
- do not read the cut from memory: the files hold it, and the plan mds hold what they left
- a change an entry decided that no plan's `Files` or `Paths` carries is a hole: find it here, and add it in step 3

### 3. Collect

- `node .pi/skills/close/scripts/collect.mjs cycles/<YYMMDD>-<NNN>-<slug>` writes `close.md` and its `## Collected`. It creates the file
- the script lists the leftovers of every plan md with their plan and line; it does not judge
- read the plan md and the diff for each line, and write its `Doing` / `Left` / `Cost`
- fill every `未特定` for a design plan from the design. An `ex-` plan's `No` is read from the Triage; the plan md has no `No`
- show the completed `## Collected` to the owner
- add the holes you found in step 2 as lines by hand, in the same shape: the script does not know them

### 4. Triage, with the owner

- first, a leftover that moves a part of `DEFINITION.md` goes to `proposed`, even when it is a contradiction, a hole, something broken, or something left stale
- a leftover that does not move `DEFINITION.md`, and is a contradiction, a hole, something broken, or something left stale, is looked at as `ex-`
- one destination per leftover, and the owner confirms. The shape is in `references/format.md`
  - `ex-plan`: it is one of those four, it does not move `DEFINITION.md`, and the fix is code. Explain the outline and the fix to the owner first, then write the plan md directly, named `ex-<what it fixes>` (no design, no `No` at the top); its `No` is read from the Triage. Run its work, and resume this close when it is merged: its line carries `done <commit>`. Run step 3 again for the merged `ex-` plan's leftovers, triage them here, and align the `Triage` numbers with the new `## Collected`, before the close goes on
  - `proposed`: it breaks nothing, or it moves a part of `DEFINITION.md`; either way, leaving it makes things worse. The next cycle carries it: its ADR decides, and a plan writes
  - `dropped`: rare, and the fix weighs more
- a leftover that needs facts nobody has gets a `research` subagent; the rest do not
- write the lines in `## Triage` as they are decided. The triage is done when every leftover has a destination and every `ex-` plan has merged

### 5. Ask and verify, by Unit

- the Units are the ones the `accepted` entries' `Definition` names, and the plans on each come from the design's `No`
- ask the owner, per Unit, whether they will run the function or look at it
- the check is of the Unit's function on the merged base, not of the change: the change is what the work looked at
- their OK in the chat closes it; a Unit they will not check carries `しない` and the reason on the same line
- a Unit whose function does not work gets an `ex-` plan, as the triage's: named `ex-<what it fixes>`, no design and no `No` at the top; its `No` is read from the Triage, its work run, and this step runs again for that Unit when it is merged. Run step 3 again for the merged `ex-` plan's leftovers, triage them here, and align the `Triage` numbers with the new `## Collected`, before the close goes on
- what they answered goes in `## Verified`, which sits after `## Triage`

### 6. Owner

- they read the whole `close.md` — the triage and the verification — and answer. A missing line comes back
- a rejection sends you back to the step it came from: 3 for a collected line, 4 for a destination, 5 for a Unit

### 7. Leftovers

- before the commit: `consult_worktree list`, and remove what no plan and no line keeps
- nothing is decided here: what this step finds that step 4 did not decide goes back to step 4, before the commit

### 8. Commit

- `close.md` and the `ex-` plans, in one commit. That commit closes the cycle, and nothing about that cycle is edited afterwards

### 9. Clean the workspace

- after the commit: delete the `memo-*` and temp files this cycle created. They are not part of the cycle's commit

## How not to do this

- Do not run the plan's checks again: the acceptance ran them, and the merge gate held. The owner's verification is of the Unit's function, and it goes in `## Verified`
- Do not decide the verification for the owner: ask, and write the answer as it is
- Do not fix a hole silently, and do not write the fix into `DEFINITION.md`, the design or a plan
- Do not leave a leftover without a line in the `Triage`: the cycle closes only when every one of them has a destination
- Do not copy by hand what the script collects: a line left out is a hole nobody finds again
