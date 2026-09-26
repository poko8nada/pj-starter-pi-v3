---
name: plan
description: Use after the definition and its Stack. Turns the gaps into steps, and freezes it.
---

# plan

A cycle is one plan.

The definition says what the product does.

The plan says in what order it is built.

The owner agrees the plan: the order, the steps and the form.

What a step is made of is the ticket's.

The shape of the file and its field rules are in `references/format.md`.

Read that before writing anything.

## Steps

1. **Read `What to build`.** The units are the work.
2. **Take the gaps.** For each unit, the gap between its `Now` and its `Then`:
   - the `Now` lines: the state today
   - the `Then` lines: the state after the build
   - an empty gap: the unit is not in the plan
3. **Split what is too big.** A step is one child's work:
   - its `Verify` is a few types, and it runs when the step closes, not later
   - when one child cannot finish it in one go, split it into `<unit-id>.<part>`
   - the parts divide the unit's `Now` lines: together they cover every line once
   - the parts stand in order, and each `Depends` is the part before it
   - a unit that is split is closed by a `<unit-id>.check` step
     - one run that proves every `Then` of it
4. **Read the existing code.** The gaps land in a repository that is already there:
   - read what is around where they land
   - ask: does this build make one name stand for two things?
     - the file, the folder or the value that would take a second job
     - a reader who would read it two ways
   - if none: no refactor step
5. **Write the refactor step.** For each thing the build makes worse:
   - the name is `<unit-id>.refactor`: the unit whose build needs it
   - `Why` is the worse thing, in one line, with the names of the place
   - `What` is the relation, the same as a unit's: the `Why` line, and what it becomes
   - it comes before the work when it has to: an early number, `Depends: なし`
   - otherwise it comes after the step that made it necessary, and `Depends` names it
   - a deletion or a move that no unit needs is not a step: it is one line in `step 0`'s `Cleanup`
   - the cost is the owner's call: a tidy-up takes time
6. **Order the steps.** The numbers are the implementation order:
   - a step that fixes a skill comes before the steps its work is carried under
   - two steps that touch the same file cannot run together: the later one depends on the earlier
   - a step that uses what an earlier step produced depends on it
   - otherwise: `Depends: なし`
7. **Fill the fields.** With the owner where a field is a decision:
   - `Files`: the files it touches. The tests are the ticket's
   - `Verify`: the types that decide every line of `What`
     - take each line of `What`, and ask which type gives a verdict on it
     - a line with no type: stop and propose the type to the owner
8. **Draw the form.** `Structure`: the tree after the gaps are filled, one marker per line:
   - ask what a folder looks like after a file is added
   - when it stops standing for one thing, the tidy-up is a `<unit-id>.refactor` step
9. **Read it against `references/format.md`**, once, before anyone else sees it.
10. **The `review` child**, with the checklist below:
    - fix what comes back, and repeat until it is clean
    - cap it at three rounds
11. **The owner.** Show the steps and the form, and the findings with what you did with each.
12. **Commit.** The commit is the freeze mark:
    - the plan is not edited afterwards
    - what changes during the cycle is recorded in the ticket that hit it

A fact the repository holds is looked up, not asked. Ask only what changes the file.

## The file

`cycles/<NNN-YYYY-MM-DD>/plan.md`, following `references/format.md`.

## The review's checklist

The `review` child of step 10 gets this, and nothing else:

- every unit with a gap is a step
- a `<unit-id>.refactor` step has no gap: it is there to straighten out
  - its `Why` names what the build makes worse, and its `What` is the relation
- together, the steps of a unit carry every `Now` line of it, once
- every line of `What` is decided by one of the `Verify` types
- each step can be verified on its own, and its `Depends` is the real dependency
- every file in `Files` is in `Structure`, and every file in `Structure` belongs to a step
- nothing is built that the definition does not ask for
- every field is filled, and `なし` is written where there is nothing
- a step that moves the form is proved by the form

Report findings only, each with its line, marked blocking or not.

## What is frozen

- **The definition** — freezes at its own commit
  - A correction that moves it goes back to the `definition` stage
- **The plan** — freezes at the commit that agrees it, and is not reopened
- **The tickets** — freeze at the commit that agrees them
  - Revised only before that step starts, with the reason and the owner's agreement

## How not to do this

- Do not write a step that no `Then` asks for
- Do not write the tests here: they are the ticket's
- Do not add a file without asking what the folder looks like after
- Do not ignore what the build makes worse in the structure
