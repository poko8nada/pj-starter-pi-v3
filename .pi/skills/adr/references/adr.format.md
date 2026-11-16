# ADR format

`cycles/<YYMMDD-NNN-slug>/adr.md`. One cycle has one ADR.

Section and field names are English; the content is Japanese.

## Shape

````md
# ADR <NNN>

## <NN>: <トピック>

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

- `## <NN>: <トピック>` holds one question, and its number runs from `01`.
- The sections run `Context`, `Research & Trial`, `Scope`, `Decision`, `Definition`.
- `Definition` is the last section the entry leaves.
- One bullet is one rule.
- A bullet under `#### Details` is the title of one fence.
- Every entry has one `Type:` line under its heading, before `Context`.

## Type

The entry's way of working.

- `_Full_` walks every step of the entry stage.
- `_Simple_` keeps `Scope` and `#### Details` as `_omission_`, does not walk the `Scope` step or the Discussion Loop, and settles the `Decision` with the owner directly.
- `_omission_` means the entry does not record the item because of its type. `なし` means the item has nothing to record. A Full entry uses `なし`; a Simple entry uses `_omission_`.

## Scope

The range the entry decides, in `In` and `Out`.

- `In:` holds one line per kind that answers yes — what this session changes, or checks for consistency — in `<kind>: <what is done>`.
- `Out:` holds one line per kind that answers no — not a target, with the reason on the line — in `<kind>: <what is not done>（理由）`.
- When a kind needs a revisit condition, put it on that kind.
- A Simple entry's body is `_omission_`.

## Context

What limits the entry: a fact, and the owner's intent or will.

- The number runs from `C1`, in the order the items were settled.
- When the decision does not weigh an item, remove its `C<n>:` label

## Research & Trial

The facts the entry holds, with their sources.

- The number runs from `F1`, in the order the items were settled.
- When the decision does not weigh an item, remove its `F<n>:` label

## Decision

What the entry becomes, and what holds it.

- `Status` is empty ,`accepted`, or `rejected` with its reason in parentheses on the same line.
- `Main` is one per entry.
- `Sub` is from 0 to multiple.
- `Add` is what grows, `Update` is what changes, and `Drop` is what disappears.
- `Policy` is what holds the decision: `Allowed` is what may be done, and `Forbidden` is what must not be done, with its reason.
- A line under `Main`, `Sub`, `Add`, `Update`, `Drop` or `Policy` ends with the items it settles, in parentheses: `（C1, F2）`.
- `#### Details`
  - It holds the concrete code and documents the discussion settled: the specific name, the logic, the method, the schema and the structure
  - One bullet is the title of one fence, and the fence follows it.
- When `#### Details` has nothing, write `なし` under it. A Simple entry's body is `_omission_`.
- When a field has nothing in it, write `なし`.

## Definition

How the lines of `DEFINITION.md` move, one line per name.

- A line is `<name>(<operation>): <value>`.
- The name is how `DEFINITION.md` calls it
- The operation is one of:

| operation   | what the value holds       |
| ----------- | -------------------------- |
| `(added)`   | the new line               |
| `(updated)` | the new line               |
| `(kept)`    | the reason the line stands |
| `(dropped)` | nothing                    |

- A Sub is a name of its own: `Unit.<unit>_<sub>`. The parent's line stands when only the Sub's line moves.
