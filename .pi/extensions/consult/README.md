# consult

Runs a child `pi` once and returns its final text. Give it a role to specialise it, and an input file to give it context. It does not see this conversation.

The agent calls it directly: there is no script to run and no CLI, because a tool call carries the arguments, streams the result, and can be cancelled.

## Install

Auto-discovered from this directory. Nothing to copy.

```
.pi/extensions/consult/       # project-local
~/.pi/agent/extensions/consult/   # global, if you want it everywhere
```

After adding or editing, run `/reload` in pi.

## Parameters

| Parameter | Required | Meaning                                                                            |
| --------- | -------- | ---------------------------------------------------------------------------------- |
| `task`    | yes      | What the child should do                                                           |
| `role`    | no       | Appended to the system prompt. Write the role, not a file path                     |
| `input`   | no       | Path to a file for the child to read on stdin. Fails the call if it cannot be read |
| `tools`   | no       | Tools the child may use. Default `read,ls,find,grep`                               |

```
consult({ role: "You are a strict auditor. Look for what is MISSING.",
          input: "tsconfig.json",
          task: "What is missing in this file?" })
```

## Spend limits

Two limits are enforced while the child runs, and neither can be raised by the caller:

| Limit         | Value  |
| ------------- | ------ |
| Output tokens | 30,000 |
| Turns         | 30     |

The extension reads the child's JSONL as it arrives, adds `usage.output` at each `message_end`, and kills the child the moment a limit is passed. The result says which limit was hit.

Normal use finishes far below both: measured reviews use 6-26 turns and 4,000-16,000 output tokens.

## Safe by default

|                                               | Default                   | Why                                                               |
| --------------------------------------------- | ------------------------- | ----------------------------------------------------------------- |
| Tools                                         | `read,ls,find,grep`       | Cannot write, so the real tree cannot be damaged                  |
| Working tree                                  | the real one              | Read-only, so there is nothing to isolate it from                 |
| Project settings and project-local extensions | not loaded into the child | Otherwise the repository can change the child's own configuration |

**Writing is opt-in.** Pass `tools` with something that can write (`bash`, `edit`, `write`, `powershell`) and the child runs in a temporary worktree instead, so your tree is untouched. A worktree is created from `HEAD`, so uncommitted changes are invisible to the child and anything it writes is removed with it.

If a writing tool is allowed outside a git repository, the call fails rather than running unsandboxed. Read-only runs never need a worktree, so this does not come up by default.

What the child does read: `AGENTS.md`, and extensions under `~/.pi/agent/extensions/`. Only project-local resources are withheld.

The child also does not run `quality-gate`: the extension is project-local, so it is not loaded. Checks are the parent's job.

## Cancelling

Cancelling the call (Esc) propagates through `AbortSignal`, so the child is killed and its worktree is removed. Ctrl+C is not dependably delivered to the child, so a hard interrupt can leave a worktree behind; `git worktree prune` clears the registration.

## Sound

Plays `Tink` at the start and at the end. It is a signal for the person at the keyboard, and it plays in this process, so the child cannot see or control it. Nothing fails if `afplay` is missing.

## Which model

The child runs whatever model the caller's pi is configured to use, and there is no parameter to change it. A caller that can name a model can name an expensive one, and the bill lands on the account owner.

## Tests

```
pnpm test:run .pi/extensions/consult
```

`spec.test.ts` covers the pure parts: pi argument assembly, JSONL parsing, the spend accounting, and the worktree decision. `run.test.ts` covers reading the input file. Process spawning and worktree creation are not covered; they need a real `pi` and a real repository.
