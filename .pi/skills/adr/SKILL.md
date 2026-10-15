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
- run the scaffold: `node .pi/skills/adr/scripts/scaffold.mjs`. It takes the cycle number from `cycles/` and `cycles/archive/`, the date from today, and the slug from the branch, and writes `cycles/<YYMMDD>-<NNN>-<slug>/adr.md` with one entry's bones. It prints the directory it made
- cycle's questions are the entries, and one entry is one question
- each entry runs the flow below, in order
- when every entry is decided, entries are read together, and the change to the picture is settled

## One entry

### 1. Fill

- the scaffold leaves one entry's bones. Fill what you can before the talk: the entry's question, what is already known in `Context`, and a first pass at `Options`
- a cycle raises several questions: add an entry per question, from the same bones
- what you cannot fill is what the talk is for

### 2. Context — the talk

- talk with the owner about what is happening and what they want, and write the answers down as the entry's `Context`
- organize them: what the question is, what is given, and what is not
- this talk is required: an entry decided without it is the agent's guess
- exchange itself is not recorded, and only organized context stays

### 3. Options — the talk

- put out options that could answer the context
- drop the ones that cannot work in this setting, and say why
- weigh the rest: what each buys, and what each costs
- write them in `Options`, each with the reason it stands or falls
- pick is not made here, and the owner makes it at the decision, with the `Status`

### 4. Research & Trial — when facts are missing

- after the talk, when a fact is still missing, ask the owner first: a `research` subagent, a `trial` subagent, or neither. Neither is the answer when the options can be weighed without them
- a `research` subagent runs with the type that fits. The type sets the questions:
  - `triage` — a defect or a limitation: is it common, and is there a remedy in this setting
  - `compare` — a choice: what are the candidates, what does each buy and cost, and does it clash with the `Ground`
  - `mechanism` — a way of doing it: what does the tool offer, and what are its limits
- keep sources and queries the subagent used, and carry them into `Research & Trial`
- a `trial` subagent runs in a worktree, because the `trial` role writes. The task carries the candidate and its setting, and the subagent installs it, sets it up, and reports clashes, versions and the smallest working shape. Ask the owner before it touches the shared store
- a `Stack` change is worth a trial
- **Nothing a trial writes enters the product.** The trial is a bench, and what it leaves is the fact. The product changes through the design, the plan and the work, and nowhere else
- what the two leave goes into the entry's `Research & Trial`

### 5. Definition change

For the option on the table, look at `DEFINITION.md` as a whole, and decide every line it would move: the name, the operation, and the new line.

- a line that changes carries its new content
- a Unit that moves with its line standing carries the name and the operation, and no value
- a Unit that `definition/rules.md` does not allow is not a Unit
- this is what the owner weighs at the decision: the option, and what it does to the picture

### 6. Decision

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
