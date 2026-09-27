---
name: stack
description: Use when a definition is approved. Writes its Stack section, after the freeze.
---

# stack

A definition is approved, and its `Stack` section is still empty.  
What a product is built with is decided here, and written into that section.  
The section has three parts: the `Runtime` it stands on, the `Deploy`, and the `Added` things.  
Every cycle passes through here, even when nothing changes.  
The shape of the section is in `../definition/references/format.md`.  
Read that before writing anything.

## Steps

1. **Read the definition.** The candidates come from it:
   - `### Type`: what kind of thing this is
   - `### Who`: who acts in it
   - each unit's `Does`: what the product does
   - `## What to keep`: what stays as it is
   - the `Retro`'s `Carry over`: what was left open
2. **Read the stack before it.**
   - the previous `Stack` is the starting point
   - what was decided stays decided until something moves
   - the units this cycle marks `update`, `add` or `drop` are where it moves
3. **Read the runtime and the language.** They are in the repository.
   - this comes first: the runtime bounds what can be put on it
4. **Find the facts.** The `consult` tool, type `research`.
   - what this kind of product is built with now, and what each piece costs
   - the units say what is needed: 買い物かごに入れる → a place to hold the state
   - ログインする → authentication; 一覧を表示する → the parts a screen is built from
   - it returns facts, not a recommendation: the options are yours
5. **Make the options.** Two or three whole stacks, from those facts:
   - what each costs, and what each buys
   - each option says whether it ships, and where to: see "The fields"
   - (a) a router only, and hand-rolled state / (b) a framework, and its parts
   - when no unit asks for anything new: the option is "nothing to add", and the owner still picks
6. **The owner picks.** One option, or a mix of them.
   - stop here until they have: the rest follows their pick
7. **Try what is not obvious.**
   - when the dependency, the configuration or the shape of the API cannot be read
   - a `trial` child: see "The trial child"
   - ask the owner before running one
8. **Write the `Stack`.** The shape is in `../definition/references/format.md`.
   - the field rules are in "The fields"
9. **The `review` child**, with the checklist below:
   - the `consult` tool, type `review`
   - it gets the definition file and this checklist, in one call
   - fix what comes back, and repeat until it is clean, up to three rounds
   - what is left after three rounds goes to the owner
10. **The owner.** Show what was added, and what a trial reported.
    - a rejection sends you back to step 5
11. **Commit.** After step 10's yes.

A fact the repository holds is looked up, not asked. Ask only what changes the file.

## The file

`cycles/<NNN-YYYY-MM-DD>/definition.md`, the `## Stack` section only.

## The fields

- `Runtime` is the ground the product stands on: the runtime and the language, names only
  - the test: does a reader know what this runs on without opening the repository?
  - `Node / TypeScript` — the runtime
  - it comes before the others: the runtime bounds what can be put on it
- `Deploy` is whether it ships, and where to
  - the test: is a reader told that it does not ship, or where it ships?
  - `なし` — it does not ship
  - `Cloudflare Workers, on push to main` — it ships
  - empty — not decided yet, and that is not the same as `なし`
- `Added` is what this product decided to put on the runtime: one line each
  - the test: did this product decide it, or did it come with the ground?
  - `shadcn`, an auth library, a DB and an ORM — a product's additions
    - what came with the ground is not written
  - `なし` when nothing was put on it: it is a decision, and it looks different from an empty line
- the marker is written with the rest:
  - the test: does the marker match what changed, in the content or in the shape?
  - a product's first definition: `Changes: add`
  - after it: `Changes: keep` when nothing changed, with the previous lines copied verbatim
  - `Changes: update`, with the reason, when something changed
    - when the shape itself moved: `update` too, and the reason says how
- the section is the stack now, not a log of the cycles: what is no longer true is dropped
- a line that did not change is copied as it was: a change where nothing changed is a lie
  - the test: is every line still true, and is it the stack now?

## The review's checklist

The `review` child of step 9 gets this checklist and the definition file, and nothing else:

- every unit's `Does` has what it needs, or a reason it needs nothing added
- nothing is in `Added` that this product did not decide
- the runtime is the one the repository uses, and `Deploy` is decided
- the marker is right: `add` on a product's first definition, `keep`, or `update` with its reason

Report findings only, each with its line, marked blocking or not.

## The trial child

- the `consult` tool, type `trial`
- it works in its own worktree, with the dependencies installed: this tree is not touched
- what it writes stays in a ref: its report comes back, the files do not
- a trial that fails is a result: it takes that candidate off the list
- drop the ref with `ref_cleanup` when the report comes back, never by hand
- the package lands in the shared store on the owner's machine: ask first

## How not to write this

- Do not decide the stack before the definition is approved: the constraints come from it
- Do not walk a checklist of slots: the candidates come from the units
- Do not leave a unit's need undecided: it is either in `Added`, or it needs nothing
