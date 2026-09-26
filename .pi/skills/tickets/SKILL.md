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
2. **Write the `Acceptance`.** The step's target: the right side of the plan's `What`, copied.
3. **Write the `Todo`.** The concrete work, by artifact:
   - a document: the headings, and what changes in each
   - code: the functions to write or change
   - a refactor: what is split, moved or dropped
   - the test files, with their paths. The plan does not name them: here is where they are decided
4. **Write `Verify`.** One block per type the plan named:
   - the types, and what each block holds, are in the plan's `format.md`
   - together, the blocks decide every `Acceptance` line
   - each block says which `Acceptance` lines it decides
5. **Write the cases**, for a step that has `test`:
   - a case is `<入力> → <結果>`, and the result is a value, an error type or a state
   - "It does not throw" is not a result
   - the cases come from the definition, not from the implementation
   - walk these, and write the case or the reason it does not apply:
     - the happy path
     - null, undefined, missing
     - empty
     - boundary values
     - invalid input
     - the expected error path
     - permission
     - a second call
     - concurrency
   - the reason sits as a bullet under the artifact, in the same list as the cases
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
- the `Acceptance` is the right side of the plan's `What`, copied
- the `Todo` covers every file in the step's `Files`, and the concrete work is named
- the test files are here, not in the plan
- every `Verify` type the plan named has its concrete
- together, the `Verify` blocks decide every `Acceptance` line
- every `test` case is `<入力> → <結果>`, marked happy or error, and the result is concrete
- every category has a case or a reason it does not apply
- `Commit:` is the last line and is empty

Report findings only, each with its line, marked blocking or not.
