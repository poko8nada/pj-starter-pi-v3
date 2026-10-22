# Design format

`cycles/<YYMMDD>-<NNN>-<slug>/design.md`.

Section and field names are English; the content is Japanese.

## Shape

```md
# DESIGN <NNN>

## Affected

### <NN>: <entry の問い>

- `<path>`

## External

### <NN>: <entry の問い>

- `<外の物>` — <このエントリーがそこで何をするか>

## `<plan id>`

### ADR & Where

- No: <NN>, <NN>
- Why: <なぜこの plan か。1 文>
- Where: worktree | base（owner が見る）

### Summary

- <この plan が何をするか。1 文>

### Paths

- `<この plan が変えるファイル>`

### Boundary

- Plans: なし
- External:
  - `<外の物>`: <この変更がそこで何をするか>
    - Contract: <前提>
```

## Affected

- The top of the file. One `### <NN>: <entry の問い>` per `accepted` entry, in the entries' order.
- Under it, what the change affects, as the research reported it: what reads the result of the change, what checks it, what is generated from it.
- The files the entry rewrites are not written here: they are the entry's subject, and the plan's `Paths` carries them.
- A path is a fact, not a decision: only what exists now is written here.
- An entry with no path to report carries `なし`. The section is not left out.
- Do not drop a repeat. The same path under two entries is what the cut reads.

## External

- The top of the file, under `## Affected`. One `### <NN>: <entry の問い>` per `accepted` entry, in the entries' order.
- Under it, what the entry talks to outside the repository, as the research reported it: the thing, and what the entry does with it.
- The plan's `Boundary.External` is taken from here; the condition the plan needs is written there.
- A thing that does not exist yet is not written here.
- An entry that talks to nothing outside carries `なし`. The section is not left out.

## One plan is one worktree

- A plan is one worktree, one branch and one merge. The plan md, the steps and the checks are written from it.
- The plan id is the name of the change, so a plan can span Units.
- A plan that depends on other plans waits for all of them.

## Cut

The cycle's changes are the `accepted` entries of the cycle's ADR. Cut them by what the work reads, not by where it lives.

- Work that reads the same input stays in one plan. The input is the subject: the entries it decides, the sources it changes, and the outside it talks to — not every file it happens to read. One subagent continues the work, so nothing is read twice.
- Split only when the inputs differ and the halves can run at once. Ask of a split:
  1. does a half leave the branch failing lint, typecheck or test? then keep it together
  2. is a half not usable on its own? then keep it together
  3. do the two touch the same path? then keep them together — the paths are in `## Affected` — or order them. Whether a file exists, and its shape, is the plan's
  4. does a piece depend on more than one plan? then it is its own plan, after all of them
- A description never merges before the behaviour it describes.

## No

- `No` — the `ADR` entries this plan cuts, by their number.

## Why

- One sentence, in `Why`: why this plan — the input it shares, the condition that applies, and what it waits for.
- The rules are not repeated here. This field says this plan.

## Where

- The default is a worktree: a branch, a subagent, a merge.
- A plan whose work needs the owner's eyes — a browser, a screen, a look — runs in the base: the agent does it in its own tree, and the changes land as they are made. No branch and no merge.
- Propose one place per plan with the reason, and record the owner's answer. `worktree`, or `base` with what the owner watches.
- A base plan lands in the agent's tree as it goes, so a plan that follows it stands on its changes: keep the files apart, or order the two.

## Summary

- Two or three lines: what this plan does, after the ADR's entries are put together or cut apart. It is a digest, not the definition's names.

## Paths

- One line per file the plan changes, as the research found it. A follower that changes with the plan is a path too.
- The checks, and the files the plan only reads, are not here; `## Affected` holds them.

## Boundary

The plan's edge. Two groups; a group with nothing in it is `なし`.

- `Plans` — the interface with other plans: what another plan decides, and what this plan does with it (uses it, describes it). The reason for the order is `Why`, not this.
- `External` — what the change talks to outside the repository, as the research reported it:
  - the parent line: the thing, and what this change does with it
  - the children: the premise, and nothing else — `Env`, `Contract`, `Data`, `Path`, `Limit`
  - a command or an endpoint is in the code; do not write it

## Writing

- One bullet is one sentence.
- Do not write what the reader can look up.
- Keep a table short: a wide one breaks with long text.
- Do not write the plan here: the files, the internal dependencies, the types and the steps belong to the plan md.
