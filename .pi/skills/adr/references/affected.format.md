# Affected format

`cycles/<YYMMDD-NNN-slug>/affected/<NN>.md`. One entry has one affected file.

Section and field names are English; the content is Japanese.

## Shape

```md
## <NN>: <問い>

### Keywords

- `<キーワード>`

### Code

- Path: `<パス>`
  - Kind: `module` | `test` | `doc` | `config` | `artifact` | `dir`
  - Edge: `needs` | `names` | `mentions` | `checks` | `contains` | `defines` `<パス>`

### External

- Name: `<外のもの>`
  - Kind: `env` | `contract` | `event` | `data` | `path` | `limit`
  - Used by: `<それを使うパス>`
```

## Entries

The entries the affected covers.

- `## <NN>: <問い>` holds one entry; its file is `<NN>.md`, and its number is the ADR's.
- `### Keywords` holds the words the search covers, one line per keyword.
- `### Code` holds the paths the change relates to, one block per path.
- `### External` holds what the change reaches outside the product: a contract it calls, an event it listens to, a value it reads from the environment, a store or a message it uses, a path it opens, or a limit it must stay within.
- It writes `なし` when there is nothing outside. A fact about how one behaves stays in the ADR's `Research & Trial`.

## Keywords

The words the search covers.

- A keyword is a name in the entry's `Context`, its `Research & Trial` facts, or the `Add`, `Update`, `Drop`, `Allowed` and `#### Details` of its `Decision`: a path, a directory, a heading, a key, an identifier, a string or a command.
- One line is one keyword.
- The keywords are the range of the search; a `Path` is not added beyond them.

## External

What the change reaches outside the product.

- An item is one block with `Name`, `Kind` and `Used by`.
- `Kind` is one of:

| kind       | what it is                                                                                    |
| ---------- | --------------------------------------------------------------------------------------------- |
| `env`      | an environment variable, a system setting, a feature flag, a locale, or a timezone            |
| `contract` | an API, an SDK, a library, a protocol, a schema, a version, a command, or an external process |
| `event`    | an event, a callback, a webhook, a signal, or a message                                       |
| `data`     | a database, a file, a payload, a cache, an object store, or a document                        |
| `path`     | a filesystem path, a URL, an endpoint, a bucket, or a mount                                   |
| `limit`    | a rate, a quota, a timeout, a size, a concurrency, a budget, or a license                     |

- `Name` is the thing outside.
- `Used by` is the paths that use it.

## The block

The fields of one path block.

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
