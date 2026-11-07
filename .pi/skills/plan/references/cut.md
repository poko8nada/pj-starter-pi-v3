# Plan cut

The cycle's changes are the `accepted` entries of the cycle's ADR. Cut them by what the work reads, not by where it lives.

## Shape

```md
## Cut

## Present

## Where
```

## Cut

- Work that reads the same input stays in one plan.
- The input is the entries it decides, the sources it changes, and the outside it talks to.
- The input is not every file the work happens to read.
- One subagent continues the work, so nothing is read twice.
- Split only when the inputs differ and the halves can run at once.
- Ask of a split:
  1. does a half leave the branch failing lint, typecheck or test? then keep it together
  2. is a half not usable on its own? then keep it together
  3. do the two touch the same path? then they are one plan
  4. does a piece depend on more than one plan? then it is its own plan, after all of them
- The paths are in the affected's `### Code`.
- Order the two only when one reads the output of the other.
- Whether a file exists, and its shape, is the plan's.
- A description never merges before the behaviour it describes.

## Present

- Present one block per plan, in a fence.
- Write the order last, numbered, for all plans.

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

- `ADR` — the ADR entries this plan cuts, by number.
- `Place` — `worktree`, or `base` with what the owner watches.
- `Summary` — what this plan does, in one sentence.
- `Why` — what the `Kind` and the `Edge` say, and why they make these entries one plan.
- `## Order:` — one trailing list, not one per plan.
- `## Order:` — plans that can run at once share one number with `+` and `(parallel)`.

## Where

- The default is a worktree: a branch, a subagent, a merge.
- A plan whose work needs the owner's eyes runs in the base.
- The owner's eyes are a browser, a screen, or a look.
- The agent does it in its own tree, and the changes land as they are made.
- It has no branch and no merge.
- A yolo plan is worktree, so the base condition does not apply.
- A base plan lands in the agent's tree as it goes, so a plan that follows it stands on its changes.
- Keep the files apart, or order the two.

## Writing

- One bullet is one sentence.
- A file name is written from the project root.
