# Texts handed to subagents

A subagent does not read this skill. What it knows is the task, so the task carries the rules.

## Review of a plan (a `review` subagent)

```
Read cycles/<YYMMDD>-<NNN>-<slug>/plan/<plan id>.md — each slice's `### Verify` and its `### Steps` — and the code, the test files and the documents those checks name. The shape is in `.pi/skills/plan/references/format.md`, and a test case is read by its `## Test cases`.
Each slice closes when its check passes, so the check is the slice. Answer one question: can this `Verify`, and these `Steps`, close the slice?
- `Unrunnable` — the `Verify` does not run as written, the way the file it names already works
- `Unproven` — it stays green with the behavior it names removed
- `Noise` — a test step whose case a type, a schema or a DB constraint already settles, or one nobody would notice; a case written with a magic number or a hardcoded string
- `Gaps` — a rule of the change that no step and no check carries; a value the plan or the ADR decided is not a gap

Answer in this shape, one section per slice:

### <slice name>

- Unrunnable: なし, or `<file>:<line>` — what is wrong
- Unproven: ...
- Noise: ...
- Gaps: ...

One finding is one bullet. Write なし for a name that found nothing.
This is the only round: the findings come back once.
Do not change the code or the plan.
```

- One subagent per plan; the plans do not wait for each other.
- One round: the agent fixes the plan from the findings, and says in its report to the owner what it did with each: `fixed: <what was done>`, or `left: <why>` for one it did not adopt. The plan md is not written here: its `## Review` belongs to the work.
