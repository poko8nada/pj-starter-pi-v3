# Definition rules

What may be a Unit or a Sub of `DEFINITION.md`, and how the Units, the Subs, the `Who` and the `Stack` are named and written.

This file is read when a line is added, moved or dropped: the ADR decides the change, and a plan writes it. The shape of the file is in `rules/definition.format.md`.

## What may be a Unit

A Unit is one thing of the product that the `Who` names and uses. The tests, in order:

1. **A name** — the `Who` calls the thing by one noun. A capability, a state or an internal mechanism has no noun of its own: it is not a Unit.
2. **Reach** — the `Who` can reach it and do one thing with it. Another Unit's capability is not a precondition. Data or content is fine as a precondition.
3. **Result** — using it changes something the `Who` can see, and the `Who` can stop there. If the work has to continue, the rest is inside the same Unit.
4. **One loss** — taking the Unit's line away removes exactly one thing the `Who` could do: its main function. Two losses at the same level: two Units. No loss: it is not a Unit. A thing that cannot exist without the Unit is a Sub, and its own line carries its one loss.
5. **The noun decides the split** — one noun is one Unit; a new noun that stands on its own is another Unit. More verbs on the same noun stay inside it, on its line or on a Sub's line. A Sub keeps the Unit's noun and adds its own word after an underscore: it is not a new Unit.
6. **Not internal work** — aligning, refactoring, syncing are not Units. When they happen, the Unit they touch moves.

A Unit may span many directories. A directory is not a Unit.

The kinds below are how the Units of this product happen to appear. They are examples, not a rule: an extension, a skill, a gate, a document, a command.

## What may be a Sub

A Sub is one thing the `Who` can do with a Unit, below the Unit's main function. It is held to `Result` and `One loss` as a Unit is, and to these:

1. **No life without the Unit** — taking the Unit away takes the Sub with it. A thing that stands without the Unit is a Unit, not a Sub.
2. **Not the route, not a check** — the route to a function (the implementation, the steps, the command, the settings, the file layout) and the checks that hold it up do not become Subs.
3. **Any number** — a Unit has no Sub, one Sub, or more. A Unit without Subs is written with its line alone.

## How the list is grouped

- `Users can do` may stay flat, or be grouped under `####` headings. The hierarchy is at most 2: `### Users can do` and `####`. The limit counts the headings; a Sub is an indented line, not a heading.
- A heading names what the `Who` does with the Units below it.
- A heading is not a Unit: by test 04, a line that groups multiple Units is not a Unit.
- A line under a heading is one Unit; a Sub is one more line under its Unit.
- A heading does not use a kind word (extension, skill, gate, document, command) as its axis.

## Each field

- A Unit's line — written from the `Who`'s side: `<Who> が、xxx する`. The name is the thing's name; the description is not. A Sub's line takes the same form, and its `Who` may be a role other than the Unit's.
- A line is the function it carries: a Unit's line is its main function, a Sub's line is its own. The route to that function — the implementation, the steps, the command, the settings, the file layout — does not go in it.
- The checks that hold the function up — whatever runs to prove it — do not go in it either.
- So a line moves only when the function it carries changes. A change to the route or to a check leaves the line as it is.
- `Who` — a role that acts in the product.
- `Stack` — what the product stands on, by group and role.
  - `Ground` is decided first, and it bounds the rest.
  - A product built from this starter always carries `Checks` and `Agent`, and starts `Ground`'s Language, Runtime and Package manager from the starter's defaults.
  - `Deploy` — where the product ships. `なし` when it does not ship. A `Deploy` that is not decided is not written.

## What does not come here

- The argument, the options, the research, the trials, the dropped plans: the ADR's.
- What is not decided yet. The definition holds what is decided.
- The cycle's work: the plan and git hold it.

## Naming

- The name is the `Who`'s word for the thing.
- The name says what the Unit is. The feature layer is gone, so the name is the only place that says it.
- A Unit's name is two or more words joined with hyphens. Two shapes:
  - a thing and its kind: `lefthook-gate`, `adr-skill`, `agent-rules`
  - an object and its work: `sound-notify`
- A Sub's name is the Unit's name, an underscore, and the Sub's own name: `subagent-consult_status`. The underscore appears once, and only in a Sub's name.
- A Sub's own name is one word, or words joined with hyphens. One word is allowed: the Unit's name already makes the whole name two or more words.
- A bare word is not written: `lint`, `test`, `consult`, `readme`.
- The tool's name belongs to the `Stack`: `oxlint` is written there, and the Unit is named for what the `Who` uses.
- The lists below are the spelling. They are not a gate: a name that is not in them is decided in the ADR entry, and written in `DEFINITION.md`. The list gains the name later, outside a cycle.
- `Who`:
  - people: owner / administrator / operator / moderator / staff / member / user / customer / subscriber / guest / visitor / author / editor / reader / viewer / buyer / seller / player / student / teacher
  - developers, for a library, a framework, an API or a CLI: developer / integrator / plugin author
  - not a person: another service / the side that sends a webhook / agent / a team
- `Stack`:
  - Ground: Language / Runtime / Package manager / Deploy
  - Checks: Typechecker / Test runner / Linter / Formatter / Git hooks / Build
  - Agent: Host / Schema
  - Product: Full-stack framework / Web framework / View / Router / Styling / State / Data / Auth / Server / API / Job / Mail / Search / Payments / Analytics / i18n
