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

## Who decides

Three gates. The table names them and says what each decides; a step that says "the gate is ..." names one of the three, and does not restate it.

| gate                | what it decides                                     | where      |
| ------------------- | --------------------------------------------------- | ---------- |
| the agent's reading | a leftover already closed                           | the chat   |
| the owner's word    | a destination, a grouping, a verification, a status | the chat   |
| the merge           | an `ex-` plan's work                                | the commit |

## The leftover's states

A leftover is in one state at a time. This table is the only place the states are written; each step below names the state it takes and the state it gives.

| state     | what it means           | what moves it on              |
| --------- | ----------------------- | ----------------------------- |
| collected | put in `## Collected`   | the agent: exclude or propose |
| excluded  | the line is deleted     | nothing: the end              |
| proposed  | `## Triage` holds it    | the owner                     |
| judged    | the owner said yes      | the agent: the plan, or close |
| merged    | the plan's work is in   | nothing: the end              |
| closed    | `dropped`, `_proposed_` | nothing: the end              |

An `ex-` plan's merge puts its plan md's leftovers back to `collected`, and the leftover's path below runs again for them.

## Procedure

The steps run in this order. The leftover's path is the collect, the exclusion, the proposal, the owner's judgement and the `ex-` plans; the rest are the cycle's.

### 1. Check the trigger

- takes: the cycle's plan mds
- does:
  - every plan is done: its `Commit:` is filled, and the work is done (`work` step 8 green)
  - or the owner dropped it: `Stopped`, no merge
- gives: a cycle the close can run on. A plan still open is the work skill's business, not this close's

### 2. Read the cycle

- takes: the ADR and the plan mds
- does:
  - read the `accepted` entries, and what each `Definition` decides
  - read the plan mds' `No` and `Boundary Plans`
  - read each plan md's `## Acceptance`, `## Work Review` and `## Notes`
  - do not read the cut from memory: the files hold it
  - list a hole: a change an entry decided that no plan's `Files` carries
- gives: the holes, for the collect

### 3. Collect

- takes: the plan mds
- does:
  - `node .pi/skills/close/scripts/collect.mjs cycles/<YYMMDD>-<NNN>-<slug>` writes `close.md` and its `## Collected`, and creates the file
  - the heading, the plan id and the line's shape are in `references/format.md`
  - fill every `未特定` as `references/format.md` says; an `ex-` plan's `No` comes from the Triage
  - add the holes from the read as lines by hand: the script does not know them
  - do not copy by hand what the script collects: a line left out is a hole nobody finds again
- gives: every leftover `collected`. Do not show `## Collected` to the owner here: the proposal comes first, and they read it after the proofread

### 4. Exclude what is already resolved

- takes: `collected` leftovers
- does:
  - read the plan md, the diff and the close context
  - delete the line of a leftover the wording shows is already closed: the script does not judge this
  - re-filter after every rerun of `collect.mjs`, and after the rerun the `ex-` plans need
- gives: `excluded` for the deleted ones, `collected` for the rest. The gate is the agent's reading

### 5. Propose the triage, in `close.md`

- takes: `collected` leftovers
- does:
  - write one destination per leftover in `## Triage`, in the order and the shape `references/format.md` gives
  - each bullet carries its `Fact:` / `Why:` / `Then:`
  - a leftover that needs facts nobody has gets a `research` subagent; the rest do not
  - an `ex-` destination has no plan name yet: the grouping in the `ex-` plans' step names it, as `references/format.md` says
  - do not triage with the owner line by line before every destination is in `## Triage`
- gives: `proposed` for every leftover

### 6. Complete `close.md`

- takes: the proposal
- does:
  - `## Triage` holds the proposal
  - `## Collected` holds the inventory
  - `## Verified` is empty, and that is normal
  - the shape is in `references/format.md`
  - what completes here is the proposal the owner reads: the destinations' confirmation, the `ex-` merges and the verification come after their judgement
- gives: the completed `close.md`

### 7. Proofread

- takes: the completed `close.md`
- does:
  - run one `proofreader` subagent with `cycles/<YYMMDD>-<NNN>-<slug>/close.md` and `.pi/skills/close/references/format.md`; the role's policy applies; edit only the named files
  - read its report and `git diff`
  - an empty `## Verified` is normal at this point: do not fill it, and put it back if the subagent filled it
  - put the file back to `references/format.md`'s shape, in your own words, if a `Triage` line, a `Verified` line or a destination changed meaning, or a section or field name moved
  - say in your report to the owner what you repaired: `fixed: <what>`, or `left: <why>`
  - one round: the repaired file does not go through the subagent again
- gives: the repaired `close.md`

### 8. The owner's judgement

- takes: `proposed` leftovers
- does:
  - the destinations are all in `## Triage` already; do not show `## Collected` to the owner before this point (the collect step says so)
  - explain one leftover at a time in the chat: what it is, which stage it came from and why, what is wrong now, how to fix it, and how wide the fix is; in words that hold without the reference files
  - wait for their answer on that one before the next
  - when the last one is answered, they read the whole `close.md` — the proposal, with its `Fact:` / `Why:` / `Then:`, and the empty `## Verified` as normal — as the final check; the final check is on the first pass only (a pass after an `ex-` plan's merge needs the one-at-a-time answers, not the whole read again)
  - a missing line comes back
  - a rejection sends you back to the step it came from: the collect for a collected line, the exclusion for a resolved one, the proposal for a destination, the verification for a Unit
- gives: `judged` for every leftover. The gate is the owner's word

### 9. Run the `ex-` plans and merge

- takes: `judged` leftovers whose destination is `_ex-plan_`
- does:
  - group them by the files they fix
  - say in the chat the round this is, and which `ex-` plans are not merged yet; count the unmerged ones each time from the `## Triage` lines that carry no `done`, and say it at every pass through this step
  - show the owner a table of the plan's name, the leftover numbers, and the files; when they agree, the `## Triage` lines carry the plan's name — the gate is the owner's word
  - write the grouped plans directly, named `ex-<what it fixes>` (no `No` at the top); its `No` is read from the Triage
  - write all of them, review them all, fix them, and commit them
  - run their work one by one: when its `Place` is worktree make a worktree, and run its work
  - when one is merged — the gate is the merge — its line carries `done <commit>`
  - its plan md's leftovers go back to `collected`: run the leftover's path again — the collect, the exclusion, the proposal and the owner's judgement, one leftover at a time — and the `## Triage` numbers follow the new `## Collected`: its first line is 1, and the numbers run through the file
- gives: `merged` for each. The step ends when no `ex-` is left without its `done <commit>`, and the chat said so

### 10. Verify, by Unit

- takes: the merged base
- does:
  - the Units are as `references/format.md` says: the lines under `Users can do` of the `accepted` entries' `Definition`; of those, the ones this cycle touched — its line or its route — are verified; a `####` heading is not a Unit; `Product` / `What` / `Who` / `Stack` are not Units
  - for each Unit, propose how to check it: the command to run and what to see, or the place to read and what to look for, and the result that means it works; in words that hold without the reference files
  - the owner runs it, or asks for another way; their word closes the Unit
  - the check is of the Unit's function on the merged base, not of the change: the change is what the work looked at
  - a Unit whose function does not work gets an `ex-` plan, with the same steps as the `ex-` plans' — the grouping, the plan, the work, the merge; say in the chat which Unit is still open, and this step runs again for that Unit when it is merged
  - what they answered goes in `## Verified`, which sits after `## Triage`; a Unit they will not check carries `しない` and the reason on the same line
- gives: the verified record, with an answer for every Unit. The gate is the owner's word

### 11. Leftovers

- takes: the worktrees
- does:
  - before the roadmap and the commit, run `consult_worktree list` and remove what no plan and no line keeps
  - what this step finds that the proposal did not carry goes back to the proposal, before the roadmap: the destinations, their `ex-` plans and the verification run again, and the roadmap is written after them
- gives: the worktrees with nothing left behind

### 12. Roadmap

- takes: the owner's judgement
- does:
  - write the cycle into `ROADMAP.md`, with their word
  - append this cycle's number to the item's `cycles`; a number that is already there is kept
  - ask the owner whether the item is finished; set its `status` to `done` only on their word, and leave it `wip` when they say it is not, or when they do not say
  - the shape and the rules of the table are in `rules/roadmap.md`
- gives: the roadmap's row. The gate is the owner's word

### 13. Commit

- takes: `close.md` and `ROADMAP.md`
- does:
  - the worktrees are clean before it: the worktree step says so
  - the roadmap is written before it: the roadmap step says so
  - commit them in one, with `close: NNN-<suffix>'s close and roadmap`; `<suffix>` is the part right of the number in the cycle folder name, as in `work` step 2 (`261104-054-dev` gives `dev`)
  - nothing about that cycle is edited afterwards
  - an `ex-` plan and its work are committed at its merge, each on its own; this commit does not carry them
- gives: the closed cycle

### 14. Clean the workspace

- takes: after the commit
- does:
  - delete the `memo-*` and temp files this cycle created; they are not part of the cycle's commit
  - the check: `git status` shows nothing of this cycle's scratch (the committed files are in the commit)
- gives: the workspace without this cycle's scratch files

## How not to do this

- Do not run the plan's checks again: the acceptance ran them, and the merge gate held. The owner's verification is of the Unit's function, and it goes in `## Verified`
- Do not fix a hole silently, and do not write the fix into `DEFINITION.md` or a plan
- Do not leave a leftover without a line in the `Triage`: the cycle closes only when every one of them has a destination and every `ex-` plan has merged
- Do not skip the resolved exclusion: what the wording shows is already closed is deleted by the agent, and re-filtered after every rerun of the script
