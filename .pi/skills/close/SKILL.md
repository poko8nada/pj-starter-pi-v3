---
name: close
description: Use when every plan of a cycle is done or dropped. It collects what the plans left in close.md, proposes their destinations, and after the owner's judgement makes the small changes, verifies each Unit's function, writes the roadmap, and hands the proposed items to the next cycle.
---

# close

Each plan carries its own acceptance, and every merge runs the whole suite, so the inside of a plan and the combination of them are both looked at. What no plan looks at is the cycle itself: a change an entry decided that no plan carried, and the holes the plans left behind.

This skill collects the holes, proposes their destinations in `close.md`, and closes the cycle. After the owner's judgement, it makes each `_ex-change_`, asks the owner to verify each Unit's function, writes the roadmap, and hands the `**proposed**` items to the next cycle's ADR.

## Procedure

### 1. Collect

Steps:

1. Run `node .pi/skills/close/scripts/collect.mjs cycles/<YYMMDD>-<NNN>-<slug>`; it writes `close.md` and its `## Collected`, and creates the file.
2. Read the heading, the plan id and the line's shape in `references/format.md`.
3. Fill every `未特定` as `references/format.md` says.
4. Add the holes from the read as lines by hand, under a heading naming the ADR entry, as `references/format.md` says.
5. Do not copy by hand what the script collects: a line left out is a hole nobody finds again.

View:

| the heading                     | what it holds          |
| ------------------------------- | ---------------------- |
| `### <NN> <plan id> (ADR <NN>)` | the plan's leftovers   |
| `### (ADR <NN>)`                | a hole no plan carries |

Notes:

- The script writes `## Collected`; the agent adds the hole no plan carries.
- Do not show `## Collected` to the owner here: the proposal comes first.

### 2. Exclude what is already resolved

Steps:

1. Read the plan md, the diff and the close context for each collected line.
2. Delete the line the wording shows is already closed.
3. Re-filter after every rerun of `collect.mjs`.

Notes:

- The script does not judge this.
- A line the wording shows is closed is deleted; the rest stays.

### 3. Triage and explain

Steps:

1. Write one destination per leftover in `## Triage`, in the order and the shape `references/format.md` gives.
2. Carry `Fact:` / `Why:` / `Then:` under each line.
3. Give a leftover that needs facts nobody has to a `research` subagent; the task is in the `Look it up` section of `references/tasks.md`.
4. Explain one leftover at a time in the chat: what it is, which stage it came from and why, what is wrong now, how to fix it, and how wide the fix is; in words that hold without the reference files.
5. Wait for their answer on that one before the next.
6. When the last one is answered, let them read the whole `close.md` as the final check.

View:

| destination    | the leftover                                                |
| -------------- | ----------------------------------------------------------- |
| `_ex-change_`  | one code place, one test or documents only, worth doing now |
| `**proposed**` | a possible obvious bug, or a debt that would grow large     |
| `_roadmap_`    | a future consideration                                      |
| `dropped`      | the rest                                                    |

Notes:

- The proposal order is in `references/format.md`.
- The destinations are all in `## Triage` already. Do not show `## Collected` to the owner before this point.
- A missing line comes back.
- A rejection sends the agent back to the step it came from: the collect for a collected line, the exclusion for a resolved one, the proposal for a destination, the verification for a Unit.
- The `dropped` line is explained too: the owner sees why it is dropped.
- The gate is the owner's word.

### 4. Ex-change

Steps:

1. After the owner agrees, take the `_ex-change_` lines one at a time.
2. Make the change in the base, with no plan and no worktree.
3. Commit it as `base(ex-change): <subject>`.
4. Append `: done <commit>` to its `## Triage` line.
5. Go to the next `_ex-change_`; two changes do not share one commit.

Notes:

- The `_ex-change_` is one code place, one test or documents only.
- It is the close's own work; no `code` subagent and no plan.
- The commit is in the base.
- The `## Triage` line carries the `done` hash.

### 5. Japanese Proofread

Steps:

1. Run one `proofreader` subagent with `cycles/<YYMMDD>-<NNN>-<slug>/close.md`.
2. Have it read `.pi/skills/close/references/format.md`; the role's policy is in `.pi/extensions/consult/types.json`; it edits only `## Collected` and `## Triage`.
3. Read its report and `git diff` after the answers of step 4 are in the chat.
4. Put `## Collected` and `## Triage` back to `references/format.md`'s shape, in your own words, when a line or a destination changed meaning, or a section or field name moved.

Notes:

- The verification conversations in step 6 run while it runs; `## Verified` is written after the repair.
- An empty `## Verified` is normal at the proofread's start and at the repair: do not fill it, and remove what the subagent filled there.
- One round: the repaired file does not go through the subagent again.

### 6. Verify, by Unit

Steps:

1. Take one Unit at a time: propose how to check it — the command to run and what to see, or the place to read and what to look for, and the result that means it works — in words that hold without the reference files.
2. Wait for the owner's answer, and hold it in the chat before the next Unit.
3. Give a Unit whose function does not work an `_ex-change_`: make it in the base, commit it as `base(ex-change): <subject>`, and write the commit in `## Verified`'s `Fixed`.
4. Run this step again for that Unit when it is done; say in the chat which Unit is still open.
5. Write what they answered in `## Verified` after step 5's repair, which sits after `## Triage`.

View:

| the Unit                                            | the check                                                               |
| --------------------------------------------------- | ----------------------------------------------------------------------- |
| a line under `Users can do`                         | its function; the acceptance and the merge already looked at the change |
| a `####` heading, `Product`, `What`, `Who`, `Stack` | not a Unit                                                              |

Notes:

- The Units are as `references/format.md` says.
- The check is of the Unit's function, not of the change.
- A Unit they will not check carries `しない` and the reason on the same line.
- The `Fixed` is the `_ex-change_` and the commit.
- The gate is the owner's word.

### 7. Roadmap

Steps:

1. Write the cycle into `ROADMAP.md`, with their word.
2. Append this cycle's number to the item's `cycles`; keep a number that is already there.
3. Ask the owner whether the item is finished; set its `status` to `done` only on their word, and leave it `wip` when they say it is not, or when they do not say.
4. Show the `_roadmap_` lines to the owner; they decide later whether to put them into `ROADMAP.md`. The close writes none of them.

View:

| the item | what changes                     |
| -------- | -------------------------------- |
| `cycles` | this cycle's number              |
| `status` | `done` on their word, else `wip` |

Notes:

- The shape and the rules of the table are in `rules/roadmap.md`.
- The `_roadmap_` lines end in `## Triage`; the close gives them no destination.
- The gate is the owner's word.

### 8. Commit

Steps:

1. Commit `close.md` and `ROADMAP.md` in one, with `close: NNN-<suffix>'s close and roadmap`; `<suffix>` is the part right of the number in the cycle folder name, as in work step 2 (`261104-054-dev` gives `dev`).
2. End here when no `**proposed**` line is left; otherwise go to step 9.

Notes:

- The worktrees are clean: the work skill's merge step removes each plan's worktree.
- The roadmap is written before it: the roadmap step says so.
- An `_ex-change_` and its work are committed at its own commit; this commit does not carry them.
- The `**proposed**` files are after this commit, and are not committed.

### 9. Proposed

Steps:

1. Take the `**proposed**` lines to the next cycle's ADR: omit the intent; first update `ROADMAP.md`; then split the entries; then run the pre-research; then fill each entry's `Context` and `Research & Trial`.
2. Leave the `Scope` empty. Do not commit the next cycle's files.
3. Stop there: another session starts from the next cycle's ADR.

View:

| the next cycle          | what is filled                   |
| ----------------------- | -------------------------------- |
| `ROADMAP.md`            | the proposed items               |
| each entry              | `Context` and `Research & Trial` |
| each `affected/<NN>.md` | the scaffold                     |
| `Scope`                 | empty                            |

Notes:

- The intent is omitted; this is not the normal ADR.
- The next cycle's `adr.md` and `affected/*.md` are written by the adr skill's scaffold and the pre-research.
- The next session starts at the entry's `Scope`.
- The files are not committed.

## How not to write this

- When the owner verifies a Unit: do not run the plan's checks again. The acceptance ran them, and the merge gate held, and the verification is of the Unit's function, in `## Verified`.
- When you find a hole: do not fix it silently, and do not write the fix into `DEFINITION.md` or a plan. It goes in the `## Triage`.
- When you close the cycle: do not leave a leftover without a line in the `## Triage`. The cycle closes only when every one of them has a destination, and every `_ex-change_` line in the `## Triage` has its `done`.
- When you implement an `_ex-change_`: do not batch. One change, one commit, and its `done <commit>`.
- When you write the `**proposed**`: do not fill the `Scope`, and do not commit the next cycle's files. The next session starts there.
- After every rerun of the script: do not skip the resolved exclusion. What the wording shows is already closed is deleted by the agent, and re-filtered.
