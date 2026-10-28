# Harness-included starter

A starter where a project and its **agent harness** come up together. Clone it, and the checks, the commit gates, the agent rules and the cycle mechanism are already in place.

日本語: [README.ja.md](README.ja.md)

## What is in it

- **Checks** — `oxlint` / `oxfmt` / `tsc` / `vitest`, and the `pnpm` scripts that run them
- **Gates** — `lefthook` on commit and push, and `quality-gate`, which checks whatever a turn changed
- **Agent rules** — `AGENTS.md`, read in every session
- **Cycle mechanism** — seven skills in `.pi/skills/` (`brief` / `adr` / `design` / `plan` / `work` / `close` / `yolo`)
- **Packages** — `upgrade` in `.pi/skills/`, which runs on its own, outside a cycle
- **Extensions** — `consult` (one extension with four tools), `quality-gate` (checks whatever a turn changed), `sound-notify` (a sound and a cmux notification when pi needs you), [`thinking-scrub`](.pi/extensions/thinking-scrub/README.md) (stops looped thinking while it is generated and removes it, so it is not carried into the next turn), `context-precompact` (prepares the standard compaction in the background before it is due and applies it at the boundary instead of waiting for it; `/precompact`, `/precompact now`, `/precompact on|off`, a status line, and settings) (`.pi/extensions/`)
  - `consult_run` — runs one subagent `pi` with a role and a place, without showing it this conversation
  - `consult_subagents` — lists the subagents of this session and stops one; it reads a record, so the list still shows this session's subagents across a reload
  - `consult_worktree` — makes, lists, or removes a unit worktree; a worktree stays until it is removed, and `remove` takes its branch too when it is merged (an unmerged branch is kept)
  - `consult_commit` — commits the work a subagent left in its worktree; you merge it yourself with `git merge --no-ff consult/<unit-id>`
  - the places: `/tmp/pi-consult/<project>-<stamp>/<unit-id>/wt`, on the branch `consult/<unit-id>`, cut from the base `HEAD`
- **CI** — `.github/workflows/pullfrog.yml`, which runs an agent on a dispatch
- **Cycle records** — `cycles/`

## Getting started

```bash
pnpm install
```

1. Run `pnpm product:ready` once to make the clone yours — it deletes `cycles/`, replaces `ROADMAP.md`, `DEFINITION.md`'s `Product` and `What`, `README.md` and `README.ja.md` with their skeletons, removes ` --config vitest.starter.config.ts` from `test`, `test:run` and `test:related`, and deletes `vitest.starter.config.ts`. The product `test` scripts use `vitest.config.ts`, which excludes the harness paths; the starter `test` scripts use `vitest.starter.config.ts`, which covers all tests. Without `--run` it only shows what would change. Add `--only <label>` to target one kind
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
- **Harness tests** — they run with the starter config (`pnpm test:run` uses `vitest.starter.config.ts`), and are excluded by the product config (`vitest.config.ts` excludes the harness paths)

## Harness

The agent harness travels with `scripts/harness/`:

- `pnpm harness:pull` brings the starter's harness into this project, `pnpm harness:push` sends it back. Without `--run` it only shows what would move (`copy` / `remove` / `legacy`).
- The list is `scripts/harness/harness.json`. The starter's place is in `scripts/harness/starter.json` as `{ "starter": "~/..." }` (committed).
- `package.json` is outside the list, so after a pull check its `scripts` and `devDependencies` by hand.
- If your product was made before this layout, move the `starter` value in `scripts/harness.local.json` to `scripts/harness/starter.json`, then pull once with `--run`: the flat 6 files (`scripts/harness.mjs`, `scripts/harness-state.mjs`, `scripts/harness.json`, `scripts/harness.mode.json`, `scripts/harness.test.ts`, `scripts/harness-state.test.ts`) are listed as `legacy` and removed.

## Cycle

One cycle is an ADR, a design, the plans, the work of carrying them out, then a close. A skill holds each stage, and **the next stage is called by that skill's `description`**. No stage calls the next stage; the next stage is found by its `description`.

```
brief        settle the owner's intent and lay the options out (the research, the trial, the talk)
adr          decide what needs deciding (the options, the decision), and proofread the record before the owner reads it
design       walk what each entry affects, cut the cycle into plans, review the cut, proofread it before the owner reads, and say where each runs
plan         write one plan per worktree (the research, the files, the types, the steps, the checks), and proofread the mds before the owner reads
work         carry a plan to done (the slices, the test cleanup, the review, the acceptance, the merge with the base's dependencies set again)
close        judge the cycle, proofread `close.md` before the owner reads it, then ask the owner to verify the Units (a leftover is an `ex-` plan, `proposed` or `dropped`)
yolo         walk the whole cycle without the owner's confirmations
```

The records stay in `cycles/<YYMMDD-NNN-<slug>>/`: `adr.md`, `design.md`, `plan/<plan id>.md`, `close.md`. Git holds the cycle's state. The ADR's `Status` is the decision, and the plan's `Commit`/`Stopped` are the work record; none of them is a cycle status field.

`DEFINITION.md` holds the product. The ADR holds the argument behind it, and it can be opened at any stage. A cycle starts with `brief`; an ADR entry can be added at any stage for a point the owner raises. Every change opens an ADR entry, and the entry names the parts of `DEFINITION.md` it relates to and whether each changes or stands.
