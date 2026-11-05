# ADR format

`cycles/<YYMMDD-NNN-slug>/adr.md`. One cycle has one ADR.

The procedure is in `SKILL.md`. Section and field names are English; the content is Japanese.

## Shape

```md
# ADR <NNN>

## <NN>: <問い>

### Context

- C1: <前提。いまの振る舞い>
- C2: <制約。Who の要望、上限、変えないと決めたこと>

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

- F1 (C1): <事実>。出所。
- F2 (C2): <事実>。出所。

### Decision

- Status: <決定の前は空。**accepted** | **rejected**（理由）>
- Adopted:
  - <A>: <説明>
    - Add:
      - <増えるもの>（C1, F2）
    - Update:
      - <変わるもの（何がどうなるか）>（C1）
    - Drop:
      - <消えるもの>（F1）
    - Keep:
      - <触らないものとその理由>（C2）
    - Cost:
      - <他の選択肢と比べたときの相対的なコスト>（F3）
- Options:
  - <B>: <説明> - <その選択肢を採用しなかった理由>
- Deferred:
  - <決めない項目と、その理由>

### Definition

- `Unit.<name>`(updated): <新しい行>
- `Unit.<name>`(kept): <その行が動かない理由>
```

## Entries

- `## <NN>: <問い>` — one entry is one question, and the number runs from `01`.
- The entries are the cycle's split, and the order is the split's.
- One bullet is one sentence.
- `Context` — the entry's items, numbered `C1`, `C2`: what is happening, what the `Who` wants, or the entry's question, and the premises and constraints the decision must respect.
- `Scope` — the list the owner agreed: every item is `in` or `out`, and an `out` item carries its reason.
- `Research & Trial` — the facts the decision weighs, each with the item it serves and its source: `F1 (C1)`. A fact that serves no item adds one to `Context`.
- `Decision` — `Status`, `Adopted`, `Options`, `Deferred`.
  - `Status` — empty before the decision; after it, `accepted` or `rejected`. A rejected entry carries its reason on the same line, in parentheses.
  - `Adopted` — the shape that was taken, named `A`, with `Add`, `Update`, `Drop`, `Keep` and `Cost`. `Add` is what grows, `Update` is what changes, `Drop` is what disappears, and `Keep` is what is left untouched with the reason. `Cost` is the relative cost compared to the other options. Each field holds one or more bullets; an empty field is `なし`. Each line carries the items it settles, in parentheses: `（C1, F2）`. `Adopted` is left empty for a rejected entry.
  - `Options` — before the decision, the options are written here in full, named `A`, `B`, `C`, each with `Add`, `Update`, `Drop`, `Keep` and `Cost`; after it, the one adopted moves to `Adopted` and the rest keep one line each, with the reason it was not taken.
  - `Deferred` — an item the entry does not settle, with the reason.
  - The chat's presentation is in `references/options.md`; this file holds how the decision is written to `adr.md`.
- `Definition` — the parts of `DEFINITION.md` the entry relates to, and what happens to each. It is the last thing the entry leaves.

## Scope

- The list the owner agreed: the entry's whole scope. For a point the owner raises, it is the list the owner agreed with the agent.
- The axes and the kinds are the skill's: `変更`, `品質`, `運用` and the kinds under each. This file does not name them; it holds the place they are written.
- Under each axis, one line per kind: `<kind>: in`, or `<kind>: out` with its reason. A revisit condition goes on the kind that needs one.
- The list is the entry's whole scope: a reader can tell what the entry does not do.

## Definition

- A line is `<name>(<operation>): <value>`.
- The name is how `DEFINITION.md` calls it.
  - `Unit.<name>` — a line under `Users can do`; a `####` heading is not a Unit
  - `Who.<name>` — a role
  - `Stack.<group>` / `Stack.<group>.<role>`
  - `Product` / `What`
- The operation is `(added)`, `(updated)`, `(dropped)` or `(kept)`.
- The value is the new line for `(added)` and `(updated)`, the reason the line stands for `(kept)`, and nothing for `(dropped)`.
- Every accepted entry names the parts it relates to. A rejected entry carries only `(kept)` for the parts that stand, or `なし（採用しなかった）`.

## Writing

- Do not write what the reader can look up.
- The exchange is not recorded: only the organized `Context` stays.
- Do not write the work: the files, the steps and the checks belong to the plan.
