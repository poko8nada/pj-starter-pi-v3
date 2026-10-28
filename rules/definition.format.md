# Definition format

`DEFINITION.md`, at the project root. One file, always current. It has no version: git holds the difference.

Section and field names are English; the content is Japanese.

## Skeleton

`product:ready` replaces the `Product` and `What` sections of `DEFINITION.md` with the matching sections of the first fenced block after this heading; the rest of the file stays. A line in `<...>` is a place to fill.

The block is the state a product starts from. `Product` and `What` are the product's own, so they are blank. `Who`, `Users can do` and `Stack` are the starter's, so they are already filled.

```md
# DEFINITION

## Product

<プロダクトの名前>

### What

<何であるか、何をするか。1 文>

### Who

- owner: clone する人。プロジェクトの持ち主
  - Does: 判断をする（何を作るか、何が要るか、何が要らないか）
  - Needs: エージェントが 1 人で進められること。判断は自分のところに来ること
- agent: 同じリポジトリで作業する側
  - Does: プロダクトを作る（サイクルを回す）
  - Needs: 規則、検査、基準、記録が最初から揃っていること

### Users can do

- definition-file: owner またはエージェントが、プロダクトの絵を 1 枚で読める
- definition-rules: エージェントが、絵の書き方の規則を読める

## Stack

| group  | role            | thing                             |
| ------ | --------------- | --------------------------------- |
| Ground | Language        | TypeScript                        |
| Ground | Runtime         | Node                              |
| Ground | Package manager | pnpm                              |
| Checks | Typechecker     | tsc                               |
| Checks | Test runner     | vitest                            |
| Checks | Linter          | oxlint                            |
| Checks | Formatter       | oxfmt                             |
| Checks | Git hooks       | lefthook                          |
| Agent  | Host            | `@earendil-works/pi-coding-agent` |
| Agent  | Schema          | typebox                           |
```

## Defaults

The two lines of `Users can do` in the skeleton are the starter's: every definition has them, and a product keeps them. The `Stack` rows are the starter's too, and a product adds its own below them. A product whose `Who` is different writes its own word for `owner` and `agent`.

The harness's other lines — the skills, the checks, `agent-rules`, `usage-readme`, the extensions — are the clone's, and they stay too. They are not written into the skeleton, because a product does not need to read them to start.

The roadmap is outside this picture: its shape and rules are in `rules/roadmap.md`.

## Sections

- `Product` — the product's name.
- `What` — what the product is, in one sentence.
- `Who` — the roles that act in the product. Each carries `Does` and `Needs`.
- `Users can do` — one line per Unit: what the `Who` can do with it. The name is the thing's name.
- `Stack` — what the product stands on: a group, a role, and the thing that fills it.

What may be a Unit, and how a Unit is named and written, is in `rules/definition.rules.md`.

## Writing

- A section the product does not need is left out.
- One line is one Unit.
- Do not write what the reader can look up.
