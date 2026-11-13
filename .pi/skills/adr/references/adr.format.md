# ADR format

`cycles/<YYMMDD-NNN-slug>/adr.md`. One cycle has one ADR.

Section and field names are English; the content is Japanese.

## Shape

````md
# ADR <NNN>

## <NN>: <問い>

Type: _Full_

### Context

- C1: <前提。いまの振る舞い>
- C2: <制約。上限、変えないと決めたこと>
- C3: <意図。オーナーの意図と意志>

### Research & Trial

- F1: <事実>。出所: <出所>

### Scope

- In:
  - <kind>: <何をするか>
- Out:
  - <kind>: <何をしないか>（理由）

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

#### Details

- <フェンスのタイトル>
  ```text
  <決まったコードや文書>
  ```

### Definition

- `Unit.<name>`(updated): <新しい行>
- `Unit.<name>`(kept): <その行が動かない理由>
````

## Entries

The entries the ADR holds.

- `## <NN>: <問い>` holds one question, and its number runs from `01`.
- The sections run `Context`, `Research & Trial`, `Scope`, `Decision`, `Definition`.
- `Definition` is the last section the entry leaves.
- One bullet is one rule.
- A bullet under `#### Details` is the title of one fence.
- Every entry has one `Type:` line under its heading, before `Context`.

## Type

The entry's way of working.

- The line sits under the entry's heading, before `Context`: `Type: _Full_` or `Type: _Simple_`.
- `_Full_` walks every step of the entry stage.
- `_Simple_` keeps `Scope` and `#### Details` as `_omission_`, does not walk the `Scope` step or the Discussion Loop, and settles the `Decision` with the owner directly.
- `_omission_` means the entry does not record the item because of its type. `なし` means the item has nothing to record. A Full entry uses `なし`; a Simple entry uses `_omission_`.

## Scope

The range the entry decides, in `In` and `Out`.

| kind          | question (yes → in)                                                                                                                               |
| ------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| result        | Does what can be observed from outside change? (what is returned, written, or emitted; side effects; what a reader receives)                      |
| logic         | Do the decisions, steps, or rules that produce the result change? (conditions, order, algorithms, constraints, instructions a reader must follow) |
| structure     | Does how things are divided, ordered, nested, or placed change? (module split, schema shape, section layout, file placement)                      |
| expression    | Does the surface notation change? (names, wording, tone, formatting, spelling)                                                                    |
| upstream      | Is an external thing the product relies on added, updated, or removed? (package, library, external contract, data source, cited source)           |
| downstream    | Does anything else name, reference, or assume the changed thing? (callers, queries, links, other documents, documents that describe it)           |
| existing      | Must an existing entity be moved or fixed? (stored data, installed versions, already-distributed documents, past records)                         |
| cost          | Do time, resources, or money change? (speed, memory, API calls, tokens, effort)                                                                   |
| safety        | Does it touch secrets, permissions, exposure, or personal data?                                                                                   |
| failure       | Does the way things fail change, or is there a check, validation, constraint, or failure path that must be kept?                                  |
| verification  | Must the means of confirming correctness (tests, checks, review steps) be added or changed?                                                       |
| observability | Do the records or signals the product leave change? (logs, metrics, audit records)                                                                |
| release       | Does it affect how the change is published, distributed, or applied, or how it can be rolled back?                                                |
| other         | Is there a concern that none of the above covers?                                                                                                 |

- Judge each kind on its own; several kinds may be `In` at the same time.
- Every kind belongs to `In` or `Out`, and to only one of them; every Full entry writes every kind.
- When the document directs a reader's behavior, a change only in `expression` puts `result` and `logic` in too, if it changes what the reader does.
- When a change of `logic` changes the artifact, `result` is `In` too; both may be `In`.

- `In:` holds one line per kind that answers yes — what this session changes, or checks for consistency — in `<kind>: <what is done>`.
- `Out:` holds one line per kind that answers no — not a target, with the reason on the line — in `<kind>: <what is not done>（理由）`.
- When a kind needs a revisit condition, put it on that kind.
- A Simple entry's body is `_omission_`.

## Context

What limits the entry: a fact, and the owner's intent or will.

- An item is one line, `C<n>: <the item>`.
- The number runs from `C1`, in the order the items were settled.
- A code or a document does not go here; it goes under `Decision`'s `#### Details`.
- The cycle stage writes the items while the pre-research runs; the discussion adds the rest.
- When the decision does not weigh an item, remove its `C<n>:` label and keep the item here as a plain bullet.

## Research & Trial

The facts the entry holds, with their sources.

- A fact is one line, `F<n>: <the fact>。出所: <the source>`.
- The source follows `出所: `, one item per fact.
- The pre-research writes the facts here before the entry stage.
- When the decision does not weigh a fact, remove its `F<n>:` label and keep the fact here as a plain bullet.

## Decision

What the entry becomes, and what holds it.

- `Status` is empty before the decision; after it, `accepted`, or `rejected` with its reason in parentheses on the same line.
- `Main` is one per entry, with its `Add`, `Update` and `Drop` under it. `Sub` is zero or more, with its `Add`, `Update` and `Drop` under it. A rejected entry leaves them empty.
- `Add` is what grows, `Update` is what changes, and `Drop` is what disappears.
- `Policy` is what holds the decision: `Allowed` is what may be done, and `Forbidden` is what must not be done, with its reason.
- A line under `Main`, `Sub`, `Add`, `Update`, `Drop` or `Policy` ends with the items it settles, in parentheses: `（C1, F2）`.
- `#### Details` holds the concrete code and documents the discussion settled. One bullet is the title of one fence, and the fence follows it. A fence carries one item.
- Write the specific name, the logic, the method, the schema and the structure. A whole text or a whole logic is written when it is the decision. The plan concretizes what is not decided.
- When `#### Details` has nothing, write `なし` under it. A Simple entry's body is `_omission_`.
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

- The exchange is not recorded. Only the organized `Context` and `Decision` stay.
