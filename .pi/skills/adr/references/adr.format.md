# ADR format

`cycles/<YYMMDD-NNN-slug>/adr.md`. One cycle has one ADR.

Section and field names are English; the content is Japanese.

## Shape

```md
# ADR <NNN>

## <NN>: <問い>

### Context

- C1: <前提。いまの振る舞い>
- C2: <制約。Who の要望、上限、変えないと決めたこと>

### Scope

- Change:
  - <kind>: in — <何をするか>
  - <kind>: out — <何をしないか>（理由）
- Quality:
  - <kind>: in — <何をするか>
  - <kind>: out — <何をしないか>（理由）
- Operation:
  - <kind>: in — <何をするか>
  - <kind>: out — <何をしないか>（理由）

### Research & Trial

- F1 (C1): <事実>。出所。
- F2 (C2): <事実>。出所。

### Decision

- Status: <決定の前は空。**accepted** | **rejected**（理由）>
- Adopted: <説明>
  - Add:
    - <増えるもの>（C1, F2）
  - Update:
    - <変わるもの（何がどうなるか）>（C1）
  - Drop:
    - <消えるもの>（F1）
  - Keep:
    - <触らないものとその理由>（C2）
- Denied:
  - <明示的にしないこと> - <しない理由>（C2, F2）

### Definition

- `Unit.<name>`(updated): <新しい行>
- `Unit.<name>`(kept): <その行が動かない理由>
```

## Entries

- `## <NN>: <問い>` — one entry is one question, and the number runs from `01`.
- One bullet is one sentence.
- `Definition` is the last section the entry leaves.

## Context

- An item is one line: `C<n>: <the item>`.
- The number runs from `C1`, in the order the items were settled.

## Scope

- Three axes: `Change`, `Quality`, `Operation`.
- Under each axis, one line per kind: `<kind>: in — <what is done>`, or `<kind>: out — <what is not done>（理由）`.
- An `out` kind carries its reason. A revisit condition goes on the kind that needs one.

## Research & Trial

- A fact is one line: `F<n> (C<n>): <the fact>。<出所>`.
- The first parenthesis names the `Context` item the fact serves.

## Decision

- `Status` — empty before the decision. After it, `accepted`, or `rejected` with its reason in parentheses on the same line.
- `Adopted` — the explanation of what is adopted, with `Add`, `Update`, `Drop` and `Keep`. `Add` is what grows, `Update` is what changes, `Drop` is what disappears, and `Keep` is what is left untouched with the reason. A rejected entry leaves it empty.
- `Denied` — what is explicitly not done, with the reason.
- A line under `Adopted` or `Denied` ends with the items it settles, in parentheses: `（C1, F2）`.
- A field with nothing in it is `なし`.

## Definition

- A line is `<name>(<operation>): <value>`.
- The name is how `DEFINITION.md` calls it.
  - `Unit.<name>` — a line under `Users can do`; a `####` heading is not a Unit
  - `Who.<name>` — a role
  - `Stack.<group>` / `Stack.<group>.<role>`
  - `Product` / `What`
- The operation is `(added)`, `(updated)`, `(dropped)` or `(kept)`.
- The value is the new line for `(added)` and `(updated)`, the reason the line stands for `(kept)`, and nothing for `(dropped)`.
- A rejected entry carries only `(kept)` for the parts that stand, or `なし（採用しなかった）`.

## Writing

- The exchange is not recorded. Only the organized `Context` stays.
