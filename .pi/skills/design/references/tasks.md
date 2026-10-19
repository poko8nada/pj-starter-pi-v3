# Texts handed to subagents

A subagent does not read this skill. What it knows is the task, so the task carries the rules.

## Walk the relations (a `research` subagent)

```
Answer for one entry, and nothing else. The task names the entry and the Unit it changes.
Walk what that change touches, across Units, and report the paths that exist now:
- what this change reads
- what reads the result of this change
- what checks it
- what is generated
- the documents
Give each path with a short reason, under its group. Report the paths only: a path that does not exist yet is not one of them.
Do not drop a path that repeats: the same path under two entries is a fact the cut reads.
Report facts, and nothing else. Do not decide, and do not say what should change.
```

- The agent hands one `accepted` entry, and the Unit it names, in the task.
- What comes back is written into design.md's `## Possibly related files`, as it is.
