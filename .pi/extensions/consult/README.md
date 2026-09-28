# consult

Runs a child `pi` in the background with a type's policy. The child does not see this conversation.

The agent calls it directly: there is no script to run and no CLI, because a tool call carries the arguments. The call returns as soon as the child starts; the child's text arrives later as a message, so the agent can keep working while it runs.

## Tools

The extension registers two tools.

| Tool           | What it does                                                                                  |
| -------------- | --------------------------------------------------------------------------------------------- |
| `consult_new`  | Starts a background child `pi` with a type's policy, and lists or stops the running ones.     |
| `consult_refs` | Lists the refs `consult` leaves behind, and deletes one. Only `consult/` refs can be deleted. |

## Types

The caller picks a type, and the type holds the whole policy: model candidates, tools, environment, spend limits, and role. There is no way to override any of it per call — to change the policy, edit `types.json`.

| Type       | Tools                                           | Environment | Turns | Output tokens |
| ---------- | ----------------------------------------------- | ----------- | ----- | ------------- |
| `research` | read, ls, find, grep, web_search, fetch_content | the tree    | 40    | 60,000        |
| `review`   | read, ls, find, grep, web_search                | the tree    | 40    | 60,000        |
| `trial`    | plus writing                                    | a worktree  | 50    | 120,000       |
| `code`     | plus writing                                    | a worktree  | 60    | 120,000       |

The limits are enforced while the child runs, and neither the caller nor the child can raise them. Normal use finishes far below them.

**A type's output is sized for one document's work** — reading it, judging it, and editing its lines. That is the unit a child gets: one document. A child that rewrites a whole document spends its budget emitting lines nobody asked it to change, and on a long document it runs out before it writes anything; the fix is to edit the lines, not to raise the number.

## Model candidates

Each type lists its models in the order to try. The last attempt is the parent's own settings (no `--model`).

```
1st candidate → 2nd candidate → the parent's settings
```

The child moves to the next candidate when it produced nothing at all (`usage.output` is 0). That covers a model that cannot be used: an unknown id, a missing key, a rate limit. pi does not fail on an unknown id — it warns, the API call fails, and the child still exits 0, so the exit code cannot be the signal.

It does not move on when the child produced something and then failed: that is a task failure, not a model failure. It does not move on when the call was cancelled.

## Environment

`tree` runs the child in the real tree. Read-only types use it: there is nothing to isolate.

`worktree` runs the child in a temporary worktree created from `HEAD`. Before the child starts, consult installs the dependencies in it: `pnpm install --frozen-lockfile` when `pnpm-lock.yaml` is there, `npm ci` when `package-lock.json` is. Without them, neither the child nor the repository's hooks can check anything, and `trial` cannot add a library to try it.

Uncommitted changes are invisible to the child, and anything it writes leaves with the worktree. If the dependencies cannot be installed, that child fails (it is an environment failure, not a bad setting).

## Taking the ref

When the child finishes, consult commits what it left behind and creates a branch `consult/<type>-<date>-<time>-<n>`. The commit runs the repository's own hooks, so **a ref means a commit that passed them**. Nothing is committed when the child changed nothing, and no ref is made when the hooks reject the commit (the failure is reported and the work is not kept).

The parent decides what to do with the ref: cherry-pick it, take part of it, or drop it. consult never touches the parent's tree.

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

Whatever has to reach the child reaches it as `task` or `input`. There is no way to hand the child a skill: the parent reads the procedure and passes it.

## Settings

`types.json` sits next to this file (`.pi/extensions/consult/types.json`) and is committed: it is what a clone starts with. Put your own models in it. The file is read on every call, so a change takes effect on the next consult without reloading pi.

## Parameters

| Parameter | Required   | Meaning                                                                               |
| --------- | ---------- | ------------------------------------------------------------------------------------- |
| `action`  | no         | `start` (the default), `list`, or `cancel`                                            |
| `type`    | for start  | How the child runs. One of the types in `types.json`                                  |
| `task`    | for start  | What the child should do                                                              |
| `input`   | no         | Paths to files whose contents are prepended to the child's prompt. One child per path |
| `id`      | for cancel | The child to stop, as returned by `start` or `list`                                   |

```
consult_new({ type: "review",
          input: ["cycles/002-2026-09-22/definition.md"],
          task: "What is missing in this definition?" })
```

`start` returns at once with `started: <id>` and lists what is running. One child per input, all in parallel, and each child finishes into its own message in the order of the inputs. A path that cannot be read fails the call before any child starts. Without `input`, one child runs with no payload.

An unknown `action`, or `start` without a `type` and `task`, is refused with the usage.

The file's contents are **prepended to the child's prompt**, not handed over as a separate document: the child sees one message, the payload first and the task after it. An empty file therefore adds nothing, and a child may read the payload as instructions.

The prompt reaches the child on stdin, not as an argument, so a task or payload that begins with `-` or `@` stays text.

Each input's block is the child's text, then `ref:` when it wrote something, then one `[consult]` line with the model that ran and the spend. The model is there because everything else about the run lives in the tool's `details`, which the calling agent never sees.

## Background and stopping

`consult_new` starts the child and returns at once with `started: <id>`. The parent does not wait: it keeps working while the child runs. When the child finishes, its text (then `ref:` when it wrote something, then the `[consult]` line) arrives as a message, and that message starts the next turn.

**Esc does not stop a child.** The tool call has already returned, so there is no call left to cancel. Ctrl+C is not dependably delivered to the child either, so a hard interrupt can leave a worktree behind; `git worktree prune` clears the registration.

There are two faces for stopping a child, and one implementation behind them:

| Who       | How                                                                            |
| --------- | ------------------------------------------------------------------------------ |
| The user  | `/consult-status` lists the running children; `/consult-cancel <id>` stops one |
| The agent | the `consult_new` tool with `action: "list"` or `action: "cancel"` and an `id` |

An unknown id is refused with a reason, and nothing is stopped. A stopped child is killed through its `AbortSignal`, and its worktree is removed by the same code that cleans up a normal finish.

A child that writes is committed in its own worktree, and that commit runs the repository's hooks. If they reject it, consult runs the child once more **in the same worktree**, with `--continue` and the hook output as its task; if they reject it again, the worktree is **kept** (the normal cleanup is skipped) and the reply names its path, how many times it ran, the time, and the files the child changed. The record of the stop sits next to the worktree (`stopped.json`), outside it, so it survives even if the worktree is removed later.

## Sound

While at least one child is running, consult plays `Tink` **once every 5 seconds** — one timer and one sound, however many children are running. It stops when the last child finishes, and there is no sound at the start or at the end. It is a signal for the person at the keyboard, and it plays in this process, so the child cannot see or control it.

The sound is **on by default, and the setting lasts for this session only** (it is not written to `types.json`). `/consult-sound on` and `/consult-sound off` turn it on and off, and `/consult-sound` with no argument reports the current state. Nothing fails if `afplay` is missing.

## consult_refs

| Parameter | Required   | Meaning                                          |
| --------- | ---------- | ------------------------------------------------ |
| `action`  | yes        | `list` to see the refs, `delete` to remove one   |
| `name`    | for delete | The ref to delete. It must start with `consult/` |

```
consult_refs({ action: "list" })
consult_refs({ action: "delete", name: "consult/review-2026-09-27-101500-1" })
```

`list` returns every `consult/` ref with its hash, and nothing else. `delete` removes one ref, and refuses any name that does not start with `consult/` — the rest of the repository is never touched. The name convention is documented under **Taking the ref**.

## The code

```
index.ts   the entry: registers the tools and the commands, and nothing else
policy/    what a type is: reading types.json, validating it, resolving a type
child/     the child pi: assembling its arguments, parsing its JSONL, the secret guard
run/       running a child: worktree, install, spawn, spend and commit; plus the ref logic
tool/      the tool faces and the running children: parameters, background and control, formatting, and the sound
```

`run/git-env.ts` is a helper for the checks, not for the tools: it fixes the repository, config and `HOME` that a check's git writes to, so an inherited `GIT_*` cannot steer it.

## Tests

```
pnpm test:run .pi/extensions/consult
```

`child/spec.test.ts` and `policy/types.test.ts` cover the pure parts: pi argument assembly, JSONL parsing, spend accounting, the model attempt order, the switch decision, and the type policy. `run/run.test.ts` covers reading inputs, the install command, and the commit and ref rules, plus one test that builds a real repository and worktree. `run/refs.test.ts` covers listing and judging the refs without spawning git. `tool/consult.test.ts` covers the background face with a fake API: starting returns an id, the completion message carries the child's text, listing and stopping look at the running children, and the sound starts and stops with the children. `tool/sound.test.ts` covers the sound itself with a replaced player and fake timers: one timer, one sound every 5 seconds, and nothing while it is off. Spawning a real `pi` is not covered; the demonstrations do that.

A check that spawns git fixes where it writes through `run/git-env.ts` — its own repository, config and `HOME` — instead of inheriting the ones it runs under, and one test proves that an inherited `GIT_*` cannot point it at the repository running the check. A hook (this repository runs its checks from one, and `consult` commits a child's work from inside a worktree) must not be able to steer a check's writes.
