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
   - a `step 0` that says なし takes no ticket
2. **Write the `Acceptance`.** The step's target, from the plan's `What`.
3. **Write the `Todo`.** The concrete work, by artifact.
   - a file the plan's `Files` does not name: stop and show the owner
4. **Write `Verify`.** One block per type the plan named.
   - it runs when the step closes, not later
5. **Write the cases.** For a step that has `test`, walk the categories.
   - write each case, or the reason it does not apply
6. **Read it against `references/format.md`**, once, before anyone else sees it.
7. **The `review` child**, with the checklist below:
   - it gets the unit's tickets, in one call
   - fix what comes back, and repeat until it is clean, up to three rounds
8. **The owner.** Show the unit's tickets, and the findings with what you did with each.
9. **After the last unit: commit.** The commit is the freeze mark.

A fact the repository holds is looked up, not asked.

## The files

`cycles/<NNN-YYYY-MM-DD>/tickets/<NN>-<step-name>.md`, following `references/format.md`.

- the plan and the definition are in the same cycle folder
- the number is the step's number, so the tickets read in the order the work happens

## The review's checklist

The `review` child of step 7 gets this, and nothing else:

- every step has a ticket, and a `step 0` with なし has none
- the `Acceptance` is the step's target, taken from the plan's `What`
- the `Todo` covers every file in the step's `Files`, and the concrete work is named
- the test files are here, not in the plan
- every `Verify` type the plan named has its concrete
- together, the `Verify` blocks decide every `Acceptance` line
- every `test` case is `<入力> → <結果>`, marked happy or error, and the result is concrete
- every category has a case or a reason it does not apply
- `Commit:` is the last line and is empty

Report findings only, each with its line, marked blocking or not.
