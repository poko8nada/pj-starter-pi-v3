# Plan cut

The cycle's changes are the `accepted` entries of the cycle's ADR. Cut them by what the work reads, not by where it lives.

## Cut

- Work that reads the same input stays in one plan. The input is the subject: the entries it decides, the sources it changes, and the outside it talks to — not every file it happens to read. One subagent continues the work, so nothing is read twice.
- Split only when the inputs differ and the halves can run at once. Ask of a split:
  1. does a half leave the branch failing lint, typecheck or test? then keep it together
  2. is a half not usable on its own? then keep it together
  3. do the two touch the same path? then they are one plan — the paths are in the affected's `### Code`. Order the two only when one reads the output of the other; whether a file exists, and its shape, is the plan's
  4. does a piece depend on more than one plan? then it is its own plan, after all of them
- A description never merges before the behaviour it describes.

## Present

Present one block per plan, in a fence. Then write the order last, numbered, for all plans. The owner agrees before the plan md is written.

```markdown
## <plan id>

- ADR: <NN>
- Place: <worktree|base>
- Summary: <what this plan does, in one sentence>
- Why: <read the `Kind` and the `Edge` in the affected, and write what those say and why they make these entries one plan; do not list the field names alone>

## Order:

1. <plan-a>
2. <plan-b> + <plan-c> (parallel)
3. <plan-d>
```

The `## Order:` is one trailing list, not one per plan. Plans that can run at once share one number with `+` and `(parallel)`.

## Where

- The default is a worktree: a branch, a subagent, a merge.
- A plan whose work needs the owner's eyes — a browser, a screen, a look — runs in the base: the agent does it in its own tree, and the changes land as they are made. No branch and no merge.
- A yolo plan is worktree; the base condition does not apply.
- Propose one place per plan with the reason, and record the owner's answer. `worktree`, or `base` with what the owner watches.
- A base plan lands in the agent's tree as it goes, so a plan that follows it stands on its changes: keep the files apart, or order the two.
