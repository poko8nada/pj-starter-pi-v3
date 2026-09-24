---
name: tickets
description: Use when a plan has been approved and before the implementation starts. Cuts one ticket per step, has it reviewed, agrees its Todo and Verify with the owner, and commits the agreement.
---

# tickets

Turn a frozen plan into one ticket per step, agree each one with the owner, and commit it. The ticket is what the work will be judged by: what to do, and how it will be checked. The shape and the field rules are in `references/format.md`.

**This skill ends when the ticket is agreed and committed.** Who implements it, and whether that is the parent or a child, is not decided here: that belongs to the step that does the work.

A ticket is a working document. It is committed when its `Todo` and `Verify` are agreed, and it is closed later, by whoever does the work, by writing the hash of the implementation commit into `Commit:`.

## Step 1: pick the next step

One ticket per step, in the plan's order. The file is named after the step, `NN-<step-name>.md`, so the tickets read in the order the work happens.

A `step 0` that says なし gets no ticket: there is nothing to do.

## Step 2: write the ticket

Follow `references/format.md`. In short:

- `Acceptance` is the definition's `Then` for this step, copied. When the step has no unit (a cleanup, a check), it is the step's `What`, in one line
- `Todo` is split by artifact: the files, then what changes in each, then the tests as cases
- the tests are cases, and they are where the error paths live. Write them from the definition, not from the implementation: the sheet says what the behaviour is, and the cases come out of that
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
- each case is `input → result`, marked `(happy)` or `(error)`, and the result is a concrete value, error type or state. "It does not throw", "it is truthy" or "the mock was called" is not a result
- `Verify` is one thing: how this step is checked when it closes. It has to be runnable at that moment, not later
- `Commit:` is the last line, and it stays empty until the step is done

## Step 3: review it

Before the owner sees the ticket, put it in front of a `review` child. Same shape as everywhere else: a checklist that is fixed, fix what comes back, repeat until it comes back clean, and cap it at three rounds.

The task, verbatim:

- Check this ticket against the plan and the definition, and nothing else:
  - the `Acceptance` is the definition's `Then` for this step, copied, or the step's `What` when the step has no unit
  - the `Todo` covers every file in the step's `Files`, and every input the artifact can fail on
  - every test is `input → result`, marked happy or error, and the result is concrete
  - every category either has a case or a reason it does not apply
  - the `Verify` can be run the moment the step closes, without waiting for a later step
- Report findings only, each with its line, marked blocking or not. If there is nothing, say "no findings".

The input is the ticket. Show the findings, and what you did with each, when you put it to the owner.

## Step 4: get it agreed

Get `Todo` and `Verify` agreed. Work does not start before that, and this skill does not go further until then.

Only an agreed `Todo` and `Verify` can judge the work: the writer does not decide their own criteria, and a check that was not agreed cannot be used to conclude that something failed. Once agreed, they are fixed, because a criterion that moves after the result is seen stops meaning anything.

They may be revised before this step's implementation starts, with the previous step's `Notes` as the reason and the owner's agreement. After that they are frozen: what actually happened goes in `Notes`, not back into the ticket.

## Step 5: commit the agreement

Commit the ticket before any implementation. What will be built, and how it will be judged, is worth having in git before the work starts.

Then this ticket is done as far as this skill is concerned. The next step gets its ticket, or the work starts — that is the step after this one.

## How not to do this

- Do not decide here who implements the ticket, or how. This skill ends at the agreement
- Do not start the work to see whether the `Todo` is right: a criterion that is agreed after the result is not a criterion
- Do not write a ticket without a `Verify`: a step nobody can judge is not a step
