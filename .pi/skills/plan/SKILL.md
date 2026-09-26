---
name: plan
description: Use after the definition and its Stack. Turns the gap between Now and Then into steps, and freezes it.
---

# plan

A cycle is one plan.

The plan fills the gap between the state today and the state after the build.

The definition says what the product does. The plan says in what order it is built, and the tickets are cut from its steps.

The shape of the file and its field rules are in `references/format.md`. Read that before writing anything.

## Steps

1. **Read `What to build`.** The units are the work.
2. **Take the gaps.** For each unit, the gap between its `Now` and its `Then`:
   - the `Now` lines: the state today
   - the `Then` lines: the state after the build
   - `What` is the relation: one line per `Now` line, and what it becomes
   - an empty gap: the unit is not in the plan
3. **Split what is too big.** A step is the smallest thing that can be verified on its own:
   - its `Verify` is one thing, and it runs when the step closes, not later
   - when the unit's `Verify` cannot be written as one thing, split it into `<unit-id>.<part>`
   - the parts divide the unit's `Now` lines: together they cover every line once
   - the parts stand in order, and each `Depends` is the part before it
   - the unit is closed by a `<unit-id>.check` step: one run that proves every `Then` of it
4. **Read the existing code.** The gaps land in a repository that is already there.
   - read what is around where they land
   - ask: does this build make the structure worse?
     - a file that would hold haphazard logic
     - a structure that becomes flat, where nothing can be found
     - a dependency that becomes complex
     - a layer or a dependency that breaks
   - if none of them: no refactor step
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
   - `Depends` names that step
7. **Fill the fields.** With the owner where a field is a decision:
   - `Files`: the files it touches
   - `Verify` has two parts, and the step names the kinds that fit what it builds:
     - `Run`: the machine runs it — the cases, the types, the lint, the build, the form
     - `Look`: a person looks at it — a value, a screen in the browser, a file, a diff
     - a component or a front end: the types and the build in `Run`, a walk in the browser in `Look`
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

- Write a field only when it can be derived from the repository, or when the owner can correct it

## The review's checklist

The `review` child of step 10 gets this, and nothing else:

- every unit with a gap is a step
- a `<unit-id>.refactor` step has no gap: it is there to straighten out
  - its `Why` names what the build makes worse, and its `What` is the relation
- together, the steps of a unit carry every `Now` line of it, once
- every `Then` has something that proves it
- each step can be verified on its own, and its `Depends` is the real dependency
- every file in `Files` is in `Structure`, and every file in `Structure` belongs to a step
- nothing is built that the definition does not ask for
- every field is filled, and `なし` is written where there is nothing
- the error paths are in `Verify`
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
- Do not leave a step without a file or without something that proves it
- Do not add a file without asking what the folder looks like after
- Do not ignore what the build makes worse in the structure
