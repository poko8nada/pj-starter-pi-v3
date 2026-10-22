---
name: yolo
description: Use when the owner says to run the cycle through without their confirmations, at any time after every entry of the ADR is accepted. It walks the cycle's stages from where it stands, and stops at the close's triage, before the owner judges it.
disable-model-invocation: true
---

# yolo

One cycle, walked without the owner's confirmations. The owner starts it; the agent cannot choose it.

## When it runs

- the owner starts it, at any time after every entry of the ADR is accepted
- started before that, it is invalid: nothing runs, and it says so
- it walks from where the cycle stands: a stage the cycle has passed is not walked again
- the ADR is not its business: no entry is accepted or checked here

## The flow

The cycle's four stages, in their order. Each keeps its work, and loses only its look at the owner.

### design

- read the definition and the ADR, and walk what each accepted entry touches
- write the paths at the top of design.md, cut them into plans, name each plan, and write its section
- skips: the owner's look at the cut, and at `## Affected`
- runs the design's review, on its seven viewpoints: the review is a subagent's, not the owner's look
- go on to the plan

### plan

- write every plan md: its files, its slices, the types, the cases, the checks and the record
- read the plans together, and review each plan's checks
- skips: the owner's look at the plan mds
- go on to the work

### work

- commit the cycle's files, and run the plans in the order the cut gives
- a plan: its slices, the test cleanup, the review, the acceptance, and the merge with the base's dependencies set again
- skips: the owner's look at the acceptance, and their OK after each slice of a plan that runs in the base
- go on to the close

### close

- check the trigger, read the cycle, and collect the leftovers
- give every leftover a destination: one of four — a contradiction, a hole, something broken, something left stale — is looked at as an `ex-` plan; what breaks nothing goes to `proposed`; `dropped` when the fix weighs more
- skips: the owner's judgement on the triage
- it ends here: the triage stands as a proposal, and the owner judges it

What comes after that judgement — the confirmed triage, the `ex-` plans, the commit that closes the cycle — is not this skill's work.

## When it stops early

Stopping is the main agent's task: when you judge that one of these holds, stop, and ask the owner.

- a plan's premise turns out false, and what closes it sits outside the plan
- a merge leaves the base red, and the plan's fix does not bring it back green
- dropping a leftover: the fix weighs more than leaving it

A hole the run finds and fixes in the plan's own files is not one of these: the slice's `Unplanned` holds it, and the run goes on.

## What it does not do

- it does not decide a change the ADR did not accept
- it does not lean on the other skills: the flow above is the whole of it
