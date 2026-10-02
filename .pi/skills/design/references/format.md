# The design's format

`cycles/<NNN-YYYY-MM-DD>/design.md`.

Section and field names are English; the content is Japanese.

## The shape

```md
# DESIGN <NNN>

## `<plan id>`

<なぜこの plan か>

- ADR: <NN>-<m>, <NN>-<m>
- Where: worktree | base（owner が見る）
- Scope:
  - <unit>.<feature>: <変える物>
- Boundary:
  - Plans: なし
  - External:
    - `<外の物>`: <この変更がそれに求める物>
      - Version: <値>
```

## One plan is one worktree

- A plan is one worktree, one branch and one merge. The plan md, the steps and the checks are written from it.
- The plan id is the name of the change, so a plan can span units.
- A plan that depends on other plans waits for all of them.

## The cut

The cycle's changes are the `accepted` entries of the cycle's ADR. Cut them by what the work reads, not by where it lives.

- Work that reads the same input stays in one plan: the same entries, the same sources, the same boundary. One child continues the work, so nothing is read twice.
- Split only when the inputs differ and the parts can run at once. Ask of a split:
  1. does a half leave the branch failing lint, typecheck or test? then keep it together
  2. is a half not usable on its own? then keep it together
  3. do the two touch the same file? then order them, or keep it together
  4. does a part depend on more than one plan? then it is its own plan, after all of them
- A description never merges before the behaviour it describes.

## The head sentence

- One sentence, before the fields: why this plan. The input it shares, the condition that applies, and what it waits for, when it depends on several plans.
- The rules are not repeated here. This line says this plan.

## Where

- The default is a worktree: a branch, a child, a merge.
- A plan whose work needs the owner's eyes — a browser, a screen, a look — runs in the base: the parent does it in its own tree, and the changes land as they are made. No branch and no merge.
- Propose one place per plan with the reason, and record the owner's answer. `worktree`, or `base` with what the owner watches.
- A base plan lands in the parent's tree as it goes, so a plan that follows it stands on its changes: keep the files apart, or order the two.

## Scope

- One line per unit or feature the plan changes: `<unit>.<feature>: <変える物>`. The names are the definition's.

## Boundary

The plan's edge. Two groups; a group with nothing in it is `なし`.

- `Plans` — the interface with other plans: what another plan decides, and what this plan does with it (uses it, describes it). The reason for the order is the head sentence, not this.
- `External` — what is outside the repository:
  - the parent line: the thing, and what this change needs from it
  - the children: the conditions, and nothing else — `Version`, `Env`, `Contract`, `Data`, `Path`, `Limit`
  - a command or an endpoint is in the code; do not write it

## Writing

- Do not write what the reader can look up.
- Keep a table short: a wide one breaks with long text.
- Do not write the plan here: the files, the internal dependencies, the types and the steps belong to the plan md.
