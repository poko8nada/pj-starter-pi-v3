---
name: close
description: Use when every ticket of a cycle is closed. Judges the cycle, and writes the Retro.
---

# close

A cycle is one definition, and it is judged as one thing.  
Each unit carries its own check, so the inside of a unit has an eye on it.  
Nobody has an eye on the seams between units.  
When the last ticket closes, the cycle itself still has to be judged.  
This skill is that judgment.  
Two rules hold the whole way through.  
It does not implement: changing the product belongs to the stage that carries a step.  
A hole that is this cycle's comes back as a ticket, and it is not fixed here.  
It does not invent criteria: the criteria are the units' `Then`s, agreed before the work started.  
A criterion that is missing is a hole, not something to add here.  
The `Retro`'s shape is in `../definition/references/format.md`.  
The tickets' `Notes` are in `../tickets/references/format.md`.

## Steps

1. **Read the cycle.**
   - the definition: every unit's `Then`, and its `## Carry over`
   - every ticket's `Notes`: the `Findings` lines are the raw material for `Carry over`
   - the `Retro`'s shape: see `../definition/references/format.md`
   - do not read the `Then`s from memory: the tree holds them
2. **Run one integration across the units.**
   - one path a person can walk, touching more than one unit
     - the seams are what no unit's own check looks at
   - a value one unit makes and the next consumes, a file two units write, a shape they share
   - the criteria are the units' `Then`s and nothing else
     - a run that needs another criterion has found a hole
   - the run leaves nothing it made: a ref, a worktree, a file. A leftover is a finding
3. **The `review` child**, with the checklist below.
   - the `consult` tool, type `review`
   - it gets the definition, the tickets, and this checklist, in one call
   - every finding goes to step 4: this step fixes only its own act
   - run the child again after those acts, up to three rounds
   - what is left after three rounds goes to the owner
   - no child, no close: a cycle is not closed without this review
4. **Send each hole where it belongs.** One place each, and the reason beside it.
   - a hole that breaks a `Then` belongs to this cycle: cut a ticket for it
     - the cycle waits for that work, and step 1 is where it resumes
     - the judgment came from the criteria, so cutting needs no new agreement
       - only a criterion that moves does
   - a hole in the closing act itself is fixed here
     - a `Carry over` line that went missing, a `Good` with no value
   - anything else belongs to the next cycle: the `Retro`'s `Carry over`
   - a hole is never fixed silently, and a frozen definition or plan is never rewritten to close it
5. **Write the `Retro`**, in the definition, in its format: `Good`, `Bad`, `Carry over`.
   - `Good`: what this cycle got right, with the value it was read from
     - a `Then` that holds, a `Verify` that passed: the value is the line that showed it
   - `Bad`: what went wrong, including what was left half-done
   - `Carry over`: two sources, one list
     - numbered from 1, across both sources
     - the previous `Carry over`'s lines that are still open, copied as written
       - their own `From:` is kept
       - a line this cycle resolved is not copied: it is done
     - this cycle's: every `Findings` line the tickets left, as it was written
       - those take `From: <NNN>.<ticket>`
     - `Unplanned` is not copied: its hole was closed in its step
     - copying is not shortening; shortening is how a hole gets lost
6. **The owner.** Show them the `Retro`.
   - they are the only one who can judge `Good` and `Bad`
   - they are the last check on `Carry over`
     - a missing line comes back; a line the owner drops leaves a `Bad` line
   - a rejection sends you back to step 4
7. **Commit.** After the owner's yes.
   - that commit closes the cycle, and nothing about that cycle is edited afterwards

## The review's checklist

- the units' `Then`s are satisfied by what is in the tree
- nothing is built that the definition does not promise
- a hole written in the tickets' `Notes` is closed, or it is in the `Retro`'s `Carry over`
- the run left nothing behind: a ref, a worktree, a file
- each finding comes with its line, marked blocking or not

## How not to do this

- Do not implement: a hole that breaks a `Then` goes back as a ticket, and the cycle waits
- Do not invent criteria: the units' `Then`s are the whole of it
- Do not fix a hole silently, and do not write the fix into a frozen definition or plan
- Do not close a cycle without the review, or before the owner has judged `Good` and `Bad`
- Do not shorten `Carry over`: a line left out is a hole nobody will find again
