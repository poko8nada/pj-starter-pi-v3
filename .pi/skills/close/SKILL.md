---
name: close
description: Use when every ticket of a cycle is closed. Judges the cycle as a whole. One integration run across the units, the finished form through a review child, where each hole goes, and the Retro that closes the cycle.
---

# close

A cycle is one definition, and it is judged as one thing. Each unit carries its own check, so the inside of a unit has an eye on it; nobody has an eye on the seams between units, and when the last ticket closes the cycle itself has still to be judged. This skill is that judgment.

Two rules hold the whole way through:

- **It does not implement.** Changing the product is the work of the stage that carries a step. What is decided here is where a hole goes; a hole that is this cycle's comes back as a ticket, it is not fixed here.
- **It does not invent criteria.** The criteria are the definition's one `Goal` and its `Then`s, which were agreed before the work started. A criterion that is missing there is a hole, not something to add here.

## Step 1: read the cycle

Read, before anything else:

- the definition: its one `Goal`, and every unit's `Then`. Those are the criteria, and each unit's own check has already covered the inside of that unit
- every ticket's `Notes`: its `Findings` and `Unplanned` lines are the raw material for `Carry over`, and a hole written there is what Step 3 checks against the finished form
- the definition's `Remarks`: a remark that landed nowhere is a hole too

Do not read the `Then`s from memory. The definition and the tickets are in the tree, and they are what the cycle is judged by.

## Step 2: run one integration across the cycle

Design and run **one** integration that crosses the units: a path a person can walk from the `Goal` down, touching more than one unit. What it is for is the seams — a value one unit produces and the next one consumes, a file two units write, a shape they share — because that is what no unit's own check looks at.

The criteria are the one `Goal` and the `Then`s, and nothing else. A run that needs a criterion the definition does not hold has found a hole: write it down for Step 4, do not promote it into a criterion.

The run leaves nothing it made. When it needs a child that writes, have the child report the text back instead, and keep the writing outside the repository; a ref, a worktree or a file that the run leaves behind is found again in Step 3, and it is a finding. A file the product itself keeps — its own data — is not a leftover, and it stays where the product puts it.

## Step 3: put the finished form in front of a review child

**The parent raises the child** (a child cannot raise one). Give it the definition and the tickets, and the fixed checklist below; fix what comes back, repeat until it comes back clean, and cap it at three rounds. Take whatever is left to the owner.

The task, verbatim:

- Check the finished form against the definition, and nothing else:
  - the one `Goal` and the `Then`s are satisfied by what is in the tree
  - nothing is built that the definition does not promise
  - every hole written in the tickets' `Notes` is actually closed
  - nothing the demonstrations left behind remains (a ref, a worktree, a file)
- Report findings only, each with its line, marked blocking or not. If there is nothing, say "no findings".

If no child can be raised, stop: a cycle is not closed without this review.

## Step 4: send each hole where it belongs

Every finding from Step 3, and every hole Steps 1 and 2 turned up, gets exactly one of three places, and the reason is written next to it:

- **a hole that breaks the `Goal`** → it belongs to this cycle. Cut a ticket for it, and the cycle does not close until it is fixed. The judgment came from the criteria, so cutting the ticket does not need a new agreement; only a criterion that moves does, and that is the owner's. Carrying the ticket out is work for whoever carries a step — this skill does not change the product, and the cycle waits for it
- **a hole in the closing act itself** — a `Carry over` that dropped a line, a `Good` with no value read from anywhere, a finding sent to the wrong place — → it belongs to this step, and it is fixed here: this skill changes no product, but its own act is its own to correct
- **anything else** → it belongs to the next cycle. It is copied as it was written into the `Retro`'s `Carry over`, and the next definition accounts for it

A hole is never fixed silently, and a frozen definition or plan is never rewritten to make a hole look closed. What actually happened is written in the `Retro` and in the `Notes`, not back into an agreed document.

## Step 5: write the Retro

Write the definition's `Retro`, in the definition, in its format:

- `Good`: what this cycle got right, with the evidence — a claim without the value it was read from is not a line
- `Bad`: what went wrong, including what was left half-done
- `Carry over`: every line the cycle's tickets left unresolved in their own step — every `Findings` line, and any `Unplanned` line its step did not fix — copied as it was written. Copying is not shortening; shortening is how a hole gets lost

Then put it to the owner. They are the only one who can judge `Good` and `Bad`, and they are the last check that `Carry over` has no gaps. When they say yes, commit. **That commit closes the cycle**, and nothing about that cycle is edited afterwards.

## How not to do this

- Do not implement: changing the product belongs to the stage that carries a step, and a hole that breaks the `Goal` goes back as a ticket
- Do not invent criteria: the one `Goal` and its `Then`s are the whole of it, and a missing one is a hole
- Do not fix a hole silently, and do not write the fix into a frozen definition or plan
- Do not close a cycle without the review, or before the owner has judged `Good` and `Bad`
- Do not shorten `Carry over`: a line left out is a hole nobody will find again
