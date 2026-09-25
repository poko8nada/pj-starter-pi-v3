---
name: plan
description: Use when a definition has been approved and its Stack is filled. Turns the sheet into steps, each with the files it touches and the tests that prove it, and freezes it.
---

# plan

Turn the approved definition into a plan: the order of work, the files each step touches, and the form they have to keep. The definition says what the product does; the plan says in what order it gets built, and what shape holds it. The shape and the field rules are in `references/format.md`.

## Step 1: read the definition

Read the approved sheet. The units are the work, and each unit's `Then` is what the step will be checked against. `What to keep` and `Non-goal` say what will not be touched.

## Step 2: prepare (step 0)

Open with `step 0`, always. It answers three questions before anything is built:

- Install: what has to be added (dependencies the stack already decided)
- Cleanup: what has to go (dead files, dropped dependencies)
- Refactor: what has to be straightened out first, so that the step after it is small

Write なし where there is nothing to do. Leaving it out hides whether it was considered.

**`Cleanup` is where work that belongs to no unit goes.** A tidy-up, a deletion, a move — the definition does not ask for it, and no unit's `Then` covers it, so it gets no step of its own: a step exists to carry a `Then`. It is written here, and it is still written down.

## Step 3: split the units into steps

A step is the smallest thing that can be verified on its own. When a unit needs more than one, split it and name the parts `<unit-id>.<part>`: the dot is what shows which unit a step belongs to.

When a unit is split, close it with a `<unit-id>.check` step: one run that verifies every `Then` of that unit together. A step's own `Verify` covers only its part, so without this the unit as a whole is never checked.

The step numbers are the order of work, and that order is the implementation order. A step that changes a skill comes before the steps whose work that skill carries: while the skill is wrong, every step carried under it is carried wrong.

## Step 4: fill each step

- `What`: what this step does, in one line
- `Depends`: what has to be done first (another step, or nothing). **A dependency is not only documents: a step can need a tool.** When a step relies on a skill or on code that is not right yet, the step that puts it right comes first, and that order is written here. A stale skill is fixed by a step of its own, not on the way to some later one
- `Action`: `build` when something is produced, `verify` when the step only checks
- `Files`: the files it touches. Test files are colocated, so they do not appear in `Structure`
- `Tests`: the test file names. Error paths live here; the definition deliberately leaves them out. When the step moves the form — it adds, moves or drops files and folders — the verification is the form, not a behaviour: `Tests` holds the command or the reading that shows it. A step that adds a check says what world that check declares, and what it sets up for itself instead of inheriting

## Step 5: write the structure and the form

The definition's `Then`s say what is built; they do not say what shape holds it. Ask these before drawing the tree, adapting them to the plan rather than reciting them, and bring a recommended answer to each:

- the design side: where do the values live? who reads them? what is the seam?
- the boundary side: where is the boundary? who may cross it? which boundary faces the outside?

One question at a time, and stop when the answers stop moving the plan. A fact the repository already holds is looked up, not asked.

`## Structure` lists the files the plan changes, as a tree, with one marker per line: `add`, `update` or `drop`. Only the changes: what stays untouched is not drawn. **The tree is the form**: write the folders nested, one line per folder with its files under it, so the shape reads at a glance. If the range widens while the plan is being written — an owner's remark, say — this follows it, because the picture and the steps have to agree. After the freeze it does not: a file that turns out to be needed is recorded in the ticket that touched it, not by editing the plan

**Ask what the folder looks like after.** When the plan adds a file or a folder, ask whether that folder still stands for one thing once the file is there. If it does not, the tidy-up is this plan's, and it is not optional: put it in `step 0`'s `Refactor` when it comes before the work, or in a step of its own when it carries a `Then`. `Refactor: なし` is a decision, not a default.

`## Layers` writes the layers and the direction between them, next to `Structure`, **as one rule**: a value feeds the style layer, the style layer feeds the part, and a layer does not know the one above it. The same rule is the boundary rule — who may cross into whom — so a front end and a back end are not two templates here, they are the same rule seen from two sides. Write the edges that must not exist as `A は B を知らない`, one line each, and the edges that may exist.

`## Seam` writes the seam: what can be exchanged without touching the rest. The plan keeps that premise, so a shape that would break it is not put into the plan; when the seam itself has to move, that move is a decision, and it is written here.

## Step 6: review it

Before the owner sees it, put the plan in front of a `review` child: it has not read this conversation, so it does not fill in what the plan leaves unsaid. Fix what it finds, and repeat until it comes back with nothing.

Each round is one child, and the checklist below is the whole of what it is asked. A fixed checklist is what makes this converge: the reviews stop when a round raises no new finding. Cap it at three rounds, and take whatever is left to the owner.

The task, verbatim:

- Check the plan against the definition, and nothing else:
  - every unit is a step
  - every `Then` has something that verifies it (a test, or a demonstration)
  - each step can be verified on its own, and its `Depends` is the real dependency
  - every file in `Files` appears in `Structure`, and every file in `Structure` belongs to a step (test files excepted)
  - nothing is built that the definition does not ask for
  - every field is filled, `step 0` says なし where there is nothing, and the error paths are in `Tests`
  - `Layers` says the direction, and `Seam` says what can be swapped
  - a step that moves the form verifies the form, and the shape question has an answer
- Report findings only, each with its file and line, marked blocking or not. If there is nothing, say "no findings".

The input is the plan file: one child, no other input. Do not cut tickets from the plan until this comes back clean.

## Step 7: put it to the owner

Do not cut tickets yet, and do not commit. Show the steps and the structure.

- a correction sends you back to Step 3
- when they say yes, commit. The plan is frozen by that commit and is not edited afterwards: what changes during the cycle is recorded in the tickets, not here
- show the review's findings and what you did with each: fixed, or answered with a reason. That is what makes this step short

## How not to do this

- Do not write the order of work into the definition; it belongs here
- Do not leave a step without a file or without a test: a step nobody can point at is not a step
- Do not add a file without asking what the folder looks like after: an increase in files is not automatically an increase in what the folder is
- Do not write a plan whose shape breaks its own seam
- Do not edit a frozen plan. A change is recorded in the ticket that hit it
