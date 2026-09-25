---
name: definition
description: Use when a cycle starts or closes. Writes the definition. The frame in a dialogue with the owner, then the cycle's units, and freezes it by a commit.
---

# definition

A cycle is one definition. Its frame is decided in a dialogue with the owner; the cycle's own work is derived from it. The shape of the file and its field rules are in `references/format.md` (relative to this file). Read that before writing anything.

## The flow: Type, Who, Does and Needs

The frame is a dialogue. The agent proposes, the owner corrects, and a section is done when the owner stops correcting. One section at a time, in this order.

1. **`Type` — the owner starts.** One line: what this is. The agent does not invent it, and does not move on until the owner has said it
2. **`Who` — the agent proposes, the owner decides.** Ask the owner, then propose the actors, picked from the list in `references/format.md`. When nothing in the list fits, propose an addition. Discussion decides who is in
3. **`Does` and `Needs` — the agent proposes, the owner decides.** For each actor, what they do in the product, and what they need from it

Bring a recommended answer to every question: the owner corrects a position faster than they fill a blank. Ask only what changes the file; a fact the repository holds is looked up, not asked.

`Who` decides the rest: the units are written from those sides, and each unit's `Actor` is one of them.

## The file

`cycles/<NNN-YYYY-MM-DD>/definition.md`, following `references/format.md`.

- `Stack` stays empty until the stack stage fills it, and `Retro` is written when the cycle closes. Everything else is written before the freeze
- Read it against `references/format.md` once, before anyone else sees it

## What to build

The units are a derivation, not a questionnaire: count what the product does, from the `Who`'s side, and bring the result as a proposal. A unit the frame cannot explain is a hole: go back to the frame instead of writing it.

The file also carries the accounting of the previous one: in `Carry over`, one line per line of the previous `Carry over`, each with the place that took it, or a refusal with its reason. A line that lands nowhere is a hole in this definition.

## Review, and the freeze

Before the owner sees it, put the file in front of a `review` child, with this checklist and nothing else:

- Check this definition against the format and against itself:
  - the sections are there, and only `Stack` and `Retro` are empty
  - `Type` is the owner's line; every `Who` is from the list, and has `Does` and `Needs`
  - every unit is written from one of the `Who`'s sides, and its `Actor` is one of them
  - every line of the previous `Carry over` lands somewhere, or is refused with its reason
  - labels are English, and the content is Japanese

Report findings only, each with its line, marked blocking or not. Fix what comes back, repeat until it is clean, and cap it at three rounds. Do not show the file to the owner before that.

Then put it to the owner: start with `What to build`, the part they have not seen. A correction that moves `Type` or `Who` sends you back to the flow; do not patch a unit and leave the frame behind. When they say yes, commit: the commit is the freeze mark, and this definition is not edited afterwards.

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
- Do not write a unit the frame cannot explain
- Do not put the order of work in the definition (that is the plan's job), and not error paths (those are the tests')
- Do not update a written definition; the next cycle writes a new one
