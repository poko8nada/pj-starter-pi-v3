# Affected format

`cycles/<YYMMDD-NNN-slug>/affected.md`. One cycle has one affected.

Section and field names are English; the content is Japanese.

## Shape

```md
# Affected <NNN>

## <NN>: <問い>

### Keywords

- `<キーワード>`

### Code

- Path: `<パス>`
  - Kind: `module` | `test` | `doc` | `config` | `artifact` | `dir`
  - Edge: `needs` | `names` | `mentions` | `checks` | `contains` | `defines` `<パス>`

### External

- Name: `<外のもの>`
  - Kind: `env` | `contract` | `data` | `path` | `limit`
  - Used by: `<それを使うパス>`
```

## Entries

The entries the affected covers.

- `## <NN>: <問い>` holds one entry, and its number is the ADR's.
- `### Keywords` holds the words the search covers, one line per keyword.
- `### Code` holds the paths the change relates to, one block per path.
- `### External` holds what the change calls or reads outside the repository, one block per thing, and writes `なし` when there is nothing outside. A fact about its behavior stays in the ADR's `Research & Trial`.

## Keywords

The words the search covers.

- A keyword is a name in the entry's `Context`, its `Research & Trial` facts, or the `Add`, `Update`, `Drop`, `Allowed` and `#### Details` of its `Decision`: a path, a directory, a heading, a key, an identifier, a string or a command.
- One line is one keyword.
- The keywords are the range of the search; a `Path` is not added beyond them.

## The block

The fields of one path block and one external block.

- `Path` is the path, written from the project root.
- `Kind` is `module`, `test`, `doc`, `config`, `artifact` or `dir`.
- `Edge` is the direction, only outward, and one `Edge` line may list several paths, separated by a comma:

| edge       | what it means                                                |
| ---------- | ------------------------------------------------------------ |
| `needs`    | the code needs the path                                      |
| `names`    | a config or a doc holds the path as a value or a description |
| `mentions` | a doc touches the path                                       |
| `checks`   | a test checks the path                                       |
| `contains` | a dir holds the path                                         |
| `defines`  | the path defines a value the other path uses                 |

- `Name` is the thing outside: an `env`, a `contract`, `data`, a `path` or a `limit`.
- `Used by` is the paths that use it.
