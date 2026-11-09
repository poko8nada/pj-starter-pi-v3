---
name: close
description: Use when every plan of a cycle is done or dropped. It collects what the plans left in close.md, proposes their triage, and after the owner's judgement asks the owner to verify each Unit's function.
---

# close

Each plan carries its own acceptance, and every merge runs the whole suite, so the inside of a plan and the combination of them are both looked at.
What no plan looks at is the cycle itself: a change an entry decided that no plan carried, and the holes the plans left behind.
This skill collects the holes, proposes their triage in `close.md`, and closes the cycle. After the owner's judgement on the proposal and its fixes, it asks the owner, Unit by Unit, whether they will verify the function.

## Who decides

View:

| gate                | what it decides                                     | where      |
| ------------------- | --------------------------------------------------- | ---------- |
| the agent's reading | a leftover already closed                           | the chat   |
| the owner's word    | a destination, a grouping, a verification, a status | the chat   |
| the merge           | an `ex-` plan's work                                | the commit |

Note: a step that says "the gate is ..." names one of the three, and does not restate it.

## The leftover's states

View:

| state     | what it means           | what moves it on              |
| --------- | ----------------------- | ----------------------------- |
| collected | put in `## Collected`   | the agent: exclude or propose |
| excluded  | the line is deleted     | nothing: the end              |
| proposed  | `## Triage` holds it    | the owner                     |
| judged    | the owner said yes      | the agent: the plan, or close |
| merged    | the plan's work is in   | nothing: the end              |
| closed    | `dropped`, `_proposed_` | nothing: the end              |

Note: a leftover is in one state at a time. This table is the only place the states are written. Each step names the state it takes and the state it gives.

## Procedure

### 1. Check the trigger

Steps:

1. Read every plan md's `Commit:` and `Stopped`.
2. Treat a plan as done when its `Commit:` is filled and its work is done (work step 9 green).
3. Treat a plan as dropped when the owner dropped it: `Stopped` holds, and nothing merges.

View:

| takes                | gives                     |
| -------------------- | ------------------------- |
| the cycle's plan mds | a cycle the close runs on |

Note: a plan still open is not this close's business.

### 2. Read the cycle

Steps:

1. Read the `accepted` entries and what each `Definition` decides.
2. Read each plan md's `No` and `Boundary Plans`.
3. Read each plan md's `## Acceptance`, `## Work Review` and `## Notes`.
4. List a hole: a change an entry decided that no plan's `Files` carries.

View:

| takes                    | gives                                                                                 |
| ------------------------ | ------------------------------------------------------------------------------------- |
| the ADR and the plan mds | the holes for the collect, and the Units of the accepted entries for the verification |

Note: do not read the cut from memory: the files hold it.

### 3. Collect

Steps:

1. Run `node .pi/skills/close/scripts/collect.mjs cycles/<YYMMDD>-<NNN>-<slug>`; it writes `close.md` and its `## Collected`, and creates the file.
2. Read the heading, the plan id and the line's shape in `references/format.md`.
3. Fill every `未特定` as `references/format.md` says; an `ex-` plan's `No` comes from the Triage.
4. Add the holes from the read as lines by hand, under a heading naming the ADR entry, as `references/format.md` says.
5. Do not copy by hand what the script collects: a line left out is a hole nobody finds again.

View:

| takes        | gives                      |
| ------------ | -------------------------- |
| the plan mds | every leftover `collected` |

Note: do not show `## Collected` to the owner here: the proposal comes first, and they read it at the owner's judgement.

### 4. Exclude what is already resolved

Steps:

1. Read the plan md, the diff and the close context for each `collected` leftover.
2. Delete the line of a leftover the wording shows is already closed.
3. Re-filter after every rerun of `collect.mjs`.

View:

| takes                 | gives                                                      |
| --------------------- | ---------------------------------------------------------- |
| `collected` leftovers | `excluded` for the deleted lines, `collected` for the rest |

Notes:

- The script does not judge this.
- The rerun the `ex-` plans need needs this re-filter too.
- The gate is the agent's reading.

### 5. Propose the triage, in `close.md`

Steps:

1. Write one destination per leftover in `## Triage`, in the order and the shape `references/format.md` gives.
2. Carry `Fact:` / `Why:` / `Then:` under each bullet.
3. Give a leftover that needs facts nobody has to a `research` subagent; the rest get none.
4. Leave an `ex-` destination without a plan name yet: the grouping in the `ex-` plans' step names it, as `references/format.md` says.

View:

| takes                 | gives                         |
| --------------------- | ----------------------------- |
| `collected` leftovers | `proposed` for every leftover |

Notes:

- The task is in the `Look it up` section of `references/tasks.md`.
- Do not triage with the owner line by line before every destination is in `## Triage`.

### 6. Complete `close.md`

Steps:

1. Hold the proposal in `## Triage`.
2. Hold the inventory in `## Collected`.
3. Leave `## Verified` empty.
4. Keep the shape as `references/format.md` gives.

View:

| takes        | gives                    |
| ------------ | ------------------------ |
| the proposal | the completed `close.md` |

Notes:

- An empty `## Verified` is normal here.
- What completes here is the proposal the owner reads: the destinations' confirmation, the `ex-` merges and the verification come after their judgement.

### 7. The owner's judgement

Steps:

1. Explain one leftover at a time in the chat: what it is, which stage it came from and why, what is wrong now, how to fix it, and how wide the fix is; in words that hold without the reference files.
2. Wait for their answer on that one before the next.
3. When the last one is answered, let them read the whole `close.md` as the final check. The final check is on the first pass only (a pass after an `ex-` plan's merge needs the one-at-a-time answers, not the whole read again).

View:

| takes              | gives                       |
| ------------------ | --------------------------- |
| proposed leftovers | `judged` for every leftover |

Notes:

- The destinations are all in `## Triage` already. Do not show `## Collected` to the owner before this point.
- A missing line comes back.
- A rejection sends the agent back to the step it came from: the collect for a collected line, the exclusion for a resolved one, the proposal for a destination, the verification for a Unit.
- The gate is the owner's word.

### 8. Run the `ex-` plans

Steps:

1. Group judged leftovers whose destination is `_ex-plan_` by the files their `## Collected` lines and plan mds name.
2. Say in the chat the round this is, and which `ex-` plans are not merged yet; count the unmerged ones each time from the `## Triage` lines that carry no `done`.
3. Show the owner a table of the plan's name, the leftover numbers, and the files.
4. Write the plan's name into the `## Triage` lines when they agree.
5. Decide their order from the dependencies; each `ex-` plan's `Boundary Plans` names the plans it stands on.
6. Write, research, review, fix, proofread and show each grouped plan by the plan skill, steps 4 to 9: named `ex-<what it fixes>`, with no `No` at the top; its `No` is the `<NN>` of the Triage line's `ADR <NN>`; its Triage line is the only source, and there is no affected for an `ex-` plan.
7. Run its work by the work skill; when its `Place` is worktree, make a worktree.
8. Carry `done <commit>` on its line when it merges.
9. Put its plan md's leftovers back to `collected` when it merges.
10. Go back to step 3 and run the collect, the exclusion, the proposal and the owner's judgement again for them, one leftover at a time.
11. Come back to this step for the next `ex-` plan; an `ex-` born there joins this step's count.
12. Continue the numbers for new `## Triage` lines from the current maximum; a line with `done <commit>` keeps its number.
13. Carry `dropped` and the reason on its line instead of `done <commit>` when the work drops the `ex-` plan.

View:

| takes                                             | gives             |
| ------------------------------------------------- | ----------------- |
| judged leftovers whose destination is `_ex-plan_` | `merged` for each |

Notes:

- The plan skill's cut is replaced here: the close's grouping is the cut.
- Say the unmerged count at every pass through this step.
- The grouping's gate is the owner's word; the merge's gate is the merge.
- The step ends when no `ex-` is left without `done <commit>` or `dropped`, and the owner said so in the chat.

### 9. Japanese Proofread

Steps:

1. Run one `proofreader` subagent with `cycles/<YYMMDD>-<NNN>-<slug>/close.md` for the Japanese proofread of `## Collected` and `## Triage`.
2. Have it read `.pi/skills/close/references/format.md`; the role's policy is in `.pi/extensions/consult/types.json`; it edits only those sections.
3. Read its report and `git diff` after step 10's answers are collected in the chat.
4. Put `## Collected` and `## Triage` back to `references/format.md`'s shape, in your own words, when a line or a destination changed meaning, or a section or field name moved.

View:

| takes                                                                            | gives                   |
| -------------------------------------------------------------------------------- | ----------------------- |
| the completed `close.md` with no `ex-` left without `done <commit>` or `dropped` | the repaired `close.md` |

Notes:

- The verification conversations in step 10 run while it runs; `## Verified` is written after the repair below.
- The wording of a quoted passage is not a change of meaning: keep that correction.
- An empty `## Verified` is normal at the proofread's start and at the repair: do not fill it, and remove what the subagent filled there.
- One round: the repaired file does not go through the subagent again.

### 10. Verify, by Unit

Steps:

1. Take one Unit at a time: propose how to check it — the command to run and what to see, or the place to read and what to look for, and the result that means it works — in words that hold without the reference files.
2. Wait for the owner's answer, and hold it in the chat before the next Unit.
3. Give a Unit whose function does not work an `ex-` plan: write, research, review, fix, proofread and show it by the plan skill, steps 4 to 9, and run it by the work skill.
4. Run this step again for that Unit when it merges; say in the chat which Unit is still open.
5. Write what they answered in `## Verified` after step 9's repair, which sits after `## Triage`.

View:

| takes                                        | gives                                              |
| -------------------------------------------- | -------------------------------------------------- |
| the merged base and the Units read in step 2 | the verified record, with an answer for every Unit |

Notes:

- The Units are as `references/format.md` says: the lines under `Users can do` of the `accepted` entries' `Definition`; of those, the ones this cycle touched — its line or its route — are verified; a `####` heading is not a Unit; `Product` / `What` / `Who` / `Stack` are not Units.
- The check is of the Unit's function, not of the change: the change is what the work looked at.
- A Unit they will not check carries `しない` and the reason on the same line.
- The gate is the owner's word.

### 11. Leftovers

Steps:

1. Run `consult_worktree list` before the roadmap and the commit.
2. Remove what no plan and no line keeps.
3. Put what this step finds that the proposal did not carry back to the proposal, before the roadmap.

View:

| takes         | gives                                  |
| ------------- | -------------------------------------- |
| the worktrees | the worktrees with nothing left behind |

Notes:

- The destinations, their `ex-` plans and the verification run again, and the roadmap is written after them.
- Re-proofread what changed.

### 12. Roadmap

Steps:

1. Write the cycle into `ROADMAP.md`, with their word.
2. Append this cycle's number to the item's `cycles`; keep a number that is already there.
3. Ask the owner whether the item is finished; set its `status` to `done` only on their word, and leave it `wip` when they say it is not, or when they do not say.

View:

| takes                 | gives             |
| --------------------- | ----------------- |
| the owner's judgement | the roadmap's row |

Notes:

- The shape and the rules of the table are in `rules/roadmap.md`.
- The gate is the owner's word.

### 13. Commit

Steps:

1. Commit `close.md` and `ROADMAP.md` in one, with `close: NNN-<suffix>'s close and roadmap`; `<suffix>` is the part right of the number in the cycle folder name, as in work step 2 (`261104-054-dev` gives `dev`).

View:

| takes                       | gives            |
| --------------------------- | ---------------- |
| `close.md` and `ROADMAP.md` | the closed cycle |

Notes:

- The worktrees are clean before it: the worktree step says so.
- The roadmap is written before it: the roadmap step says so.
- Nothing about that cycle is edited afterwards.
- An `ex-` plan and its work are committed at its own merge; this commit does not carry them.

### 14. Clean the workspace

Steps:

1. Delete the `memo-*` and temp files this cycle created.
2. Check `git status` shows nothing of this cycle's scratch.

View:

| takes            | gives                                            |
| ---------------- | ------------------------------------------------ |
| after the commit | the workspace without this cycle's scratch files |

Notes:

- They are not part of the cycle's commit.
- The committed files are in the commit.

## How not to write this

- Do not run the plan's checks again: the acceptance ran them, and the merge gate held. The owner's verification is of the Unit's function, and it goes in `## Verified`
- Do not fix a hole silently, and do not write the fix into `DEFINITION.md` or a plan
- Do not leave a leftover without a line in the `Triage`: the cycle closes only when every one of them has a destination and every `ex-` plan has merged or is dropped
- Do not skip the resolved exclusion: what the wording shows is already closed is deleted by the agent, and re-filtered after every rerun of the script
