# Readme format

`README.md` and `README.ja.md`, at the project root. Two files: one is English, the other Japanese, and they carry the same sections.

## Skeleton

`product:ready` replaces `README.md` with the first fenced block after this heading. A line in `<...>` is a place to fill. Write each language in its own file.

```md
# <the product's name>

<badges>

<what it is, in one sentence>

## What is in it

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

## 入っているもの

## 使い始める

## <プロダクト固有のセクション>

## コントリビュート

## ライセンス
```

## Writing

- A section the product does not need is left out.
- The pair stays a pair: a heading added to one is added to the other, in the same order.
- Do not write what the reader can look up.
- Keep only related badges, each with a value from a source.
- The badges line sits right after the title with no heading.
- `## Getting started` covers install and usage. There is no `## Usage`.
