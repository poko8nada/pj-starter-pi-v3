---
name: work
description: Use when the tickets are agreed. Carries one step to done; who does the work, how it merges, the demonstration, the closure, the record, and the ref cleanup.
---

# work

Carry a step to done. The tickets say what to do and how it will be checked; this skill is how that work is actually done, and how it is closed. Writing the sheet, cutting the tickets and closing the cycle are other skills' jobs, not this one.

**The step is the unit.** One ticket, one implementation, one `Verify` run on the parent's tree, one closure. A step is not done while its `Verify` cannot run or its ticket has no `Commit:`.

**The parent owns the judgment.** The parent reads the ticket, decides who does the work, merges, runs the `Verify` on the merged tree, decides what to take, and cleans up the refs. A child may do the work; it does not judge it. What the parent does not do is write about work it did not do: the `Notes` belong to whoever did the work.

**Work ends when the tree holds it.** The line is: the parent's tree contains the step's result, the `Verify` has run on that tree, the ticket is closed with a `Commit:`, and no ref from this step is left. Judging the cycle as a whole — the seams between units — is a different skill's job (`close`), not this one.

## Step 1: read the ticket

Read `Acceptance`, `Todo` and `Verify` before anything else. `Acceptance` is what the step owes its unit. `Todo` is the work, split by artifact. `Verify` is what will be run when it closes, and it has to be runnable at that moment: if it needs something a later step builds, the ticket is wrong — say so before starting, and fix it before implementing (that is the only time a ticket may change).

## Step 2: decide who does it

The default is a child. For a child, use `type code`, and hand it the `Acceptance`, the `Todo`, and the `Notes` it has to fill in: a child does not need the machinery, and it does not see this conversation.

The exception is size. When the cycle's `What to build` holds three units or fewer **and** the cycle holds five tickets or fewer, the parent does the work itself: at that size, a round trip through a worktree and a ref costs more than the work.

Two things stay with the parent whatever the size:

- a step that needs context the parent cannot hand over — a hole just found, or work that assumes the parent's uncommitted state (a child sees only `HEAD`)
- a `<unit-id>.check` ticket: it is the judgment, and the judgment is the parent's

## Step 3: start from the right place

A step with no dependency starts from `HEAD`. A step that depends on an earlier one starts from **that step's ref**: the dependent child starts from the ref, and when the last one merges, the chain comes in with it.

If the dependency is real and the earlier ref is gone (that step was dropped, or its child failed), cut the step again. What a later step needs is a file, and a file that was never merged cannot be depended on.

## Step 4: run in parallel only where the writes cannot meet

Steps whose files do not overlap may run together, as several inputs of one `consult` call or as one child each. Steps that touch the same file are serialised, and the ticket says which of them comes first.

## Step 5: grouping

Steps may be handed to one child together when they are one piece of work: one call, one ref, and the same hash written into both tickets. Group only what would be verified together; grouping steps that are verified apart turns the closure into a guess.

## Step 6: merge and take the ref

Merge one step at a time. The `Verify` runs on the parent's tree, so a step that is not in the tree cannot be demonstrated.

Take the ref or drop it, and say which, in the `Notes`. A ref means a commit that passed the repository's own hooks, which is the shape to take. When the child produced nothing at all (no `ref:` line, a failure, a timeout), do not invent work: bring it into the parent, do it there, and write what happened.

A `Verify` that fails on the merged tree is a hole in **this** step: fix it here. Never adopt a ref whose `Verify` failed as if the step were done.

## Step 7: demonstrate

Run the `Verify`, and look at the values, not at the exit code. The demonstration must leave nothing behind: what may remain is only what you can delete yourself. A child that **writes** leaves its worktree's commit as a ref (003's step 15 and 002's step 7 both show it), so have the child report the text back instead, and only let it write outside the repository. If the reproduction would touch something that outlives the repository — a shared store, a cache, a global setting — get the owner's permission first.

To find out what a child is allowed to do, ask it for the refusal text, not for a file: a refused command shows the rule without touching the tree.

A `Verify` is not loosened after the fact. If it cannot be run, the step is not done.

## Step 8: close the ticket

`Notes` belong to whoever did the work. A child fills in its own `Findings` and `Unplanned` in the ticket, in its worktree, and they come back with the ref: the record is first-hand, not retold. A hole **inside** this step is fixed here, in a new commit, and written under `Unplanned`; a hole **outside** it is a finding for the next cycle to carry over. When someone other than the writer fixes a hole later, they **append** their own lines; nobody edits another hand's account. A fix that is not written down is a fix nobody can find.

`Commit:` takes the hash of the implementation commit: the one whose content the `Verify` judged. Whoever **takes the ref** writes it, because the hash exists only after `consult` has committed, and a child cannot commit at all (`git commit` needs an approval a child has no UI for). When the step changed no code (a demonstration, a check), say that instead of inventing a hash.

## Step 9: clean up the refs

Use the `ref-cleanup` tool: list first, then delete, one at a time. It refuses anything that is not a `consult/` ref. A ref it refuses to delete is not deleted by hand: `git branch -D` is not the tool's job, and the reason it refused is what the owner needs to see.

## Where the holes found here belong

- a hole in **this** step → fix it here, in a new commit, and write it under `Unplanned`
- a hole in an **earlier** step → do not reopen that ticket: write it under `Findings`, and the cycle's carrying over picks it up
- a hole in a **later** step → write it in this ticket's `Findings`, where that step's ticket can read it

## The failures the text answers

- **the child returns no ref** (it failed, or timed out) → Step 6: bring the work into the parent, do it there, and write what happened
- **the child's work is wrong** (a red test committed anyway) → Step 6: a `Verify` that fails on the merged tree is fixed in this step, not adopted
- **a dependency whose earlier ref is gone** (that step was dropped) → Step 3: cut the step again; a file that was never merged cannot be depended on
- **a ref that cannot be deleted** (`ref-cleanup` refuses, or git fails) → Step 9: leave it, and put the reason in front of the owner

## How not to do this

- Do not let a child judge its own work: the parent runs the `Verify` and decides what to take
- Do not close a ticket without a `Commit:`, or with a hash the `Verify` did not judge
- Do not leave the demonstration's leftovers behind: a written file, a worktree, a ref
- Do not fix a hole silently
- Do not write `Notes` about work you did not do, and do not tidy another hand's account
- Do not count a step as done before it is in the tree and its ref is gone
- Do not delete a ref by hand
