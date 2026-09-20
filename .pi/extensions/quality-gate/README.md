# quality-gate

Runs format, lint and typecheck on the files the agent touched, and hands the failures back as a follow-up so the same turn fixes them.

## Install

Auto-discovered from this directory. Nothing to copy.

After adding or editing, run `/reload` in pi.

## What it does

After each turn, it checks the files that were edited and, on failure, queues a message telling the agent to fix them. The suite runs again after that turn, up to three times; then it stops and reports what is still failing.

| Phase  | Check       | Script                      | On failure                                     |
| ------ | ----------- | --------------------------- | ---------------------------------------------- |
| fix    | `lint:fix`  | `pnpm run lint:fix`         | ignored, the verify phase reports what remains |
| fix    | `format`    | `pnpm run format`           | ignored, same                                  |
| verify | `lint`      | `pnpm run lint`             | reported                                       |
| verify | `typecheck` | `pnpm run typecheck:staged` | reported                                       |

The fix phase only applies changes that cannot alter meaning. `oxlint --fix` can leave braces in a shape the formatter disagrees with, which is why `format` runs after it. Anything needing a judgement call (`eqeqeq`, `no-unused-vars`) is left for the agent.

Files that were deleted, or are git-ignored, are skipped rather than passed to the tools, which would fail on a path that does not exist.

## Hooks

| Event              | Purpose                                                                                                        |
| ------------------ | -------------------------------------------------------------------------------------------------------------- |
| `tool_result`      | Records the path of each `edit` / `write`, since `agent_end` does not carry tool inputs                        |
| `agent_end`        | Runs the suite. Not `agent_settled`: sending from settled leaves a stale extension context on the second round |
| `input`            | Clears the retry count when the user types something new                                                       |
| `session_start`    | Resets state                                                                                                   |
| `session_shutdown` | Records anything left unresolved                                                                               |

A run that ended in `error` or `aborted` is skipped: the model or the user stopped it, so queueing more work would only repeat the failure.

## `/quality-gate`

Runs the suite once on everything touched this session, without queueing a follow-up. Use it to check before committing.

## Limits

Three attempts per turn. Beyond that the agent is told to stop and report what remains, and the unresolved paths are recorded on the session so they can be found afterwards.

## Relation to lefthook

`lefthook.yaml` runs format, lint, typecheck and test at commit time. This extension runs the first three earlier, while the agent still has the turn open, so the agent fixes its own mistakes instead of the user finding them at commit.

`pnpm test` is not in the list, and nothing in the code says why. It runs at commit time through `lefthook`, so a broken test is caught before the change lands, but the agent does not see the failure while it still has the turn open.

## Tests

No test file. The checks shell out to `pnpm`, and the rest is event wiring; both need a real pi session to exercise. This is the gap noted in `spec/harness/v001.json` under `quality-gate`.
