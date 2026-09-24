---
name: tickets
description: Use when a plan has been approved. Cuts a ticket per step, has them reviewed as a set, agrees them with the owner, and commits the agreement.
---

# tickets

Turn a frozen plan into one ticket per step, agree them with the owner, and commit them. The ticket is what the work will be judged by: what to do, and how it will be checked. The shape and the field rules are in `references/format.md`.

**The unit is the chunk.** A unit is one thing the product does; its `Then`s are covered by the unit's steps together, and the `<unit-id>.check` step is what closes it. So the cutting, the review and the reading all happen per unit: the tickets of one unit are written together and read together.

**This skill ends when the tickets are agreed and committed.** Who implements them, and whether that is the parent or a child, is not decided here: that belongs to the step that does the work.

A ticket is a working document. It is committed when its `Todo` and `Verify` are agreed, and it is closed later, by whoever does the work, by writing the hash of the implementation commit into `Commit:`.

## Step 1: cut one unit at a time

Take the plan's units in order. For a unit, cut **all** of its steps before moving to the next: the unit's steps and its `<unit-id>.check`. The file is named after the step, `NN-<step-name>.md`, so the tickets read in the order the work happens.

A `step 0` that says なし gets no ticket: there is nothing to do.

## Step 2: write the tickets

Follow `references/format.md`. In short:

- `Acceptance` is the definition's `Then` for this step, copied. When the step has no unit (a cleanup, a check), it is the step's `What`, in one line
- `Todo` is split by artifact: the files, then what changes in each, then the tests as cases
- the tests are cases, and they are where the error paths live. Write them from the definition, not from the implementation: the sheet says what the behaviour is, and the cases come out of that. The plan's `Tests` names the cases to start from; walking the nine categories below is how you find the ones the plan left out
- go down this list for each unit of behaviour, and write either the case or the reason it does not apply:
  - the happy path
  - null, undefined, missing
  - empty (an empty string, array or object)
  - boundary values (0, 1, max, max + 1)
  - invalid or malformed input
  - the expected error path (a failure, not "it does not crash")
  - permission or authorisation, where the behaviour has one
  - a second call, where the behaviour has side effects
  - concurrency, where it can be called at the same time
- each case is `input → result`, marked `(happy)` or `(error)`, and the result is a concrete value, error type or state. "It does not throw", "it is truthy" or "the mock was called" is not a result. The plan's own words (`(empty)`, `(boundary)`) are categories, not marks: an empty input that returns a value is `(happy)`
- `Verify` is one thing: how this step is checked when it closes. It has to be runnable at that moment, not later. A step with no files writes なし in `Todo` and says why, and its `Verify` is the demonstration itself: what is run, and the values to look at
- `Commit:` is the last line, and it stays empty until the step is done
- a ticket that touches the same file as another step says so, and says which of them is implemented first — the plan's `Depends` sees the documents, not the tools

## Step 3: review the unit

Before the owner sees anything, put **the unit's tickets** in front of a `review` child, in one call. `consult` runs one child per input, and an input is one file's contents, so for a unit of several tickets the child is given the task and reads the tickets itself, by name (say which ones).

Fix what comes back, repeat until it comes back clean, and cap it at three rounds. The task, verbatim:

- Check these tickets against the plan and the definition, and nothing else:
  - the `Acceptance` is the definition's `Then` for this step, copied, or the step's `What` when the step has no unit
  - the `Todo` covers every file in the step's `Files`, and every input the artifact can fail on
  - every test is `input → result`, marked happy or error, and the result is concrete
  - every category either has a case or a reason it does not apply
  - the `Verify` can be run the moment the step closes, without waiting for a later step
- Report findings only, each with its line, marked blocking or not. If there is nothing, say "no findings".

If you cannot spawn a child at all, stop: unreviewed tickets do not go in front of the owner.

Show the findings, and what you did with each, when you put the tickets to the owner.

## Step 4: review the set

When every unit is cut and reviewed, put **all** the tickets in front of **one** child, and repeat until it comes back clean (same cap: three rounds). It looks only at what a ticket-by-ticket review cannot see:

- the split into steps: do the tickets of one unit fit together, and does every `Then` of that unit get covered by its steps and its `<unit-id>.check`?
- overlaps: two tickets that touch the same file — is the order real (does one depend on the other)?
- order: is any `Depends` wrong or missing, including tool dependencies (a ticket that needs another ticket's file changed first)?
- duplication: the same work appearing in two tickets
- naming: the same thing called by different names across tickets
- anything the plan says that no ticket does, or a ticket doing what the plan does not say

Report findings only, each naming the ticket(s) and the line, marked blocking or not. If there is nothing, say "no findings".

## Step 5: get them agreed

Put the tickets to the owner **once**, after every unit is cut and both reviews are clean. Not earlier: a remark that moves an early ticket is cheap while nothing is built, and a ticket that was agreed and then changed was a criterion that moved.

What the owner sees is the map, not the pile: what differs from the plan, the findings and what was done with each, and the points that need a decision. The detail is in the files, and they can read the ones they care about.

Only an agreed `Todo` and `Verify` can judge the work: the writer does not decide their own criteria, and a check that was not agreed cannot be used to conclude that something failed. Once agreed, they are fixed, because a criterion that moves after the result is seen stops meaning anything.

They may be revised before that step's implementation starts, with the previous step's `Notes` or an owner's remark as the reason and the owner's agreement. An owner's remark lands where it acts; in a cycle whose sheet has a `Remarks` section it is written there, and in a cycle without one it goes in the ticket's `Notes`. After that they are frozen: what actually happened goes in `Notes`, not back into the ticket.

## Step 6: commit the agreements

Commit the tickets before any implementation, in one commit. What will be built, and how it will be judged, is worth having in git before the work starts. If there is no owner to agree with, stop before this step.

Then this skill is done for this cycle.

## How not to do this

- Do not decide here who implements a ticket, or how. This skill ends at the agreement
- Do not start the work to see whether the `Todo` is right: a criterion that is agreed after the result is not a criterion
- Do not write a ticket without a `Verify`: a step nobody can judge is not a step
- Do not cut one step at a time: the unit is the chunk, and its tickets are reviewed together
- Do not skip the set review: a ticket-by-ticket review cannot see the joins between tickets
