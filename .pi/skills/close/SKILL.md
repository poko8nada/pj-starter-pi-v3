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
   - the definition: every unit's `Then`, and the `Retro`'s `Carry over`
   - every ticket's `Notes`: the `Findings` lines are the raw material for `Carry over`
   - every ticket's state: a ticket with no `Commit:`, or a `Stopped` section, is still open; it is a hole, and step 4 reads its reason
   - the `Retro`'s shape: see `../definition/references/format.md`
   - do not read the `Then`s from memory: the tree holds them
2. **Run one integration across the units.**
   - one path a person can walk, touching more than one unit
     - the seams are what no unit's own check looks at
   - a value one unit makes and the next consumes, a file two units write, a shape they share
   - the criteria are the units' `Then`s and nothing else
     - a run that needs another criterion has found a hole
   - the run leaves nothing it made: a ref, a worktree, a file, a tag. A leftover is a finding
     - `squash-backup` is not a leftover: it is the last unit's undo point, overwritten by the next squash
3. **Send each hole where it belongs.** One place each, and the reason beside it.
   - a hole that breaks a `Then` belongs to this cycle: cut a ticket for it
     - the ticket is named `ex-<NN>-<step-name>.md`, with the next free number: that is `../tickets/references/format.md`'s `Names`
     - a hole an open ticket already holds is not cut again: step 4 reads its `Stopped`, and the owner decides its fate there
     - the cycle waits for that work, and step 1 is where it resumes
     - the judgment came from the criteria, so cutting needs no new agreement
       - only a criterion that moves does
   - a hole in the closing act itself is fixed here
     - a `Carry over` line that went missing, a `Good` with no value
   - anything else belongs to the next cycle: the `Retro`'s `Carry over`
   - a hole is never fixed silently, and a frozen definition or plan is never rewritten to close it
4. **The research.** Before the `Retro` is written: the reported holes are classified, and only what is decided to be acted on survives.
   - collect: the tickets' `Findings`, the tickets that are still open, and what this close itself found
   - a ticket that is still open (no `Commit:`, a `Stopped` section) is a hole, and it is not re-cut: read its `Stopped` reason
     - the parent and the owner decide its fate, before the `Retro`: 続ける / 落とす / 持ち越す
       - 続ける: the cycle waits (step 3): `work` takes it back, or `consult_resume` runs the child on in the same worktree; the worktree stays, and step 1 is where the close resumes
       - 落とす: the ticket is dropped, the reason is one `Bad` line, its worktree is removed at step 9, and the ticket is closed as dropped: write `Commit: なし（owner が落とした。理由は Stopped のとおり）` into it, so the next close does not read it as still open
       - 持ち越す: it is one `Carry over` line at step 5, copied with its `Stopped` reason, and its worktree is kept at step 9; a worktree the owner calls stale is removed too, and the line says so
     - a `Stopped` reason with no worktree id leaves nothing to resume or remove: say so, and do not invent one
   - a line that was in focus is a hole in its own step: cut it as an `ex-` ticket and fix it; it is not classified here
   - one child of type `research` per hole, run in parallel, answers two things, with sources
     - is it common: independent reports (issues, PRs, docs, articles), two or three at least
     - is there a standard remedy **in this setting** (a pre-commit hook, the owner's real tree), not in another one
     - the queries come from the hole's mechanism, in English: `<mechanism> git hook test`, `<symptom> "working tree" repository`, `<tool> issue <symptom>`, `<mechanism> known limitation`
     - it keeps the queries it used, so the owner can judge the search
   - the cells say what happens next
     - common, and a remedy: act: a job for the next cycle
     - common, no remedy: discuss the impact; a high impact gets a second research pass for a method, then the decision
     - rare, and a remedy: the weight of the implementation decides
     - rare, no remedy: decided to ignore, and not written
   - the owner and the parent settle this, before the `Retro`: the policy comes first
5. **Write the `Retro`**, in the definition, in its format: `Good`, `Bad`, `Carry over`.
   - `Good`: what this cycle got right, with the value it was read from
     - a `Then` that holds, a `Verify` that passed: the value is the line that showed it
   - `Bad`: what went wrong, including what was left half-done
   - `Carry over`: the holes decided to be acted on: the ones step 4 kept
     - numbered from 1; each line is a heading, then `Status`, `Research`, `Action`, `Basis` and `From:`
       - the shape is `../definition/references/format.md`; the labels stay English, the content is written in Japanese
     - the previous `Carry over`'s lines that are still open, copied as written
       - their own `From:` is kept
       - a line this cycle resolved is not copied: it is done
     - copying is not shortening; shortening is how a hole gets lost
6. **The owner.** Show them the `Retro`, before the review.
   - they are the only one who can judge `Good` and `Bad`
   - they are the last check on `Carry over`
     - a missing line comes back; a line the owner drops leaves a `Bad` line
   - a rejection sends you back to step 3
7. **The `review` child**, with the checklist below.
   - the `consult_new` tool, type `review`
   - it gets the definition, the tickets, and this checklist, in one call
   - a hole it finds goes to step 3: this step fixes only its own act
   - run the child again after those acts, up to three rounds
   - what is left after three rounds goes to the owner
   - no child, no close: a cycle is not closed without this review
8. **Commit.** After the owner's yes and the review's last round.
   - that commit closes the cycle, and nothing about that cycle is edited afterwards
9. **The worktrees.** After the commit: what the stopped children left is removed or kept, as step 4 decided. Nothing is decided here — what this step finds that step 4 did not decide goes back to step 4, before the commit.
   - `consult_resume` with `list`: every worktree `consult` left, with its id, its place, the reason it stopped, and the files the child changed
   - `remove`, one at a time, by the id `list` gave: the worktree of a ticket decided 落とす, and any worktree no open ticket and no `Carry over` line names (a `Carry over` line keeps its worktree alive across cycles)
   - a worktree decided 持ち越す stays; its id is beside that ticket's `Stopped` reason, and in the `Carry over` line
   - the id comes from `list`, not from memory; a worktree a call kept is not removed here

## The review's checklist

The `review` child of step 7 gets this checklist, the definition and the tickets, and nothing else:

- the owner has seen the `Retro` and agreed
- every change since the owner's look answers their point
- the units' `Then`s are satisfied by what is in the tree, and nothing is built that the definition does not promise
- a hole written in the tickets' `Notes` is closed, or it is in the `Retro`'s `Carry over`
- every open ticket is explained: the `Stopped` reason was read, and the owner's call (続ける / 落とす / 持ち越す) is written
- every worktree `consult` left is explained: removed, or kept with the ticket and the call that keeps it

Report findings only, each with its line, marked blocking or not.

## How not to do this

- Do not implement: a hole that breaks a `Then` goes back as a ticket, and the cycle waits
- Do not invent criteria: the units' `Then`s are the whole of it
- Do not fix a hole silently, and do not write the fix into a frozen definition or plan
- Do not close a cycle without the review, or before the owner has judged `Good` and `Bad`
- Do not shorten `Carry over`: a line left out is a hole nobody will find again
- Do not leave an open ticket or a stopped child's worktree unexplained: the ticket is a hole the owner calls (続ける / 落とす / 持ち越す), and its worktree follows that call
