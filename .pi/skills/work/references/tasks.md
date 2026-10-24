# Texts handed to subagents

A subagent does not read this skill. What it knows is the task, so the task carries the rules.

## Slices (a `code` subagent)

```
Read cycles/<YYMMDD>-<NNN>-<slug>/plan/<plan id>.md.
Work its slices in order, as far as you can.
For each slice: its `Steps`, then its `Verify`, then commit (consult(<plan id>): <short English subject>), then write that slice's record in ## Notes.
A finding is a hole you could not close: one bullet for the hole, and `left: <why>` under it. What you did, and why, goes in the commit message. `Unplanned` is only for a hole you found and fixed here. Write なし when there is none.
If you cannot finish, write where you stopped (Stopped) and stop.
```

- Agent passes `worktree` (for a worktree plan) and `continue: true` after the first run. Role's own permissions (`types.json`) are what the subagent works under.
- Check comes before the commit: a filled `Commit` means that slice's check passed.

## Clean the tests (the `code` subagent, continued)

```
After the slices, clean the tests in the test files the plan's `Files` updates:
- two or more tests that check the same behavior
- a test for a behavior that is gone
- a test for a branch this plan's change stops making
- a test the plan's `## Test cases` would not write: a premise the types, the schema or the DB already settle, or one nobody would notice
Drop what you find, and keep the suite green.
Write it in the plan md's ## Notes, as a section that is not a slice.
```

- It is not a slice: what went stale is known only after the change.

## Review (a `review` subagent)

```
Read cycles/<YYMMDD>-<NNN>-<slug>/plan/<plan id>.md (## Files, the slices' `### Verify` and `### Steps`, ## Notes).
Read the diff yourself with `git diff <base hash>..HEAD` (`git diff`, `git status`, `git log` are allowed for this role).
Answer one question: can this diff close the plan? By five viewpoints:
- Stale: a document, a comment or a test this change makes stale
- Unlisted: a change the plan's Files does not name
- Gaps: a behavior the checks do not exercise
- Unproven: a test that stays green when the behavior it names is broken
- Noise: a test the types, the schema or a DB constraint already settle, or one nobody would notice; a case written with a magic number or a hardcoded string
Read the test steps' cases by `.pi/skills/plan/references/format.md`'s `## Test cases`.
A value the plan or the ADR already decided is not a finding, and neither is a behavior the plan covers in `Added`.
Write your findings in the plan md's ## Review, under ### Round 1: one bullet per finding, under the viewpoint it came from, each with <file>:<line>. Write なし for a viewpoint that found nothing.
This is the only round of findings. A doubt or a note that is not a finding goes under `- Doubts:` in `### Round 1`.
Do not change the code.
```

```
Fixes for Round 1 are in. Look only at the lines marked fixed:, and check each one is really fixed.
This is the last look. Write your answer in ### Round 2, same viewpoints, and stop. A doubt that is not a finding goes under `- Doubts:` in `### Round 2`.
```

- Round 1 runs in a new conversation (`continue: false`); Round 2 continues the reviewer's own. A Round 1 that finds nothing ends the review.
- After Round 2 the review ends. What is still open is fixed once more, and nothing looks at it again: the record and the report hold it.
- Reviewer's role allows it to write only `cycles/*/plan/*.md`: it writes the record, and nothing else.

## Fixes (the `code` subagent, continued)

```
Read the plan md's ## Review, ### Round 1. For each finding without a `fixed:` or `left:` line, adopt it and fix it, or leave it.
When you adopt one, add a `fixed:` line under it, saying what you did. When you leave one, add a `left:` line under it, saying why.
Run the plan's checks after fixing. Then commit: consult(<plan id>): round <N> fixes
```

## Acceptance's findings (a `code` subagent)

```
Acceptance found this, in cycles/<YYMMDD>-<NNN>-<slug>/plan/<plan id>.md (## Acceptance, Findings):
<the lines>
Fix them, run the plan's checks, and commit: consult(<plan id>): acceptance fixes
If one cannot be fixed here, write why under it instead, and leave it for the close.
```
