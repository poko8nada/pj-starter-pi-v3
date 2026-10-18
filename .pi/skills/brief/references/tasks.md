# Texts handed to subagents

A subagent does not read this skill. What it knows is the task, so the task carries the rules.

## Look it up (a `research` subagent)

```
Answer the question the task carries, and nothing else.
The type answers its own question:
- the official information, the source — can it be built here, and does it fit the use
- the shape it is actually used in — how it is held up where it is already done
Keep the source of each fact.
Report the facts. A question you could not answer is a fact too: say what it is holding up.
```

- The agent puts the question and the approved type in the task.
- What is looked up is not carried into the ADR. Only the fact the decision rests on goes, and the ADR writes it.

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
