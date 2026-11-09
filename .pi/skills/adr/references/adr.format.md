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
- Adopted: <エントリ全体として何がどうなるか>
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

- `## <NN>: <問い>` — one entry is one question, and the number runs from `01`.
- One bullet is one sentence.
- The sections run `Scope`, `Context`, `Research & Trial`, `Decision`, `Definition`.
- `Definition` is the last section the entry leaves.

## Scope

- The `View` is the table of 13 kinds:

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

- The output is `In:` and `Out:`: `- In:` with one line per kind in scope (`<kind>: <what is done>`), `- Out:` with one line per kind out of scope (`<kind>: <what is not done>（理由）`).
- An `Out` kind carries its reason. A revisit condition goes on the kind that needs one.

## Context

- An item is one line: `C<n>: <the item>`.
- The number runs from `C1`, in the order the items were settled.

## Research & Trial

- A fact is one line: `F<n> (C<n>): <the fact>。<出所>`.
- The first parenthesis names the `Context` item the fact serves.

## Decision

- `Status` — empty before the decision. After it, `accepted`, or `rejected` with its reason in parentheses on the same line.
- `Adopted` — the one line of what the entry becomes as a whole, with `Add`, `Update` and `Drop` under it. `Add` is what grows, `Update` is what changes, and `Drop` is what disappears. A rejected entry leaves it empty.
- `Policy` — what holds the decision: `Allowed` is what may be done, `Forbidden` is what must not be done, with the reason.
- A line under `Adopted` or `Policy` ends with the items it settles, in parentheses: `（C1, F2）`.
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
