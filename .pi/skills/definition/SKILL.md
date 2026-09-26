---
name: definition
description: Use when a cycle starts or closes. Writes the definition, and freezes it by a commit.
---

# definition

A cycle is one definition. Its frame is decided in a dialogue with the owner.

The cycle's work is derived from that frame.

The shape of the file and its field rules are in `references/format.md`.

Read that before writing anything.

## Steps

1. **`Type`.** The owner starts: one line, what this is
   - the agent does not invent it, and does not move on until the owner has said it
2. **`Who`.** The agent proposes the actors, picked from the list in `references/format.md`
   - when nothing fits, propose an addition
   - the owner decides who is in
3. **`Does` and `Needs`.** For each actor: the agent proposes, the owner decides
4. **`Carry over`.** Read the previous cycle's `Retro`'s `Carry over` first
   - the previous cycle is the folder before this one: `cycles/<NNN-1>/definition.md`
   - one line at a time:
   - it is about this cycle's subject — it is material for the units
   - it is for another subject — it is a candidate for the copy in step 6
   - it is not a hole — it is done
5. **`What to build`.** Derive the units from the frame, with the owner:
   - count what the product does, from the `Who`'s side
   - `Now`: the state today, the carried lines that landed here among them
   - `Then`: the ideal
   - a carried line no unit covers: a unit of its own, back to the top of this step
   - a unit the frame cannot explain: a hole, back to step 1
6. **`Carry over`, written.** Now that the units exist:
   - the lines no unit took are copied into `## Carry over`, as they were written
   - a line a unit took is not copied
7. **Read it against `references/format.md`**, once, before anyone else sees it
8. **The `review` child**, with the checklist below
   - fix what comes back, repeat until it is clean, and cap it at three rounds
9. **The owner.** Start with `What to build`, the part they have not seen
   - a correction that moves the frame sends you back to step 1
10. **Commit.** The commit is the freeze mark, and this definition is not edited afterwards

Bring a recommended answer to every question.

The owner corrects a position faster than they fill a blank.

Ask only what changes the file; a fact the repository holds is looked up, not asked.

`Who` decides the rest: the units are written from those sides.

Each unit's `Actor` is one of them.

## The file

`cycles/<NNN-YYYY-MM-DD>/definition.md`, following `references/format.md`.

- Write a field only when it can be derived from the repository
  - or when it is a proposal the owner can correct

## The review's checklist

The `review` child of step 8 gets this, and nothing else:

- the sections are there
  - an empty field keeps its name, and nothing is written into it that was not decided
- `Type` is the owner's line; every `Who` is from the list, and has `Does` and `Needs`
- every unit is written from one of the `Who`'s sides, and its `Actor` is one of them
  - it is the smallest thing the `Who` can use
- every open line of the previous `Carry over` is copied, stands alone, and keeps its `From:`
  - a line this cycle resolved is not copied
- labels are English, and the content is Japanese

Report findings only, each with its line, marked blocking or not.

## What is frozen

- **The definition** — freezes at the commit that agrees it, and is never edited
  - `Stack` and `Retro` are written into it later, and the next cycle writes a new one
- **The plan** — freezes at the commit that agrees it, and is not reopened
  - a change is recorded in the ticket that hit it
- **The tickets** — freeze at the commit that agrees them
  - revised only before that step starts, with the reason and the owner's agreement
- **The skills, the code** — nothing. Never frozen: fix before the next use

## How not to write this

- Do not invent the `Type`; it is the owner's line
- Do not write a unit the frame cannot explain
