# The ADR's format

`cycles/<YYMMDD-NNN-slug>/adr.md`. One cycle has one ADR.

The procedure is in `SKILL.md`. Section and field names are English; the content is Japanese.

## The shape

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

### Research & Trial

- <測った事実、試した事>

### Definition Change

- `Unit.<name>`(updated): <新しい行>
- なし
```

## The entries

- `## <NN>: <問い>` — one entry is one question, and the number runs from `01`.
- One bullet is one sentence.
- `Context` — what is happening, and what the `Who` wants.
- `Decision` — `Status`, `Adopted`, `Options`.
  - `Status` — `accepted` or `rejected`. A rejected entry carries its reason on the same line, in parentheses.
  - `Adopted` — the shape that was taken. It stays empty for a rejected entry.
  - `Options` — every option weighed, each with the reason it was not taken. A rejected entry lists the options the same way, because none of them was taken.
- `Research & Trial` — the facts that were measured, and the trials that were run. The record is the ADR's, not the definition's.
- `Definition Change` — the lines of `DEFINITION.md` that move, and the last thing the entry leaves.

## Definition Change

- A line is `<name>(<operation>): <the new line>`.
- The name is how `DEFINITION.md` calls the part.
  - `Unit.<name>` — a part under `Users can do`
  - `Who.<name>` — a role
  - `Stack.<group>` / `Stack.<group>.<role>`
  - `Product` / `What`
- The operation is `(added)`, `(updated)` or `(dropped)`.
- The value is the new line of `DEFINITION.md`. When the line does not change, the value is not written: the part moved, and the line stands.
- `なし` when no line moves.

## Writing

- Do not write what the reader can look up.
- The exchange is not recorded: only the organized `Context` stays.
- Do not write the work: the files, the steps and the checks belong to the plan.
