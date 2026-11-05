# Texts handed to subagents

A subagent does not read this skill. What it knows is the task, so the task carries the rules.

## Review of a plan (a `review` subagent)

```
Read through cycles/<YYMMDD>-<NNN>-<slug>/plan/<NN>-<plan id>.md — each slice's `### Verify` and its `### Steps`, and every file it names — and the ADR's `Adopted` and `Scope`. The shape is in `.pi/skills/plan/references/format.md`, and a test case is read by its `## Test cases`.
Each slice closes when its check passes, so the check is the slice. Answer one question: can this `Verify`, and these `Steps`, close the slice?
- `Goal` — each line of the ADR's `Adopted` and the `Scope` that no step and no check carries, and a step that goes past the `Scope`; the answers in `## Design` against the four questions
- `Integration` — how the update is built into the existing, and how the whole is redesigned; a plan that only replaces words
- `Files` — a file the change needs but `Files` does not name, and a document, a comment or a test the change makes stale
- `Types` — a declaration the code uses but `Types` does not name, and a declaration against the type rules
- `Cases` — the test steps' cases and their prefixes (`add:`, `update:`, `drop:`) against `## Test cases`
- `Checks` — a `Verify` that does not run as written, one that is red with the change in place, and a check that stays green with the behavior removed
- `Flow` — a contradiction, a circular flow, a duplication, an omission, an unnatural flow inside a file the change made

Answer in this shape, one section per slice:

### <slice name>

- Goal: なし, or `<file>:<line>` — what is wrong
- Integration: ...
- Files: ...
- Types: ...
- Cases: ...
- Checks: ...
- Flow: ...

One finding is one bullet. Write なし for a name that found nothing.
This is the only round: the findings come back once.
Do not change the code or the plan.
```

- One subagent per plan; the plans do not wait for each other.
- One round: the agent fixes the plan from the findings, and says in its report to the owner what it did with each: `fixed: <what was done>`, or `left: <why>` for one it did not adopt. The plan stage reserves the section; its content belongs to the work.

## Research the unwritable lines (a `research` subagent)

```
Answer for one line the plan cannot write, and nothing else. The task names the line, the ADR's `Adopted` and `Scope`, and what the plan holds so far. Before writing, read the file the line belongs to again.

Ask one question within these four kinds:
- the code's present shape
- the contract of the thing it calls
- the library's or the package's practice
- the shape of the test double

Report the facts that exist now, with where they were found. Do not decide, and do not write the plan.
If the missing fact is none of the four kinds, answer なし; the plan writes the line as `Stopped`, with the question and the reason.
```
