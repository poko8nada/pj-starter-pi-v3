# Texts handed to subagents

A subagent does not read this skill. What it knows is the task, so the task carries the rules.

## Shape

```md
## Look it up (a `research` subagent)
```

## Look it up (a `research` subagent)

```
Answer the question the task carries, and nothing else.
Keep the source of each fact.
Report the facts. A question you could not answer is a fact too: say what it is holding up.
```

- The agent puts the question and the leftover in the task.
- What is looked up is not carried into `close.md`.
- Only the fact the leftover's destination rests on goes there.
- The close writes it.

## Writing

- One bullet is one sentence.
- A file name is written from the project root.
