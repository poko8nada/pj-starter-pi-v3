---
name: tickets
description: Use when a plan is approved. One ticket per step, agreed with the owner, and frozen.
---

# tickets

A cycle is one set of tickets.  
The plan says the steps, and the `Verify` types the owner agreed.  
A ticket is one step, and it writes the concrete: what to do, and what to run and look at.  
A unit is one build unit from the definition: the smallest thing a `Who` can use.  
Its steps are its tickets.  
The shape of the file and its field rules are in `references/format.md`.  
Read that before writing anything.

## Steps

1. **Read the plan.** One ticket per step, cut in the plan's order.
   - the tickets of a unit are cut together, and shown as one set
   - a `<unit-id>.refactor` step belongs to the unit in its name
2. **Write the `Acceptance`.** The step's target, from the plan's `What`.
3. **Write the `Todo`.** The concrete work, by artifact.
   - a file the plan's `Files` does not name: stop and show the owner
4. **Write `Verify`.** One block per type the plan named.
   - it runs when the step closes, not later
5. **Write the cases.** For a step that has `test`, walk the categories.
   - write each case, or the reason it does not apply
6. **Read it against `references/format.md`**, once, before anyone else sees it.
7. **The owner.** Show the unit's tickets, and hear their points.
   - the owner looks before the review child: nothing goes under review that the owner has not seen
8. **The `review` child**, with the checklist below:
   - it gets the unit's tickets and the plan, in one call
   - fix what comes back, and repeat until it is clean, up to three rounds
9. **After the last unit: commit.** The commit is the freeze mark.

A fact the repository holds is looked up, not asked.

## The files

`cycles/<NNN-YYYY-MM-DD>/tickets/<NN>-<step-name>.md`, following `references/format.md`.

- the plan and the definition are in the same cycle folder
- the number is the step's number, so the tickets read in the order the work happens

## The review's checklist

The `review` child of step 8 gets this checklist, the unit's tickets and the plan, and nothing else:

- the owner has seen the tickets and agreed
- every change since the owner's look answers their point
- one ticket per step, in the plan's order, and a `step 0` with なし has none
- the `Acceptance` is the step's target, and its `Todo` and `Verify` decide every line of it

Report findings only, each with its line, marked blocking or not.
