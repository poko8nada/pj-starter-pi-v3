---
name: definition
description: Use when the owner declares a cycle start, or when a recorded part of the definition is about to change — the frame, a unit in `Users can do`, or the Stack. It writes `cycles/<NNN>/definition.md`, and leaves the discussion behind every decision in the cycle's ADR.
---

# definition

A cycle has one definition. It is the product's picture as this cycle leaves it: what the product is, who uses it, what it can do, and what it stands on.

The definition is the anchor of the cycle. The design, the plan and the close read it, and nothing else says what the product is. A reader who wants the whole shape opens this one file.

**The discussion does not happen here.** A point that needs a decision — a fork, a change to the frame or to a unit, or a call only the owner can make — belongs to the cycle's ADR (the `adr` skill). What is decided there comes back and is written here.

## The file

`cycles/<NNN-YYYY-MM-DD>/definition.md`, in the shape `references/format.md` gives.

Read that file before writing. It holds the sections, the marker rules, the `Who` list, and the `Stack`'s roles.

## What goes to adr

### In this cycle

Every part of this file can raise a decision.

- `What` — what the product does is redefined; it becomes another thing
- `Who` — an actor joins or leaves, or one does not fit the list (then the list gains a role)
- `Users can do` — a unit is added or dropped; a unit's capability moves in a way that is expensive to undo; two units would share one name, or one unit would stand for two things
- `Stack` — a runtime, a framework, a library or a deploy with real alternatives; a cost: a licence, a service, a running cost

### The last cycle's close

A point can also come from the last cycle.

- A `proposed` line the last `close` left becomes an entry, and the owner decides it.

## Procedure

### 1. Confirm the trigger and read what is behind the cycle

- scaffold the draft with the script (`.pi/skills/definition/scripts/scaffold.mjs`; the previous definition without markers, the format for the first cycle), and set the `# Definition <NNN>` heading
- the last definition, in full: the frame, the `Users can do` map, the Stack

### 2. Decide the points that need a decision

Each point in `## What goes to adr` above is one `adr` entry. Its `Decision` is where the agreement is recorded; nothing else records it.

### 3. Write the definition

- carry every part that did not move, as it is
- mark what moved: `**add**`, `**update**` or `**drop**`, on the line it belongs to. An unmarked line is a line that did not move
- `Users can do` is the product's capability map, one line per unit, written from the `Who`'s side
- the `Stack` names what the product stands on, by role, `Ground` first

### 4. Show the owner

One file, one picture. They read the whole shape, and answer.

### A change after this

A new `adr` entry records it. The definition is edited to match, and git holds the diff.

## What is not here

| what                                                 | where           |
| ---------------------------------------------------- | --------------- |
| the options, the research, the trials                | the cycle's ADR |
| the cut into plans and the order                     | the design      |
| the files, the dependencies, the types and the steps | the plan        |
| whether the cycle delivered                          | the close       |

## How not to write this

- Do not make a unit of internal work (aligning, refactoring, syncing): it is not something the `Who` can use, so it is not a unit
- Do not write the work: this file is the product, not the cycle
