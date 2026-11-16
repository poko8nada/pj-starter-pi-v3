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

### <name>

- Plans:
  - `<plan id>`
- Result: <OK / 見つかったもの / しない — 理由>
- Change: <OK / 見つかったもの / しない — 理由>
- Fixed: <変更内容を簡潔に説明> (<commit>) / なし
```

## Collected

The inventory of the cycle's leftovers.

- The script is `node .pi/skills/close/scripts/collect.mjs cycles/<YYMMDD>-<NNN>-<slug>`.
- The script writes `close.md` itself. It creates the file when it is not there.
- It is the inventory only.
- One leftover is one numbered line, in `<line> / <place> / <出どころ>`: the line in the plan md (the heading above names the plan), and where the hole came from (`Slice 1 (名前)`, `Cleanup: <what it cleaned>`, `Work Review Round 1`, `Acceptance`).
- A hole the script cannot see — a change an entry decided that no plan carries — is added by the agent as a numbered line, in the same shape, after every run of the script.
- A hole no plan carries goes under `### (ADR <NN>) — 運ぶ計画がない項目`, naming its entry.

### Heading

- The heading of a plan carries the `No` of its plan md.
- `未特定` when the plan md has no `No` (a plan written by hand).

### Order

- The numbering runs through the whole file.
- A plan with no leftover is not listed.
- The order is the `NN` numeric order of the plans.
- `なし` when there is none.

## Triage

Where every leftover goes.

- One line holds its number, where it goes, and the part of the definition it belongs to.
- The part is the ADR entry and the part of `DEFINITION.md` the leftover lands on.
- Each bullet carries its grounds underneath, in this shape:
  - Fact: what happened and how it stands now.
  - Why: why this proposal is recommended.
  - Then: for an `_ex-change_` what to change, for a `**proposed**` what to discuss next, for an `_roadmap_` and a `dropped` nothing.
- `なし` when there is none.

### `_ex-change_`

- The line is `- <N>: _ex-change_ (ADR <NN>, <定義の部分>)`.
- After the implementation, `: done <commit>` sits at the end of the line, and the commit is `base(ex-change): <subject>`.
- `Then:` is the change it makes.

### `**proposed**`

- The next cycle's ADR takes it.
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

The Units the cycle touched, the Subs the change touched, and what the owner answered for each.

- At the completion of `close.md`, `## Verified` is empty, and that is normal.
- `## Verified` sits after `## Triage`.

### Name

- `### <name>` holds one section per Unit this cycle touched, and per Sub the change touched, among the names listed in `Users can do`.
- A Unit is a top-level line under `Users can do`; a Sub is an indented line under its Unit. A `####` heading is neither.
- The name is copied as it is.
- `Product` / `What` / `Who` / `Stack` are not names and are not verified.

### Fields

- `Plans` holds one bullet per plan that cuts an entry that names it, taken from the plan md's `No`.
- `Result` is `OK` when the owner checked the Unit's or Sub's function and it worked, and what they found when it did not.
- `Result` is `しない` with the reason on the same line when they will not check.
- `Change` is `OK` when the owner checked what the plans changed and it is as intended, and what they found when it is not.
- `Change` is `しない` with the reason on the same line when they will not check.
- `Fixed` is a short description of the change and the commit it made, or `なし` when there was no fix, and it takes the place of the `done <commit>` a `## Triage` line carries.
