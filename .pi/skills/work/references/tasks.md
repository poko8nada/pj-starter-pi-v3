# The texts handed to children

A child does not read this skill. What it knows is the task and the plan md, so the task carries the rules.

## The slices (a `code` child)

```
Read cycles/<NNN-YYYY-MM-DD>/plan/<plan id>.md.
Work its slices in order, as far as you can.
For each slice: its Steps, then its Verify, then commit (consult(<plan id>): <short English subject>), then write that slice's record in ## Notes.
A finding is one bullet, with `left: <why>` under it.
Say what you did and why in each line you write. If you cannot finish, write where you stopped (Stopped) and stop.
```

- The parent passes `worktree` (for a worktree plan), `continue: true` after the first run, and `paths` as the plan's `Files` plus the plan md.
- The check comes before the commit: a filled `Commit` means that slice's check passed.

## The review (a `review` child)

```
Read cycles/<NNN-YYYY-MM-DD>/plan/<plan id>.md (## Files, ## Slices, ## Notes).
Review the diff <base hash>..HEAD, by three viewpoints:
- Stale: a document, a comment or a test this change makes stale
- Unlisted: a change the plan's Files does not name
- Gaps: a hole the slices passed over (what the Verify blocks do not cover)
Write your findings in the plan md's ## Review, under ### Round 1: one bullet per finding, under the viewpoint it came from. Write なし for a viewpoint that found nothing.
Do not change the code.
```

```
The fixes for Round <N> are in. Look only at the lines marked fixed:, and check each one is really fixed.
Write your answer in ### Round <N+1>, same viewpoints. Write なし if nothing is left.
```

- Round 1 runs in a new conversation (`continue: false`); the rounds after it continue the reviewer's own.
- The parent passes `paths` as the plan md alone: the reviewer writes the record, and nothing else.

## The fixes (the `code` child, continued)

```
Read the plan md's ## Review, ### Round <N>. For each finding without a `fixed:` or `left:` line, adopt it and fix it, or leave it.
When you adopt one, add a `fixed:` line under it, saying what you did. When you leave one, add a `left:` line under it, saying why.
Run the plan's checks after fixing. Then commit: consult(<plan id>): round <N> fixes
```

## The acceptance's findings (a `code` child)

```
The acceptance found this, in cycles/<NNN-YYYY-MM-DD>/plan/<plan id>.md (## Acceptance, Findings):
<the lines>
Fix them, run the plan's checks, and commit: consult(<plan id>): acceptance fixes
If one cannot be fixed here, write why under it instead, and leave it for the close.
```
