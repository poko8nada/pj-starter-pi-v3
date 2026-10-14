# Texts handed to subagents

A subagent does not read this skill. What it knows is the task and the plan md, so the task carries the rules.

## Slices (a `code` subagent)

```
Read cycles/<YYMMDD>-<NNN>-<slug>/plan/<plan id>.md.
Work its slices in order, as far as you can.
For each slice: its `Steps`, then its `Verify`, then commit (consult(<plan id>): <short English subject>), then write that slice's record in ## Notes.
A finding is a hole you could not close: one bullet for the hole, and `left: <why>` under it. What you did, and why, goes in the commit message. `Unplanned` is only for a hole you found and fixed here. Write なし when there is none.
If you cannot finish, write where you stopped (Stopped) and stop.
```

- The agent passes `worktree` (for a worktree plan) and `continue: true` after the first run. The role's own permissions (`types.json`) are what the subagent works under.
- Check comes before the commit: a filled `Commit` means that slice's check passed.

## Review (a `review` subagent)

```
Read cycles/<YYMMDD>-<NNN>-<slug>/plan/<plan id>.md (## Files, the slices' `### Verify`, ## Notes).
Review the diff <base hash>..HEAD, by four viewpoints:
- Stale: a document, a comment or a test this change makes stale
- Unlisted: a change the plan's Files does not name
- Gaps: a hole the slices passed over — a behavior the checks do not exercise. A value the plan or the ADR already decided is not a gap: the check does not restate it. A behavior with no faithful double is not a gap when the plan covers it with a `look` / `use` check instead
- Unproven: a test that would stay green if the behavior it names were removed
Write your findings in the plan md's ## Review, under ### Round 1: one bullet per finding, under the viewpoint it came from. Write なし for a viewpoint that found nothing.
Do not change the code.
```

```
The fixes for Round 1 are in. Look only at the lines marked fixed:, and check each one is really fixed.
Write your answer in ### Round 2, same viewpoints. Write なし if nothing is left.
```

- Round 1 runs in a new conversation (`continue: false`); Round 2 continues the reviewer's own. Two rounds: a Round 1 that finds nothing ends the review, and a Round 2 that still finds the same thing goes to the owner.
- The reviewer's role allows it to write only `cycles/*/plan/*.md`: it writes the record, and nothing else.

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
