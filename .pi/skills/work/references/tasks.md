# Texts handed to subagents

A subagent does not read this skill. What it knows is the task, so the task carries the rules. Work in the tree you were given. Read and write the plan md there.

## Slices (a `code` subagent)

When the plan md is agreed.

```text
Work the plan's slices in order, as far as you can.

1. Read cycles/<YYMMDD>-<NNN>-<slug>/plan/<NN>-<plan id>.md.
2. Follow the plan's `Goal` and each slice's `Policy`.
3. For each slice, do its `Steps` and its `Policy`, then its `Verify`, then commit it as `consult(<plan id>): <short English subject>`.
4. Write each slice's record in `## Notes` as `### Slice N: <name>`, in the shape `.pi/skills/plan/references/format.md` gives.
   - IF the slice passed its `Verify` → `Commit` holds the hash.
   - IF a hole could not be closed → write it as a finding, with `left: <why>` under it. What you did, and why, goes in the commit message.
   - IF you found and fixed a hole here → `Unplanned` holds it.
   - IF you cannot finish → write `Stopped` with what the stop left, and stop.
   - IF none of the above → write `なし`.
5. Report the slices you worked, with their commits.
```

- Agent passes `worktree` (for a worktree plan) and `continue: true` after the first run.
- Role's own permissions (`types.json`) are what the subagent works under.
- Check comes before the commit.
- A filled `Commit` means that slice's check passed.

## Clean the tests (the `code` subagent, continued)

When the slices are done.

```text
Clean the tests in the test files the plan's `Files` updates, and keep the suite green.

1. Read the plan md and the test files the plan's `Files` updates.
2. For each test, decide keep, drop, or fix:
   - IF two or more tests check the same behavior → drop it.
   - IF the test is for a behavior that is gone → drop it.
   - IF the test is for a branch this plan's change stops making → drop it.
   - IF the test is one the plan's `## Test cases` would not write (a premise the types, the schema or the DB already settle, one nobody would notice, or an `Add`, `Update` or `Drop` line with no case) → drop it.
   - IF the test hides the premise the behavior needs → move the premise into the test, and leave only the values that do not affect the behavior in the setup.
   - IF the test builds a premise another test already shares → share it when nobody changes it, and keep a mutable premise in each test.
   - IF none of the above → keep it.
3. Drop the tests you found and fix the premises you found, and keep the suite green.
4. Report it in the plan md's `## Notes`, as `### Cleanup: <what it cleaned>`, with `Findings` and `Unplanned`, and a fixed premise goes in `Unplanned`.
```

- It is not a slice.
- What went stale is known only after the change.

## Review (a `review` subagent)

When the slices and the test cleanup are done.

```text
Answer one question: can this diff close the plan?

1. Read the plan md (`## Files`, the slices' `### Verify` and `### Steps`, `## Notes`) and the test steps' cases by `.pi/skills/plan/references/format.md`'s `## Test cases`.
2. Read the diff yourself with `git diff <base hash>..HEAD` (`git diff`, `git status` and `git log` are allowed for this role).
3. Answer under six viewpoints:
   - `Stale` — a document, a comment or a test this change makes stale, or a sentence the change makes redundant
   - `Unlisted` — a change the plan's `Files` does not name
   - `Gaps` — a behavior the checks do not exercise, and a hole that misses the plan's `Goal`
   - `Policy` — a `Policy` line the diff does not keep: an `Allowed` it forbids, or a `Forbidden` it does
   - `Unproven` — a test that stays green when the behavior it names is broken
   - `Noise` — a test the types, the schema or a DB constraint already settle, or one nobody would notice; a case written with a magic number or a hardcoded string
4. Write your findings in the plan md's `## Work Review`, under `### Round 1`: one bullet per finding, under the viewpoint it came from, each with `<file>:<line>`, and `なし` for a viewpoint that found nothing.
   - IF a value the plan or the ADR already decided → it is not a finding, and neither is a behavior the plan covers in `Added`.
   - IF a doubt or a note is not a finding → write it under `- Doubts:` in `### Round 1`. A doubt you resolved yourself is not written: write only a doubt that needs a fix or the owner's judgement.
5. When the fixes for Round 1 are in, look only at the lines marked `fixed:`, and check each one is really fixed. Write your answer in `### Round 2` of the same plan md, under the same viewpoints, and stop. A doubt that is not a finding goes under `- Doubts:` in `### Round 2`.
6. Report the record you wrote, and change no code.
```

- A Round 1 that finds nothing ends the review.
- After Round 2 the review ends.
- What is still open is fixed once more.
- Nothing looks at it again: the record and the report hold it.
- Reviewer's role allows it to write only `cycles/*/plan/*.md`.
- It writes the record, and nothing else.

## Fixes (the `code` subagent, continued)

When the Round 1 findings are in.

```text
Read the plan md's `## Work Review`, `### Round 1`, in the same plan md.

1. For each finding without a `fixed:` or `left:` line, adopt it and fix it, or leave it.
2. Add a `fixed:` line under the finding you adopt, saying what you did, and a `left:` line under the one you leave, saying why. A `left:` goes on a finding, not on a doubt.
3. Run the plan's checks after fixing.
4. Commit it as `consult(<plan id>): round <N> fixes`.
5. Report the findings you fixed, and the ones you left.
```

## Acceptance's findings (a `code` subagent)

When the acceptance found something.

```text
Acceptance found this, in cycles/<YYMMDD>-<NNN>-<slug>/plan/<NN>-<plan id>.md (`## Acceptance`, `Findings`):
<the lines>

1. Fix them.
2. Run the plan's checks.
3. Commit it as `consult(<plan id>): acceptance fixes`.
   - IF one cannot be fixed here → write why under it in the same plan md instead, and leave it for the close.
4. Report the findings you fixed, and the ones you left.
```

## Writing

- One bullet is one rule.
- A file name is written from the project root.
