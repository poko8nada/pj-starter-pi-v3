# The close.md format

## The shape

```md
# Close <NNN>

## Integration

- Test: <the file, from the project root> (new | updated)
- Handoff: <the name the design's Boundary.Plans gives>
- Cases:
  - <case>: pass | fail

## Collected

### <plan id> (ADR <NN>-<m> / Scope <定義の部分>)

1. <place> / <hole> / <handling>: <why>

## Triage

- <N>: ex-plan <plan id> (<定義の部分>): <why>
- <N>: proposed (<定義の部分>): <why>
- <N>: dropped (<定義の部分>): <why>
```

## Integration

- One block per handoff the design's `Boundary.Plans` names. Several handoffs: the block repeats.
- `なし` when the design names none.
- `Test` — the file, and `new` or `updated`. The close looks for a test that already covers the handoff before writing one.
- `Cases` — the happy path and the most likely error path. A `fail` is a hole: it goes to the `Triage`.
- The test touches nothing real: it writes under a temporary directory, and its doubles live in `.pi/test/`.

## Collected

- The script's output, pasted as it is. The script is `.pi/skills/close/scripts/collect.mjs`.
- The heading of a plan carries its link, read from the design's plan section: the `ADR` and the `Scope`. `未特定` when the script cannot read it — the plan is not in the design (an `ex-` plan, a refactor plan), or the section or the field is missing.
- A `未特定` is filled before the `Triage`: read the design and the definition, and the owner confirms the part each leftover belongs to.
- Do not shorten and do not rewrite: a line left out is a hole nobody finds again.
- The numbering runs through the whole file. A plan with no leftover is not listed.
- `なし` when there is none.
- The order is the design's plans first (by file name), the `ex-` plans after (by file name), so adding an `ex-` plan does not move the numbers above it.

## Triage

- `owner 確認済み。` first: the destinations are the owner's call, confirmed.
- One line per leftover: its number, where it goes, the part of the definition it belongs to, and why. The part is the `ADR` entry and the line of the definition the leftover lands on.
- `ex-plan <plan id>` — it breaks the criteria. The plan is named `ex-<what it fixes>`, and it has no design.
- `proposed` — it breaks nothing, but leaving it makes things worse. The next cycle's definition carries it.
- `dropped` — rare, and the fix weighs more.
- `done` at the end of the line when the `ex-` plan has merged and closed it.
- `なし` when there is none.

## Writing

- A file name is written from the project root.
- Do not write what the reader can look up: name the plan and the place.
- Keep a table short: a wide one breaks with long text.
