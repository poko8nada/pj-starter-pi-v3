---
name: work
description: Use when the tickets are agreed. Carries one step to done, and closes it.
---

# work

Carry a step to done: the tickets say what to do and how it will be checked.
This is how that work is done, and how it closes.  
A cycle is the unit of this work: unless the owner says otherwise, carry every ticket of it to done, and report once, at the end.  
A step is one ticket, one implementation, a `Verify` on the parent's tree, and one closure.  
The parent owns the judgment. A child may do the work; it does not judge it.

## Steps

1. **Read the ticket.** `Acceptance`, `Todo` and `Verify`, before anything else.
   - `Acceptance`: what the step owes its unit
   - `Todo`: the work, by artifact
   - `Verify`: what will be run when it closes
   - a `Verify` that cannot run: show the owner before starting
     - one whose work is a later step's: the ticket is wrong, and this is the one time to change it
2. **Decide who does the work.** The parent, or a `consult` child of type `code`.
   - the axis: how many units the definition holds, and how many tickets this cycle has
   - three units or fewer and five tickets or fewer: the parent does it, a round trip costs more
   - 7 units: a child, however many tickets the cycle has
   - anything else: a child too, it is the default
   - the parent either way: a step that needs context a child cannot see
     - a hole just found, or the parent's uncommitted state: a child sees only `HEAD`
   - the parent either way: a `<unit-id>.check` step, the judgment is the parent's
3. **Start from the right place.** No dependency: `HEAD`. A dependency: the earlier step's ref.
   - a dependency whose earlier ref is gone (the step was dropped, or its child failed)
     - cut the step again: a file that was never merged cannot be depended on
4. **Decide what runs together.** Only where the writes cannot meet, and only what is checked.
   - the child is the one step 2 picked: what it carries is decided here
   - steps whose files overlap are serialised, in the order the ticket gives
   - a ticket that changes this skill comes before the tickets whose work it carries
   - several steps to one child: one call, one ref, and the same hash in both tickets
   - grouping steps that are verified apart turns the closure into a guess
5. **Hand the work over.** The `consult` tool, a child of type `code`.
   - it gets the ticket, and the `Notes` it fills
     - a child does not read this skill: the ticket is what it knows
   - a child starts from step 3's ref, or from `HEAD`
   - the commit comes after it stops, and the repository's hooks run on it
     - leave a tree that passes them
   - everything left in the worktree goes into that commit: no scratch files
   - `Commit:` stays empty, the hash exists only after that commit
6. **Merge one step at a time.** The `Verify` runs on the parent's tree.
   - a step that is not in the tree cannot be demonstrated
   - take the ref or drop it, and the `Notes` carry which
   - a ref means a commit that passed the repository's own hooks: that is the shape to take
   - the work the parent did itself: the parent commits it, and that commit is the tip
   - a child that produced nothing (no ref, a failure, a timeout): do the work in the parent
     - and write what happened, do not invent work
7. **Run the `Verify`.** On the parent's tree, and read the values, not the exit code.
   - the types, and what each block holds: `../plan/references/format.md`
   - the shape of the block, and its pass line: `../tickets/references/format.md`
   - a `read` or a `use`: one `consult` child, of the type the block names
     - the block names the child (`review`), the document, and what it reports: `read` is the verify type, not the child's name
     - the document goes in `input`, the tool's argument: the child is a reading type, and it is not asked to write
     - the report the block names goes in the `task`: the child gets the document and the question
     - the evidence is the text the child returns: the parent reads it and judges
   - the demonstration leaves nothing behind: only what you can delete yourself
   - a shared store, a cache, a global setting: the owner's permission first
   - what a child is allowed to do: ask it for the refusal text, not for a file
   - a `Verify` is not loosened after the fact: if it cannot be run, the step is not done
   - a `Verify` that goes through `consult`, when the step changed `consult`'s own code: stop, and ask the owner to reload
     - the session keeps the code it loaded, and that code is what runs the child
   - a `Verify` that fails on the merged tree is a hole in this step: fix it here
8. **Read the diff.** From the commit the step started at, against the ticket and the unit.
   - the parent does this whether it wrote the change or a child did
   - what to look for:
     - a change the `Todo` does not name
     - a line of the `Acceptance` the change does not cover
     - a document the change contradicts
     - a hole this step would be passing over
   - a hole found here is this step's: fix it, and run step 7 again
9. **Write the `Notes`.** The two fields and their shape: `../tickets/references/format.md`.
   - a hole inside this step: fixed here, and written under `Unplanned`
   - a hole outside it, earlier or later: `Findings`
   - a child writes its own in its worktree, and they come back with the ref
   - the parent appends its own: the take or drop, and what its read found
10. **Finish the ticket.** Its work is done when the `Verify` passed and the diff is read.
    - `Commit:` stays empty here: it is written at the unit's end (step 11)
    - a step that changed nothing (a `.check` step): `Commit: なし（理由）`, the reason in the parentheses on the same line
11. **The unit's end.** When every step of the unit is verified and its diff read:
    - the review child: the unit's diff and the unit's `Then`, and nothing else
      - viewpoints: 2〜4, the files named, findings only, up to three rounds
    - fix what it reports, and run the `Verify` of the steps it touched again
    - squash the unit's commits into one: `.pi/skills/work/scripts/squash.mjs <cycle-dir> <base-hash> <hash>...`
      - dry first: it prints what it will squash, the message, and the ticket lines it will rewrite
      - it refuses a dirty tree, a list that does not match `base..HEAD`, and a `HEAD` that is not the list's last
      - the run makes a backup tag first, then `reset --soft` and one commit
    - write the hash it printed into every ticket of the unit: `Commit: <hash>`
    - the records are their own commit: the tickets, with their `Notes`
12. **Clean up the refs.** The `ref_cleanup` tool: list first, then delete, one at a time.
    - it refuses anything that is not a `consult/` ref
    - a ref it refuses: leave it, and put the reason in front of the owner
    - do not delete a ref by hand: `git branch -D` is not the tool's job
13. **Report.** To the owner, once, when the cycle's work is done.
    - read the work again in full, not only the change: the lines around it as well
    - what changed, and how the whole flow reads now
    - stop here: the owner reads it, and the cycle goes to `close`
    - what you notice looking back: it may need fixing here, in the step that carries it

## How not to do this

- Do not let a child judge its own work: the parent runs the `Verify` and decides what to take
- Do not close a ticket with a hash the `Verify` did not judge
- Do not fix a hole silently
