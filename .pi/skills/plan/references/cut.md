# Plan cut

The cycle's changes are the `accepted` entries of the cycle's ADR. Cut them by what the work reads, not by where it lives.

## Cut

What the work reads decides how the plans are cut.

- Work that reads the same input stays in one plan.
- The input is the entries it decides, the sources it changes, and the outside it talks to.
- The input is not every file the work happens to read.
- One subagent continues the work, so nothing is read twice.
- Split only when the inputs differ and the halves can run at once.
- The paths are in the affected's `### Code`.
- Order the two only when one reads the output of the other.
- Whether a file exists, and its shape, is the plan's.
- A description never merges before the behaviour it describes.

### Asking of a split

- Does a half leave the branch failing lint, typecheck or test? Then keep it together.
- Is a half not usable on its own? Then keep it together.
- Do the two touch the same path? Then they are one plan.
- Does a piece depend on more than one plan? Then it is its own plan, after all of them.

## Present

How the cut is shown to the owner, one block per plan in a fence.

- Present one block per plan, in a fence.
- Write the order last, numbered, for all plans.

```markdown
## <plan id>

- ADR: <NN>[, <NN>...]
- Place: <worktree|base>
- Goal: <何が> が <どうなる>、1 行。
- Summary: <what this plan does, in one sentence>
- Why: <read the `Kind` and the `Edge` in the affected, and write what those say and why they make these entries one plan; do not list the field names alone>

## Order:

1. <plan-a>
2. <plan-b> + <plan-c> (parallel)
3. <plan-d>
```

| field       | what it holds                                                                |
| ----------- | ---------------------------------------------------------------------------- |
| `ADR`       | the ADR entries this plan cuts, by number, comma-separated                   |
| `Place`     | `worktree`, or `base` with what the owner watches                            |
| `Goal`      | what becomes what, in one line                                               |
| `Summary`   | what this plan does, in one sentence                                         |
| `Why`       | what the `Kind` and the `Edge` say, and why they make these entries one plan |
| `## Order:` | one trailing list, not one per plan                                          |

- Plans that can run at once share one number with `+` and `(parallel)`.

## Where

Where the plan runs.

| `Place`    | what it means                              |
| ---------- | ------------------------------------------ |
| `worktree` | the default                                |
| `base`     | the plan whose work needs the owner's eyes |

- A worktree plan is a branch, a subagent and a merge.
- A base plan runs in the agent's own tree: the changes land as they are made, and it has no branch and no merge.
- The owner's eyes are a browser, a screen, or a look.
- A yolo plan is worktree, so the base condition does not apply.
- A base plan lands in the agent's tree as it goes, so a plan that follows it stands on its changes.
- Keep the files apart, or order the two.

## Writing

- One bullet is one rule.
- A file name is written from the project root.
