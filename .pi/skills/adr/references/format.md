# ADR format

`cycles/<YYMMDD-NNN-slug>/adr.md`. One cycle has one ADR.

The procedure is in `SKILL.md`. Section and field names are English; the content is Japanese.

## Shape

```md
# ADR <NNN>

## <NN>: <問い>

### Context

- <何が起きていて、何をしたいか>

### Decision

- Status: **accepted** | **rejected**（理由）
- Adopted:
  - <採った形>
- Options:
  - <案>（採らなかった理由）

### Scope

- 変更:
  - in: <何をするか>
  - out: <何をしないか>（理由）
- 品質:
  - ...
- 運用:
  - ...

### Research & Trial

- <測った事実、試した事>

### Definition

- `Unit.<name>`(updated): <新しい行>
- `Unit.<name>`(kept): <その行が動かない理由>
```

## Entries

- `## <NN>: <問い>` — one entry is one question, and the number runs from `01`.
- One bullet is one sentence.
- `Context` — what is happening, and what the `Who` wants.
- `Decision` — `Status`, `Adopted`, `Options`.
  - `Status` — `accepted` or `rejected`. A rejected entry carries its reason on the same line, in parentheses.
  - `Adopted` — the shape that was taken. It stays empty for a rejected entry.
  - `Options` — every option weighed, each with the reason it was not taken. A rejected entry lists the options the same way, because none of them was taken.
- `Scope` — the list the front agreed: every item is `in` or `out`, and an `out` item carries its reason.
- `Research & Trial` — the facts the decision rests on. The record is the ADR's, not the definition's.
- `Definition` — the parts of `DEFINITION.md` the entry relates to, and what happens to each. It is the last thing the entry leaves.

## Scope

- The front's list, as it was agreed: the entry's whole scope, in the front's own words.
- The axes and the kinds are the front's: `変更`, `品質`, `運用` and the kinds under each. This file does not name them; it holds the place they are written.
- Under each axis, one line per kind: `in`, or `out` with its reason. A revisit condition goes on the kind that needs one.
- The list is the entry's whole scope: a reader can tell what the entry does not do.

## Definition

- A line is `<name>(<operation>): <value>`.
- The name is how `DEFINITION.md` calls it.
  - `Unit.<name>` — a line under `Users can do`
  - `Who.<name>` — a role
  - `Stack.<group>` / `Stack.<group>.<role>`
  - `Product` / `What`
- The operation is `(added)`, `(updated)`, `(dropped)` or `(kept)`.
- The value is the new line for `(added)` and `(updated)`, the reason the line stands for `(kept)`, and nothing for `(dropped)`.
- Every entry names the parts it relates to.

## Writing

- Do not write what the reader can look up.
- The exchange is not recorded: only the organized `Context` stays.
- Do not write the work: the files, the steps and the checks belong to the plan.
