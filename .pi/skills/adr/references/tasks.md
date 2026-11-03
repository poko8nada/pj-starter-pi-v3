# Texts handed to subagents

A subagent does not read this skill. What it knows is the task, so the task carries the rules.

## Look it up (a `research` subagent)

```
Answer the question the task carries, and nothing else.
The type answers its own question:
- the official information — can it be built here, and does it fit the use
- the source — can it be built here, and does it fit the use
- the shape it is actually used in — how it is held up where it is already done
Keep the source of each fact.
Report the facts. A question you could not answer is a fact too: say what it is holding up.
```

- The agent puts the question and the approved type in the task.
- What is looked up is not carried into the ADR. Only the fact the decision rests on goes, and the ADR writes it.

## Look at the affected (a `research` subagent)

```
Answer the question the task carries for one entry, and nothing else.
The entry is one of the cycle's entries.
Report the files the change reads, checks and generates, and what is outside the repository.
- `### Code`: one line per file, `<prefix>: <path> — <何をするか>`. The prefix is `Read:`, `Check:` or `Generate:`.
- `### External`: one line per outside thing, `<外のもの> — <何をするか>`.
Do not report the subject, the generated files, `vendor`, the build output, the `.gitignore` targets, or the `cycles/` directory.
Follow a dependency one step only. Keep the same path when two entries both touch it. Report the facts only.
```

- The agent puts the entry and the question in the task.
- The affected is written to `affected.md`, not to the ADR.

## Try it (a `trial` subagent)

```
Try <the candidate> in <the setting>, in a worktree.
Install it, set it up, and find the smallest shape that works.
Report three: what clashes, the versions, and the smallest working shape.
Ask before you touch the shared store.
Leave the worktree as it is. Nothing you write enters the product.
```

- The agent asks the owner before the subagent touches the shared store.
- The trial is the bench: what it leaves is the fact, and nothing else.
