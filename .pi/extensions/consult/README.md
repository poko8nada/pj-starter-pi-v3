# consult

Runs a child `pi` in the background, with a role and a place. The child does not see this conversation.

The agent calls it directly: there is no script to run and no CLI, because a tool call carries the arguments. A call returns as soon as the child starts; the child's text arrives later as a message, so the agent can keep working while it runs.

## Tools

The extension registers four tools.

| Tool               | What it does                                                                                                                  |
| ------------------ | ----------------------------------------------------------------------------------------------------------------------------- |
| `consult_run`      | Runs **one** child, with a role and (for a role that writes) a worktree. Returns `started: <id>`.                             |
| `consult_children` | Lists the children of this session, and stops one. Reads a record, so it still shows this session's children across a reload. |
| `consult_worktree` | Makes, lists, or removes a unit worktree — and, on `remove`, its merged branch (an unmerged one is kept).                     |
| `consult_commit`   | Commits the work a child left in its worktree, on that worktree's branch.                                                     |

## Roles

The caller picks a role, and the role holds the whole policy: model candidates, tools, whether the child writes, spend limits, and the words it works under. There is no way to override any of it per call — to change the policy, edit `types.json`.

| Role       | Tools                                                     | Place                 | Turns | Output tokens | `continue` by default |
| ---------- | --------------------------------------------------------- | --------------------- | ----- | ------------- | --------------------- |
| `research` | read, ls, find, grep, web_search, fetch_content           | the parent's tree     | 40    | 60,000        | no                    |
| `review`   | read, ls, find, grep, web_search, quick_edit, target_edit | the parent's tree     | 40    | 60,000        | no                    |
| `trial`    | plus bash, and writing                                    | a worktree (required) | 60    | 120,000       | yes                   |
| `code`     | plus bash, and writing                                    | a worktree (required) | 80    | 120,000       | yes                   |

`isolated` decides the place: a role that is not isolated may be given a worktree, and runs in the parent's tree when it is not. An isolated role has no such choice — without a worktree the call is refused, and consult never makes one on its own.

`paths` and `bash` are the role's permissions, enforced inside the child: a write tool (`edit`, `quick_edit`, `target_edit`, `write`) may only touch a path the role allows, and `bash` may only run a command that starts with one of the role's prefixes. Reading is not limited. An empty list means no limit. A path is written from the child's cwd (its worktree): a file, a directory, or a glob (`cycles/*/plan/*.md`).

The parent resolves the policy and hands it to the child on the way in; the child never reads `types.json`. The child's guard holds even where the host has no permission config — the real boundary is still the host and the OS (see Trust).

The limits are enforced while the child runs, and neither the caller nor the child can raise them. A run gets the limit afresh: `continue` starts a new child process, so the second stretch has its own. Normal use finishes far below them.

**A role's output is sized for one document's work** — reading it, judging it, and editing its lines. That is the unit a child gets: one document. A child that rewrites a whole document spends its budget emitting lines nobody asked it to change, and on a long document it runs out before it writes anything; the fix is to edit the lines, not to raise the number.

## `consult_run`

| Parameter  | Required             | Meaning                                                                                                     |
| ---------- | -------------------- | ----------------------------------------------------------------------------------------------------------- |
| `role`     | yes                  | How the child runs. One of the roles in `types.json`                                                        |
| `task`     | yes                  | What the child should do. **Name any file it must read** — the child has `read` itself                      |
| `worktree` | for an isolated role | The unit id to run in (see `consult_worktree`). Omitted for a role that is not isolated = the parent's tree |
| `continue` | no                   | Reopen the same conversation in that worktree. Defaults to the role's `continueByDefault`                   |

```
consult_run({ role: "review", task: "What is missing in cycles/261010-015-main/definition.md?" })
consult_run({ role: "code", task: "Fix the failing check in run/log.ts", worktree: "8-consult.docs" })
```

**One call is one child.** Two children mean two calls; both run at once, and each finishes into its own message. There is no `input` parameter: the child reads what it needs, and the path goes in `task`.

The call returns `started: <id>` with what is running at that moment. `id` is what `consult_children` and the commands take.

The task reaches the child on stdin, not as an argument, so a task that begins with `-` or `@` stays text.

## `consult_children`

| Parameter | Required     | Meaning                                         |
| --------- | ------------ | ----------------------------------------------- |
| `action`  | no           | `list` (the default), or `cancel`               |
| `id`      | for `cancel` | The child to stop, as returned by `consult_run` |

A row carries the id, the role, the place (a worktree id, or `parent`), how long it has been going, its turns, and its spend. A child that is still running shows `running (pid <n>)`; a finished one shows how it ended (`done`, `turn-limit`, `error`, `aborted`) and, when it did not end well, the reason. A child with no end row whose pid is also dead shows `lost` (it is not passed off as `done`).

The list is read from a record on disk (`<root>/records/<project>/<YYYY-MM-DD>.jsonl` — today and yesterday, 2 files), filtered to this session: **only children this session started appear, even across a reload** — a child is not tied to the pi process that started it, but a child from another session is not shown. `cancel` stops a child this session started — one this instance holds through its `AbortSignal`, one from before a reload by sending SIGTERM to the pid in the record; a child from another session is named in the reply and left alone.

## `consult_worktree`

| Parameter | Required       | Meaning                                                                           |
| --------- | -------------- | --------------------------------------------------------------------------------- |
| `action`  | no             | `new`, `list` (the default), or `remove`                                          |
| `id`      | for new/remove | The unit id, e.g. `8-consult.docs`                                                |
| `base`    | no             | What to branch from, for `new`. Defaults to the parent's `HEAD` (never `main`)    |
| `force`   | no             | Remove even when changes are left, and delete the branch even when it is unmerged |

`new` returns the id, the branch, the place, and the base:

| What   | Where                                                                                                                                           |
| ------ | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| `id`   | the unit id, as given                                                                                                                           |
| branch | `consult/<unit-id>`                                                                                                                             |
| `path` | `/tmp/pi-consult/<project>-<YYYYMMDD-HHMMSS>/<unit-id>/wt` — the place the child works in                                                       |
| `base` | what it branched from: `HEAD`, or the `base` you passed                                                                                         |
| record | `<root>/records/<project>/<YYYY-MM-DD>.jsonl` — only the record moved there; the work place and the conversation stay under `<root>/<unit-id>/` |

**A worktree stays until it is removed.** It is the record of what the child did, and the child's work is the only thing in it: uncommitted changes are invisible to the parent's tree, and anything the child writes stays there.

`remove` deletes the worktree and then its branch:

- the branch is deleted **when it is already merged** into the current `HEAD` (or has an upstream that has it) — that is what `git branch -d` refuses otherwise
- an **unmerged** branch is kept, and the reply says so: take it in (`git merge --no-ff consult/<unit-id>`), or discard it with `force`
- a worktree a child is running in is refused regardless of session (a worktree where another session's child is running is not deleted either), and so is one with changes left, unless `force`

`remove` first prunes registrations whose path is gone: a pruned registration reads as missing, and the reply names the pruned paths. It then sweeps the other `consult/*` branches that are checked out nowhere — a merged one is deleted, an unmerged one is kept — and the reply names what was deleted and what was kept. A call refused for a running child is the one exception: it touches nothing. The reply carries the cleanup report: the pruned paths, and for each orphan branch whether it was removed or kept (`unmerged`).

`list` never shows a registration with no real path. The same sweep runs once quietly at `session_start`; it also deletes record files older than 30 days, and a failure there is swallowed so the session still starts.

Before a child starts in a fresh worktree, consult installs the dependencies there: `pnpm install --frozen-lockfile` when `pnpm-lock.yaml` is there, `npm ci` when `package-lock.json` is. Without them, neither the child nor the repository's hooks can check anything, and `trial` cannot add a library to try it. If that install fails, the child fails (an environment failure, not a bad setting).

## `consult_commit`

| Parameter  | Required | Meaning                               |
| ---------- | -------- | ------------------------------------- |
| `worktree` | yes      | The unit id of the worktree to commit |

The reply is one of three:

- `committed: <hash>` — the commit is on the worktree's branch, and its hash is what the ticket's `Commit:` wants
- `rejected: <hook output>` — the repository's hooks refused it. **The work is left in place**: read the output, fix it in the worktree, and call again
- `no change` — the child left nothing to commit

The message is made here — `consult(<unit>): the child's work` — so the log stays countable and the caller cannot slip a different one in. Committing runs the repository's own hooks, so a commit means one that passed them.

**consult does not merge.** Taking the commit into your branch is a plain git command, run by the parent:

```
git merge --no-ff consult/<unit-id>
```

The branch may then be removed with `consult_worktree{action: "remove", id: ...}`; the commit stays reachable from the merge, and `git log --first-parent` shows one line per unit.

## What comes back

A finished child arrives as a message that starts with one line:

```
consult consult-1 (code) finished
```

then the block:

```
## consult-1 — code / done

- place: worktree 8-consult.docs
- turns: 12 / 80
- spend: 0.0123 usd
- files: run/log.ts, tool/children.ts
```

then `---` and the child's last text, then one `[consult]` line with the model that ran and the spend.

- `state` is one of `done`, `turn-limit`, `error`, `aborted`. `reason` is there when it is not `done`
- `files` are the paths the child changed (`git status --porcelain` in its worktree), so a read-only child has none
- **no diff is carried.** The parent reads `git -C <the worktree> diff` itself when it wants one
- **before its last turn, the child is asked to report.** The extension tells it "the next turn is your last; report what you have and what is unfinished", so a child that runs out of turns still says where it got to

## Model candidates

Each role lists its models in the order to try. The last attempt is the parent's own settings (no `--model`).

```
1st candidate → 2nd candidate → the parent's settings
```

The child moves to the next candidate when it produced nothing at all (`usage.output` is 0). That covers a model that cannot be used: an unknown id, a missing key, a rate limit. pi does not fail on an unknown id — it warns, the API call fails, and the child still exits 0, so the exit code cannot be the signal.

It does not move on when the child produced something and then failed: that is a task failure, not a model failure. It does not move on when the call was cancelled.

## Trust

The child does not load the project's settings, project-local extensions, or skills. Those can change how the child runs — a skill or an extension carries instructions, and a repository can ship one.

On top of whatever the host enforces, consult passes its own guard (`-e child/guard.ts`) to the child: it refuses reads of secret paths (`.env`, `.envrc`, `*.pem`, `*.key`) by their **resolved** location, so a path built by a command cannot slip past a string rule. That guard holds even where the host has no permission config at all.

The guard does not imitate the shell: it expands `$VAR` / `${VAR}` from the environment, and refuses a token while a `$` is still unresolved. That is the whole of it. Four holes sit outside that line:

- `cat${IFS}.env` — it does not split words, so `$IFS` does not become whitespace and the token stays `cat.env`
- `cat .env;ls` — it does not join operators, so `;` does not split the token and `.env;ls` stays one word
- a non-bash `path` is not expanded while pi expands `~`, so the guard cannot resolve where `~` points
- a variable assigned in the same command (`FOO=.env; cat $FOO`) is invisible: the guard reads the environment the child was started with, not what the command sets

The real boundary is therefore the host and the OS, not this guard: the guard holds where the host has no config, and those four holes are where the host has to hold instead.

What the child does read is `AGENTS.md` and user/global extensions. A `GIT_*` environment from a hook (lefthook sets `GIT_INDEX_FILE`) is stripped before git and the child start, so a caller's git context cannot leak into either.

Whatever has to reach the child reaches it as `task`. There is no way to hand the child a skill or a file: the parent reads the procedure and passes it, and a file worth reading is named in `task`.

## Background and stopping

A child is started **detached**: it outlives the pi process that started it, so a reload does not kill it, and its work stays in its worktree. What a reload replaces is the delivery — the pipe that a finished child's message comes back through. A session's delivery is dropped at `session_shutdown`; a child that finishes with nowhere to deliver is written to the record instead as a notice, and the next boot of the same session hands those notices over one by one, advancing the cursor only after they are all handed over (a notice may arrive twice, but none is lost).

**Esc does not stop a child.** The tool call has already returned, so there is no call left to cancel. Use `consult_children{action: "cancel", id}` (or `/consult-cancel <id>`).

There are two faces for stopping a child, and one implementation behind them:

| Who       | How                                                                            |
| --------- | ------------------------------------------------------------------------------ |
| The user  | `/consult-status` lists the running children; `/consult-cancel <id>` stops one |
| The agent | the `consult_children` tool with `action: "cancel"` and an `id`                |

An unknown id is refused with a reason, and nothing is stopped. A child this instance holds is stopped through its `AbortSignal`; a child from before a reload is stopped by sending SIGTERM to the pid in the record — only sent, since the end row is written by the side that held that child, and where that side is already gone the row stays `lost` and its worktree is left in place (with its changes) so the parent can decide.

A child that wrote its report but does not exit is stopped after 30 seconds of quiet and its last text is still delivered as `done`.

## Sound

While at least one child is running, consult plays `Tink` **once every 5 seconds** — one timer and one sound, however many children are running. Every tick re-reads the record, and the timer stops itself when no running child of this session remains; there is no sound at the start or at the end. The timer keeps running while the sound is off (it just makes no sound). It is a signal for the person at the keyboard, and it plays in this process, so the child cannot see or control it.

The sound is **on by default, and the setting lasts for this session only** (it is not written to `types.json`). `/consult-sound on` and `/consult-sound off` turn it on and off, and `/consult-sound` with no argument reports the current state. Nothing fails if `afplay` is missing.

## Settings

`types.json` sits next to this file (`.pi/extensions/consult/types.json`) and is committed: it is what a clone starts with. Put your own models in it. The file is read on every call, so a change takes effect on the next consult without reloading pi.

## The code

```
index.ts   the entry: registers the tools and the commands, and nothing else
policy/    what a role is: reading types.json, validating it, resolving a role
child/     the child pi: assembling its arguments, parsing its JSONL, the secret guard, the budget nudge
run/       running a child: the worktree, the install, the spawn, the record, the delivery, and the report
tool/      the tool faces and the running children: parameters, background and control, formatting, and the sound
```

`run/git-env.ts` is a helper for the checks, not for the tools: it fixes the repository, config and `HOME` that a check's git writes to, so an inherited `GIT_*` cannot steer it.

## Tests

```
pnpm test:run .pi/extensions/consult
```

`child/spec.test.ts` and `policy/types.test.ts` cover the pure parts: pi argument assembly, JSONL parsing, spend accounting, the model attempt order, and the role policy. `child/budget.test.ts` covers when the child is nudged to report. `run/child.test.ts` covers one child's wiring without starting it: where it runs (`prepare` — the parent tree or the worktree, and that an isolated role needs one), the env the parent hands over (`childEnv`), and the per-worktree-and-role session file. `run/worktree.test.ts` covers the place, the branch, and the removal (including that an unmerged branch is kept), with a real repository and worktrees. `run/log.test.ts` covers the record: appending, reading it back, skipping a broken line, and judging whether a process is still alive. `run/delivery.test.ts` covers the delivery: it sends to the session that is attached, writes to the record instead when it is not, and does not fall over when a new session attaches after the old one let go. `tool/commit.test.ts` covers the commit face with a replaced git: the three answers, the message it makes, and that it never merges. `tool/children.test.ts` covers the list and the cancel with a record on disk and a fake host (no child is started): row formatting (`elapsed`, `lost`), one row per child (`latest`), session filtering, and the read window. `tool/consult.test.ts` covers the background face with a fake API: running returns an id, the completion message carries the child's text, the ref and the `[consult]` line, and the sound starts and stops with the children. `tool/sound.test.ts` covers the sound itself with a replaced player and fake timers: one timer, one sound every 5 seconds, and nothing while it is off. `run/place.test.ts` covers the record place: the project key, the day name, the day file, the today-and-yesterday window, and the files older than 30 days. `tool/worktree.test.ts` covers the worktree face with a real repository and a record on disk: making, listing, and removing, including that a worktree where a child runs is refused. `child/guard.test.ts` covers the child's secret guard with real files: secret paths by their resolved location, refusing tool calls that touch them, and the role's path and bash permissions. `tool/render.test.ts` covers the shape handed to the parent without starting a child: the result, the usage line, and the report block (no diff is carried). `tool/run.test.ts` covers only the params check (`parseRunRequest`): role, task, worktree and continue validation, with unknown args ignored. Spawning a real `pi` is not covered; the demonstrations do that.

A check that spawns git fixes where it writes through `run/git-env.ts` — its own repository, config and `HOME` — instead of inheriting the ones it runs under, and one test proves that an inherited `GIT_*` cannot point it at the repository running the check. That helper cannot drive a _worktree_ (`GIT_DIR` / `GIT_WORK_TREE` are fixed to the repository), so the checks that commit inside one spawn git with `gitEnv()` and the worktree as the cwd. A hook (this repository runs its checks from one, and `consult` commits a child's work from inside a worktree) must not be able to steer a check's writes.
