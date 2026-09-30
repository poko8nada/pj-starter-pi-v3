---
name: definition
description: Use when a cycle starts, or when a recorded part of the definition is about to change — the frame, a unit in `Users can do`, or the Stack. It writes `cycles/<NNN>/definition.md`, and leaves the discussion behind every decision in the cycle's ADR.
---

# definition

A cycle has one definition. It is the product's picture as this cycle leaves it: what the product is, who uses it, what it can do, and what it stands on.

The definition is the anchor of the cycle. The plan, the tickets and the close read it, and nothing else says what the product is. A reader who wants the whole shape opens this one file.

**The discussion does not happen here.** A point that needs a decision — a fork, a change to the frame or to a unit, or a call only the owner can make — belongs to the cycle's ADR (the `adr` skill). What is decided there comes back and is written here.

## The file

`cycles/<NNN-YYYY-MM-DD>/definition.md`, in the shape `references/format.md` gives.

Read that file before writing. It holds the sections, the marker rules, the `Who` list, and the `Stack`'s roles.

## Procedure

### 1. Read what is behind the cycle

- the last definition, in full: the frame, the `Users can do` map, the Stack
- the last cycle's `Retro`: the holes it left open

### 2. Collect the cycle's points

The owner's request, and the carried holes. A point is a change to a unit, to the frame, or to the Stack — or a question that has to be answered before any of those can be written.

### 3. Decide the points that need a decision

A fork, a change to something already recorded, or the owner's call goes to `adr` — one entry per point. Its `Decision` is where the agreement is recorded; nothing else records it.

### 4. Write the definition

- carry every part that did not move, as it is
- mark what moved: `**add**`, `**update**` or `**drop**`, on the line it belongs to. An unmarked line is a line that did not move
- `Users can do` is the product's capability map, one line per unit, written from the `Who`'s side
- the `Stack` names what the product stands on, by role, `Ground` first

### 5. Show the owner

One file, one picture. They read the whole shape, and answer.

### A change after this

A new `adr` entry records it. The definition is edited to match, and git holds the diff.

## What is not here

| what                                  | where           |
| ------------------------------------- | --------------- |
| the options, the research, the trials | the cycle's ADR |
| the order of the work                 | the plan        |
| the concrete work and the tests       | the tickets     |
| whether the cycle delivered           | the close       |

## How not to write this

- Do not decide policy here: open an `adr` entry, and let the owner answer
- Do not make a unit of internal work (aligning, refactoring, syncing): it is not something the `Who` can use, so it is not a unit
- Do not write the work: this file is the product, not the cycle
