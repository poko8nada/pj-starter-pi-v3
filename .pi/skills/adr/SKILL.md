---
name: adr
description: Use when the owner declares a cycle start, or raises a point about the definition or the cycle. It writes `cycles/<YYMMDD>-<NNN>-<slug>/adr.md` and decides what the cycle does to `DEFINITION.md`.
---

# adr

One cycle has one ADR: `cycles/<YYMMDD>-<NNN>-<slug>/adr.md`. It is where the cycle's decisions about `DEFINITION.md` are made and left.

The ADR decides what the picture becomes, and a plan writes it. The design, the plan and the work are written from `DEFINITION.md`, and none of them argues.

## Files

- `cycles/<YYMMDD>-<NNN>-<slug>/adr.md` — the record, in the shape `references/format.md` gives. Read that file before writing.
- `DEFINITION.md` — the product's picture. The entry names the lines of it that move; a plan writes them.
- `definition/rules.md` — what may be a Unit, and how a Unit is named and written. Read it before deciding an entry's change.
- `definition/format.md` — the shape of the picture.

## Cycle

- owner declares the cycle, and says what it is for
- cycle's questions are the entries, and one entry is one question
- each entry runs the flow below, in order
- when every entry is decided, entries are read together, and the change to the picture is settled

## One entry

### 1. Context — the interview

- ask the owner what is happening and what they want, and write the answers down as the entry's `Context`
- organize them: what the question is, what is given, and what is not
- exchange itself is not recorded, and only organized context stays

### 2. Options — the research

- put out options that could answer the context
- drop the ones that cannot work in this setting, and say why
- weigh the rest: what each buys, and what each costs
- write them in `Options`, each with the reason it stands or falls
- pick is not made here, and the owner makes it at the decision, with the `Status`

When facts are missing, run a `research` subagent with the type that fits. The type sets the questions:

- `triage` — a defect or a limitation: is it common, and is there a remedy in this setting
- `compare` — a choice: what are the candidates, what does each buy and cost, and does it clash with the `Ground`
- `mechanism` — a way of doing it: what does the tool offer, and what are its limits

Keep sources and queries the subagent used, and carry them into `Research & Trial`.

### 3. Trial — when it needs hands

A `trial` subagent runs in a worktree, because the `trial` role writes. The task carries the candidate and its setting, and the subagent installs it, sets it up, and reports clashes, versions and the smallest working shape. Ask the owner before it touches the shared store.

A `Stack` change is worth a trial.

**Nothing a trial writes enters the product.** The trial is a bench, and what it leaves is the fact. The product changes through the design, the plan and the work, and nowhere else.

### 4. Definition change

For the option on the table, look at `DEFINITION.md` as a whole, and decide every line it would move: the name, the operation, and the new line.

- a line that changes carries its new content
- a Unit that moves with its line standing carries the name and the operation, and no value
- a Unit that `definition/rules.md` does not allow is not a Unit
- this is what the owner weighs at the decision: the option, and what it does to the picture

### 5. Decision

The owner's answer is the decision, and nothing else records it. Write the `Status` — `accepted` or `rejected` — and put a rejection's reason on the same line.

- the option that is adopted moves from `Options` to `Adopted`
- the rest keep the reason each was not taken, and a rejected entry adopts nothing, so `Adopted` stays empty

## Entries, together

When every entry is decided, read them together: the names they write, and the lines they move.

Two entries that touch the same name must not contradict, and a contradiction is settled here with the owner.

## What comes after an entry

An entry decided here is not work done: the design cuts it, the plan writes it, and the work carries it out.

This skill keeps its own business — entry, research, trial and decision — and does not do theirs.

## How not to write this

- Do not write the work here: files, steps and checks belong to the plan
- Do not put two questions in one entry
- Do not leave an entry undecided: a cycle decides every entry it raises
- Do not write the picture here: the entries decide it, and a plan writes it
