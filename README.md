# Harness-included starter

A starter where a project and its **agent harness** come up together. Clone it, and the checks, the commit gates, the agent rules and the cycle mechanism are already in place.

日本語: [README.ja.md](README.ja.md)

## What is in it

- **Checks** — `oxlint` / `oxfmt` / `tsc` / `vitest`, and the `pnpm` scripts that run them
- **Gates** — `lefthook` on commit and push, and `quality-gate`, which checks whatever a turn changed
- **Agent rules** — `AGENTS.md`, read in every session
- **Cycle mechanism** — five skills in `.pi/skills/` (`adr` / `design` / `plan` / `work` / `close`)
- **Extensions** — `consult` (one extension with four tools), `quality-gate` (checks whatever a turn changed), `sound-notify` (a sound and a cmux notification when pi needs you), `intent-router` (routes the owner's message and stops over-investigation) (`.pi/extensions/`)
  - `consult_run` — runs one child `pi` with a role and a place, without showing it this conversation
  - `consult_children` — lists the children of this session and stops one; it reads a record, so the list still shows this session's children across a reload
  - `consult_worktree` — makes, lists, or removes a unit worktree; a worktree stays until it is removed, and `remove` takes its branch too when it is merged (an unmerged branch is kept)
  - `consult_commit` — commits the work a child left in its worktree; you merge it yourself with `git merge --no-ff consult/<unit-id>`
  - the places: `/tmp/pi-consult/<project>-<stamp>/<unit-id>/wt`, on the branch `consult/<unit-id>`, cut from the parent's `HEAD`
- **CI** — `.github/workflows/pullfrog.yml`, which runs an agent on a dispatch
- **Cycle records** — `cycles/`

## Getting started

```bash
pnpm install
```

1. Run `pnpm product:ready` once to make the clone yours — it lists what would go (`harness` / `tests` / `cycles`). Nothing is deleted until you add `--run`. Add `--only <label>` to target one kind. Run it before writing your own tests; afterwards you start from zero tests
2. `.pi/extensions/consult/types.json` is in the repository. Put your own models in it
3. Start `pi`. The skills are found in `.pi/skills/`

## Checks

| Command                             | What it does                        |
| ----------------------------------- | ----------------------------------- |
| `pnpm test:run`                     | Run the tests once                  |
| `pnpm lint`                         | `oxlint`, warnings included         |
| `pnpm typecheck`                    | `node scripts/checks/typecheck.mjs` |
| `pnpm format` / `pnpm format:check` | Format, or verify the format        |

- **On commit** — format, lint, `typecheck:staged` and `test:related`, on what changed
- **On push** — typecheck (the root and the harness) and test
- **On every agent turn** — when the turn changed something: the fix pass runs `lint:fix` then `format`, and the check pass runs `lint` and `typecheck:staged` on what changed

## Harness

The agent harness travels with `scripts/harness.mjs`:

- `node scripts/harness.mjs pull` brings the starter's harness into this project, `node scripts/harness.mjs push` sends it back. Without `--run` it only shows what would move (`copy` / `remove`).
- The list is `scripts/harness.json`. The starter's place goes in `scripts/harness.local.json` as `{ "starter": "~/..." }` (yours, never committed).
- `package.json` is outside the list, so after a pull check its `scripts` and `devDependencies` by hand.

## Cycle

One cycle is an ADR, a design, the plans, the work of carrying them out, then a close. A skill holds each stage, and **the next stage is called by that skill's `description`**. No stage names the one after it.

```
adr          decide what needs deciding (the options, the research, the trial, the decision)
design       cut the cycle into plans, and say where each runs
plan         write one plan per worktree (the files, the types, the steps, the checks)
work         carry a plan to done (the slices, the review, the acceptance, the merge)
close        judge the cycle (the integration test, where each leftover goes)
```

The records stay in `cycles/<YYMMDD-NNN-<slug>>/`: `adr.md`, `design.md`, `plan/<plan id>.md`, `close.md`. Git holds the state, so there is no check box and no status field anywhere.

`DEFINITION.md` holds the product. The ADR holds the argument behind it, and it fires from any stage. A change after the definition is agreed is a new ADR entry, and a plan writes it.
