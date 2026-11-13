# Close format

`cycles/<YYMMDD>-<NNN>-<slug>/close.md`, in the shape below. It is the cycle's last word.

## Shape

```md
# Close <NNN>

## Collected

### <NN> <plan id> (ADR <プランの No の値>)

1. <line> / <place> / <出どころ>

### (ADR <NN>) — 運ぶ計画がない項目

1. <line> / <place> / <出どころ>

## Triage

- <N>: _ex-change_ (ADR <NN>, <定義の部分>): done <commit>
  - Fact: <何が起きて現状どうなっているか>
  - Why: <このトリアージ案を推奨した理由>
  - Then: <どう変えるか>
- <N>: **proposed** (ADR <NN>, <定義の部分>)
  - Fact: <何が起きて現状どうなっているか>
  - Why: <このトリアージ案を推奨した理由>
  - Then: <次に論点にすべき点>
- <N>: _roadmap_ (ADR <NN>, <定義の部分>)
  - Fact: <何が起きて現状どうなっているか>
  - Why: <このトリアージ案を推奨した理由>
  - Then: なし
- <N>: dropped (ADR <NN>, <定義の部分>)
  - Fact: <何が起きて現状どうなっているか>
  - Why: <このトリアージ案を推奨した理由>
  - Then: なし

## Verified

### <Unit>

- Plans:
  - `<plan id>`
- Result: <OK / 見つかったもの / しない — 理由>
- Change: <OK / 見つかったもの / しない — 理由>
- Fixed: <変更内容を簡潔に説明> (<commit>)
```

## Collected

The inventory of the cycle's leftovers.

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

- The heading of a plan carries the `No` of its plan md.
- `未特定` when the plan md has no `No` (a plan written by hand).
- Fill it before showing the owner.

### Order

- The numbering runs through the whole file.
- A plan with no leftover is not listed.
- `なし` when there is none.
- The order is the `NN` numeric order of the plans.

## Triage

Where every leftover goes.

- One line holds its number, where it goes, and the part of the definition it belongs to.
- The part is the ADR entry and the part of `DEFINITION.md` the leftover lands on.
- Each bullet carries its grounds underneath, in this shape:
  - Fact: what happened and how it stands now.
  - Why: why this proposal is recommended.
  - Then: for an `_ex-change_` what to change, for a `**proposed**` what to discuss next, for an `_roadmap_` and a `dropped` nothing.
- `なし` when there is none.

### Destination

- The proposal order is: the cycle's own concern, then a small change outside it, then a possible bug or a large debt, then a future consideration, then the rest.
- A change of one code place, one test, or documents only, in the cycle's concern or outside it, that is worth doing → `_ex-change_`.
- A possible obvious bug, or a debt that would grow large if it stays → `**proposed**`.
- A future implementation or change worth considering, outside the two above → `_roadmap_`.
- The rest → `dropped`.

### `_ex-change_`

- The close fixes it now, in the base, with no plan and no worktree.
- It is one code place, one test, or documents only.
- The line is `- <N>: _ex-change_ (ADR <NN>, <定義の部分>)`.
- After the implementation, `: done <commit>` sits at the end of the line, and the commit is `base(ex-change): <subject>`.
- The commit is one per `_ex-change_`; two changes do not share one commit.
- `Then:` is the change it makes.

### `**proposed**`

- The next cycle's ADR takes it.
- The close updates the roadmap, splits the next cycle's entries, proposes each entry's `Type`, runs the pre-research, and fills each entry's `Context` and `Research & Trial`.
- The close leaves the `Scope` as the scaffold wrote it and commits nothing of the next cycle.
- `Then:` is what the next cycle should discuss.

### `_roadmap_`

- The close gives it no destination, and it ends here.
- The owner reads it and decides later whether to put it into `ROADMAP.md`.
- `Then:` is `なし`.

### `dropped`

- It gets no destination, and the reason is in the `Fact:` and the `Why:`.
- `Then:` is `なし`.

## Verified

The Units of the cycle and what the owner answered for each.

- The close's verification step writes it.
- It is filled after the owner's judgement on the triage.
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
- `Change` is `OK` when the owner checked what the plans changed and it is as intended, and what they found when it is not.
- `Change` is `しない` with the reason on the same line when they will not check.
- `Fixed` is a short description of the change and the commit it made, or `なし` when there was no fix, and it takes the place of the `done <commit>` a `## Triage` line carries.
- The close resumes at its verification step for that Unit.
- The check has two parts: the Unit's function, and the change the plans made.
- The acceptance saw the plan's work; this check sees the Unit after the merge.

## Writing

- One bullet is one rule.
- A file name is written from the project root.
