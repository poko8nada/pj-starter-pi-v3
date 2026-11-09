# Close format

`cycles/<YYMMDD>-<NNN>-<slug>/close.md`, in the shape below. It is the cycle's last word.

## Shape

```md
# Close <NNN>

## Collected

### <NN> <plan id> (ADR <プランの No の値>) — `NN` のあるプラン

### <plan id> (ADR <プランの No の値>) — `NN` を持たない `ex-` のプラン

### (ADR <NN>) — 運ぶ計画がない項目

1. <line> / <place> / <出どころ>

## Triage

- <N>: _ex-plan_ (ADR <NN>, <定義の部分>) — the grouping has not named the plan yet
  - Fact: <何が起きて現状どうなっているか>
  - Why: <このトリアージ案を推奨した理由>
  - Then: <ex- の場合はどういう方針のプランを立てるか、_proposed_ の場合は次に論点にすべき点、drop の場合はなし>
- <N>: _ex-plan_ <plan id> (ADR <NN>, <定義の部分>) — after the grouping
- <N>: _proposed_ (ADR <NN>, <定義の部分>)
  - Fact: <何が起きて現状どうなっているか>
  - Why: <このトリアージ案を推奨した理由>
  - Then: <次に論点にすべき点>
- <N>: dropped (ADR <NN>, <定義の部分>)
  - Fact: <何が起きて現状どうなっているか>
  - Why: <このトリアージ案を推奨した理由>
  - Then: なし

## Verified

### <Unit>

- Plans:
  - `<plan id>`
- Result: <OK / 見つかったもの / しない — 理由>
- Fixed: `ex-<what it fixes>` (<commit>)
```

## Collected

The inventory of the cycle's leftovers, one numbered line for each.

- The script writes `close.md` itself.
- It creates the file when it is not there.
- The script is `node .pi/skills/close/scripts/collect.mjs cycles/<YYMMDD>-<NNN>-<slug>`.
- It writes `## Collected`.
- One leftover is one numbered line, in `<line> / <place> / <出どころ>`: the line in the plan md (the heading above names the plan), and where the hole came from (`Slice 1 (名前)`, `Cleanup: <what it cleaned>`, `Work Review Round 1`, `Acceptance`).
- It is the inventory only.
- The agent excludes what the wording shows is already resolved, by hand, after every run of the script.
- The script rewrites the numbered lines, so re-filter every time.
- A hole the script cannot see — a change an entry decided that no plan carries — is added by the agent as a numbered line, in the same shape, after every run of the script.
- A hole no plan carries goes under `### (ADR <NN>) — 運ぶ計画がない項目`, naming its entry.

### Heading

- The heading of a normal plan carries the `No` of its plan md.
- `未特定` when the plan md has no `No` (a plan written by hand).
- The `## Collected` heading's `No` for an `ex-` plan comes from the Triage, in the `<NN>` of the `ADR <NN>` in the Triage line `- <N>: _ex-plan_ <plan id> (ADR <NN>, <定義の部分>)`.
- A missing Triage line is `未特定`.
- A line the grouping has not named yet is `未特定`: the plan's name comes first.
- Fill it before showing the owner.

### Order

- The numbering runs through the whole file.
- A plan with no leftover is not listed.
- `なし` when there is none.
- The order is the `NN` numeric order for the plans that have an `NN`.
- The `ex-` plans follow them in name order, so adding an `ex-` plan does not move the numbers above it.

## Triage

The destination of every leftover, one line for each.

- One line holds its number, where it goes, and the part of the definition it belongs to.
- The part is the ADR entry and the part of `DEFINITION.md` the leftover lands on.
- Each bullet carries its grounds underneath, in this shape:
  - Fact: what happened and how it stands now.
  - Why: why this proposal is recommended.
  - Then: for an `ex-` what policy the plan follows, for a `_proposed_` what to discuss next, for a `dropped` nothing.
- `なし` when there is none.

### Destination

- The proposal order is: the cycle's own concern → `_ex-plan_`.
- An obvious bug, vulnerability, or stale implementation or wording outside that concern → `_ex-plan_`.
- One of the above whose scope or change is too large for one `ex-`, or that needs further outside or inside research → `_proposed_`.
- The rest → `dropped`.

### `_ex-plan_`

- The cycle fixes it now, whatever files it changes.
- It is the cycle's own concern, or an obvious defect, and it fits one plan.
- The plan is named `ex-<what it fixes>` at the grouping, and it has no `No`.
- Until the grouping the line is `- <N>: _ex-plan_ (ADR <NN>, <定義の部分>)`.
- After it, the plan id follows `_ex-plan_` with no `NN-`.
- `done <commit>` sits at the end of the line, in `- <N>: _ex-plan_ <plan id> (ADR <NN>, <定義の部分>): done <commit>`, and it means the `ex-` plan has merged, and this is its merge commit.
- `dropped <reason>` sits there instead when the work drops the `ex-` plan.
- After the grouping, `_ex-plan_` keeps the plan id right after it, with no backticks: `collect.mjs` reads it there.

## Verified

The Units of the cycle and what the owner answered for each.

- The close's verification step writes it.
- It is filled after the owner's judgement on the triage and the `ex-` merges.
- At the completion of `close.md`, `## Verified` is empty, and that is normal.
- `## Verified` sits after `## Triage`.
- The script rewrites `## Collected`, and keeps what is below `## Triage`.

### Unit

- `### <Unit>` holds one section per Unit this cycle touched, among the Units listed in `Users can do`.
- A Unit is a line under `Users can do`, and a `####` heading is not a Unit.
- The name is copied as it is.
- `Product` / `What` / `Who` / `Stack` are not Units and are not verified.

### Fields

- `Plans` holds one bullet per plan that cuts an entry the Unit is named by, taken from the plan md's `No`.
- `Result` is `OK` when the owner checked the Unit's function and it worked, and what they found when it did not.
- `Result` is `しない` with the reason on the same line when they will not check.
- `Fixed` is the `ex-` plan and the commit it merged as, written only when the function did not work, and it takes the place of the `done <commit>` a `Triage` line carries.
- The close resumes at its verification step for that Unit.
- The check is of the Unit's function, not of the change.
- The change is what the work looked at.

## Writing

- One bullet is one rule.
- A file name is written from the project root.
