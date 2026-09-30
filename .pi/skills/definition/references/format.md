# The definition's format

`cycles/<NNN-YYYY-MM-DD>/definition.md`.

Section and field names are English; the content is Japanese.

## The shape

```md
# Definition

## Product

<プロダクト名>

### What

<何であるか。何をするか>

### Who

- <id>: <誰か>
  - Does: <その人が何をするか>
  - Needs: <その人が何を必要としているか>

### Users can do

- <unit-id>: <Who が、xxx する>
  - .<feature>: <説明>
- <unit-id>: <Who が、xxx する>

## Stack

- Ground:
  - Language: <言語>
  - Runtime: <本番で動く土台>
  - Package manager: <パッケージマネージャ>
  - Deploy: <出すのか、どこへいつ。出さないなら なし>
- Checks:
  - Typechecker: <物>
  - Test runner: <物>
  - Linter: <物>
  - Formatter: <物>
  - Git hooks: <物>
- Agent:
  - Host: <物>
  - Schema: <物>
- Product:
  - <役割>: <物>
```

A section with nothing in it is left out. A field that is not decided yet keeps its name and stays empty — the empty field is the thing still to decide.

## Markers

- **Every line of the definition is one item.** A product's name, a line of `What`, a `Who` item, a unit or a feature under `Users can do`, a line of the `Stack` — all of them are items.
- A line that moved ends with `**add**`, `**update**` or `**drop**`, in bold. A line without a marker is a line that did not move.
- Only the markers that mean something for that item are used: a name that leaves is a `**drop**`, and a thing that cannot leave never carries one.
- `add` is an item that did not exist before. `update` moves the content of an item and leaves its name alone.

## Who

`Who` is the product's users: the roles that act in the product. Pick them from this list.

- **people**: owner / administrator / operator / moderator / staff / member / user / customer / subscriber / guest / visitor / author / editor / reader / viewer / buyer / seller / player / student / teacher
- **developers**, for a library, a framework, an API or a CLI: developer / integrator / plugin author
- **not a person**: another service / the side that sends a webhook / agent / a team

The list rests on one assumption: this harness is general-purpose for anything web. The users therefore differ from product to product. When nothing in the list fits, propose an addition.

## Users can do

- A unit is the smallest thing that stands alone, that the `Who` uses, and that gives a result. For a product of this harness, that is an extension, a skill, a gate or a document.
- A feature (`.xxx`) is a part that is inside that unit and does not stand alone.
- The description is written from the `Who`'s side: `<Who> が、xxx する`. The id stays the name of the thing, not the description.
- Internal work is not a unit. Aligning, refactoring and syncing are not things the `Who` can use; when they happen, the unit they touch moves.
- A feature's line has no rule about the `Who`. Write the feature itself.

## Stack

- The groups are `Ground`, `Checks`, `Agent` and `Product`. A group with nothing in it is left out.
- A line is `role: thing`. The role comes from the patterns below.
- The order starts at `Ground`. It is decided first, and it bounds the rest.
- A product built from this starter always carries `Checks` and `Agent`, and starts `Ground`'s `Language`, `Runtime` and `Package manager` from the starter's defaults.
- `Deploy` says whether the product ships and where: `なし` when it does not. An empty `Deploy` is not decided yet, which is not the same as `なし`.

### The roles

- **Ground**: Language / Runtime / Package manager / Deploy
  - `Runtime` is the ground the product runs on in production: `Node`, `Cloudflare Workers (workerd)`, `Browser`. The runtime that runs the tooling is not written.
- **Checks**: Typechecker / Test runner / Linter / Formatter / Git hooks / Build
- **Agent**: Host / Schema
- **Product**: Full-stack framework / Web framework / View / Router / Styling / State / Data / Auth / Server / API / Job / Mail / Search / Payments / Analytics / i18n

When nothing in the list fits, propose an addition.

## Writing

- Do not write what the reader can look up.
- Keep a table short: a wide one breaks with long text.
- Do not write the cycle's work here. This file is the product.
