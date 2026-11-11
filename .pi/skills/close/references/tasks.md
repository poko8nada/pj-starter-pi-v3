# Texts handed to subagents

A subagent does not read this skill. What it knows is the task, so the task carries the rules.

## Look it up (a `research` subagent)

When the agent needs a fact the leftover's destination rests on.

```text
Answer the question the task carries, and nothing else.

1. Keep the source of each fact.
2. Report the facts.
   - A question you could not answer is a fact too: report it, and say what it is holding up.
```

- The agent puts the question and the leftover in the task.
- What is looked up is not carried into `close.md`.
- Only the fact the leftover's destination rests on goes there.
- The close writes it.
