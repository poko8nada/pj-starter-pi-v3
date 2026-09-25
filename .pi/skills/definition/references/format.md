# The definition's format

`cycles/<NNN-YYYY-MM-DD>/definition.md`. Section and field names are English; the content is Japanese.

## The shape

```md
# <プロダクト名>

## What

### Type

何であるか

### Who

- <id>: 誰か
  - Does: その製品で何をするか
  - Needs: その製品に何を必要としているか

## What to build

### 1. <unit-id>

- Change: update / add
- Actor: <`Who` の id>
- Does: 何をするか（行動）
- Now:
  - いまの状態と、理想と違うところ（1 行 1 つ）
- Then:
  - どうなっているべきか（理想）

## What to keep

- <unit-id> From: <NNN>

## Stack

## Carry over

- <前の 1 行> → <受けた場所>

## Retro

### Good

### Bad

### Carry over
```

## Who

`Who` is the product's users: the roles that act in the product. Pick them from this list.

- people: owner / administrator / operator / moderator / staff / member / user / customer / subscriber / guest / visitor / author / editor / reader / viewer / buyer / seller / player / student / teacher
- developers, for a library, a framework, an API or a CLI: developer / integrator / plugin author
- not a person: another service / the side that sends a webhook / agent / an organisation or a team

The assumption the list rests on: this harness is general-purpose for building anything web-related, so the users differ from product to product.

## Units

- `Actor` is a `Who` id
- **`Does` is one action. A unit is the smallest thing the `Who` can use,** so one action is one result they can get
  - The test is whether the `Who` can finish it there and see a result. If another unit is needed before a result shows, it is too big; if the `Who` cannot tell it from the unit next to it, it is too small
  - `カートに入れる` is a unit. `買い物ができる` is three units. `ボタンを押す` is a part of a unit
- `Now` is the state today, one line per bullet: what is not the ideal yet. For an `add`, what does not exist yet
  - `カートに入れる` today: 商品ページに、入れるボタンだけがある。カートの画面はまだ無い
- `Then` is the ideal, as a state. Not an action, not a step. One meaning for every reader. Values and the check belong to the plan
  - `カートに入れる` then: 商品ページで押すと、カートに入り、ヘッダの件数が増える
- The name is the ID of the thing: two nouns, at most one hyphen
- Count what the product does, from the `Who`'s side: a behaviour without a unit is a hole
- A `drop` unit has no `Actor` / `Does` / `Now` / `Then`

## Markers

- A unit in `What to build` carries `Change: update / add / drop` on its own line. `Now` is why it moves. A `keep` unit is not here: it goes in `What to keep`, with `From: <NNN>`
- A section ends with `Changes: keep`, or with `Changes: update` and one line per reason
- `What to build`, `What to keep` and the markers account for every unit: what is touched, and what stays

## Carry over

- One line per line of the previous definition's `Carry over`, each with the place that took it, or a refusal with its reason. A line that lands nowhere is a hole

## Writing

- Do not write what the reader can look up
- A field whose content cannot be written yet keeps its name and stays empty: it is what still has to be decided
- `Carry over` copies holes, as they were written

## Retro

- `Good` and `Bad` are heading 3, one item per line: `- <主題> — <中身>`
- `Carry over` holds the holes the tickets left: copied, not shortened
