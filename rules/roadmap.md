# Roadmap rules

`ROADMAP.md`, at the project root. One file, always current.

It is the layer outside `DEFINITION.md`: the picture says what the product is, and the roadmap says what is done next. It holds no Unit.

## Fields

- `No` — the item's number, from `001`, in each version.
- `Ver` — the version the item belongs to. The person writes it; it is not tied to a `git tag` or to `package.json`'s `version`.
- `status` — `_todo_`, `wip` or `done`. `_todo_` is not started, `wip` is under way, `done` is finished. Only `_todo_` is wrapped in underscores so it renders in italics and the not-started rows stand out in the table.
- `cycles` — the cycle's number that handled the item, which `close` appends, written as `NNN-m`, `NNN-d` or `NNN-f` and separated by `,` when more than one is present. More than one is allowed. `m` is a `main` cycle, `d` is a `dev` cycle, `f` is a `feat` cycle. The last letter is the first letter of the first word of the cycle folder name's suffix (`main`, `dev`, `feat`).
- A number in `cycles` does not mean the item is done: several cycles may handle one item. `done` is `status`'s word, and nothing else's.
- `priority` — `high`, `mid` or `low`.
- `title` — one line.

## Who writes it

- `adr` picks the item the cycle fits, and sets its `status` to `wip`. When no item fits, `adr` adds one. Either way the owner agrees first.
- `close` appends the cycle's number to `cycles`, and sets `status` to `done` or leaves it `wip`, with the owner's word.

## What is not here

- The argument, the options, the decision: the ADR's.
- The steps: the plan's.
- What is not decided yet.

## Skeleton

`product:ready` replaces `ROADMAP.md` with the first fenced block after this heading. A line in `<...>` is a place to fill.

```md
# Roadmap

## 1.x.x

| No  | Ver | status | cycles | priority | title |
| --- | --- | ------ | ------ | -------- | ----- |

### <Ver> <No>

- description:
  - <何をするか。1 行>
- ideas:
  - <思いついた形>

## 0.x.x

| No  | Ver | status | cycles | priority | title |
| --- | --- | ------ | ------ | -------- | ----- |

### <Ver> <No>

- description:
  - <何をするか。1 行>
- ideas:
  - <思いついた形>
```
