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

1. **The frame, and whether it moves.** Ask the owner first: do `Type` and `Who` change from the last cycle?
   - a first definition has nothing before it: it starts from `Type`
   - the `Type` is the owner's line, one line, what this is
   - the agent does not invent it, and does not move on until the owner has said it
2. **`Who`.** The agent proposes the actors, picked from the list in `references/format.md`
   - when nothing fits, propose an addition
   - the owner decides who is in
3. **`Does` and `Needs`.** For each actor: the agent proposes, the owner decides
4. **`Carry over`.** Read the previous cycle's `Retro`'s `Carry over` first
   - the previous cycle is the folder before this one: `cycles/<NNN-1>/definition.md`
   - one line at a time:
   - it is about this cycle's subject — it is material for the units
   - it is for another subject — it is a candidate for the copy in step 7
   - it is not a hole — it is done
5. **The previous units.** Read the previous cycle's `What to build` and `What to keep` first: those names are this cycle's starting list
   - `What to build` holds the units that moved; `What to keep` holds the units that stayed
   - a name grows only by an `add`, and shrinks only by a `drop`
   - an `update` keeps the unit's name, and is written `ユニット名.機能`
6. **`What to build` (the draft).** Derive the units from the frame and the previous names, with the owner:
   - count what the product does, from the `Who`'s side
   - `Now`: the state today, the carried lines that landed here among them
   - `Then`: the ideal
   - the `Now` / `Then` of each unit are settled with the owner here, before the review
   - a carried line no unit covers: a unit of its own, back to the top of this step
   - a unit the frame cannot explain: a hole, back to step 1
7. **`Carry over`.** Now that the units exist, read the previous `Retro`'s list against them:
   - a line a unit took is not copied: it is done
   - a line no unit took stays a hole: it is written into this `Retro`'s `Carry over`
8. **Read it against `references/format.md`**, once, before anyone else sees it
9. **The `review` child**, with the checklist below
   - fix what comes back, repeat until it is clean, and cap it at two rounds
10. **After the review: the owner.** Report what came back, with your own opinion, and settle the `Now` / `Then` with them
    - the draft was confirmed in step 6; this is where the review's result is discussed
    - a correction that moves the frame sends you back to step 1
11. **Commit.** The commit is the freeze mark, and this definition is not edited afterwards

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

The `review` child of step 9 gets this checklist, the definition and the previous cycle's definition, and nothing else:

- hand it over with `consult_run{role: 'review', task}`: name those files in the `task`, and paste this checklist into it too — a child does not read the skills, so the parent passes the text. The tool takes no `input`; the `review` role reads, so it runs in the parent's tree with no worktree

- the owner has seen the units and agreed
- every change since the owner's look answers their point
- `Type` is the owner's line, every `Who` is from the list, and every unit is written from one of those sides
  - the names are carried over from the previous `What to build` and `What to keep`
  - a name grows only by an `add`, and shrinks only by a `drop`
- every open line of the previous `Retro`'s `Carry over` is accounted for

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
