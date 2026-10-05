---
name: adr
description: Use when the work meets a choice that is expensive to undo, that changes what the product promises, or that costs the owner something. It writes the entry, researches it, and decides.
---

# adr

One cycle has one ADR: `cycles/<NNN-YYYY-MM-DD>/adr.md`. It is where a decision is made and left.

The other md are written from what is decided here. The definition says what the product is, the design says the cut, and the plan says the work; none of them argues. The argument lives in the ADR.

**A point does not wait for a stage.** The ADR fires from wherever the work is — the definition, the design, the plan, the work, or the close.

## The file

`cycles/<NNN-YYYY-MM-DD>/adr.md`, in the shape `references/format.md` gives.

Read that file before writing. It holds the tree, the parts, the research types, and the trial.

## What needs an entry

- **expensive to undo** — a data shape, a public name, a file or folder layout, a dependency, an interface with the outside
- **the product's promise changes** — a line of the definition's `Users can do`; not the code inside
- **the product's behavior changes** — what it can do, or what a person sees while it does it
- **the owner pays** — a new dependency, a service, a licence, a running cost, a migration
- **a reversal** — something already accepted, now to be changed
- **the owner's call** — the product's direction (what to build, what to drop), a trade-off the owner lives with

The stage keeps its own business: a name, a local order, where a file goes, the shape of a private function, a test case.

## Procedure

### 1. Take the point

One entry, one point. Place it in the tree: the `##` is where the thing lives (`Product`, a unit, `Stack`), and the `###` is the name the definition gives it (`Who`, `.worktree`, `Product`).

A new cycle's first points are the previous `close.md`'s `Triage` lines that go to `proposed`: read that file, and place each as an entry with `Decision: proposed`. Their origin is that close, and that close did no research for them.

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

### 6. Decide

The owner's answer is the decision, and nothing else records it. Write `5. Decision:` — `accepted` or `rejected` — and put the accepted result into the md it belongs to.

### A change after this

A new entry. The older one stays as it was written; the record adds up.

## How not to write this

- Do not decide alone: the direction, a cost or a long-lived trade-off is the owner's call
- Do not leave the decision empty: an entry raised in this cycle is decided in this cycle (`proposed` is what a `close` leaves for the next cycle)
- Do not write the work here: the ADR argues, it does not do
