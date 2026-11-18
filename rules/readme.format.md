# Readme format

`README.md` and `README.ja.md`, at the project root. Two files: one is English, the other Japanese, and they carry the same sections.

## Skeleton

`product:ready` replaces both `README.md` and `README.ja.md` with the first fenced block after this heading. A line in `<...>` is a place to fill. Write each language in its own file.

```md
# <name>

<badges>

<what it is and does, in one sentence>

## What is in it

### Product

### Default

## Getting started

## <product's own sections>

## Contributing

## License
```

## Writing

### Pair

- The pair stays a pair: a heading added to one is added to the other, in the same order.
- A section the product does not need is left out.
- Do not write what the reader can look up.

### Badges

- Keep only related badges, each with a value from a source.
- The badges line sits right after the title with no heading.

### Sections

- `## Getting started` covers install and usage. There is no `## Usage`.
- A description placed right under a heading is one sentence, holds without reading the list, holds no demonstrative and no name from the list, and holds wherever it is placed.
- A line in `<...>` is a place to fill; under `## What is in it`, `### Product` keeps the product's own lines and `### Default` takes one line per starter heading.

### Starter

- The starter README holds no `### Product`: the starter itself is not a product, and `### Product` with `### Default` appear only in the template `product:ready` writes.
