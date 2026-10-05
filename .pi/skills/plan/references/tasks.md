# The texts handed to children

## The review of a plan (a `review` child)

```
Read cycles/<NNN-YYYY-MM-DD>/plan/<plan id>.md (## Files, ## Slices, ## Verify).
Review its core, by three viewpoints:
- Shapes: does the I/O cover the change — every shape, signature and state the plan moves
- Checks: is every Verify runnable, do its cases cover the walk, and do they follow the test file they name
- Files: is a file missing, is a file shared with another plan, is a double in the right place
Report your findings: one bullet per finding, under the viewpoint it came from. Write なし for a viewpoint that found nothing.
Do not change the code.
```

- One child per plan; the plans do not wait for each other.
- The parent fixes the plan from the findings, and says in its report to the owner what it did with each: `fixed: <what was done>`, or `left: <why>` for one it did not adopt. The plan md is not written here: its `## Review` belongs to the work.
