---
name: adr
description: Use when the owner raises a point about the definition or the cycle, or when a question comes from `brief` with its options laid out. It writes `cycles/<YYMMDD>-<NNN>-<slug>/adr.md` and records the owner's decision on what the cycle does to `DEFINITION.md`.
---

# adr

One cycle has one ADR: `cycles/<YYMMDD>-<NNN>-<slug>/adr.md`. It is where the cycle's decisions about `DEFINITION.md` are recorded and left.

The ADR records the owner's decision on what the picture becomes, and a plan writes it. The design, the plan and the work are written from `DEFINITION.md`, and none of them argues.

## Files

- `cycles/<YYMMDD>-<NNN>-<slug>/adr.md` — the record, in the shape `references/format.md` gives. Read that file before writing.
- `DEFINITION.md` — the product's picture. The entry names the parts of it it relates to, and what happens to each; a plan writes them.
- `rules/definition.rules.md` — what may be a Unit, and how a Unit is named and written. Read it before deciding an entry's change.
- `rules/definition.format.md` — the shape of the picture.

## Cycle

- the question comes from the front: `brief` has settled it, and its options are on the table — or from a point the owner raises (step 2), whose options are laid out here
- run the scaffold: `node .pi/skills/adr/scripts/scaffold.mjs`. It takes the cycle number from `cycles/` and `cycles/archive/`, the date from today, and the slug from the branch, and writes `cycles/<YYMMDD>-<NNN>-<slug>/adr.md` with one entry's bones. It prints the directory it made
- cycle's questions are the entries, and one entry is one question
- each entry runs the flow below, in order
- when every entry is decided, entries are read together, and the change to the picture is settled

## One entry

### 1. Fill

- the scaffold leaves one entry's bones. Fill what the front left: the entry's question, its `Context`, the `Scope` the front agreed, and the `Options` it laid out
- for a point the owner raises, settle the `Scope` with the owner: every kind, in or out, and the reason an `out` carries
- a cycle raises several questions: add an entry per question, from the same bones
- what is still missing is asked of the front, or of the owner for a point the owner raises

### 2. Context — where the front left it, or where the owner raised it

- the front's record is what goes into `Context`: what was asked, what was found, and what is not known
- organize it: what the question is, what is given, and what is not
- the question is not argued again here: the talk is the front's work
- a point raised without a front is written down as the owner said it, and organized here

### 3. Options

- the options come from the front, and they are written here as the front laid them out: what each buys, what each costs, and the reason it stands or falls
- for a point the owner raises, the options are laid out here, and the owner confirms them
- a dropped option keeps the line that says why
- pick is not made here, and the owner makes it at the decision, with the `Status`

### 4. Research & Trial — the ground of the decision

- what is written here is only the fact the decision rests on, with its source
- what the front looked up is not carried here: the front holds it, and only the fact the decision stands on comes over
- a fact that is still missing goes back to the front: it is looked up there, and not here

### 5. Decision

The owner's answer is the decision, and nothing else records it. Write the `Status` — `accepted` or `rejected` — and put a rejection's reason on the same line.

- the option that is adopted moves from `Options` to `Adopted`
- the rest keep the reason each was not taken, and a rejected entry adopts nothing, so `Adopted` stays empty

### 6. Definition

For the adopted option, look at `DEFINITION.md` as a whole, and name the parts it relates to: `Unit`, `Who`, `Stack`, `What`.

- each part carries one of four operations: `(added)`, `(updated)`, `(dropped)`, `(kept)`
- `(kept)` carries the reason the part stands: its main function is the same, and what changed is the route or the check that holds it up
- the parts are named, not summarised: a part left unnamed is a part the entry did not weigh
- a Unit that `rules/definition.rules.md` does not allow is not a Unit
- this is the record of what the adopted option does to the picture
- a rejected entry adopts nothing: its `Definition` carries only `(kept)` for the parts that stand, or `なし（採らなかった）`

## Entries, together

When every entry is decided, read them together: the names they write, and the lines they move.

Two entries that touch the same name must not contradict, and a contradiction is settled here with the owner.

## Proofread

Before the owner reads `adr.md`, it goes through one proofread.

- the document: `cycles/<YYMMDD>-<NNN>-<slug>/adr.md`
- run one `proofreader` subagent, and name that file in the task
- read its report and `git diff` of the file
- if a decision, a reason, a number, a name or a `Scope` line changed meaning, or a section or field name moved, put the file back to `references/format.md`'s shape, in your own words
- say in your report to the owner what you repaired: `fixed: <what>`, or `left: <why>`
- one round: the repaired file does not go through the subagent again

## What comes after an entry

An entry decided here is not work done: the design cuts it, the plan writes it, and the work carries it out.

This skill keeps its own business — the entry and the decision — and does not do theirs.

## How not to write this

- Do not write the work here: files, steps and checks belong to the plan
- Do not put two questions in one entry
- Do not leave an entry undecided: a cycle decides every entry it raises
- Do not write the picture here: the entries decide it, and a plan writes it
