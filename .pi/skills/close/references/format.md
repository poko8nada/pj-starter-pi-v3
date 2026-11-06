# Close format

`cycles/<YYMMDD>-<NNN>-<slug>/close.md`, in the shape below. It is the cycle's last word.

## Shape

```md
# Close <NNN>

## Collected

### <NN> <plan id> (ADR <プランの No の値>) — `NN` のあるプラン

### <plan id> (ADR <プランの No の値>) — `NN` を持たない `ex-` のプラン

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

- The collect step writes this section; the gate is the agent's reading, as `SKILL.md`'s table says.

- The script writes this section: `node .pi/skills/close/scripts/collect.mjs cycles/<YYMMDD>-<NNN>-<slug>`. It writes `close.md` itself, and creates the file when it is not there.
- One leftover is one numbered line. The line is `<line> / <place> / <出どころ>`: the line in the plan md (the heading above names the plan), and where the hole came from (`Slice 1 (名前)`, `Cleanup: <what it cleaned>`, `Work Review Round 1`, `Acceptance`). It is the inventory only.
- The agent excludes what the wording shows is already resolved, by hand, after every run of the script: the script rewrites the numbered lines, so re-filter every time.
- A hole the script cannot see — a change an entry decided that no plan carries — is added by the agent as a numbered line, in the same shape, after every run of the script.
- The heading of a normal plan carries the `No` of its plan md. `未特定` when the plan md has no `No` (a plan written by hand). The `## Collected` heading's `No` for an `ex-` plan comes from the Triage: its `No` is the `<NN>` of the `ADR <NN>` in the Triage line `- <N>: _ex-plan_ <plan id> (ADR <NN>, <定義の部分>)`. A missing Triage line is `未特定`, and so is a line the grouping has not named yet: the plan's name comes first. Fill it before showing the owner.
- The numbering runs through the whole file. A plan with no leftover is not listed.
- `なし` when there is none.
- The order is the `NN` numeric order for the plans that have an `NN`, and the `ex-` plans after them in name order, so adding an `ex-` plan does not move the numbers above it.

## Triage

- The proposal step writes it, and the owner's word closes it, as `SKILL.md`'s table says.

- One line per leftover: its number, where it goes, and the part of the definition it belongs to. The part is the `ADR` entry and the part of `DEFINITION.md` the leftover lands on.
- Each bullet carries its grounds underneath, in this shape:
  - Fact: what happened and how it stands now.
  - Why: why this proposal is recommended.
  - Then: for an `ex-` what policy the plan follows, for a `_proposed_` what to discuss next, for a `dropped` nothing.
- The proposal order is: the cycle's own concern → `_ex-plan_`; an obvious bug, vulnerability, or stale implementation or wording outside that concern → `_ex-plan_`; one of the above whose scope or change is too large for one `ex-`, or that needs further outside or inside research → `_proposed_`; the rest → `dropped`.
- `_ex-plan_` — the cycle fixes it now, whatever files it changes: it is the cycle's own concern, or an obvious defect, and it fits one plan. The plan is named `ex-<what it fixes>` at the grouping, and it has no `No`. Until the grouping the line is `- <N>: _ex-plan_ (ADR <NN>, <定義の部分>)`; after it, the plan id follows `_ex-plan_` with no `NN-`.
- `_proposed_` — leaving it makes things worse. The next cycle carries it: its ADR decides, and a plan writes.
- `dropped` — the rest: the fix weighs more than leaving it.
- `done <commit>` — the `ex-` plan has merged, and this is its merge commit.
- `done <commit>` sits at the end of that line: `- <N>: _ex-plan_ <plan id> (ADR <NN>, <定義の部分>): done <commit>`.
- After the grouping, `_ex-plan_` keeps the plan id right after it, with no backticks: `collect.mjs` reads it there.
- `なし` when there is none.

## Verified

- The verification step writes it, and the owner's word closes it, as `SKILL.md`'s table says.

- The close's verification step writes it: the Units of the cycle, and what the owner answered for each.
- At the completion of `close.md` `## Verified` is empty, and that is normal. It is filled after the owner's judgement on the triage and the `ex-` merges.
- `### <Unit>` — one section per Unit this cycle touched, among the Units listed in `Users can do`. A Unit is a line under `Users can do`; a `####` heading is not a Unit. The name is copied as it is. `Product` / `What` / `Who` / `Stack` are not Units and are not verified.
- `Plans` — one bullet per plan that cuts an entry the Unit is named by, taken from the plan md's `No`.
- `Result` — `OK` when the owner checked the Unit's function and it worked; what they found when it did not; `しない` with the reason on the same line when they will not check.
- `Fixed` — written only when the function did not work: the `ex-` plan, and the commit it merged as, on one line. It takes the place of the `done <commit>` a `Triage` line carries, and the close resumes at its verification step for that Unit.
- The check is of the Unit's function, not of the change: the change is what the work looked at.
- `## Verified` sits after `## Triage`: the script rewrites `## Collected`, and keeps what is below `## Triage`.

## Closing

- Every leftover has a line in the `Triage`: nothing is left without a destination.
- `close.md` is complete when `## Collected` holds the inventory, `## Triage` holds the proposal with its Fact / Why / Then, and `## Verified` is empty.
- Then the Japanese proofread runs, and the owner reads the whole `close.md` and judges the triage.
- Every `ex-` plan is merged, and its line carries `done <commit>`: the `Triage`'s line, or the Unit's `Fixed`.
- Every Unit this cycle touched has a section in `## Verified`: what was checked, or the reason it was not, and the `ex-` that fixed a broken one.
- Then the cycle is closed: `close.md` and `ROADMAP.md` go in one commit, and nothing about the cycle is edited afterwards. An `ex-` plan and its work are committed at its own merge.

## Writing

- A file name is written from the project root.
- Do not write what the reader can look up: name the plan and the place.
