# consult

Runs a subagent `pi` in the background, with a role and a place. The subagent does not see this conversation.

The agent calls it directly: there is no script to run and no CLI, because a tool call carries the arguments. A call returns as soon as the subagent starts; the subagent's text arrives later as a message, so the agent can keep working while it runs.

## Tools

The extension registers four tools.

| Tool                | What it does                                                                                                                    |
| ------------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| `consult_run`       | Runs **one** subagent, with a role and (for a role that writes) a worktree. Returns `started: <id>`.                            |
| `consult_subagents` | Lists the subagents of this session, and stops one. Reads a record, so it still shows this session's subagents across a reload. |
| `consult_worktree`  | Makes, lists, or removes a unit worktree — and, on `remove`, its merged branch (an unmerged one is kept).                       |
| `consult_commit`    | Commits the work a subagent left in its worktree, on that worktree's branch.                                                    |

## Roles

The caller picks a role, and the role holds the whole policy: model candidates, tools, whether the subagent writes, spend limits, and the words it works under. There is no way to override any of it per call — to change the policy, edit `types.json`.

| Role          | Tools                                                      | Place                 | Turns | Output tokens | `continue` by default |
| ------------- | ---------------------------------------------------------- | --------------------- | ----- | ------------- | --------------------- |
| `research`    | read, ls, find, grep, web_search, fetch_content            | the base              | 40    | 60,000        | no                    |
| `review`      | read, ls, find, grep, web_search, quick_edit, target_edit  | the base              | 40    | 60,000        | no                    |
| `proofreader` | read, ls, find, grep, edit, quick_edit, target_edit, write | the base              | 80    | 120,000       | no                    |
| `trial`       | plus bash, and writing                                     | a worktree (required) | 60    | 120,000       | yes                   |
| `code`        | plus bash, and writing                                     | a worktree (required) | 80    | 120,000       | yes                   |

`isolated` decides the place: a role that is not isolated may be given a worktree, and runs in the base when it is not. An isolated role has no such choice — without a worktree the call is refused, and consult never makes one on its own.

`paths` and `bash` are the role's permissions, enforced inside the subagent: a write tool (`edit`, `quick_edit`, `target_edit`, `write`) may only touch a path the role allows, and `bash` may only run a command that starts with one of the role's prefixes. Reading is not limited. An empty list means no limit. A path is written from the subagent's cwd (its worktree): a file, a directory, or a glob (`cycles/*/plan/*.md`). One role writes only md, with (`["**/*.md", "**/.*/**/*.md"]`), so md under dot directories is also covered.

The agent resolves the policy and hands it to the subagent on the way in; the subagent never reads `types.json`. The subagent's guard holds even where the host has no permission config — the real boundary is still the host and the OS (see Trust).

The limits are enforced while the subagent runs, and neither the caller nor the subagent can raise them. A run gets the limit afresh: `continue` starts a new subagent process, so the second stretch has its own. Normal use finishes far below them.

**A role's output is sized for one document's work** — reading it, judging it, and editing its lines. That is the unit a subagent gets: one document. A subagent that rewrites a whole document spends its budget emitting lines nobody asked it to change, and on a long document it runs out before it writes anything; the fix is to edit the lines, not to raise the number.

## `consult_run`

| Parameter  | Required             | Meaning                                                                                            |
| ---------- | -------------------- | -------------------------------------------------------------------------------------------------- |
| `role`     | yes                  | How the subagent runs. One of the roles in `types.json`                                            |
| `task`     | yes                  | What the subagent should do. **Name any file it must read** — the subagent has `read` itself       |
| `worktree` | for an isolated role | The unit id to run in (see `consult_worktree`). Omitted for a role that is not isolated = the base |
| `continue` | no                   | Reopen the same conversation in that worktree. Defaults to the role's `continueByDefault`          |

```
consult_run({ role: "review", task: "What is missing in cycles/261010-015-main/definition.md?" })
consult_run({ role: "code", task: "Fix the failing check in run/log.ts", worktree: "8-consult.docs" })
```

**One call is one subagent.** Two subagents mean two calls; both run at once, and each finishes into its own message. There is no `input` parameter: the subagent reads what it needs, and the path goes in `task`.

The call returns `started: <id>` with what is running at that moment. `id` is what `consult_subagents` and the commands take.

The task reaches the subagent on stdin, not as an argument, so a task that begins with `-` or `@` stays text.

## `consult_subagents`

| Parameter | Required     | Meaning                                            |
| --------- | ------------ | -------------------------------------------------- |
| `action`  | no           | `list` (the default), or `cancel`                  |
| `id`      | for `cancel` | The subagent to stop, as returned by `consult_run` |

A row carries the id, the role, the place (a worktree id, or `base`), how long it has been going, its turns, and its spend. A subagent that is still running shows `running (pid <n>)`: the same subagent has no end row and the start time recorded at launch (`startToken`) still matches what `ps -p <pid> -o lstart=` reports for that pid (`--name` carries the token only as the subagent's display name); a row without a `startToken` falls back to whether the pid is alive. A finished subagent whose report has been handed over shows how it ended (`done`, `turn-limit`, `error`, `aborted`) and, when it did not end well, the reason — an end row on its own reads as finished even when its pid is alive again, but a completion whose report is still waiting (`notice` without a mark) shows `running` without a pid until the session hands it over. A start with no end row whose `startToken` no longer matches its pid's `lstart` (or whose pid is dead, for a row without a `startToken`) shows `lost` (it is not passed off as `done`). When the check cannot read a pid at all, the subagent counts as running.

The list is read from a record on disk (`<root>/records/<project>/<YYYY-MM-DD>.jsonl` — today and yesterday, 2 files), filtered to this session: **only subagents this session started appear, even across a reload** — a subagent is not tied to the pi process that started it, but a subagent from another session is not shown. `cancel` stops a subagent this session started — one this instance holds through its `AbortSignal`, one from before a reload by sending SIGTERM to the pid in the record; a subagent from another session is named in the reply and left alone.

## `consult_worktree`

| Parameter | Required       | Meaning                                                                           |
| --------- | -------------- | --------------------------------------------------------------------------------- |
| `action`  | no             | `new`, `list` (the default), or `remove`                                          |
| `id`      | for new/remove | The unit id, e.g. `8-consult.docs`                                                |
| `base`    | no             | What to branch from, for `new`. Defaults to the base `HEAD` (never `main`)        |
| `force`   | no             | Remove even when changes are left, and delete the branch even when it is unmerged |

`new` returns the id, the branch, the place, and the base:

| What   | Where                                                                                                                                                                                                                                   |
| ------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `id`   | the unit id, as given                                                                                                                                                                                                                   |
| branch | `consult/<unit-id>`                                                                                                                                                                                                                     |
| `path` | `/tmp/pi-consult/<project>-<YYYYMMDD-HHMMSS>/<unit-id>/wt` — the place the subagent works in                                                                                                                                            |
| `base` | what it branched from: `HEAD`, or the `base` you passed                                                                                                                                                                                 |
| record | `<root>/records/<project>/<YYYY-MM-DD>.jsonl` — only the record moved there; the work place stays at `/tmp/pi-consult/<project>-<YYYYMMDD-HHMMSS>/<unit-id>/wt` and the conversation (`session-<role>`) sits in the unit dir next to it |

**A worktree stays until it is removed.** It is the record of what the subagent did, and the subagent's work is the only thing in it: uncommitted changes are invisible to the base, and anything the subagent writes stays there.

`remove` deletes the worktree and then its branch:

- the branch is deleted **when it is already merged** into the current `HEAD` (or has an upstream that has it) — that is what `git branch -d` refuses otherwise
- an **unmerged** branch is kept, and the reply says so: take it in (`git merge --no-ff consult/<unit-id>`), or discard it with `force`
- a worktree a subagent is running in is refused regardless of session (a worktree where another session's subagent is running is not deleted either): running means the same subagent has no end row and its `startToken` still matches its pid's `lstart`, and so is one with changes left, unless `force`

`remove` first prunes registrations whose path is gone: a pruned registration reads as missing, and the reply names the pruned paths. It then sweeps the other `consult/*` branches that are checked out nowhere — a merged one is deleted, an unmerged one is kept — and the reply names what was deleted and what was kept. A call refused for a running subagent is the one exception: it touches nothing. The reply carries the cleanup report: the pruned paths, and for each orphan branch whether it was removed or kept (`unmerged`).

`list` never shows a registration with no real path. The same sweep runs once quietly at `session_start`; it also deletes record files older than 30 days, and a failure there is swallowed so the session still starts.

Before a subagent starts in a fresh worktree, consult installs the dependencies there: `pnpm install --frozen-lockfile` when `pnpm-lock.yaml` is there, `npm ci` when `package-lock.json` is. Without them, neither the subagent nor the repository's hooks can check anything, and `trial` cannot add a library to try it. If that install fails, the subagent fails (an environment failure, not a bad setting).

## `consult_commit`

| Parameter  | Required | Meaning                               |
| ---------- | -------- | ------------------------------------- |
| `worktree` | yes      | The unit id of the worktree to commit |

The reply is one of three:

- `committed: <hash>` — the commit is on the worktree's branch, and its hash is what the ticket's `Commit:` wants
- `rejected: <hook output>` — the repository's hooks refused it. **The work is left in place**: read the output, fix it in the worktree, and call again
- `no change` — the subagent left nothing to commit

The message is made here — `consult(<unit>): the subagent's work` — so the log stays countable and the caller cannot slip a different one in. Committing runs the repository's own hooks, so a commit means one that passed them.

**consult does not merge.** Taking the commit into your branch is a plain git command, run by the agent:

```
git merge --no-ff consult/<unit-id>
```

The branch may then be removed with `consult_worktree{action: "remove", id: ...}`; the commit stays reachable from the merge, and `git log --first-agent` shows one line per unit.

## What comes back

A finished subagent arrives as a message that starts with one line:

```
consult consult-1 (code) finished
```

then the block:

```
## consult-1 — code / done

- place: worktree 8-consult.docs
- turns: 12 / 80
- spend: 0.0123 usd
- files: run/log.ts, tool/subagents.ts
```

then `---` and the subagent's last text, then one `[consult]` line with the model that ran and the spend.

- `state` is one of `done`, `turn-limit`, `error`, `aborted`. `reason` is there when it is not `done`
- `files` are the paths the subagent changed (`git status --porcelain` in its worktree), so a read-only subagent has none
- **no diff is carried.** The agent reads `git -C <the worktree> diff` itself when it wants one
- **before its last turn, the subagent is asked to report.** The extension tells it "the next turn is your last; report what you have and what is unfinished", so a subagent that runs out of turns still says where it got to

## Model candidates

Each role lists its models in the order to try. The last attempt is the agent's own settings (no `--model`).

```
1st candidate → 2nd candidate → the agent's settings
```

The subagent moves to the next candidate when it produced nothing at all (`usage.output` is 0). That covers a model that cannot be used: an unknown id, a missing key, a rate limit. pi does not fail on an unknown id — it warns, the API call fails, and the subagent still exits 0, so the exit code cannot be the signal.

It does not move on when the subagent produced something and then failed: that is a task failure, not a model failure. It does not move on when the call was cancelled.

## Trust

The subagent does not load the project's settings, project-local extensions, or skills. Those can change how the subagent runs — a skill or an extension carries instructions, and a repository can ship one.

On top of whatever the host enforces, consult passes its own guard (`-e sub/guard.ts`) to the subagent: it refuses reads of secret paths (`.env`, `.envrc`, `*.pem`, `*.key`) by their **resolved** location, so a path built by a command cannot slip past a string rule. That guard holds even where the host has no permission config at all.

The guard does not imitate the shell: it expands `$VAR` / `${VAR}` from the environment, and refuses a token while a `$` is still unresolved. That is the whole of it. Four holes sit outside that line:

- `cat${IFS}.env` — it does not split words, so `$IFS` does not become whitespace and the token stays `cat.env`
- `cat .env;ls` — it does not join operators, so `;` does not split the token and `.env;ls` stays one word
- a non-bash `path` is not expanded while pi expands `~`, so the guard cannot resolve where `~` points
- a variable assigned in the same command (`FOO=.env; cat $FOO`) is invisible: the guard reads the environment the subagent was started with, not what the command sets

The real boundary is therefore the host and the OS, not this guard: the guard holds where the host has no config, and those four holes are where the host has to hold instead.

What the subagent does read is `AGENTS.md` and user/global extensions. A `GIT_*` environment from a hook (lefthook sets `GIT_INDEX_FILE`) is stripped before git and the subagent start, so a caller's git context cannot leak into either.

Whatever has to reach the subagent reaches it as `task`. There is no way to hand the subagent a skill or a file: the agent reads the procedure and passes it, and a file worth reading is named in `task`.

## Background and stopping

A subagent is started **detached**: it outlives the pi process that started it, so a reload does not kill it, and its work stays in its worktree. When a subagent finishes, the completion is one row in the record (the report body with the values that point at the run). The session re-reads the record every 5 seconds and hands rows without a mark over one by one, adding one mark row for each handover (a notice may arrive twice, but none is lost). The old cursor (`delivered.json`) is only read as the water level for notice rows written before this change; nothing new is written to it.

**Esc does not stop a subagent.** The tool call has already returned, so there is no call left to cancel. Use `consult_subagents{action: "cancel", id}` (or `/consult-cancel <id>`).

There are two faces for stopping a subagent, and one implementation behind them:

| Who       | How                                                                             |
| --------- | ------------------------------------------------------------------------------- |
| The user  | `/consult-status` lists the running subagents; `/consult-cancel <id>` stops one |
| The agent | the `consult_subagents` tool with `action: "cancel"` and an `id`                |

An unknown id is refused with a reason, and nothing is stopped. A subagent this instance holds is stopped through its `AbortSignal`; a subagent from before a reload is stopped by sending SIGTERM to the pid in the record — only when it is still running (no end row for that subagent and its `startToken` still matches its pid's `lstart`), since the end row is written by the side that held that subagent, and where that side is already gone the row stays `lost` and its worktree is left in place (with its changes) so the agent can decide. A start with an end row, or with a `startToken` that no longer matches, is refused as already finished or lost and nothing is killed.

A subagent that wrote its report but does not exit is stopped after 30 seconds of quiet and its last text is still delivered as `done`.

## Sound

Every 5 seconds the session's tick re-reads the record and hands the rows without a mark over one by one, adding one mark row for each handover. When a subagent of this session is still running (no end row and the `startToken` still matches, or an unreadable pid) or a finished report is still waiting for handover, consult plays `Tink` once — one timer and at most one sound per tick, however many subagents are running or waiting. The timer starts at `session_start` and runs until `session_shutdown` (`stopTick`); it does not stop itself when running subagents disappear. The timer keeps running while the sound is off (it just makes no sound). It is a signal for the person at the keyboard, and it plays in this process, so the subagent cannot see or control it.

The sound is **on by default, and the setting lasts for this session only** (it is not written to `types.json`). `/consult-sound on` and `/consult-sound off` turn it on and off, and `/consult-sound` with no argument reports the current state. Nothing fails if `afplay` is missing.

## Settings

`types.json` sits next to this file (`.pi/extensions/consult/types.json`) and is committed: it is what a clone starts with. Put your own models in it. The file is read on every call, so a change takes effect on the next consult without reloading pi.

## The code

```
index.ts   the entry: registers the tools and the commands, and nothing else
policy/    what a role is: reading types.json, validating it, resolving a role
sub/     the subagent pi: assembling its arguments, parsing its JSONL, the secret guard, the budget nudge
run/       running a subagent: the worktree, the install, the spawn, the record, the delivery, and the report
tool/      the tool faces and the running subagents: parameters, background and control, formatting, and the sound
```

## Tests

```
pnpm test:run .pi/extensions/consult
```

| Test                     | Covers                                                                                                       |
| ------------------------ | ------------------------------------------------------------------------------------------------------------ |
| `sub/spec.test.ts`       | pi argument assembly, JSONL parsing, spend accounting                                                        |
| `sub/budget.test.ts`     | when the subagent is nudged to report                                                                        |
| `sub/guard.test.ts`      | the secret guard: resolved paths, refused calls, the role's permissions                                      |
| `policy/types.test.ts`   | the role policy                                                                                              |
| `run/subagent.test.ts`   | one subagent's wiring without starting it: `prepare`, `subagentEnv`, the session file                        |
| `run/worktree.test.ts`   | the place, the branch and the removal                                                                        |
| `run/log.test.ts`        | the record: appending, reading it back, a broken line, liveness                                              |
| `run/place.test.ts`      | the record place: the project key, the day, the 2-day window, 30 days                                        |
| `run/delivery.test.ts`   | delivery: `pendingReports` and `appendDelivered` (pending rows, the mark row, the old cursor as water level) |
| `tool/commit.test.ts`    | the commit face with a replaced git: its three answers                                                       |
| `tool/subagents.test.ts` | the list and the cancel: rows (`elapsed`, `lost`), the session filter, the read window                       |
| `tool/consult.test.ts`   | the background face with a fake API: the id, the completion row (no `sendMessage`)                           |
| `tool/sound.test.ts`     | the sound: `playSound`, the player swap, nothing while off (the timer lives in `index.ts`)                   |
| `tool/render.test.ts`    | the shape handed to the agent: the result, the usage line, the report block                                  |
| `tool/run.test.ts`       | only the params check (`parseRunRequest`)                                                                    |
| `tool/worktree.test.ts`  | the worktree face: make, list, remove, a running subagent refused                                            |

Spawning a real `pi` is not covered; the demonstrations do that.

Git is started through one entry point only: `git()` in `lib/git-env.mjs`, which drops an inherited `GIT_*` before launching. The checks never start git themselves — they take the git they use as an argument — and the tests replace it with a fake, so the test suite starts no git process.
