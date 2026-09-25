---
name: definition
description: Use when a cycle starts or closes, or when a request may change the sheet's What, Goal or Non-goal. Writes the one-page definition for a product, grills the owner one question at a time until you share the same understanding, then freezes it.
---

# definition

A cycle is one sheet for one product. The sheet is frozen by a commit, and after that it is never edited, except for the three sections that stay writable: `Stack`, `Remarks` and `Retro`. A later cycle writes a new sheet that carries the differences.

This skill writes that sheet, and closes the previous one. The shape of the sheet, its field rules, its change markers and its language rules are in `references/format.md` (relative to this file). Read that before you write anything. The later stages of the cycle have their own skills, and each of those says in its description when to read it.

## Step 1: the impulse

Ask the owner what this cycle is for. One line is enough ("rebuild the reader", "add a trend chart", "make the export work"). Nothing else is known yet, so this is the one question with no material behind it.

## Step 2: gather the facts, do not ask

Send `consult` with the `research` type, one child per subject, in parallel (the same task, split by input):

- the previous sheet, to see what the product already is
- the closed cycle's tickets, for their `Findings` (a hole recorded there is material for this sheet)
- no input, for the repository itself: the code, the config, whatever the sheet has to agree with

Gathering the facts is not the owner's job. The decisions are, and those are the only things Step 4 asks about. If a question can be answered from what comes back, ask the repository instead of the owner.

The `Findings` of closed tickets are also the source of the previous cycle's `Retro` carry-over. Do not read them from memory; read them from the tickets.

## Step 3: settle the scope

Decide which sections move in this cycle, and say so before writing anything. The change markers are the record of "what moved", and they are settled here, first: `Changes:` on the sections, `Change:` on the units. Their exact form is in `references/format.md`.

There are two entry points, depending on where the impulse comes from.

**Frame first** (a rebuild, or a change of direction): `What` → `Goal` → `Non-goal`, then the units. A rebuild moves all three.

**Unit first** (an addition, a fix): before touching the units, check whether the change moves `What`, `Goal` or `Non-goal`.

- If it does, switch to frame first and settle the frame before you write any unit.
- If it does not, the three sections stay `keep`, and you go straight to the units.

A unit that contradicts the frame is the definition of a hole. Never write one.

Propose the scope, with a recommendation and with the markers spelled out, and get it confirmed. This proposal is the first question of the grilling.

## Step 4: grill the sections

Sections move in the order they depend on each other: `What` → `Goal` → `Non-goal` → the units. Do not ask about a later section while an earlier one is still open.

**A section is done when your questions run out, not after one question.** Grill `What` with as many questions as it needs, one at a time, until a recommendation no longer draws a correction and you cannot think of another question. Then move to `Goal`, and so on. Three questions in one pass and done is not this.

- **One question at a time.** Waiting for each answer is not slowness; several questions at once is bewildering, and the answers blur into each other.
- **Bring a recommended answer to every question.** The owner corrects a position faster than they fill a blank. "I would say the goal is X — does that match?" beats "what is the goal?".
- **Ask only what changes the sheet.** If the answer cannot change a line of the sheet, it is not a question. Look it up instead.
- **Facts are looked up, decisions are asked.** Keep the two apart, and say which one you are asking for.
- **Keep going until you share the same understanding.** That is the end condition, not "the sheet has been written".

Starting questions, to adapt rather than recite:

- `What`: what is this? who is it for? what is it not?
- `Goal`: with this in hand, who is in what state? what is missing today?
- `Non-goal`: what are we deciding now not to do? where is the boundary?

## Step 5: count the behaviours

Close the grilling with one question: "with this `Goal` and these `Non-goal`s, what does the product need to do?" The units come out of this answer.

Counting file by file is not counting. Count what the product does. If something the product does has no unit, the sheet has a hole.

## Step 6: build the units

Derive the units from what the frame and the facts say. This is your job, not the owner's: you are the one who read the repository and counted the behaviours, and the units are a derivation, not a preference. Bring them as a proposal.

Do not walk the owner through the units one by one. That is not what the grilling is for, and it turns a derivation into a questionnaire. They will correct the result.

Before you write them down, read them against the frame. A unit that needs a `Non-goal` changed, or that only makes sense under a `Goal` you did not agree on, means the frame moves: go back to Step 3 instead of writing a unit the frame cannot explain.

## Step 7: write the sheet

Write it whole, following `references/format.md`. Three things about the sheet are worth keeping in mind here:

- **`Stack` stays empty, and that is not an unresolved section.** It is filled later, after this sheet is frozen
- **`Retro` is empty by definition.** It is written when the cycle closes, in Step 10 or in a later run
- **`Remarks` is empty until the owner says something.** It is written while the cycle runs, and it is never frozen

The sheet also carries the accounting of the previous one, in `## Carry over`: one line per line of the previous sheet's `Carry over`, reading `<前の 1 行> → <受けた場所>` — the same one-line shape as `Remarks`. The landing place is where that line now lives: a unit (`What to build` or `What to keep`), a `Non-goal`, a `Changes` reason, or an explicit refusal with its reason. Nothing is shortened, and a line that lands nowhere is a hole in this sheet, so every line of the previous `Carry over` is written. **`## Carry over` is empty only in the first sheet**, which has no previous cycle; from the second sheet it holds the previous lines.

Then read your own sheet against `references/format.md`, once, before anyone else sees it: the nine sections, the markers, and the language of the content.

## Step 8: review it

Before the owner sees it, put the sheet in front of a `review` child. The frame has been grilled with the owner, so the part they have not seen is the units: this is where those get a second pair of eyes. Fix what comes back, repeat until it comes back clean, and cap it at three rounds. A fixed checklist is what makes this converge.

The task, verbatim:

- Check this definition sheet against the format and against itself, and nothing else:
  - the nine sections are there, and no section is empty except `Stack`, `Retro` and `Remarks`, and `Carry over` on the first sheet
  - the markers are right: `Changes:` on the sections, `Change:` on the units, reasons in bold, and no `keep` unit written under `What to build`
  - every behaviour the `Goal` and the `Non-goal`s ask for has a unit
  - no unit contradicts the frame
  - labels are English, and the content is Japanese
- Report findings only, each with its line, marked blocking or not. If there is nothing, say "no findings".

The input is the sheet. Do not show it to the owner until this comes back clean.

The same holds for any child you hand a piece of writing to: give it a subject the repository does not already answer. A child can copy what is in the tree, and a copy proves nothing.

## Step 9: put it to the owner

Do not commit anything yet. Put the sheet in front of the owner and talk it through:

- start with `What to build`, the part they have not seen: it is your derivation, and a proposal is easiest to correct there
- then the sheet as a whole, so the parts are seen together once
- a correction that moves `What`, `Goal` or `Non-goal` sends you back to Step 3; do not patch the unit and leave the frame behind
- show the review's findings and what you did with each: fixed, or answered with a reason
- when they say yes, commit. **The commit is the freeze mark**, and that cycle's sheet is not edited afterwards

## Step 10: close the previous cycle

Close it in its own sheet, and never touch that sheet again for anything else:

- write `Retro` — `Good`, `Bad`, and `Carry over`. The carry-over holds every line the closed cycle's tickets left unresolved in their own step — every `Findings` line, and any `Unplanned` line that its step did not fix — copied as it was written. Copying is not shortening; shortening is how they get lost
- put it to the owner: they are the only one who can judge `Good` and `Bad`, and they are the last check that `Carry over` is complete
- when they say yes, commit. That commit closes the cycle (the commit is the freeze mark; nothing about that cycle is edited afterwards)

`Carry over` is what the next sheet has to account for, and Step 7's accounting section says how: the next sheet's `## Carry over` holds one line per line here, each with the place that received it — a unit, a `Non-goal`, a `Changes` reason, or an explicit refusal with its reason. A carry-over line that lands nowhere is a hole in the next sheet.

A cycle may be abandoned. If the definition breaks, close the cycle and move to the next one, with the reason in the `Retro`. Dropping work early is cheap, and keeping it cheap is the point.

Then write this sheet's `Changes` from the differences. `Retro` is the experience and the carry-over, `Changes` is the decisions, and the order runs experience → decisions.

## What is frozen, and when

| What                 | Freezes at                  | How it changes after that                                                                                                                      |
| -------------------- | --------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| the sheet            | the commit that agrees it   | never edited. `Stack`, `Remarks` and `Retro` are written into it later, and the next cycle writes a new sheet                                  |
| the plan             | the commit that agrees it   | not reopened. A change is recorded in the ticket that hit it                                                                                   |
| the tickets          | the commit that agrees them | revised only before that step's implementation, with the previous step's `Notes` or an owner's remark as the reason, and the owner's agreement |
| the skills, the code | nothing                     | never frozen. Fix before the next use                                                                                                          |

A ref belongs to the stage that made it: the stage that decides to take or drop it deletes it then, and only the tool does the deleting (`ref-cleanup`) — never `git branch -D` by hand. A demonstration that hands the writing to a child (`trial`, `code`) can leave one behind, so prefer a child that reports the text back.

## Remarks

While the cycle runs, what the owner says is recorded in the sheet's `Remarks`: one line per remark, reading `<指摘> → <着地先>`. It is written at any time, and it is never frozen.

Where a remark lands is where it acts:

- it moves the frame (`What` / `Goal` / `Non-goal`) → the next cycle's sheet
- it changes a unit → that unit's ticket
- it is about how a stage is run → that stage's skill
- it is a rule for cycles → the document that holds that rule

**A remark that moves the frame does not touch a unit.** If it only makes sense under a `Goal` that was not agreed, or if it moves a `Non-goal`, the frame moved: leave the units alone and let the next sheet carry it.

Decisions live in the repository, not in the conversation — a remark that stays where it was said will come back. When the cycle closes, `Retro` reads the `Remarks` once: a remark that landed nowhere is a hole.

## How not to write this

- Do not put check marks in a sheet. The commit hash is the state
- Do not update a written sheet (write the next one)
- Do not put the order of work inside a unit (that is the plan's job)
- Do not enumerate error paths in the definition (that is the tickets' tests)
