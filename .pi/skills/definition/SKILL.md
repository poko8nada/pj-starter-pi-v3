---
name: definition
description: Use when a cycle starts or closes. Writes the definition. The frame in a dialogue with the owner, then the cycle's units, and freezes it by a commit.
---

# definition

A cycle is one definition. Its frame is decided in a dialogue with the owner; the cycle's own work is derived from it. The shape of the file and its field rules are in `references/format.md` (relative to this file). Read that before writing anything.

## Steps

1. **`Type`.** The owner starts: one line, what this is. The agent does not invent it, and does not move on until the owner has said it
2. **`Who`.** The agent asks the owner, then proposes the actors, picked from the list in `references/format.md`; when nothing fits, propose an addition. The owner decides who is in
3. **`Does` and `Needs`.** For each actor: the agent proposes, the owner decides
4. **`What to build`.** The agent derives the units and brings them as a proposal. Then, with the owner, each unit's `Now` and `Then`. This step is where they are discussed: not earlier, and not by the agent alone. A unit the frame cannot explain is a hole: go back to the frame
5. **`Carry over`.** One line per line of the previous definition's `Carry over`, each with the place that took it, or a refusal with its reason. A line that lands nowhere is a hole. Ask the owner about anything that needs deciding
6. **Read it against `references/format.md`**, once, before anyone else sees it
7. **The `review` child**, with the checklist below. Fix what comes back, repeat until it is clean, and cap it at three rounds
8. **The owner.** Start with `What to build`, the part they have not seen. A correction that moves the frame sends you back to step 1
9. **Commit.** The commit is the freeze mark, and this definition is not edited afterwards

Bring a recommended answer to every question: the owner corrects a position faster than they fill a blank. Ask only what changes the file; a fact the repository holds is looked up, not asked.

`Who` decides the rest: the units are written from those sides, and each unit's `Actor` is one of them.

## The file

`cycles/<NNN-YYYY-MM-DD>/definition.md`, following `references/format.md`.

- Write a field only when it can be derived from the repository, or when it is a proposal the owner can correct

## The review's checklist

The `review` child of step 7 gets this, and nothing else:

- the sections are there; an empty field keeps its name, and nothing is written into it that was not decided
- `Type` is the owner's line; every `Who` is from the list, and has `Does` and `Needs`
- every unit is written from one of the `Who`'s sides, its `Actor` is one of them, and it is the smallest thing that `Who` can use
- every line of the previous `Carry over` lands somewhere, or is refused with its reason
- labels are English, and the content is Japanese

Report findings only, each with its line, marked blocking or not.

## Closing the previous cycle

Close it in its own file, and never touch that file again for anything else:

- write `Retro`: `Good`, `Bad`, and `Carry over`. The carry-over holds every hole the closed cycle's tickets left unresolved — every `Findings` line, and any `Unplanned` line its step did not fix — copied as it was written
- put it to the owner: they are the only one who can judge `Good` and `Bad`, and the last check that `Carry over` has no gaps
- when they say yes, commit. That commit closes the cycle

## What is frozen

| What                 | Freezes at                  | How it changes after that                                                                                                             |
| -------------------- | --------------------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| the definition       | the commit that agrees it   | never edited. `Stack` and `Retro` are written into it later, and the next cycle writes a new one                                      |
| the plan             | the commit that agrees it   | not reopened. A change is recorded in the ticket that hit it                                                                          |
| the tickets          | the commit that agrees them | revised only before that step starts, with the previous step's `Notes` or the owner's remark as the reason, and the owner's agreement |
| the skills, the code | nothing                     | never frozen. Fix before the next use                                                                                                 |

## How not to write this

- Do not invent the `Type`; it is the owner's line
- Do not fill a field you cannot write. Leave the name and move on: a field filled without a decision is worse than an empty one
- Do not write a unit the frame cannot explain
- Do not put the order of work in the definition (that is the plan's job), and not error paths (those are the tests')
- Do not update a written definition; the next cycle writes a new one
