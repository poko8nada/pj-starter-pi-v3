---
name: close
description: Use when every plan of a cycle is done (done, or dropped by the owner). It collects what the plans left, proposes their triage in close.md, and after the owner's judgement asks, Unit by Unit, whether they will verify the function.
---

# close

Each plan carries its own acceptance, and every merge runs the whole suite, so the inside of a plan and the combination of them are both looked at.
What no plan looks at is the cycle itself: a change an entry decided that no plan carried, and the holes the plans left behind.
This skill collects the holes, proposes their triage in `close.md`, and closes the cycle: after the owner's judgement on the proposal and its fixes, it asks the owner, Unit by Unit, whether they will verify the function.

Texts handed to subagents are in `references/tasks.md`.

## File

`cycles/<YYMMDD>-<NNN>-<slug>/close.md`, in the shape `references/format.md` gives.

## Procedure

### 1. Check the trigger

- every plan is done: its `Commit:` is filled and the work is done (`work` step 8 green), or the owner dropped it (`Stopped`, no merge)
- a plan that is still open is the work skill's business, not this close's

### 2. Read the cycle

- the ADR: the `accepted` entries, and what each `Definition` decides
- the plan mds: the `No` and the `Boundary Plans`
- each plan md: its `## Acceptance`, its `## Work Review` and its `## Notes`
- do not read the cut from memory: the files hold it, and the plan mds hold what they left
- a change an entry decided that no plan's `Files` carries is a hole: find it here, and add it in step 3

### 3. Collect

- `node .pi/skills/close/scripts/collect.mjs cycles/<YYMMDD>-<NNN>-<slug>` writes `close.md` and its `## Collected`. It creates the file
- the plan id is the plan md's file name without the `NN-` prefix and without `.md`; the `## Collected` heading prefixes it with the `NN` (`### <NN> <plan id> (ADR ...)`); a Triage line's plan id stays `ex-<what it fixes>` with no `NN-`
- the script lists the leftovers of every plan md with their plan and line; it does not judge
- one leftover is one numbered line `<line> / <place> / <出どころ>`: the inventory only. `Doing` / `Left` / `Cost` are not written
- fill every `未特定` from the plan md's `No`. An `ex-` plan's `No` is read from the Triage; the plan md has no `No`
- add the holes you found in step 2 as lines by hand, in the same shape: the script does not know them
- do not show `## Collected` to the owner here: the proposal comes first, and they read it after the proofread

### 4. Exclude what is already resolved

- a resolved leftover is excluded by the agent's reading of the wording: the plan md, the diff and the close context show it is already closed
- the script does not judge this: the agent deletes the resolved lines from `## Collected` by hand
- every rerun of `collect.mjs` rewrites the numbered lines, so re-filter after every rerun before the close goes on

### 5. Propose the triage, in `close.md`

- the agent writes one proposal destination per leftover, in `## Triage`, in this order:
  1. the cycle's own concern → `ex-`
  2. an obvious bug, vulnerability, or stale implementation or wording outside that concern → `ex-`
  3. one of the above whose scope or change is too large for one `ex-`, or that needs further outside or inside research → `_proposed_`
  4. the rest → `dropped`
- each `## Triage` bullet carries its grounds underneath, in this shape:
  - `Fact:` what happened and how it stands now
  - `Why:` why this proposal is recommended
  - `Then:` what comes next — for an `ex-`, the policy its plan follows; for a `_proposed_`, the question the next cycle discusses; for a `dropped`, nothing.
- a leftover that needs facts nobody has gets a `research` subagent; the rest do not
- the proposal is done when every leftover has a destination with its `Fact:` / `Why:` / `Then:`. The owner confirms it later, in step 8

### 6. Complete `close.md`

- at completion `## Triage` holds the proposal, `## Collected` holds the inventory, and `## Verified` is empty, and that is normal
- the shape is in `references/format.md`
- what completes here is the proposal the owner reads: the confirmed destinations, the `ex-` merges and the verification come after their judgement

### 7. Proofread

Before the owner reads `close.md`, run one `proofreader` subagent with `cycles/<YYMMDD>-<NNN>-<slug>/close.md` and `.pi/skills/close/references/format.md`; the role's policy applies; edit only the named files.

- read its report and `git diff` of the file
- if a `Triage` line, a `Verified` line or a destination changed meaning, or a section or field name moved, put the file back to `references/format.md`'s shape, in your own words
- say in your report to the owner what you repaired: `fixed: <what>`, or `left: <why>`
- one round: the repaired file does not go through the subagent again

### 8. Owner

- they read the whole `close.md` — the triage proposal, with its `Fact:` / `Why:` / `Then:`, and the empty `## Verified` as normal — and answer. A missing line comes back
- a rejection sends you back to the step it came from: 3 for a collected line, 4 for a resolved judgement, 5 for a destination, 10 for a Unit

### 9. Run the `ex-` plans and merge

- after the owner's judgement, write each confirmed `ex-` leftover's plan directly, named `ex-<what it fixes>` (no `No` at the top); its `No` is read from the Triage. Review the plan itself, fix it, and commit it, then run its work: when its `Place` is worktree make a worktree, when `base` run without the owner's OK. Resume this close when it is merged: its line carries `done <commit>`
- run steps 3 to 5 again for the merged `ex-` plan's leftovers, propose their destinations here, and align the `Triage` numbers with the new `## Collected`, before the close goes on
- go on when no `ex-` is left without its `done <commit>`

### 10. Verify, by Unit

- the Units are the lines under `Users can do` of the `accepted` entries' `Definition`, and of those, the ones this cycle touched — its line or its route — are verified; a `####` heading is not a Unit. `Product` / `What` / `Who` / `Stack` are not Units and are not verified
- ask the owner, per Unit, whether they will run the function or look at it
- the check is of the Unit's function on the merged base, not of the change: the change is what the work looked at
- their OK in the chat closes it; a Unit they will not check carries `しない` and the reason on the same line
- a Unit whose function does not work gets an `ex-` plan, as the triage's: named `ex-<what it fixes>`, no `No` at the top; its `No` is read from the Triage. Review the plan itself, fix it, and commit it, then run its work: when its `Place` is worktree make a worktree, when `base` run without the owner's OK, and this step runs again for that Unit when it is merged. Run steps 3 to 5 again for the merged `ex-` plan's leftovers, propose their destinations here, and align the `Triage` numbers with the new `## Collected`, before the close goes on
- what they answered goes in `## Verified`, which sits after `## Triage`

### 11. Roadmap

- after the owner's judgement, write the cycle into `ROADMAP.md`, with their word
- append this cycle's number to the item's `cycles`; a number that is already there is kept
- set the item's `status` to `done` when the owner says the item is finished, and leave it `wip` when it is not
- the shape and the rules of the file are in `rules/roadmap.md`

### 12. Leftovers

- before the commit: `consult_worktree list`, and remove what no plan and no line keeps
- nothing is decided here: what this step finds that step 5 did not propose goes back to step 5, before the commit

### 13. Commit

- Commit message: `close: NNN-<suffix>'s close and roadmap`. `<suffix>` is the part right of the number in the cycle folder name, as in `work` step 2 (`261104-054-dev` gives `dev`).
- `close.md` and `ROADMAP.md`, in one commit. That commit closes the cycle, and nothing about that cycle is edited afterwards
- an `ex-` plan and its work are committed at its merge, each on its own; this commit does not carry them

### 14. Clean the workspace

- after the commit: delete the `memo-*` and temp files this cycle created. They are not part of the cycle's commit

## How not to do this

- Do not run the plan's checks again: the acceptance ran them, and the merge gate held. The owner's verification is of the Unit's function, and it goes in `## Verified`
- Do not decide the verification for the owner: ask, and write the answer as it is
- Do not fix a hole silently, and do not write the fix into `DEFINITION.md` or a plan
- Do not triage with the owner line by line before `close.md` is complete: the agent proposes every destination with its `Fact:` / `Why:` / `Then:`, proofreads it, and only then the owner judges it
- Do not skip the resolved exclusion: what the wording shows is already closed is excluded by the agent, and re-filtered after every rerun of the script
- Do not leave a leftover without a line in the `Triage`: the cycle closes only when every one of them has a destination and every `ex-` plan has merged
- Do not copy by hand what the script collects: a line left out is a hole nobody finds again
