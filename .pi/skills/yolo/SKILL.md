---
name: yolo
description: Use when the owner says to run the cycle through without their confirmations, at any time after every entry of the ADR is accepted. It walks the cycle's stages from where it stands, and stops at the close's triage, and passes the `Added` owner check.
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

The cycle's three stages, in their order. Each keeps its work, and loses only its look at the owner.

### plan

- write every plan md: its files, its slices, the types, the steps, the verify and the record
- run the research for the lines the plan cannot write, and write a `Stopped` line for what the four kinds do not cover
- read the plans together, and review each plan on the five viewpoints: `Goal`, `Files`, `Types`, `Cases`, `Checks`
- skips: the proofread (the owner does not read the plan mds under `yolo`, so it does not run later either), and the owner's look at the plan mds
- go on to the work

### work

- commit the cycle's files, and run the plans in the order the cut gives
- a plan: its slices, the test cleanup, the review, the acceptance, and the merge with the base's dependencies set again
- a `base` plan is not used: every plan is a worktree, and the `Added` owner look (front cmux-browser, base slice) is passed
- skips: the report to the owner
- go on to the close

### close

- check the trigger, read the cycle, collect the leftovers, and exclude what the wording shows is already resolved
- give every leftover a proposed destination, in this order: the cycle's own concern → `ex-`; an obvious bug, vulnerability, or stale implementation or wording outside that concern → `ex-`; one of the above too large for one `ex-`, or needing further outside or inside research → `proposed`; the rest → `dropped`, each with its `Fact:` / `Why:` / `Then:`
- complete `close.md`: `## Collected` holds the inventory, `## Triage` holds the proposal, and `## Verified` stays empty at the completion (and that is normal)
- run the proofread here, so the `close.md` at the stop is what the owner can read
- skips: the owner's judgement on the triage, the `ex-` plans and their merges, and the verification of what the cycle delivered
- it ends here: before the owner's judgement on the triage, with the proposal complete and proofread

What comes after that judgement — the confirmed triage, the `ex-` plans, the verification, the commit that closes the cycle — is not this skill's work. The order from the completion of `close.md` to the verification is the same as the close skill's.

## When it stops early

Stopping is the main agent's task: when you judge that one of these holds, stop, and ask the owner.

- a plan's premise turns out false, and what closes it sits outside the plan
- a merge leaves the base red, and the plan's fix does not bring it back green
- a pair of plans would make the same thing, and the owner has to decide the cut

A hole the run finds and fixes in the plan's own files is not one of these: the slice's `Unplanned` holds it, and the run goes on.

## What it does not do

- it does not decide a change the ADR did not accept
- it does not call the other skills: each stage keeps its own rules, and the flow above is the order it walks them
