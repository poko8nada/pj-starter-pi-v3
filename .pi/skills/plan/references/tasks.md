# Texts handed to subagents

A subagent does not read this skill. What it knows is the task, so the task carries the rules.

## Review of a plan (a `review` subagent)

```
Read cycles/<YYMMDD>-<NNN>-<slug>/plan/<plan id>.md — each slice's `### Verify` — and the code, the test files and the documents those checks name. The walk and the markers are in `.pi/skills/plan/references/format.md`.
Each slice closes when its check passes, so the check is the slice. Answer one question: can this `Verify` close its slice?
- `Unrunnable` — it does not run as written, the way the file it names already works
- `Unproven` — it stays green with the behavior it names removed
- `Gaps` — a line of the walk has no case; a value the plan or the ADR decided is not a gap
- `Noise` — a case the compiler or the schema already settles, or nobody would notice

Answer in this shape, one section per slice:

### <slice name>

- Unrunnable: なし, or `<file>:<line>` — what is wrong
- Unproven: ...
- Gaps: ...
- Noise: ...

One finding is one bullet. Write なし for a name that found nothing.
This is the only round: the findings come back once.
Do not change the code or the plan.
```

- One subagent per plan; the plans do not wait for each other.
- One round: the agent fixes the plan from the findings, and says in its report to the owner what it did with each: `fixed: <what was done>`, or `left: <why>` for one it did not adopt. The plan md is not written here: its `## Review` belongs to the work.
