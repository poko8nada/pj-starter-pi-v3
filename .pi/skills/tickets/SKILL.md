---
name: tickets
description: Use when a plan is approved. One ticket per step, reviewed and agreed, and frozen by a commit.
---

# tickets

A cycle is one set of tickets.

A ticket is what the work will be judged by: what to do, and how it will be checked.

The plan says the steps; a ticket is one step, and the tickets are cut in the plan's order.

A unit is one build unit from the definition: the smallest thing a `Who` can use. Its steps are its tickets.

The shape of the file and its field rules are in `references/format.md`.

Read that before writing anything.

## Steps

1. **Read the plan.** The steps are the tickets: one ticket per step.
   - the tickets of a unit are cut together, and shown as one set
   - a `step 0` that says なし takes no ticket
2. **Write the `Acceptance`.** It is the step's target:
   - the right side of the plan's `What`, copied
3. **Write the `Todo`.** The work, split by artifact:
   - a file, then the units inside it (a heading in a document, a function in code), then the tests
   - every file in the step's `Files` appears
   - a step with no files writes なし, and says why
4. **Write the tests.** They are cases, and the error paths live here.
   - the definition leaves the error paths out
   - a case is `<入力> → <結果>`, marked `(happy)` or `(error)`
   - the result is a value, an error type or a state
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
5. **Write the `Verify`.** It is the step's `Verify` from the plan, in the ticket's own words.
   - `Run` is the command, and `Look` is what a person reads
   - it runs the moment the step closes, not later
   - a step that moves the form is proved by the form
6. **Read it against `references/format.md`**, once, before anyone else sees it.
7. **The `review` child**, with the checklist below:
   - it gets the unit's tickets, in one call
   - fix what comes back, and repeat until it is clean, up to three rounds
8. **The owner.** Show the unit's tickets, and the findings with what you did with each.
9. **Commit.** The commit is the freeze mark.

A fact the repository holds is looked up, not asked.

## The files

`cycles/<NNN-YYYY-MM-DD>/tickets/<NN>-<step-name>.md`, following `references/format.md`.

- the number is the step's number, so the tickets read in the order the work happens

## The review's checklist

The `review` child of step 7 gets this, and nothing else:

- every step has a ticket, and a `step 0` with なし has none
- the `Acceptance` is the right side of the plan's `What`, copied
- the `Todo` covers every file in the step's `Files`
- every test is `<入力> → <結果>`, marked happy or error, and the result is concrete
- every category has a case or a reason it does not apply
- the `Verify` can run the moment the step closes
- `Commit:` is the last line and is empty

Report findings only, each with its line, marked blocking or not.

## How not to do this

- Do not write a ticket that no step asks for
- Do not leave a file out of `Todo`
- Do not write a test whose result is not a value
- Do not close a ticket before its `Verify` runs
