# The definition's format

`cycles/<NNN-YYYY-MM-DD>/definition.md`.

Section and field names are English; the content is Japanese.

## The shape

```md
# <プロダクト名>

## What

### Type

何であるか

Changes: keep

### Who

- <id>: 誰か
  - Does: その製品で何をするか
  - Needs: その製品に何を必要としているか

Changes: keep

## What to build

### 1. <unit-id>

- Change: update / add / drop
- Actor: <`Who` の id>
- Does: 何をするか（行動）
- Now:
  - いまの状態と、理想と違うところ（1 行 1 つ）
- Then:
  - どうなっているべきか（理想）

## What to keep

- <unit-id> From: <NNN>

## Stack

Changes: keep

## Carry over

- <場所>: <状態>。閉じるもの。From: <NNN>.<ticket>

## Retro

### Good

### Bad

### Carry over
```

## Who

`Who` is the product's users: the roles that act in the product.

Pick them from this list.

- people:
  - owner / administrator / operator / moderator / staff / member / user / customer
  - subscriber / guest / visitor / author / editor / reader / viewer / buyer / seller
  - player / student / teacher
- developers, for a library, a framework, an API or a CLI:
  - developer / integrator / plugin author
- not a person: another service / the side that sends a webhook / agent / an organisation or a team

The assumption the list rests on: this harness is general-purpose for building anything web-related.

The users therefore differ from product to product.

## Units

- `Actor` is a `Who` id
- **`Does` is one action. A unit is the smallest thing the `Who` can use**
  - so one action is one result they can get
  - the test: can the `Who` finish it there and see a result?
    - if another unit is needed before a result shows, it is too big
    - if the `Who` cannot tell it from the unit next to it, it is too small
  - `カートに入れる` is a unit
  - `買い物ができる` is three units
  - `ボタンを押す` is a part of a unit
- `Now` is the state today, one line per bullet: what is not the ideal yet
  - for an `add`: what does not exist yet
  - `カートに入れる` today: 商品ページに、入れるボタンだけがある
    - カートの画面はまだ無い
- `Then` is the ideal, as a state. Not an action, not a step
  - one meaning for every reader
  - values and the check belong to the plan
  - `カートに入れる` then: 商品ページで押すと、カートに入り、ヘッダの件数が増える
- The name is the ID of the thing: two nouns, at most one hyphen
- Count what the product does, from the `Who`'s side: a behaviour without a unit is a hole
- A `drop` unit has no `Actor` / `Does` / `Now` / `Then`

## Markers

- A unit in `What to build` carries `Change: update / add / drop` on its own line
  - `Now` is why it moves
  - a `keep` unit is not here: it goes in `What to keep`, with `From: <NNN>`
- The frame ends with `Changes: keep`, or with `Changes: update **理由**`
  - `### Type` and `### Who`
- `## Stack` ends the same way
- `What to build`, `What to keep` and `Change:` account for every unit
  - what is touched, and what stays

## Carry over

- One line per hole that is still open
  - a line this cycle resolved is not copied: it is done
    - a unit took it, or it was judged not to be a hole
- A line has three parts, in this order, and nothing else:
  - the place: file, section, unit, as narrowly as the hole allows
  - the state: what is missing, wrong or undecided
  - what closes it: the thing to decide or do
    - without this part the next cycle cannot act on the line
- `From: <NNN>.<ticket>` closes the line: the cycle that first left it, and the ticket in it
  - a copied line keeps its original `From:`

## Writing

- Do not write what the reader can look up
- No tables: they break with long text
- A field whose content cannot be written yet keeps its name and stays empty
  - it is what still has to be decided
- `Carry over` copies holes, as they were written
- The order of work is the plan's, and the error paths are the tests': not here

## Retro

- `Good` and `Bad` are heading 3, one item per line: `- <主題> — <中身>`
- `Carry over` holds the lines that are still open: the copied ones, and the ones this cycle left
  - copied, not shortened
