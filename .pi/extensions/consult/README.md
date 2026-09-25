# consult

Runs a child `pi` and returns its final text. The child does not see this conversation.

The agent calls it directly: there is no script to run and no CLI, because a tool call carries the arguments, streams the result, and can be cancelled.

## Types

The caller picks a type, and the type holds the whole policy: model candidates, tools, environment, spend limits, and role. There is no way to override any of it per call — to change the policy, edit `types.json`.

| Type       | Tools                                           | Environment | Turns | Output tokens |
| ---------- | ----------------------------------------------- | ----------- | ----- | ------------- |
| `research` | read, ls, find, grep, web_search, fetch_content | the tree    | 40    | 60,000        |
| `review`   | read, ls, find, grep, web_search                | the tree    | 40    | 120,000       |
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

What the child does read is `AGENTS.md` and user/global extensions. A `GIT_*` environment from a hook (lefthook sets `GIT_INDEX_FILE`) is stripped before git and the child start, so a caller's git context cannot leak into either.

Whatever has to reach the child reaches it as `task` or `input`. There is no way to hand the child a skill: the parent reads the procedure and passes it.

## Settings

`types.json` sits next to this file and is not committed: model ids belong to an account, not to a repository. Copy `types.example.json` and put your own models in it. The file is read on every call, so a change takes effect on the next consult without reloading pi.

## Parameters

| Parameter | Required | Meaning                                                                               |
| --------- | -------- | ------------------------------------------------------------------------------------- |
| `type`    | yes      | How the child runs. One of the types in `types.json`                                  |
| `task`    | yes      | What the child should do                                                              |
| `input`   | no       | Paths to files whose contents are prepended to the child's prompt. One child per path |

```
consult({ type: "review",
          input: ["cycles/002-2026-09-22/definition.md"],
          task: "What is missing in this definition?" })
```

One child per input, all in parallel, and the results come back in the order of the inputs. A path that cannot be read fails the call before any child starts. Without `input`, one child runs with no payload.

The file's contents are **prepended to the child's prompt**, not handed over as a separate document: the child sees one message, the payload first and the task after it. An empty file therefore adds nothing, and a child may read the payload as instructions.

Each input's block is the child's text, then `ref:` when it wrote something, then one `[consult]` line with the model that ran and the spend. The model is there because everything else about the run lives in the tool's `details`, which the calling agent never sees.

## Cancelling

Cancelling the call (Esc) propagates through `AbortSignal`, so the child is killed and its worktree is removed. Ctrl+C is not dependably delivered to the child, so a hard interrupt can leave a worktree behind; `git worktree prune` clears the registration.

## Sound

Plays `Tink` at the start and at the end. It is a signal for the person at the keyboard, and it plays in this process, so the child cannot see or control it. Nothing fails if `afplay` is missing.

## Tests

```
pnpm test:run .pi/extensions/consult
```

`child/spec.test.ts` and `policy/types.test.ts` cover the pure parts: pi argument assembly, JSONL parsing, spend accounting, the model attempt order, the switch decision, and the type policy. `run/run.test.ts` covers reading inputs, the install command, and the commit and ref rules, plus one test that builds a real repository and worktree. Spawning a real `pi` is not covered; the demonstrations do that.

A check that spawns git fixes where it writes through `git-env.ts` — its own repository, config and `HOME` — instead of inheriting the ones it runs under, and one test proves that an inherited `GIT_*` cannot point it at the repository running the check. A hook (this repository runs its checks from one, and `consult` commits a child's work from inside a worktree) must not be able to steer a check's writes.
