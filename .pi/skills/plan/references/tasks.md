# Texts handed to subagents

A subagent does not read this skill. What it knows is the task, so the task carries the rules.

## Review of a plan (a `review` subagent)

```
Read cycles/<YYMMDD>-<NNN>-<slug>/plan/<plan id>.md — each slice's `### Verify` and its `### Steps` — the design's `Goal` and `Non-goal`, and the code, the test files and the documents those checks name. The shape is in `.pi/skills/plan/references/format.md`, and a test case is read by its `## Test cases`.
Each slice closes when its check passes, so the check is the slice. Answer one question: can this `Verify`, and these `Steps`, close the slice?
- `Goal` — the design's `Goal` and `Non-goal` that no step and no check carries, and a step that goes past the `Non-goal`
- `Files` — a file the change needs but `Files` does not name, and a document, a comment or a test the change makes stale
- `Types` — a declaration the code uses but `Types` does not name, and a declaration against the type rules
- `Cases` — the test steps' cases against `## Test cases`
- `Checks` — a `Verify` that does not run as written, and a check that stays green with the behavior removed

Answer in this shape, one section per slice:

### <slice name>

- Goal: なし, or `<file>:<line>` — what is wrong
- Files: ...
- Types: ...
- Cases: ...
- Checks: ...

One finding is one bullet. Write なし for a name that found nothing.
This is the only round: the findings come back once.
Do not change the code or the plan.
```

- One subagent per plan; the plans do not wait for each other.
- One round: the agent fixes the plan from the findings, and says in its report to the owner what it did with each: `fixed: <what was done>`, or `left: <why>` for one it did not adopt. The plan stage reserves the section; its content belongs to the work.

## Research the unwritable lines (a `research` subagent)

```
Answer for one line the plan cannot write, and nothing else. The task names the line, the design's `Goal` and `Non-goal`, and what the plan holds so far.

Ask one question within these four kinds:
- the code's present shape
- the contract of the thing it calls
- the library's or the package's practice
- the shape of the test double

Report the facts that exist now, with where they were found. Do not decide, and do not write the plan.
If the missing fact is none of the four kinds, answer なし; the plan writes the line as `Stopped`, with the question and the reason.
```
