# ADR format

`cycles/<YYMMDD-NNN-slug>/adr.md`. One cycle has one ADR.

Section and field names are English; the content is Japanese.

## Shape

```md
# ADR <NNN>

## <NN>: <問い>

### Scope

- In:
  - <kind>: <何をするか>
- Out:
  - <kind>: <何をしないか>（理由）

### Context

- C1: <前提。いまの振る舞い>
- C2: <制約。Who の要望、上限、変えないと決めたこと>

### Research & Trial

- F1 (C1): <事実>。出所。

### Decision

- Status: <決定の前は空。**accepted** | **rejected**（理由）>
- Main: <この関心事は、何がどうなるか>
  - Add:
    - <増えるもの>（C1, F2）
  - Update:
    - <変わるもの（何がどうなるか）>（C1）
  - Drop:
    - <消えるもの>（F1）
- Sub: <この関心事は、何がどうなるか>
  - Add:
    - <増えるもの>（C1, F2）
  - Update:
    - <変わるもの（何がどうなるか）>（C1）
  - Drop:
    - <消えるもの>（F1）
- Policy:
  - Allowed:
    - <して良いこと>（C2, F2）
  - Forbidden:
    - <明示的にしてはいけないこと> - <しない理由>（C2, F2）

### Definition

- `Unit.<name>`(updated): <新しい行>
- `Unit.<name>`(kept): <その行が動かない理由>
```

## Entries

The entries the ADR holds.

- `## <NN>: <問い>` holds one question, and its number runs from `01`.
- The sections run `Scope`, `Context`, `Research & Trial`, `Decision`, `Definition`.
- `Definition` is the last section the entry leaves.
- One bullet is one rule.

## Scope

The range the entry decides, in `In` and `Out`.

| kind                | what it is                                                                                        |
| ------------------- | ------------------------------------------------------------------------------------------------- |
| behaviour           | what the product does; the actions a user takes, and what the product returns                     |
| refactor            | the shape of the code or the document, without changing what the product does                     |
| dependency          | a package, a library, or an external contract the product relies on                               |
| naming              | the name of a section, field, file, or identifier in the product                                  |
| format              | the section order, headings, table shape, and fences of a product document                        |
| prose               | the wording, sentence structure, and voice of a product document                                  |
| speed               | the time or the resources the work takes                                                          |
| security            | secrets, permissions, or exposure in the product                                                  |
| compatibility       | an existing reference, a past record, or another part of the product that names the changed thing |
| errors              | a check, a test, a validation, or a failure the product must keep                                 |
| deploy              | the distribution or release of the product                                                        |
| migration           | an existing record or an installed version of the product that must be moved                      |
| logs and monitoring | the records or signals the product leaves                                                         |

- `In:` holds one line per kind in scope, in `<kind>: <what is done>`.
- `Out:` holds one line per kind out of scope, in `<kind>: <what is not done>（理由）`.
- When a kind is `Out`, carry its reason.
- When a kind needs a revisit condition, put it on that kind.

## Context

The facts that limit the entry.

- An item is one line, `C<n>: <the item>`.
- The number runs from `C1`, in the order the items were settled.

## Research & Trial

The facts the decision weighs, with their sources.

- A fact is one line, `F<n> (C<n>): <the fact>。<出所>`.
- The first parenthesis names the `Context` item the fact serves.

## Decision

What the entry becomes, and what holds it.

- `Status` is empty before the decision; after it, `accepted`, or `rejected` with its reason in parentheses on the same line.
- `Main` is one per entry, with its `Add`, `Update` and `Drop` under it. `Sub` is zero or more, with its `Add`, `Update` and `Drop` under it. A rejected entry leaves them empty.
- `Add` is what grows, `Update` is what changes, and `Drop` is what disappears.
- `Policy` is what holds the decision: `Allowed` is what may be done, and `Forbidden` is what must not be done, with its reason.
- A line under `Main`, `Sub`, `Add`, `Update`, `Drop` or `Policy` ends with the items it settles, in parentheses: `（C1, F2）`.
- When a field has nothing in it, write `なし`.

## Definition

How the lines of `DEFINITION.md` move, one line per name.

- A line is `<name>(<operation>): <value>`.
- The name is how `DEFINITION.md` calls it:
  - `Unit.<name>` — a line under `Users can do`; a `####` heading is not a Unit
  - `Who.<name>` — a role
  - `Stack.<group>` / `Stack.<group>.<role>`
  - `Product` / `What`
- The operation is one of:

| operation   | what the value holds       |
| ----------- | -------------------------- |
| `(added)`   | the new line               |
| `(updated)` | the new line               |
| `(kept)`    | the reason the line stands |
| `(dropped)` | nothing                    |

- When the entry is rejected, carry only `(kept)` for the parts that stand, or `なし（採用しなかった）`.

## Writing

- The exchange is not recorded. Only the organized `Context` stays.
