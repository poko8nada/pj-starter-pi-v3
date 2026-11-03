# Harness-included starter

[![Pullfrog](https://github.com/poko8nada/pj-starter-pi-v3/actions/workflows/pullfrog.yml/badge.svg)](https://github.com/poko8nada/pj-starter-pi-v3/actions/workflows/pullfrog.yml) [![TypeScript](https://img.shields.io/badge/TypeScript-7.0.2-3178C6)](https://www.typescriptlang.org/)

A starter where a project and its **agent harness** are in place from the start. This starter already has the checks, the commit gates, the agent rules and the cycle mechanism at the moment you clone it.

日本語: [README.ja.md](README.ja.md)

## What is in it

- **Checks** — `oxlint` / `oxfmt` / `tsc` / `vitest`, and the `pnpm` scripts that run them
- **Gates** — `lefthook`, which checks on commit and on push, and `quality-gate`, which checks only what was changed in each turn
- **Agent rules** — `AGENTS.md`, read in every session
- **Cycle mechanism** — the five skills in `.pi/skills/` (`adr` / `plan` / `work` / `close` / `yolo`)
- **Packages** — `upgrade` in `.pi/skills/`, which runs on its own, separately from a cycle
- **Extensions** — `consult` (one extension with four tools), `quality-gate` (checks what was changed in each turn), `sound-notify` (a sound and a cmux notification when pi is waiting for the user), [`thinking-scrub`](.pi/extensions/thinking-scrub/README.md) (stops looped thinking while it is generated and removes it, so that it is not carried into the next turn), `context-precompact` (without waiting for the standard compaction, prepares in the background before the threshold is reached and applies it at the boundary; `/precompact`, `/precompact now`, `/precompact on|off`, a status line, and settings) (location: `.pi/extensions/`)
  - `consult_run` — starts exactly one subagent `pi` with a role and a place; the subagent is not shown this conversation
  - `consult_subagents` — lists this session's subagents and stops one. Because it reads a record, this session's subagents are shown even across a reload
  - `consult_worktree` — creates, lists and removes unit worktrees. A worktree remains unless it is explicitly removed. `remove` also deletes the branch when it is merged (an unmerged branch is kept)
  - `consult_commit` — commits the work a subagent left in the worktree. To bring it into the main agent's branch, run `git merge --no-ff consult/<unit-id>` yourself
  - Storage location: `/tmp/pi-consult/<project>-<stamp>/<unit-id>/wt`, branch `consult/<unit-id>`, base default `HEAD`
- **CI** — `.github/workflows/pullfrog.yml`, which runs an agent on a dispatch
- **Cycle records** — `cycles/`

## Getting started

```bash
pnpm install
```

1. Make the clone yours with `pnpm product:ready` (once) — it deletes `cycles/` and replaces `ROADMAP.md`, `DEFINITION.md`'s `Product` and `What`, and the two READMEs with their templates. It removes ` --config vitest.starter.config.ts` from `test`, `test:run` and `test:related`, and deletes `vitest.starter.config.ts`. The product `test` uses `vitest.config.ts`, which excludes the harness paths; the starter `test` uses `vitest.starter.config.ts`, which covers all tests. Without `--run` it only shows the changes. To target only one kind, add `--only <label>`
2. `.pi/extensions/consult/types.json` is in the repository, so change it to your own models and use it
3. Start `pi`. The skills are found in `.pi/skills/`

## Checks

| Command                             | Content                                |
| ----------------------------------- | -------------------------------------- |
| `pnpm test:run`                     | Run the tests once                     |
| `pnpm lint`                         | `oxlint` (fails if there are warnings) |
| `pnpm typecheck`                    | `node scripts/checks/typecheck.mjs`    |
| `pnpm format` / `pnpm format:check` | Format / verify                        |

- **On commit** — runs format / lint / `typecheck:staged` / `test:related` / `ja-check` on the changed parts
- **Banned Japanese words** — change `ja-check`'s banned words in `scripts/checks/ja-check.json` (`error` and `warn`)
- **On push** — runs typecheck (the root and the harness) / test
- **On every agent turn** — only when there was a change. The fix stage applies `lint:fix` → `format`, and the check stage applies `lint` → `typecheck:staged`, to the changed parts.
- **Harness tests** — they run under the starter config (`pnpm test:run` uses `vitest.starter.config.ts`), and are excluded by the product config (`vitest.config.ts` excludes the harness paths)

## Harness

The agent harness is handed over with `scripts/harness/`:

- `pnpm harness:pull` brings in what is listed in `copy` from the starter, and `pnpm harness:push` returns what is listed in `push`. Without `--run` it only shows the changes. It never deletes files.
- The list is in `scripts/harness/harness.json`, which has 3 keys: `starter`, `copy`, `push`. `starter` is the other side's (the starter's) path (e.g. `"~/..."`), `copy` is the list for pull, and `push` is the list for push. Items can be written as paths or globs (e.g. `scripts/harness/*.mjs`).
- `package.json` is outside the list, so after a pull, visually check `scripts` and `devDependencies`.
- Items that are not in the source are output as `missing (<count>):`, one per line, and the exit code is 1 whether or not `--run` is given. With `--run`, what can be copied is copied.

## Cycle

One cycle = ADR → plan → plan execution → close. A skill is in charge of each stage. **What calls the next stage is the skill's `description`**, and the previous stage does not call the next stage. The next stage is found from the `description`.

```
adr          when the owner starts a cycle or raises a point about the definition or the cycle, settle the intent, the roadmap item and the entries, and write `cycles/<YYMMDD>-<NNN>-<slug>/adr.md`, recording the owner's decision on what the cycle does to `DEFINITION.md`
plan         when the split is agreed and one of its plans has to become work — after the split is settled and a plan is ready to be handed to a subagent, write `cycles/<YYMMDD>-<NNN>-<slug>/plan/<plan id>.md`, holding files, slices, types, steps and verify
work         when a plan is agreed and its work has to be carried out — after the plan md is written and the owner has read it, run the slices, the review, the acceptance and the merge, and leave the record in the plan md
close        when every plan of a cycle is done (done, or dropped by the owner), collect what the plans left, triage it with the owner, then ask the owner, Unit by Unit, whether they will verify the function
yolo         when the owner says to run the cycle through without their confirmations, at any time after every entry of the ADR is accepted, walk the cycle's stages from where it stands without the owner's confirmations, stop at the close's triage, and pass the `Added` owner check
```

The records stay in `cycles/<YYMMDD-NNN-<slug>>/`: `adr.md` / `affected.md` / `plan/<plan id>.md` / `close.md`. Git holds the cycle's state. The ADR's `Status` is the state of the decision, and the plan's `Commit` / `Stopped` are the work record; they do not represent the cycle's state.

`DEFINITION.md` holds the product's definition. The ADR carries the discussion behind it, and the ADR can be opened at any stage. A cycle starts with the `adr`, and when the owner raises a point, an ADR entry can be added at any stage. On a change, every cycle opens an ADR entry, and the entry writes which parts of `DEFINITION.md` it relates to and whether each part is changed or stays as it is.

## Contributing

`lefthook` checks on commit and on push. On commit it runs format, lint, `typecheck:staged`, `test:related` and `ja-check` on the changed parts, and on push it runs typecheck (the root and the harness) and test. Change `ja-check`'s banned words in `scripts/checks/ja-check.json` (`error` and `warn`).

Before committing, run the following commands:

```bash
pnpm lint
pnpm typecheck
pnpm test:run
```

## License

UNLICENSED
