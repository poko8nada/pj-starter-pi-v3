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

### Type

何であるか

### Who

- <id>: 誰か
  - Does: その製品で何をするか
  - Needs: その製品に何を必要としているか

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

## Carry over

- **<主題>**（`<前のチケット>`）→ <受けた場所>

## Retro

### Good

- **<主題>** — <何がどうなったか（値つき）>

### Bad

- **<主題>** — <何がどうだったか（値つき）>

### Carry over

- **<チケット名>**
  - **<主題>** — <中身>（次へ回す / 未解決）
```

## Who

`Who` is the product's users: the roles that act in the product. Pick them from this list.

- people: owner / administrator / operator / moderator / staff / member / user / customer / subscriber / guest / visitor / author / editor / reader / viewer / buyer / seller / player / student / teacher
- developers, for a library, a framework, an API or a CLI: developer / integrator / plugin author
- not a person: another service / the side that sends a webhook / agent / an organisation or a team

When nothing in the list fits, propose an addition.

Then write, for each one, what they do in the product and what they need from it (`Does` and `Needs`):

- what they do — and what they want to do
- what they need

The assumption the list rests on: this harness is general-purpose for building anything web-related, so the users differ from product to product.

## Units

A unit is one thing the product does, seen from the user's side. The rules:

- **Count everything the product does.** A behaviour without a unit is a hole in the definition. Count what the product does, not what the repository holds
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

- A section (`What` / `What to build` / `What to keep`, and `Stack` once it has content) ends with `Changes: keep / update **理由**`
- A unit carries `Change: keep / update / add / drop **理由**` at the top
- **Reasons are wrapped in `**`.** Bold is for reasons only: they are what the reader is looking for when they ask "what changed here?"
- **A `keep` unit is not written in `What to build`.** It is collected in `What to keep`, with `From: <NNN>` pointing at the definition that holds it
- `What to build`, `What to keep` and the `Changes:` markers together account for every unit: what is touched, and what stays. `From:` is how you walk back to a definition
- A unit that is `keep` but has never been verified means the previous version had a problem, so it should normally be `update`. If it stays `keep` as an exception, it does not belong in `What to build`
- A `drop` unit has no `Given` / `When` / `Then`: there is no definition for something that will not exist
- `drop` units go after the active ones
- A product's first sheet is all `add`, sections included, whatever the cycle number is: there is nothing yet to carry over. A new product's first sheet is also all `add`, even when other products have been through cycles before it

## 何を書くか（`Good` / `Bad`）

- `Good` says what the cycle made happen, with the value it was read from. `Bad` says what went wrong, including what was left half-done. **Both are heading 3**, and one item is one line: `- **<主題>** — <中身>`. The subject is what a reader scans for, so a line without one is a line nobody finds
- **A line has to earn its place.** Ask what the reader loses if the line is gone. If the answer is nothing — the code, the commit, or another line already says it — do not write it. A heading whose children are only more names is the same failure: write the content, or drop the line
- `Carry over` is not a second `Bad`. **It is grouped by ticket**, and it holds only the items the tickets marked `次へ回す` or `未解決` — the holes the next sheet has to take. A ticket that left nothing gets no heading here. A hole the closing stage itself found has no ticket: it gets its own group, named for the stage

## Writing

- **One line carries one thing.** A line holding two events is split into a short line plus 2-space sub-lines under it. A sub-line must say something the line above does not: a sub-line that only repeats the stem means the line was a list, and a list stays on one line. A list of values is one thing — `null / 空 / 境界`, the names of tools, the markers `add / update / drop`
- **Do not chain events with `/`, nested parentheses or `→`.** `→` is for a landing place, and `input → result` cases keep theirs. Swapping a separator for `、` is not a split; it is the same crammed line
- **Do not write what the reader can look up.** Not the commands that were run, not that the checks were green (an observation is one line: `green`), not what the code, the diff or the commit already shows
- **Do not wrap a sentence across lines, and do not use structures that grow sideways.** One paragraph is one line: the editor soft-wraps, and a re-flow never touches a line you did not change. Tables break with long text
- **`Carry over` copies holes, not noise.** Every hole a ticket left unresolved is copied as it was written, and noise is never copied — it is not written in the first place. A line numbers nothing: point by file and heading
- `Stack` and `Retro` may be empty in a definition. `Carry over` may be empty only in the first sheet, which has no previous cycle; from the second sheet it holds one line per line of the previous definition's `Carry over`. Any other empty section is unresolved

- Prefer whole sheets over diffs: repeating what did not change is allowed, and a `keep` marker says so
- Lines that did not change are copied from the previous sheet exactly. A diff that shows a change where nothing changed is a lie
- Do not put the order of work inside a unit (that is the plan's job)
- Do not enumerate error paths here (that is the tickets' tests)

## Labels

- Section and field names are English (they are the type). The content is Japanese
- **Units are subheadings (`### N. <unit-id>`).** Their fields are the bullets under them, nested by two spaces. Indentation does not survive the formatter, so levels come from headings, not from indentation
- Do not use structures that grow sideways. Tables break with long text
