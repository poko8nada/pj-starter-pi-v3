---
name: plan
description: Use when the ADR entries are decided and the work has to be cut into plans. It presents the cut for agreement, writes cycles/<YYMMDD>-<NNN>-<slug>/plan/<NN>-<plan id>.md per plan, and reviews each.
---

# plan

One plan is one worktree. It is one branch and one merge. When the plan md's `Place` says `base`, the agent works in its own tree. Then there is no branch and no merge.

It is written from the ADR and the affected. The work is done from it. A subagent reads the plan, and nothing else, to do the work. For a `base` plan, the agent itself does the work.

## Procedure

### 1. Read the ADR's entries

Read `cycles/<YYMMDD>-<NNN>-<slug>/adr.md`. Read all of its accepted entries in full, with each entry's `Definition` as the scope boundary. A normal plan is cut from the ADR's entries, and writes `No` at the top of the plan md as it is. An `ex-` plan comes from the close's triage instead: read its Triage line in `close.md`, and do not write `No`. The Triage line is the only source.

### 2. Read the affected

Read `cycles/<YYMMDD>-<NNN>-<slug>/affected.md` for those entries. It is the impact map. One `Path` per block, with its `Kind` and its `Edge`. Plus the `### External` items. The shape is in `.pi/skills/adr/references/affected.format.md`.

### 3. Cut, and present

- Before cutting, read `references/cut.md`.
- Cut the work into plans by what it reads, not by where it lives.
- Decide in this order: the split, the place of each plan, the order, and the boundary. When unsure of the place, propose worktree. The owner's answer decides the place.
- Present them to the owner in the fence `references/cut.md` gives. One block per plan (`ADR`, `Place`, `Summary`, `Why`). Then the `Order` last, numbered, for all plans.
- The `Why` reads the `Kind` and the `Edge`. It says what those mean and why the entries make one plan. The field names alone are not enough.
- The owner agrees before any plan md is written. On disagreement, revise and present again until they agree.

### 4. Write the plan md from the affected

- Before writing, read `references/format.md`.
- Read the map's every path whole, and each file those paths directly name: what they import, what they re-export, and the tests beside them.
- Decide each path's mark: `add`, `update`, `drop`, or no mark.
- Answer the four questions in `## Design` of `references/format.md`.
- A target of questions 3 and 4 goes into `Files` even when it is past the ADR's `Scope`. The reason goes into `## Design`.
- The affected is the plan's material. An `Edge: checks` is an `Always` line with the related tests. A `Kind: artifact` is a path in `Files` with its mark. When it is generated, the step says how. An `### External` item is the step's `Outside:`. A path is a `Files` line.
- Choose the `Added` checks the work needs: work on rows goes to DB, a component the owner must see goes to front, auth behavior goes to auth, an amended Japanese document goes to proofread, and anything else goes to other. `なし` when nothing applies.
- The marks follow the `Adopted`: `Add` is `add`, `Update` is `update`, `Drop` is `drop`, and `Keep` is no mark.
- Read the `Definition` `Unit` lines as the scope. Lines with `(added)`, `(updated)` or `(dropped)` are the work. Lines with `(kept)` are context. When the `Definition` changes `Who`, `Stack` or `What`, write that change as steps on `DEFINITION.md`.
- Decide the slices by the check that closes them. The check comes first. Then the dependency order. Then the same place together.
  - One slice closes with one `Verify`.
  - Different checks mean different slices.
  - One check closes the parts together.
- Put a slice that reads another slice's output after it.
- Keep steps that touch the same place in one slice.
- A subagent may carry several slices in one run.
- Cut a `base` plan where the owner can look and decide.
  - Its check carries the look.
  - Their answer closes the slice.

When the plan's `Files` has neither `add` nor `drop`, write in the `Steps` and the `Design` how the update is built into the existing, and how the whole is redesigned. A plan that only replaces words is not a plan.

**A boundary with no answer is a hole in the plan.** A `Verify` that cannot be run, or that is red with the change in place, is a hole too. Stop, and decide the shape before writing on. Say why a hole does not apply. Leave a line the plan cannot write with its name and an empty field. Step 5 fills it.

### 5. Research the lines the plan cannot write

For a line the plan cannot write, run one `research` subagent within the four kinds. The kinds are the code's present shape, the contract of the thing it calls, the library's or the package's practice, and the shape of the test double. The task is in `references/tasks.md`.

- Research only the lines that block the plan. A line that can wait is a `Stopped` line. Skip what is already in hand.
- Write facts about paths and marks in `Files`, facts about declarations in `Types`, and facts about behavior in `Steps`.
- A missing fact the four kinds do not cover is a `Stopped` line with the reason, and the review reads it. Write it to `## Notes` as `### Slice N`, in the shape `references/format.md` gives.
- Set the threshold for the question. The research is not a ritual at every plan.

### 6. Review, one plan at a time

Write one plan md, and send it to its review at once. A `review` subagent reads through the plan md and every file it names. It also reads the ADR's `Adopted`, `Denied`, `Scope` and `Definition`. It answers on these viewpoints:

- `Goal` — the steps and the checks that do not carry each line of the ADR's `Adopted`, and the `Scope`. A step or a check that does what `Denied` says not to do. A `Definition` line whose target `Files` does not name.
- `Integration` — how the update is built into the existing, and how the whole is redesigned
- `Files` — a file the change needs but `Files` does not name, and a document, a comment or a test the change makes stale
- `Types` — a declaration the code uses but `Types` does not name, and a declaration against the type rules
- `Cases` — the test steps' cases against `## Test cases`
- `Checks` — a `Verify` that does not run as written, one that is red with the change in place, and a check that stays green with the behavior removed
- `Flow` — a contradiction, a circular flow, a duplication, an omission, an unnatural flow inside a file the change made

The task is in `references/tasks.md`. The plan is fixed from them, and the report to the owner says what was done with each finding. One subagent per plan. When a fix changes another plan's boundary, `Files` or order, update that plan before its review. A plan already reviewed goes through review again.

With two or more plans, while that review runs, write the next plan file. The writing of one file and the review of the previous one overlap. A plan that is fixed from its review does not wait for the others.

### 7. Japanese Proofread

After every review and its fixes are done, run one `proofreader` subagent per file in parallel with the fixed plan mds for the Japanese proofread of each plan md (`NN` is the file's order prefix in `references/format.md`; an `ex-` plan has no prefix). Have it read `.pi/skills/plan/references/format.md`. The role's policy is in `.pi/extensions/consult/types.json`. It edits only the plan md.

- Read its report and the `git diff` of the file.
- If a slice's `Steps`, a `Verify` line, a test case or a field name changed meaning, or a section or field name moved, put the file back to `references/format.md`'s shape, in your own words.
- The wording of a quoted passage is not a change of meaning. Keep that correction.
- Say in your report to the owner what you repaired: `fixed: <what>`, or `left: <why>`.
- One round. A repaired file does not go through the subagent again.

### 8. Show the owner

Show every plan of the cycle: files, slices, types, steps, verify. The owner answers approval or fixes. A fix to the cut goes back to step 3 and the affected plans are presented again. A fix to the content goes back to step 4 and through review and proofread again. Repeat until the owner approves.

### Changes after this

The agent edits the plan to match the owner's answers, and git holds the diff. The plan md's `Boundary Plans` is written in step 4 from the cut's order. It is edited when a pair is cut again, and git holds that diff too.

## How not to write this

- Do not copy the ADR: name it where it bites, and write what the reader has to do
- Do not write a plan that only replaces words: say how the update is built into the existing, and how the whole is redesigned
- Do not invent a check: `Always` holds the checks `references/format.md` lists, and `Added` holds the ones the change decides
- Do not write a case the type, the schema or the DB settles: it is noise, and the reviewer takes it out
- Do not leave a hole.
- Do not write the plan from the agent's side while a worktree is live.
- The subagent writes its slice's record, and the agent writes at the acceptance
