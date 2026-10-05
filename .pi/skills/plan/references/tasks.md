# The texts handed to children

## The review of a plan (a `review` child)

```
Read cycles/<NNN-YYYY-MM-DD>/plan/<plan id>.md (## Files, ## Slices, ## Verify).
Review its core, by three viewpoints:
- Shapes: does the I/O cover the change — every shape, signature and state the plan moves
- Checks: is every Verify runnable, do its cases cover the walk, do they follow the test file they name, and does each case's input tell the behavior from its absence
- Files: is a file missing, is a file shared with another plan, is a double in the right place
Report your findings: one bullet per finding, under the viewpoint it came from. Write なし for a viewpoint that found nothing.
Do not change the code.
```

```
The plan was fixed from your findings. Re-read the plan md's core (## Files, ## Slices, ## Verify) and check each finding is really addressed, and that the fix did not open a new hole.
Write your answer in Round 2, same viewpoints. Write なし if nothing is left.
```

- One child per plan; the plans do not wait for each other.
- Round 1 runs in a new conversation; Round 2 continues the reviewer's own. Two rounds: a Round 1 that finds nothing ends the review, and a Round 2 that still finds the same thing goes to the owner.
- The parent fixes the plan from the findings, and says in its report to the owner what it did with each: `fixed: <what was done>`, or `left: <why>` for one it did not adopt. The plan md is not written here: its `## Review` belongs to the work.
