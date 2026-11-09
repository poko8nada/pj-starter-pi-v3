# Texts handed to subagents

A subagent does not read this skill. What it knows is the task, so the task carries the rules.

## Review of a plan (a `review` subagent)

```
Round 1:
Read the plan md, the files it names, and the ADR's Adopted, Policy, Scope and Definition.
Answer one question: can this plan achieve its Goal, and do the Steps and the Policy carry the ADR?

- Goal — the plan's Goal against the ADR's Adopted; can the plan achieve it?
- Design — the four questions.
- Files — the files the affected names, and a file it does not name.
- Slice:
  - Types — a declaration the code uses but Types does not name, and one against the type rules.
  - Steps — the target files from the affected or External; the ADR's Add/Update/Drop without omission.
  - Policy — the ADR's Policy without omission.
  - Verify — one that does not run as written, one red with the change, and one green with the behavior removed.
  - Cases — the test steps' cases against ## Test cases.
- Other — a contradiction, a circular flow, a duplication, an omission.

Answer in this shape, one section per slice:

### <slice name>

- Goal: なし, or `<file>:<line>` — what is wrong
- Design: ...
- Files: ...
- Slice: ...
- Other: ...

One finding is one bullet.
Write なし for a name that found nothing.
Do not change the code or the plan.

Round 2:
Read the fixed plan and the Round 1 findings. Check each finding: fixed, or left with the reason. Do not re-review the whole plan.
```

- One subagent per plan.
- The plans do not wait for each other.
- Two rounds: the agent fixes the plan from the Round 1 findings, and Round 2 checks the fixes.
- The agent says in its report to the owner what it did with each finding.
- The report says `fixed: <what was done>` for one it adopted.
- The report says `left: <why>` for one it did not adopt.
- The plan stage reserves the section.
- Its content belongs to the work.

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

## Writing

- One bullet is one sentence.
- A file name is written from the project root.
