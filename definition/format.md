# Definition format

`DEFINITION.md`, at the project root. One file, always current. It has no version: git holds the difference.

Section and field names are English; the content is Japanese.

## Shape

```md
# DEFINITION

## Product

<プロダクトの名前>

### What

<何であるか、何をするか。1 文>

### Who

- <name>: <誰か>
  - Does: <その人が何をするか>
  - Needs: <その人が何を必要としているか>

### Users can do

- <name>: <Who が、xxx する>

## Stack

| group   | role   | thing |
| ------- | ------ | ----- |
| <group> | <role> | <物>  |
```

## Defaults

These lines are the starter's: every definition has them, and a product keeps them. What the product adds sits with them — its `What`, its `Who`, its own Units, and its own `Product` group in `Stack`.

```md
- definition-file: owner またはエージェントが、プロダクトの絵を 1 枚で読める
- definition-rules: エージェントが、絵の書き方の規則を読める

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

The `Who` in these lines is the starter's. A product whose `Who` is different writes its own word for it.

The harness's other lines — the skills, the checks, `agent-rules`, `usage-readme`, the extensions — are the clone's, and they stay too.

## Sections

- `Product` — the product's name.
- `What` — what the product is, in one sentence.
- `Who` — the roles that act in the product. Each carries `Does` and `Needs`.
- `Users can do` — one line per Unit: what the `Who` can do with it. The name is the thing's name.
- `Stack` — what the product stands on: a group, a role, and the thing that fills it.

What may be a Unit, and how a Unit is named and written, is in `definition/rules.md`.

## Writing

- A section with nothing in it is left out.
- One line is one Unit.
- Do not write what the reader can look up.
