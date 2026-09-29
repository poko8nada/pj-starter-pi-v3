# Harness-included starter

A starter where a project and its **agent harness** come up together. Clone it, and the checks, the commit gates, the agent rules and the cycle mechanism are already in place.

日本語: [README.ja.md](README.ja.md)

## What is in it

- **Checks** — `oxlint` / `oxfmt` / `tsc` / `vitest`, and the `pnpm` scripts that run them
- **Gates** — `lefthook` on commit and push, and `quality-gate`, which checks whatever a turn changed
- **Agent rules** — `AGENTS.md`, read in every session
- **The cycle mechanism** — six skills in `.pi/skills/` (`definition` / `stack` / `plan` / `tickets` / `work` / `close`)
- **Extensions** — `consult` (one extension with four tools), `quality-gate` (checks whatever a turn changed), `sound-notify` (a sound and a cmux notification when pi needs you) (`.pi/extensions/`)
  - `consult_run` — runs one child `pi` with a role and a place, without showing it this conversation
  - `consult_children` — lists the children of this project and stops one; it reads a record, so the list survives a reload
  - `consult_worktree` — makes, lists, or removes a unit worktree; a worktree stays until it is removed, and `remove` takes its branch too
  - `consult_commit` — commits the work a child left in its worktree; you merge it yourself with `git merge --no-ff consult/<unit-id>`
  - the places: `/tmp/pi-consult/<project>-<stamp>/<unit-id>/wt`, on the branch `consult/<unit-id>`, cut from the parent's `HEAD`
- **CI** — `.github/workflows/pullfrog.yml`, which runs an agent on a dispatch
- **The cycle records** — `cycles/`

## Getting started

```bash
pnpm install
```

1. Delete `cycles/` — this starter's own cycles. They do not belong in a clone
2. `.pi/extensions/consult/types.json` is in the repository. Put your own models in it
3. Start `pi`. The skills are found in `.pi/skills/`

## Checks

| Command                             | What it does                 |
| ----------------------------------- | ---------------------------- |
| `pnpm test:run`                     | Run the tests once           |
| `pnpm lint`                         | `oxlint`, warnings included  |
| `pnpm typecheck`                    | `tsc --noEmit`               |
| `pnpm format` / `pnpm format:check` | Format, or verify the format |

- **On commit** — format, lint, `typecheck:staged` and `test:related`, on what changed
- **On push** — typecheck and test
- **On every agent turn** — when the turn changed something: the fix pass runs `lint:fix` then `format`, and the check pass runs `lint` and `typecheck:staged` on what changed

## The cycle

One cycle is a definition, a stack, a plan, tickets, the work of carrying them out, then a Retro. A skill holds each stage, and **the next stage is called by that skill's `description`**. No stage names the one after it.

```
definition   write the one definition (What / What to build / What to keep / Stack / Retro)
stack        decide what to build with (the runtime it stands on, whether it ships, what is added)
plan         decide the order (steps, their files, and how each is verified)
tickets      cut a ticket per step, agree them
work         carry each step to done (who does it, where it starts, the merge, the Verify, the diff, the notes, the close, the report)
close        judge the cycle as a whole (one integration across the units, the review, where each hole goes, the Retro)
```

The records stay in `cycles/<NNN-DATE>/`. **A cycle is closed when its `Retro` is there.** Git holds the state, so there is no check box and no status field anywhere.

Most of a definition is frozen by the commit that agrees it. Two sections stay writable: `Stack` and `Retro`.
