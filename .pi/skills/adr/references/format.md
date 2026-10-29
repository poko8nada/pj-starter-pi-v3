# ADR format

`cycles/<YYMMDD-NNN-slug>/adr.md`. One cycle has one ADR.

The procedure is in `SKILL.md`. Section and field names are English; the content is Japanese.

## Shape

```md
# ADR <NNN>

## <NN>: <問い>

### Context

- <何が起きていて、何をしたいか>

### Scope

- 変更:
  - <kind>: in — <何をするか>
  - <kind>: out — <何をしないか>（理由）
- 品質:
  - <kind>: in — <何をするか>
  - <kind>: out — <何をしないか>（理由）
- 運用:
  - <kind>: in — <何をするか>
  - <kind>: out — <何をしないか>（理由）

### Research & Trial

- <測った事実、試した事>

### Decision

- Status: **accepted** | **rejected**（理由）
- Adopted:
  - <採った形>
- Options:
  - <案>（採らなかった理由）

### Definition

- `Unit.<name>`(updated): <新しい行>
- `Unit.<name>`(kept): <その行が動かない理由>
```

## Entries

- `## <NN>: <問い>` — one entry is one question, and the number runs from `01`.
- The entries are the cycle's split, and the order is the split's.
- One bullet is one sentence.
- `Context` — what is happening, and what the `Who` wants.
- `Scope` — the list the owner agreed: every item is `in` or `out`, and an `out` item carries its reason.
- `Research & Trial` — the facts the decision rests on. The record is the ADR's, not the definition's.
- `Decision` — `Status`, `Adopted`, `Options`.
  - `Status` — `accepted` or `rejected`. A rejected entry carries its reason on the same line, in parentheses.
  - `Adopted` — the shape that was taken. It stays empty for a rejected entry.
  - `Options` — every option weighed, each with the reason it was not taken. A rejected entry lists the options the same way, because none of them was taken.
- `Definition` — the parts of `DEFINITION.md` the entry relates to, and what happens to each. It is the last thing the entry leaves.

## Scope

- The list the owner agreed: the entry's whole scope. For a point the owner raises, it is the list the owner agreed with the agent.
- The axes and the kinds are the skill's: `変更`, `品質`, `運用` and the kinds under each. This file does not name them; it holds the place they are written.
- Under each axis, one line per kind: `<kind>: in`, or `<kind>: out` with its reason. A revisit condition goes on the kind that needs one.
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
- Every accepted entry names the parts it relates to. A rejected entry carries only `(kept)` for the parts that stand, or `なし（採らなかった）`.

## Writing

- Do not write what the reader can look up.
- The exchange is not recorded: only the organized `Context` stays.
- Do not write the work: the files, the steps and the checks belong to the plan.
