# Affected format

`cycles/<YYMMDD-NNN-slug>/affected.md`. One cycle has one affected.

Section and field names are English; the content is Japanese.

## Shape

```md
# Affected <NNN>

## <NN>: <問い>

### Code

- Path: `<パス>`
  - Kind: `module` | `test` | `doc` | `config` | `artifact` | `dir`
  - Edge: `needs` | `names` | `mentions` | `checks` | `contains` `<パス>`

### External

- Name: `<外のもの>`
  - Kind: `env` | `contract` | `data` | `path` | `limit`
  - Used by: `<それを使うパス>`
```

## Entries

- `## <NN>: <問い>` — one entry is one question, and the number is the ADR's.
- `### Code` — the paths the change relates to, one block per path.
- `### External` — what the change talks to outside the repository, one block per thing. When there is nothing outside, the section says `なし`.

## The block

- `Path` — the path, written from the project root.
- `Kind` — `module`, `test`, `doc`, `config`, `artifact` or `dir`.
- `Edge` — the direction, only outward: `needs` (the code needs the path), `names` (a config or a doc holds the path as a value or a description), `mentions` (a doc touches the path), `checks` (a test checks the path), `contains` (a dir holds the path).
- One `Edge` line may list several paths, separated by a comma.
- `Name` — the thing outside: an `env`, a `contract`, `data`, a `path` or a `limit`.
- `Used by` — the paths that use it.

## Writing

- An empty `### External` says `なし`.
- A fact that could not be derived is not written to the record.
