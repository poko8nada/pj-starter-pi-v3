---
name: brief
description: Use when the owner declares a cycle start. It settles the owner's intent, asks which roadmap item the cycle fits, looks up what the approval allows, and lays out the weighed options for the ADR's decision.
---

# brief

This is the front of the ADR. The owner's intent is settled, the facts are gathered, the options are weighed and laid out. The ADR writes them down and decides.

The procedure does not run in a straight line. The intent, the options and the facts go back and forth.

Texts handed to subagents are in `references/tasks.md`.

## The end

The work ends when five things hold. None of them is the number of the options.

- the options worth keeping are on the table, and each one dropped carries the line that says why
- `Context` can be written
- `Options` can be written
- the scope is agreed: what is in, and what is out
- the fact the decision rests on is in hand, and can be written into `Research & Trial`

Several options on the table is not the end.

## Procedure

### 1. Settle the intent

- write what you understood first, and let the owner correct it
- repeat it until no point is left in dispute
- the intent is the measure of all that follows: an option is worth weighing only against it
- do not start the research from the declaration alone: the target would be wrong

### 2. Ask the roadmap

- after the intent is settled, ask which item of `ROADMAP.md` the cycle fits
- an item whose `status` is `todo` or `wip` is a candidate; a `done` item is not
- when one fits, set its `status` to `wip`, with the owner's agreement first
- when none fits, show the owner the item as you would write it, and add it to `ROADMAP.md` when they agree
- the shape and the rules of the file are in `rules/roadmap.md`

### 3. Settle the scope

- once the intent is settled, write your reading of the scope first: every kind, one by one, in or out
- the change: behaviour, refactor, dependency, naming, format, prose
- the quality: speed, security, compatibility, errors
- the operation: deploy, migration, logs and monitoring
- an `out` kind carries its reason; a revisit condition goes on the kind that needs one
- the depth of an `out` kind — out of this cycle, out for now, out — is chosen here
- the owner corrects the list, and the ADR writes it as the entry's `Scope`

### 4. Propose what to look up

- what must be known follows from the intent, and each type answers its own question: the official information and the source answer whether it can be built here and whether it fits the use, and the shape it is actually used in answers how it is held up where it is already done
- the question is one of two: `compare` — what ways are there at all for this kind of problem, and what does each buy and cost; `mechanism` and `triage` — does this candidate hold here, and what are its limits
- the `compare` question is asked when the ways are not visible yet, and not otherwise
- propose the type and the question together, and say what the answer would decide
- a `research` subagent runs it, and the research runs once the owner approves

### 5. Look it up

- look up what the owner approved, and nothing else
- the facts come back with their source
- a question nobody could answer comes back as a fact too, with what it is holding up
- what was found is what an option can rest on, and what is still open is where an option cannot rest yet

### 6. Put the options out

- an option is a way the intent is met, standing on what came back; it is not a list of what is possible
- two to four of them, each with what it buys, what it costs, and where it may not hold
- where the holding point is a fact nobody has, the trial or the drop is what answers it

### 7. Discuss them with the owner

- put them in front of the owner, and hear what each one means for the intent
- expect the talk to change them: an option may be sharpened, split or dropped here
- drop the ones that cannot work in this setting, with the line that says why
- an option left standing keeps its line, and the ADR's `Options` carries it

### 8. Try it, with the owner's agreement

- a trial runs only with the owner's agreement, and the agreement is asked before it starts, in every case
- the trial is run on that option alone: on the `Stack`, or on what can be checked on the spot
- a `trial` subagent runs it in a worktree, because the `trial` role writes
- ask the owner before it touches the shared store
- the trial is the bench, and nothing it writes enters the product

### 9. Stop

- the work stops here: the ADR decides

## How not to do this

- Do not look up before the intent is settled: the target would be wrong, and the time and the money go with it
- Do not put one option on the table: a single option cannot be weighed
- Do not take the count of the options for the end: the end is the laid-out set
- Do not leave the intent in the agent's words: an intent the owner did not correct is a guess
- Do not skip the scope: an option with no edge cannot be weighed
- Do not decide: the ADR starts by writing the options down, and the owner's answer there is the decision
- Do not write an option as a line of `DEFINITION.md`: that is the ADR's work, and it would bend the options to its shape
