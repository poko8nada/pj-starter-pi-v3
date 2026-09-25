# The definition sheet's format

Section and field names are English. They are the type: the same in every sheet, and fixed.

**The content is Japanese.** The owner reads these sheets, and the project's rule is that documents a person reads are written in Japanese. So the placeholders in the template below are in Japanese on purpose: they show the language the content goes in, not the labels. Keep the labels as they are and write the rest in Japanese.

## Where it lives

The sheet is `cycles/<NNN-YYYY-MM-DD>/definition.md`: the cycle's number and the day it was agreed. Everything for one cycle collects in that one folder, so the cycle can be handled as a folder when it closes, and the number is written once. Another product means another repository; a change of direction is stacked as a later cycle of the same product. A clone starts with an empty `cycles/`.

A closed cycle is recognised by its `Retro`: there is no status field anywhere.

## The shape

```markdown
# <プロダクト名>

## What

- Type: 何であるか
- Who:
  - <id>: 誰か。何をする人か

Changes: keep / update **理由**

## Goal

成し遂げたい状態（利用者の側から書く）

Changes: keep / update **理由**

## Non-goal

- やらないこと
  - Why: やらない理由

Changes: keep / update **理由**

## What to build

### 1. <unit-id>

- Change: keep / update / add **理由**（update と drop は必須）
- Actor: <`Who` の id>
- Given: 前提だけ
- When: 1 つの行動
- Then:
  - 観測できる結果（複数なら箇条書き）

### N. <unit-id>

- Change: drop **理由**

## What to keep

- <unit-id> From: <NNN>

## Stack

## Remarks

- <オーナーの指摘> → <着地先>

## Retro

- Good:
- Bad:
- Carry over:
  - <閉じたチケットの `Findings` を 1 行ずつ、漏れなく>
```

## Units

A unit is one thing the product does, seen from the user's side. The rules:

- **Count everything the product does.** A behaviour without a unit is a hole in the sheet. Count what the product does, not what the repository holds
- **For a product, the harness (checks, hooks, extensions) is given.** It goes in `Stack`, not in the units. This repository is the exception: its product is the harness, so the harness is counted here
- **One unit is one user action.** If the action splits in two, make two units
- **Write from the user's side.** Not the name of a mechanism, but what the person experiences
- **`Then` may be several lines. If it is more than one, make it a list** — do not pack it into one sentence
- **The name is the ID of the thing being made:** English, two nouns, at most one hyphen. Do not name a unit after an explanation of its behaviour. If the artifact already has a name, use it
- **`Actor` points at a `Who` id**, so it can be checked mechanically
- **`Given` is preconditions only.** No steps
- **`When` is one action.** If you want to chain two actions, split the unit
- **`Then` is what can be observed.** A machine-checkable form ("exit 0") is better when it is honest
- **Happy path only.** Error paths (a dropped connection, a bad input, a retry) are covered by the plan's tests, not here
- **But when the core of a feature looks like two behaviours that are two sides of one thing** (pass / block), both sides go in `Then`
- **A capability about failure** (seeing a reason for a refusal, being able to retry) is a separate unit

## Change markers (from `002` onwards)

- A section (`What` / `Goal` / `Non-goal` / `Stack`) ends with `Changes: keep / update **理由**`
- A unit carries `Change: keep / update / add / drop **理由**` at the top
- **Reasons are wrapped in `**`.** Bold is for reasons only: they are what the reader is looking for when they ask "what changed here?"
- **A `keep` unit is not written in `What to build`.** It is collected in `What to keep`, with `From: <NNN>` pointing at the sheet that holds its definition
- `What to build`, `What to keep` and the `Changes:` markers together account for every unit: what is touched, and what stays. `From:` is how you walk back to a definition
- A unit that is `keep` but has never been verified means the previous version had a problem, so it should normally be `update`. If it stays `keep` as an exception, it does not belong in `What to build`
- A `drop` unit has no `Given` / `When` / `Then`: there is no definition for something that will not exist
- `drop` units go after the active ones
- A product's first sheet is all `add`, sections included, whatever the cycle number is: there is nothing yet to carry over. A new product's first sheet is also all `add`, even when other products have been through cycles before it

## Writing

- Do not write what can be derived from the code. Write decisions
- Do not wrap lines mid-sentence. One paragraph is one line: the editor soft-wraps, and a re-flow never touches a line you did not change
- `Retro`, `Stack` and `Remarks` may be empty in a definition. Any other empty section is unresolved
- **`Carry over` is not shortened.** It lists every `Findings` line of the closed cycle's tickets. Shortening it is how a hole gets lost, and the next sheet has to account for each line
- **`Remarks` is a log, not a decision.** One line per remark, `<指摘> → <着地先>`, and the landing place is where it acts (the next sheet, a unit's ticket, a stage's skill, the document that holds the rule). It is written at any time and it is never frozen; a remark that lands nowhere is a hole when the cycle closes
- Prefer whole sheets over diffs: repeating what did not change is allowed, and a `keep` marker says so
- Lines that did not change are copied from the previous sheet exactly. A diff that shows a change where nothing changed is a lie
- Do not put the order of work inside a unit (that is the plan's job)
- Do not enumerate error paths here (that is the tickets' tests)

## Labels

- Section and field names are English (they are the type). The content is Japanese
- **Units are subheadings (`### N. <unit-id>`).** Their fields are the bullets under them, nested by two spaces. Indentation does not survive the formatter, so levels come from headings, not from indentation
- Do not use structures that grow sideways. Tables break with long text
