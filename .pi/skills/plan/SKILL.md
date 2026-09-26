---
name: plan
description: Use after the definition and its Stack. Turns the gap between Now and Then into steps, and freezes it.
---

# plan

A cycle is one plan.

The plan fills the gap between the state today and the state after the build.

The definition says what the product does. The plan says in what order it is built, and the tickets are cut from its steps.

The shape of the file and its field rules are in `references/format.md`.

Read that before writing anything.

## Steps

1. **Read the definition.** The units are the work.
2. **Take the gaps.** For each unit, the gap between its `Now` and its `Then`:
   - the `Now` lines: the state today, and what `Structure` touches
   - the `Then` lines: the state after the build, and what proves a step
   - an empty gap: the unit is not in the plan
   - a gap too big for one step: split it into `<unit-id>.<part>`
   - a split unit is closed by a `<unit-id>.check` step: one run that proves every `Then` of it
3. **Read the existing code.** The gaps land in a repository that is already there.
   - read what is around where they land
   - ask: does this build make the structure worse?
     - a file that would hold haphazard logic
     - a structure that becomes flat, where nothing can be found
     - a dependency that becomes complex
     - a layer or a dependency that breaks
   - if none of them: no refactor step
4. **Write the refactor step.** For each thing the build makes worse:
   - the name is `<unit-id>.refactor`: the unit whose build needs it
   - `Why` is the worse thing, in one line, with the names of the place
   - `What` is what is straightened out in the existing code
   - it comes before the work when it has to: an early number, `Depends: なし`
   - otherwise it comes after the step that made it necessary, and `Depends` names it
   - a deletion or a move that no unit needs is not a step: it is one line in `step 0`'s `Cleanup`
   - the cost is the owner's call: a tidy-up takes time
5. **Order the steps.** The numbers are the implementation order:
   - a step that fixes a skill comes before the steps its work is carried under
   - `Depends` names that step
6. **Fill the fields.** With the owner where a field is a decision.
7. **Draw the form.** `Structure`: the tree after the gaps are filled, one marker per line:
   - ask what a folder looks like after a file is added
   - when it stops standing for one thing, the tidy-up is a `<unit-id>.refactor` step
8. **Read it against `references/format.md`**, once, before anyone else sees it.
9. **The `review` child**, with the checklist below:
   - fix what comes back, and repeat until it is clean
   - cap it at three rounds
10. **The owner.** Show the steps and the form, and the findings with what you did with each.
11. **Commit.** The commit is the freeze mark:
    - the plan is not edited afterwards
    - what changes during the cycle is recorded in the ticket that hit it

A fact the repository holds is looked up, not asked. Ask only what changes the file.

## The file

`cycles/<NNN-YYYY-MM-DD>/plan.md`, following `references/format.md`.

- Write a field only when it can be derived from the repository, or when the owner can correct it

## The review's checklist

The `review` child of step 9 gets this, and nothing else:

- every unit with a gap is a step
- a `<unit-id>.refactor` step has no gap: it is there to straighten out
  - its `Why` names what the build makes worse
- every `Then` has something that proves it
- each step can be verified on its own, and its `Depends` is the real dependency
- every file in `Files` is in `Structure`, and every file in `Structure` belongs to a step
- test files are the exception
- nothing is built that the definition does not ask for
- every field is filled, and `なし` is written where there is nothing
- the error paths are in `Tests`
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
