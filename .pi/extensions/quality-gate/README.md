# quality-gate

Runs format, lint and typecheck on the files the agent changed in a run, and hands the failures back as a follow-up so the same session fixes them.

## Install

Auto-discovered from this directory. Nothing to copy.

After adding or editing, run `/reload` in pi.

## What it does

When a run ends, it works out what that run changed, checks it and, on failure, queues a message telling the agent to fix it. The suite runs again after the turn that follows, up to three times; then it stops and reports what is still failing.

Targets come from git. The working tree is fingerprinted when a run starts and again when it ends, and what differs is checked — so a file written by a script or a formatter counts, not just one written through `edit` or `write`. Paths those tools reported are added on top, so a mid-run `git commit` cannot hide them. Git-ignored paths never appear in the list, and deleted files are not handed to the tools.

| Phase  | Check       | Script                      | On failure                                     |
| ------ | ----------- | --------------------------- | ---------------------------------------------- |
| fix    | `lint:fix`  | `pnpm run lint:fix`         | ignored, the verify phase reports what remains |
| fix    | `format`    | `pnpm run format`           | ignored, same                                  |
| verify | `lint`      | `pnpm run lint`             | reported                                       |
| verify | `typecheck` | `pnpm run typecheck:staged` | reported                                       |

The fix phase only applies changes that cannot alter meaning. `oxlint --fix` can leave braces in a shape the formatter disagrees with, which is why `format` runs after it. Anything needing a judgement call (`eqeqeq`, `no-unused-vars`) is left for the agent.

A run that changed nothing is left alone: there is nothing to check. If a check failure is still unresolved at that point, the user is told once and the gate goes quiet until the next prompt. An agent that says it fixed something without touching a file lands here.

The notices to the user — unresolved after a change-free run, and giving up at the limit — are `ctx.ui.notify`, so they are silent in print and JSON mode. The messages to the agent are not: those are session messages and appear in the event stream.

## Hooks

| Event           | Purpose                                                                                                        |
| --------------- | -------------------------------------------------------------------------------------------------------------- |
| `agent_start`   | Fingerprints the working tree, to compare against at the end                                                   |
| `agent_end`     | Runs the suite. Not `agent_settled`: sending from settled leaves a stale extension context on the second round |
| `tool_result`   | Records the path of each `edit` / `write`. Used only when git cannot answer                                    |
| `input`         | Clears the retry count when the user types something new                                                       |
| `session_start` | Resets state                                                                                                   |

A run that ended in `error` or `aborted` is skipped: the model or the user stopped it, so queueing more work would only repeat the failure.

Without git — no repository, or no `git` command — there is no fingerprint to compare, so the gate falls back to the paths `edit` and `write` reported. Deleted and git-ignored files are filtered out on that path, since the tools fail on a path that is not there.

## Limits

Three consecutive failures. Beyond that the agent is told to stop and report what remains, and the gate stops checking until the user types something new. The count clears when a check passes, when the user types, or when a run ends without a change. Files it gave up on are not re-checked by that next prompt either: they are checked when a later run touches them, or by `lefthook` at commit.

## Relation to lefthook

`lefthook.yaml` runs format, lint, typecheck and test at commit time. This extension runs the first three earlier, while the agent still has the turn open, so the agent fixes its own mistakes instead of the user finding them at commit.

`pnpm test` is not in the list, and nothing in the code says why. It runs at commit time through `lefthook`, so a broken test is caught before the change lands, but the agent does not see the failure while it still has the turn open.

## Tests

```
pnpm test:run .pi/extensions/quality-gate
```

`targets.test.ts` covers the porcelain parsing — including renames, where git appends the original path — and the fingerprint diff. The checks shell out to `pnpm` and the rest is event wiring; both need a real pi session to exercise.
