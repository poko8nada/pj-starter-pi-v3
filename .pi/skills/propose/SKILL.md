---
name: propose
description: Use when the owner asks what to do next. It reads the definition, the leftovers and the code, and lays the candidate work out, each with the Unit it would move.
---

# propose

This is one of the two fronts of the ADR. The candidate work is laid out: what is left over, what is missing, what is no longer wanted. The ADR writes the chosen one down and decides.

Texts handed to subagents are in `references/tasks.md`.

## The three questions

A run asks all three, in one sitting. The weight of a run is not a reason to leave one out.

- what is left over — the leftovers of the past cycles
- what is missing — the Units the product should have and does not
- what is no longer wanted — the Units that stand and should not, or that should be one

Where each answer comes from:

- the leftovers — the `Triage` of `close.md` with its `proposed` lines, and the `rejected` entries of the archived ADRs
- the missing — every line of `DEFINITION.md`, and the `Needs` of each `Who`
- the surplus — every line of `DEFINITION.md`, read against `definition/rules.md`

## Procedure

### 1. Explore the code

- the work starts here: read the code, the tests and what runs, so that a candidate comes from what the product is
- the three questions are answered from that reading and from the records

### 2. Look it up, beside the exploration

- a `research` subagent runs beside the exploration; the approval is not asked, because the exploration sets what is worth asking
- the source is read in the exploration itself, and the subagent takes the official information and the shape it is actually used in
- the question is one of two: `compare` — what ways are there at all, and what does each buy and cost; `mechanism` and `triage` — does it hold here, and what are its limits
- the `compare` question is asked when what the product could do is not visible yet, and not otherwise

### 3. Lay the candidates out

- each candidate says why now, which Unit moves, and the ground it stands on
- two to four of them, and one of them is recommended
- a candidate is a piece of work, not a decision
- the candidates are laid out, not decided: the ADR decides
- which candidate opens a cycle is the owner's call

### 4. Stop

- the work stops here: the owner opens the cycle, and the ADR decides

## The end

The work ends when four things hold. None of them is the number of the candidates.

- the candidates worth keeping are on the table, each with the Unit it would move
- `Context` can be written
- `Options` can be written
- the fact the decision rests on is in hand, and can be written into `Research & Trial`

The candidates are laid out, not decided: the ADR decides.

## How not to do this

- Do not run one question: the three are one sitting
- Do not start from the records alone: the code is read first
- Do not ask for approval before the research: the exploration sets its scope
- Do not write `DEFINITION.md` or `cycles/`: the ADR decides, and a plan writes
- Do not decide: the owner opens the cycle, and the ADR decides
