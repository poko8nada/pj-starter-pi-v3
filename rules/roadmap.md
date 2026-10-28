# Roadmap rules

`ROADMAP.md`, at the project root. One file, always current.

It is the layer outside `DEFINITION.md`: the picture says what the product is, and the roadmap says what is done next. It holds no Unit.

## Fields

- `No` — the item's number, from `001`, in each version.
- `Ver` — the version the item belongs to. The person writes it; it is not tied to a `git tag` or to `package.json`'s `version`.
- `status` — `todo`, `wip` or `done`. `todo` is not started, `wip` is under way, `done` is finished.
- `cycles` — the cycle numbers that handled the item, separated by `,`. More than one is allowed.
- A number in `cycles` does not mean the item is done: several cycles may handle one item. `done` is `status`'s word, and nothing else's.
- `priority` — `high`, `mid` or `low`.
- `title` — one line.

## Who writes it

- `brief` picks the item the cycle fits, and sets its `status` to `wip`. When no item fits, `brief` adds one. Either way the owner agrees first.
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
