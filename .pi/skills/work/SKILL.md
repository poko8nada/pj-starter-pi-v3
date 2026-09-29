---
name: work
description: Use when the tickets are agreed. Carries one step to done, and closes it.
---

# work

Carry a step to done: the tickets say what to do and how it will be checked.
This is how that work is done, and how it closes.  
A cycle is the unit of this work: unless the owner says otherwise, carry every ticket of it to done.  
The unit's `Owner:` decides the way: `at the end` carries the unit through, and reports once, at the end (step 13); `in the loop` stops at each step's end, and the owner decides before the flow moves on (step 1).  
A step is one ticket, one implementation, a `Verify` on the parent's tree, and one closure.  
The parent owns the judgment. A child may do the work; it does not judge it.

## Steps

1. **Read the ticket.** `Acceptance`, `Todo`, `Verify` and `Owner`, before anything else.
   - `Acceptance`: what the step owes its unit
   - `Todo`: the work, by artifact
   - `Verify`: what will be run when it closes
   - `Owner`: `in the loop` or `at the end`, from the plan; it decides the way this unit runs
     - `in the loop`: the step stops at its end, and the owner decides; the way is below
     - `at the end`: no stop and no `止まり方`; carry the unit through. A cycle reports once at the end (step 13), whatever the unit's values are
   - a `Verify` that cannot run: show the owner before starting
     - one whose work is a later step's: the ticket is wrong, and this is the one time to change it

**The `in the loop` unit.** The owner decides at every step boundary, not once at the end.

- where it stops: the ticket's `止まり方` names it; at this step's end, and not before
- what it shows: the one thing the `止まり方` names — the product running, a screen, or the diff
- the owner's call, and one of the three: 残す (keep) / 直す (fix) / 捨てる (drop)
  - 残す: the step is kept; go on to the next step
  - 直す: the fix repeats inside this ticket — change, show again, hear again; this is the loop. If it does not converge, the owner decides (drop, or re-cut the step)
  - 捨てる: drop the change, and re-cut the step with the owner
- what ends it: the ticket's `止まり方` says; the `Acceptance` holds, the `Verify` passed, and the diff is read (step 10)
- only after the unit ends: the commit and the unit review (step 11)
  - nothing is committed or reviewed before the owner has kept the work

2. **Decide who does the work.** The parent, or a `consult_run` child with the `code` role.
   - the axis: how many units the definition holds, and how many tickets this cycle has
   - three units or fewer and five tickets or fewer: the parent does it, a round trip costs more
   - 7 units: a child, however many tickets the cycle has
   - anything else: a child too, it is the default
   - the parent either way: a step that needs context a child cannot see
     - a hole just found, or the parent's uncommitted state: a child sees only `HEAD`
   - the parent either way: a `<unit-id>.check` step, the judgment is the parent's
3. **Start from the right place.** No dependency: `HEAD`. A dependency: the worktree and the commit the earlier step left (its branch is `consult/<unit-id>`).
   - a dependency whose earlier work is gone (the step was dropped, or its child produced nothing)
     - cut the step again: a file that was never merged cannot be depended on
4. **Decide what runs together.** Only where the writes cannot meet, and only what is checked.
   - the child is the one step 2 picked: what it carries is decided here
   - steps whose files overlap are serialised, in the order the ticket gives
   - a ticket that changes this skill comes before the tickets whose work it carries
   - several steps to one child: one call, one worktree, and both tickets point at the same unit commit (written at step 11)
   - grouping steps that are verified apart turns the closure into a guess
5. **Hand the work over.** The `consult_run` tool, a child with the `code` role, in the worktree of the ticket's unit (`consult_worktree`, if there is none yet).
   - it gets the ticket, and the `Notes` it fills
     - a child does not read this skill: the ticket is what it knows
   - the child works in its own worktree (its base is the parent's `HEAD`); nothing of it touches the parent's tree
   - the commit comes after it stops, and the repository's hooks run on it
     - leave a tree that passes them
   - everything left in the worktree goes into that commit: no scratch files
   - a test writes into its own temporary directory through the shared helper (`test/tmp.ts`, `tmpDir()`), never into the repository: the hook runs the tests in the real tree
   - `Commit:` stays empty, the hash exists only after that commit
6. **Merge one step at a time.** The `Verify` runs on the parent's tree.
   - a step that is not in the tree cannot be demonstrated
   - take the commit or drop it, and the `Notes` carry which
   - read what the commit brings before taking it: a file the ticket does not name is not taken
     - drop it, or ask the child why it is there: do not carry it in silently
   - a commit means it passed the repository's own hooks: `consult_commit` refuses and says why when they reject it
   - the work the parent did itself: the parent commits it, and that commit is the tip
   - a child that produced nothing (no commit, a failure, or a timeout): step 10's four options decide what happens; doing the work in the parent is what (a) turns into when the instruction was wrong
     - and write what happened, do not invent work
7. **Run the `Verify`.** On the parent's tree, and read the values, not the exit code.
   - the types, and what each block holds: `../plan/references/format.md`
   - the shape of the block, and its pass line: `../tickets/references/format.md`
   - a `read` or a `use`: one `consult_run` child, with the role the block names
     - the block names the child (`review`), the document, and what it reports: `read` is the verify type, not the child's name
     - **the document goes in the `task`**: the child has `read` itself, and the tool takes no `input`
     - the report the block names goes in the `task` too: the child reads the document and answers the question
     - the evidence is the text the child returns: the parent reads it and judges
   - the demonstration leaves nothing behind: only what you can delete yourself
   - a shared store, a cache, a global setting: the owner's permission first
   - what a child is allowed to do: ask it for the refusal text, not for a file
   - a `Verify` is not loosened after the fact: if it cannot be run, the step is not done
   - a `Verify` that goes through `consult_run`, when the step changed `consult`'s own code: stop, and ask the owner to reload
     - the session keeps the code it loaded, and that code is what runs the child
   - a `Verify` that fails on the merged tree is a hole in this step: fix it here
8. **Read the impact.** From the commit the step started at, against the ticket and the unit.
   - the parent does this whether it wrote the change or a child did
   - the impact child: a `consult_run` child with the `review` role, with the ticket and this step's commit range
     - it names what the change makes stale, by `file:line`: a document or a comment that now contradicts, a test still asserting the old behavior, a behavior that changed with no test on it
     - its reply is material: the parent sorts it in step 9
   - what to look for:
     - a change the `Todo` does not name
     - a line of the `Acceptance` the change does not cover
     - a document, a comment or a test the change makes stale
     - a hole this step would be passing over
   - a hole this step's own change made is this step's: fix it, and run step 7 again
9. **Write the `Notes`.** The fields and their shape: `../tickets/references/format.md`.
   - in focus: a hole in a file the `Todo` or the plan's `Files` names, or in the behavior the `Acceptance` or the unit's `Then` states, or in a document, a comment or a test this change makes stale
     - fixed here, and written under `Unplanned`
   - out of focus, and the cost stops at tidying, wording or coverage: not written
   - out of focus, anything else: `Findings`, in the shape the format gives
     - a judgement call: report it, do not drop it
     - at the `close`, the research decides whether to act
   - a child writes its own in its worktree, and they come back in its report
     - a child that stopped comes back without a commit: what it wrote stays in the worktree it left
   - the parent appends its own: the take or drop, and what its read found
10. **Finish the ticket.** Its work is done when the `Verify` passed and the diff is read. For an `in the loop` unit, the owner's 残す comes first.
    - `Commit:` stays empty here: it is written at the unit's end (step 11)
    - a step that changed nothing (a `.check` step): `Commit: なし（理由）`, the reason in the parentheses on the same line
    - a step that stopped: the ticket is not closed, and its `Commit: なし（理由）` carries the stop
      - write the reason in the ticket's `Stopped`: the six `../tickets/references/format.md` names — the output of the check that failed, the files changed, the child's last text, how many times it ran, the time, and the id of the worktree it left
      - a child that stopped sends the reason in its reply, and the record shows the row too (`consult_children`); the parent writes the ticket
      - read the reason, and pick one, before the flow moves on:
        - (a) fix the instruction, and run the step again
        - (b) `consult_run{role: 'research', worktree, continue: true}` — read what it left, and report
        - (c) `consult_run{role: 'code', worktree, continue: true}` — finish it
        - (d) leave the ticket open, and hand it to `close`
11. **The unit's end.** When every step of the unit is verified and its diff read, the parent:

- a ticket that stopped and was finished later (a)–(c): write the unit's hash into its `Commit:`, and drop its `Stopped` section, so `close` does not read it as still open
- a step left open by (d): the unit does not finish, its siblings' `Commit:` stay empty, and `close` reads the unit as open — that is what (d) chooses - reviews the unit once, before its commit: a `consult_run` child with the `review` role
  - it gets the unit's diff and the unit's `Then`, and nothing else
  - viewpoints: 2〜4, the files named, findings only, up to three rounds inside this one stage
    - required, whatever else is picked: the owner has seen what this unit must answer (the plan's step and the ticket), and agreed; every change since their look answers the point they made. For an `in the loop` unit, the owner has also seen the unit's result at a step's stop
    - tests write into their own temporary directory through the shared helper (`test/tmp.ts`), never into the repository - fixes what it reports, and runs the `Verify` of the steps it touched again
  - for an `in the loop` unit, those fixes are shown to the owner before the unit's commit - squashes the unit's commits into one: `.pi/skills/work/scripts/squash.mjs <cycle-dir> <base-hash> <hash>... [--tickets <name>...]`
  - name the unit's tickets: their empty `Commit:` is filled with the new hash, so no ticket is left blank
  - dry first: it prints what it will squash, the message, and the ticket lines it will rewrite or fill
  - it refuses a dirty tree, a list that does not match `base..HEAD`, and a `HEAD` that is not the list's last
  - the run points the one backup tag (`squash-backup`) at what it is about to rewrite, then `reset --soft` and one commit
  - the next unit overwrites that tag: there is nothing to delete, and `git reset --hard squash-backup` is the undo - the script has written the hash into every ticket of the unit: `Commit: <hash>`
  - read what it printed, and check the tickets
  - a `.check` step keeps `Commit: なし（理由）`: it changed nothing - commit the tickets: the squash's commit holds the code, not the records - an `ex-` ticket the `close` cut is its own unit: the same shape end to end
  - the review, the squash, and the records commit, exactly as above
  - `<base>` is where that ticket's work started, and `--tickets` names it
  - `Commit:` names the squashed commit; the records are their own commit

12. **Clean up the worktrees.** The `consult_worktree` tool: list first, then remove, one at a time — `remove` takes the branch too.
    - it removes what the list named, never on memory
    - a worktree a child is still running in is refused: leave it, and put the reason in front of the owner
13. **Report.** To the owner, once, when the cycle's work is done: this is the `at the end` unit's movement.
    - read the work again in full, not only the change: the lines around it as well
    - what changed, and how the whole flow reads now
    - a step that stopped: report it, with the reason the ticket holds and the call it took (step 10)
    - stop here: the owner reads it, and the cycle goes to `close`
    - what you notice looking back: it may need fixing here, in the step that carries it

## How not to do this

- Do not let a child judge its own work: the parent runs the `Verify` and decides what to take
- Do not close a ticket with a hash the `Verify` did not judge
- Do not fix a hole silently
