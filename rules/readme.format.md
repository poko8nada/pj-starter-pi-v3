# Readme format

`README.md` and `README.ja.md`, at the project root. Two files: one is English, the other Japanese, and they carry the same sections.

## Skeleton

`product:ready` replaces `README.md` with the first fenced block after this heading. A line in `<...>` is a place to fill. Write each language in its own file.

```md
# <the product's name>

<badges>

<what it is, in one sentence>

## What is in it

### Product

### Default

## Getting started

## <the product's own sections>

## Contributing

## License
```

## Skeleton (ja)

`product:ready` replaces `README.ja.md` with the first fenced block after this heading. A line in `<...>` is a place to fill. Write each language in its own file.

```md
# <プロダクトの名前>

<バッジ>

<何であるか、何をするか。1 文>

## What is in it

### Product

### Default

## Getting started

## <the product's own sections>

## Contributing

## License
```

## Writing

- A section the product does not need is left out.
- The pair stays a pair: a heading added to one is added to the other, in the same order.
- Do not write what the reader can look up.
- Keep only related badges, each with a value from a source.
- The badges line sits right after the title with no heading.
- `## Getting started` covers install and usage. There is no `## Usage`.
- A description placed right under a heading is one sentence, holds without reading the list, holds no demonstrative and no name from the list, and holds wherever it is placed.
- The starter README holds no `### Product`: the starter itself is not a product, and `### Product` with `### Default` appear only in the template `product:ready` writes.
- A line in `<...>` is a place to fill; under `## What is in it`, `### Product` keeps the product's own lines and `### Default` takes one line per starter heading.
