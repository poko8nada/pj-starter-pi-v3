# Texts handed to subagents

A subagent does not read this skill. What it knows is the task, so the task carries the rules.

## First review of a plan (a `review` subagent)

When the plan md is written and its cut is agreed, before the review against the ADR.

```text
You receive one plan md, and nothing else. You can read the codebase. You cannot read the ADR, the affected, or a chat.

Answer one question for each substep in `Steps`: can a subagent implement it without hesitation?

- **実装できる** — the substep names the file, the change, and what to do. A subagent can implement it.
- **迷うが実装できる** — a subagent can implement it, but it must interpret something. Write the part that makes it hesitate and how it would interpret it.
- **実装できない** — a subagent cannot implement it. Write why.

1. Read the plan md.
2. Read the files the plan names, where the substep needs them.
3. Answer one section per slice, one subsection per file step, one bullet per substep, in the plan's order:

   ## <slice name>

   ### <file step>

   - **実装できる**: `<substep>`
   - **迷うが実装できる**: `<substep>`
     - 迷う部分: <...>
     - 解釈: <...>
   - **実装できない**: `<substep>`
     - 理由: <...>

4. Do not change the plan.
```

- A `Steps` subsection is a file step, including an `Outside:` step.

## Review of a plan against the ADR (a `review` subagent)

When the first review is fixed.

```text
Answer one question: can this plan achieve its Goal, and do the Steps and the Policy carry the ADR?

1. Read the plan md, the files it names, the ADR's `Main`, `Sub`, `Policy`, `Scope` and `Definition`, and `.pi/skills/plan/references/design.md`.
2. Answer under these viewpoints:
   - `Goal` — the plan's `Goal` against the `Main` lines of the entries it carries; can the plan achieve it?
   - `Design` — the four questions.
   - `Files` — the files the affected names, and a file it does not name.
   - `Slice` — `Types` (a declaration the code uses but `Types` does not name, and one against the type rules), `Steps` (the target files from the affected or `External`, and the ADR's `Add`/`Update`/`Drop` without omission), `Policy` (the ADR's `Policy` without omission), `Verify` (one that does not run as written, one red with the change, and one green with the behavior removed), and `Cases` (the test steps' cases against `design.md`'s `## Test cases`).
   - `Other` — a contradiction, a circular flow, a duplication, an omission.
3. Answer in this shape, one section per slice:

   ### <slice name>

   - Goal: なし, or `<file>:<line>` — what is wrong
   - Design: ...
   - Files: ...
   - Slice: ...
   - Other: ...

4. Report one finding per bullet, and `なし` for a name that found nothing. Do not change the code or the plan.
```

## Research the unwritable lines (a `research` subagent)

When the plan has a line it cannot write.

```text
Answer for one line the plan cannot write, and nothing else.

The task names the line, the ADR's `Main` and `Sub` and `Scope`, and what the plan holds so far.

1. Before writing, read the file the line belongs to again.
2. Ask one question within these four kinds:
   - the code's present shape
   - the contract of the thing it calls
   - the library's or the package's practice
   - the shape of the test double
3. Report the facts that exist now, with where they were found. Do not decide, and do not write the plan.
   - IF the missing fact is none of the four kinds → answer `なし`; the plan writes the line as `Stopped`, with the question and the reason.
```
