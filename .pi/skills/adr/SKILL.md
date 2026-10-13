---
name: adr
description: Use when the owner declares a cycle start, or raises a point about the definition or the cycle. It writes `cycles/<YYMMDD>-<NNN>-<slug>/adr.md`, decides what the cycle does to `DEFINITION.md`, and writes the picture from it.
---

# adr

One cycle has one ADR: `cycles/<YYMMDD>-<NNN>-<slug>/adr.md`. It is where the cycle's decisions about `DEFINITION.md` are made and left.

The ADR decides, and the picture is written from what it decided. The design, the plan and the work are written from `DEFINITION.md`, and none of them argues.

## The files

- `cycles/<YYMMDD>-<NNN>-<slug>/adr.md` — the record, in the shape `references/format.md` gives. Read that file before writing.
- `DEFINITION.md` — the product's picture. The entry names the parts of it that move, and the picture is written from them.
- `definition/rules.md` — what may be a part, and how a part is named and written. Read it before deciding an entry's change.
- `definition/format.md` — the shape of the picture.

## The cycle

- the owner declares the cycle, and says what it is for
- the cycle's questions are the entries, and one entry is one question
- each entry runs the flow below, in order
- when every entry is decided, the entries are read together, and the picture is written

## One entry

### 1. The context — the interview

- ask the owner what is happening and what they want, and write the answers down as the entry's `Context`
- organize them: what the question is, what is given, and what is not
- the exchange itself is not recorded, and only the organized context stays

### 2. The options — the research

- put out the options that could answer the context
- drop the ones that cannot work in this setting, and say why
- weigh the rest: what each buys, and what each costs
- write them in `Options`, each with the reason it stands or falls
- the pick is not made here, and the owner makes it at the decision, with the `Status`

When the facts are missing, run a `research` child with the type that fits. The type sets the questions:

- `triage` — a defect or a limitation: is it common, and is there a remedy in this setting
- `compare` — a choice: what are the candidates, what does each buy and cost, and does it clash with the `Ground`
- `mechanism` — a way of doing it: what does the tool offer, and what are its limits

Keep the sources and the queries the child used, and carry them into `Research & Trial`.

### 3. The trial — when it needs hands

A `trial` child runs in a worktree, because the `trial` role writes. The task carries the candidate and its setting, and the child installs it, sets it up, and reports the clashes, the versions and the smallest working shape. Ask the owner before it touches the shared store.

A `Stack` change is worth a trial.

**Nothing a trial writes enters the product.** The trial is a bench, and what it leaves is the fact. The product changes through the design, the plan and the work, and nowhere else.

### 4. The definition change

For the option on the table, look at `DEFINITION.md` as a whole, and decide every line it would move: the part's name, the operation, and the new line.

- a line that changes carries its new content
- a part that moves with its line standing carries the name and the operation, and no value
- a part that `definition/rules.md` does not allow is not a part
- this is what the owner weighs at the decision: the option, and what it does to the picture

### 5. The decision

The owner's answer is the decision, and nothing else records it. Write the `Status` — `accepted` or `rejected` — and put a rejection's reason on the same line.

- the option that is adopted moves from `Options` to `Adopted`
- the rest keep the reason each was not taken, and a rejected entry adopts nothing, so `Adopted` stays empty

Then write `DEFINITION.md` from the `Definition Change`. This is the only path that moves the picture.

## The entries, together

When every entry is decided, read them together: the parts they name, and the lines they move.

Two entries that touch the same part must not contradict, and a contradiction is settled here with the owner.

## What comes after an entry

An entry decided here is not work done: the design cuts it, the plan writes it, and the work carries it out.

This skill keeps its own business — the entry, the research, the trial, the decision, and the picture — and does not do theirs.

## How not to write this

- Do not write the work here: the files, the steps and the checks belong to the plan
- Do not put two questions in one entry
- Do not leave an entry undecided: a cycle decides every entry it raises
- Do not write `DEFINITION.md` from anywhere but the entries
