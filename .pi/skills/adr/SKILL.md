---
name: adr
description: Use when the definition, the design, the plan or the work meets its handoff condition. It writes the entry, researches it, and decides.
---

# adr

One cycle has one ADR: `cycles/<NNN-YYYY-MM-DD>/adr.md`. It is where a decision is made and left.

The other md are written from what is decided here. The definition says what the product is, the design says the cut, and the plan says the work; none of them argues. The argument lives in the ADR.

**A point comes from a handoff.** The ADR is entered from the definition, the design, the plan or the work, and never on its own.

## The file

`cycles/<NNN-YYYY-MM-DD>/adr.md`, in the shape `references/format.md` gives.

Read that file before writing. It holds the tree, the parts, the research types, and the trial.

## Procedure

### 1. Take the point

The point comes from a handoff. Before writing the entry, present what the definition changes in chat and discuss it.

One entry, one point. Place it in the tree: the `##` is where the thing lives (`Product`, a unit, `Stack`), and the `###` is the name the definition gives it (`Who`, `.worktree`, `Product`).

A point the previous `close` left as `proposed` is placed as an entry: that close did no research for it.

### 2. Write the Agenda

- `Title:` — what is in question, in one line
- `Proposal:` — what the point asks for

### 3. Gather the Highlight

The context the decision rests on: what the work saw, what the discussion settled (the owner's constraint or direction, the reasons that came up), and the options weighed and dropped. The fewest lines that carry it. Nothing that had to be looked up.

### 4. Research

When the decision needs facts nobody has, run a `research` child with the type that fits. The type sets the questions: `triage` for a defect, `compare` for a choice, `mechanism` for a way of doing it. Keep the sources and the queries the child used.

Write `なし` when nothing had to be looked up.

### 5. Trial

When the decision needs hands, run a `trial` child in a worktree. It installs the candidate, configures it, and reports. Ask the owner before it touches the shared store.

Write `なし` when there is nothing to try.

### 6. Probe the holes

Before Decide, pass this ADR (the proposal in `cycles/<NNN>/adr.md`) to a `review` child once, asking for holes in three views: missed considerations, missed research, missed trials. Answer the holes it returns, show both the holes and your answers to the owner, and carry them into the `Highlight` after the owner's opinion. The arrival may come in a later message.

### 7. Decide

The owner's answer is the decision, and nothing else records it. Write `5. Decision:` — `accepted` or `rejected` — and put the accepted result into the definition.

### A change after this

A new entry. The older one stays as it was written; the record adds up.

## How not to write this

- Do not write the work here: the ADR argues, it does not do
