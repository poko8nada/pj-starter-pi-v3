# The ADR's format

`cycles/<NNN-YYYY-MM-DD>/adr.md`.

Section and field names are English; the content is Japanese.

## The shape

```md
# ADR <NNN>

## <NN>: <Product | unit-id | Stack>

### <NN>-<m>: <definition の呼び名>

1. Agenda:
   - Title: <何が問いか>
   - Proposal: <何を求めるか>
2. Highlight:
   - <仕事が見つけた事実>
3. Research:
   - <triage | compare | mechanism | なし>: <調べた事実と、出典>
4. Trial: <試した物 | なし>
   - <結果>
5. Decision: **<proposed | accepted | rejected>**
```

## The tree

- A parent (`##`) groups the points that live in one place: `Product`, a unit's id, or `Stack`. Its number is the group.
- A child (`###`) is one entry: `### <NN>-<m>` plus the name the definition gives that part, for example `### 02-1: .worktree`.
- The tree mirrors the definition's parts, not its heading levels. `Users can do` is a container, so it is not a parent here.
- One entry is one point. Do not mix two.
- One parent can hold several children: `### 02-1: .worktree` and `### 02-2: .docs`.

## The parts

- `1. Agenda:` — `Title` (what is in question, one line) and `Proposal` (what it asks for).
- `2. Highlight:` — the context the decision rests on, in the fewest lines that carry it:
  - what the work saw: the symptoms, the mechanism
  - what the discussion settled: the owner's constraint or direction, the reasons that came up
  - the options weighed and dropped, and why
  - nothing that had to be looked up: that is `Research`
- `3. Research:` — the type (`triage`, `compare`, `mechanism`), or `なし`.
- `4. Trial:` — what was tried, or `なし`.
- `5. Decision:` — the result, in bold: `proposed`, `accepted` or `rejected`. The reason it went that way is the last line of the `Highlight`.

## The research types

The type sets the questions. Hand one `research` child the type's questions and the subject. Keep the sources and the queries it used.

- `triage` — a defect or a limitation:
  - is it common? (two or three independent reports at least)
  - is there a remedy in this setting? (a tool, a setting or an idiom that works in this repository, on the owner's machine)
- `compare` — a choice: a stack, a tool, a way of doing it:
  - what are the candidates? (two or three)
  - what does each buy, and what does each cost? (dependencies, learning, migration)
  - does it clash with the `Ground`?
- `mechanism` — a way of doing it:
  - what does the tool offer? (an API, a command, a setting)
  - what are the limits? (a version, an environment)

## Trial

A `trial` child runs in a worktree, because the `trial` role writes.

- Put what to try in the `task`: the candidate (a library, a framework, a package) and its setting.
- The child installs it, sets it up, and reports the clashes, the versions and the smallest working shape.
- When it works, the work lands on the worktree's branch; the parent decides whether to take it (`consult_commit`, then a merge).
- The package touches the shared store (the pnpm store), so ask the owner first.

## Decision

- `proposed` — not decided yet. Only a `close` leaves one, for the next cycle, and it does no research.
- `accepted` — decided. Write the result into the md it belongs to: a marker in the definition, or a line of the design or the plan.
- `rejected` — weighed and not taken. No md changes.
- An entry raised in this cycle is decided in this cycle. It does not end as `proposed`.
- To change something already `accepted`, write a new entry. The older one stays as it was, and the record adds up.

## Writing

- Do not write what the reader can look up.
- Keep a table short: a wide one breaks with long text.
- `Highlight` is the context; `Research` is what was looked up. Do not mix them.
- Bold is scarce: the `Decision` result, and one line in each of `Highlight`, `Research` and `Trial` — the one that leads to the result, or the most important finding. A page of bold hides what matters.
