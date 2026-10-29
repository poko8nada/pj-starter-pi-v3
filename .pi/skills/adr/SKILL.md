---
name: adr
description: Use when the owner starts a cycle or raises a point about the definition or the cycle. It settles the intent, the roadmap item and the entries, and writes `cycles/<YYMMDD>-<NNN>-<slug>/adr.md`, recording the owner's decision on what the cycle does to `DEFINITION.md`.
---

# adr

One cycle has one ADR: `cycles/<YYMMDD>-<NNN>-<slug>/adr.md`. It is where the cycle's decisions about `DEFINITION.md` are recorded and left.

The ADR records the owner's decision on what the picture becomes, and a plan writes it. The design, the plan and the work are written from `DEFINITION.md`, and none of them argues.

The procedure has two stages. The cycle stage settles the intent, the roadmap item and the entries. The entry stage runs once per entry: the scope, the research, the options, the decision and the write.

## Files

- `cycles/<YYMMDD>-<NNN>-<slug>/adr.md` — the record, in the shape `references/format.md` gives. Read that file before writing.
- `DEFINITION.md` — the product's picture. The entry names the parts of it it relates to, and what happens to each; a plan writes them.
- `rules/definition.rules.md` — what may be a Unit, and how a Unit is named and written. Read it before deciding an entry's change.
- `rules/definition.format.md` — the shape of the picture.
- `rules/roadmap.md` — the shape and the rules of `ROADMAP.md`. Read it before choosing an item.
- `ROADMAP.md` — the items the cycle chooses from, in the shape `rules/roadmap.md` gives.
- `references/tasks.md` — the texts handed to the `research` and `trial` subagents.

The entry's question, the intent and the split are the owner's. The procedure writes them down, and the owner's answer is the decision.

## Cycle

### 1. Intent

- write what you understood first, and let the owner correct it
- repeat it until no point is left in dispute
- the intent is the measure of all that follows: an option is worth weighing only against it
- do not start the research from the declaration alone: the target would be wrong

### 2. Roadmap

- after the intent is settled, ask which item of `ROADMAP.md` the cycle fits
- an item whose `status` is `todo` or `wip` is a candidate; a `done` item is not
- when one fits, set its `status` to `wip`, with the owner's agreement first
- when none fits, show the owner the item as you would write it, and add it to `ROADMAP.md` when they agree
- the shape and the rules of the file are in `rules/roadmap.md`

### 3. Entries

- split the cycle into entries: one entry is one question
- show the owner the split and each entry's intent before any entry's scope is written
- the owner's answer is the split; a rejected split is rewritten and shown again. A new entry found while an entry runs is shown to the owner first, and added after their answer.
- run the scaffold: `node .pi/skills/adr/scripts/scaffold.mjs`. It writes a new cycle's `adr.md` with one entry's bones; on an open cycle it appends the next entry's bones. It prints the path it wrote
- when every entry is decided, the entries are read together, and the change to the picture is settled

## One entry

The entry stage runs once per entry, in the order the split gave.

An entry after the first starts with the scaffold: it appends the entry's bones (`## NN:`), and the number is the next after the existing headings. The bones are filled at step 6.

### 1. Scope

- write your reading of the entry's scope first: every kind, one by one, in or out
- the change: behaviour, refactor, dependency, naming, format, prose
- the quality: speed, security, compatibility, errors
- the operation: deploy, migration, logs and monitoring
- an `out` kind carries its reason; a revisit condition goes on the kind that needs one
- the depth of an `out` kind — out of this cycle, out for now, out — is chosen here
- the owner corrects the list, and the entry's `Scope` takes it
- the scope is of this entry, not of the cycle: the other entries' scope is theirs

### 2. Research

- what must be known follows from the entry's intent, and each type answers its own question: the official information and the source answer whether it can be built here and whether it fits the use, and the shape it is actually used in answers how it is held up where it is already done
- the question is one of two: `compare` — what ways are there at all for this kind of problem, and what does each buy and cost; `mechanism` and `triage` — does this candidate hold here, and what are its limits
- the `compare` question is asked when the ways are not visible yet, and not otherwise
- propose the type and the question together, and say what the answer would decide
- a `research` subagent runs it, and the research runs once the owner approves
- look up what the owner approved, and nothing else
- the facts come back with their source; a question nobody could answer comes back as a fact too, with what it is holding up
- a fact that is still missing stops the entry: it is looked up here, not in the decision

### 3. Options

- an option is a way the entry's intent is met, standing on what came back; it is not a list of what is possible
- two to four of them, each with what it buys, what it costs, and where it may not hold
- where the holding point is a fact nobody has, the trial or the drop is what answers it
- a trial runs only with the owner's agreement, and the agreement is asked before it starts, in every case
- the trial is run on that option alone: on the `Stack`, or on what can be checked on the spot
- a `trial` subagent runs it in a worktree, because the `trial` role writes
- ask the owner before it touches the shared store
- the trial is the bench, and nothing it writes enters the product

### 4. Discussion

- put them in front of the owner, and hear what each one means for the entry's intent
- expect the talk to change them: an option may be sharpened, split or dropped here
- drop the ones that cannot work in this setting, with the line that says why
- an option left standing keeps its line, and the entry's `Options` carries it

### 5. Decision

- the owner's answer is the decision, and nothing else records it
- the option that is adopted moves from `Options` to `Adopted`
- the rest keep the reason each was not taken, and a rejected entry adopts nothing, so `Adopted` stays empty

### 6. Write

- write the entry into `adr.md`: the `Context`, the `Scope`, the `Research & Trial`, the `Decision` and the `Definition`
- the entry's question is in its heading, and the number runs from `01`
- the parts of `DEFINITION.md` the entry relates to: `Unit`, `Who`, `Stack`, `What`
- each part carries one of four operations: `(added)`, `(updated)`, `(dropped)`, `(kept)`
- `(kept)` carries the reason the part stands: its main function is the same, and what changed is the route or the check that holds it up
- the parts are named, not summarised: a part left unnamed is a part the entry did not weigh
- a Unit that `rules/definition.rules.md` does not allow is not a Unit
- a rejected entry adopts nothing: its `Definition` carries only `(kept)` for the parts that stand, or `なし（採らなかった）`

## Entries, together

- when every entry is decided, read them together: the names they write, and the lines they move
- two entries that touch the same name must not contradict, and a contradiction is settled here with the owner

## Proofread

After the write of an entry, run one `proofreader` subagent with `adr.md` and `adr/references/format.md`; the role's policy applies; edit only the named files, and only this entry's lines.

- read its report and `git diff` of the file
- if a decision, a reason, a number, a name or a `Scope` line changed meaning, or a section or field name moved, put the file back to `references/format.md`'s shape, in your own words
- if the report changed the meaning of a decision, settle it with the owner again
- say in your report to the owner what you repaired: `fixed: <what>`, or `left: <why>`
- one round: the repaired file does not go through the subagent again
- the next entry's stage goes ahead while the proofread runs; the next entry is written to `adr.md` after the report is read

## What comes after an entry

An entry decided here is not work done: the design cuts it, the plan writes it, and the work carries it out.

This skill keeps its own business — the entry and the decision — and does not do theirs.

## How not to write this

- Do not decide: the ADR starts by writing the options down, and the owner's answer there is the decision
- Do not write the work here: files, steps and checks belong to the plan
- Do not leave an entry undecided: a cycle decides every entry it raises
- Do not write the picture here: the entries decide it, and a plan writes it
- Do not look up before the intent is settled: the target would be wrong, and the time and the money go with it
- Do not put one option on the table: a single option cannot be weighed
- Do not take the count of the options for the end: the end is the laid-out set
- Do not leave the intent in the agent's words: an intent the owner did not correct is a guess
- Do not skip the scope: an option with no edge cannot be weighed
- Do not write an option as a line of `DEFINITION.md`: that is the ADR's work, and it would bend the options to its shape
