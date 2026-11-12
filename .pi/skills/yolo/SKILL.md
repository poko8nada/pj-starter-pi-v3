---
name: yolo
description: Use when the owner says to run the cycle through without their confirmations, at any time after the entries' scaffold is made.
disable-model-invocation: true
---

# yolo

One cycle, walked without the owner's confirmations. The owner starts it; the agent cannot choose it.

## When it runs

View:

| case                                                     | does it run                                                                            |
| -------------------------------------------------------- | -------------------------------------------------------------------------------------- |
| the owner starts it, after the entries' scaffold is made | it runs                                                                                |
| started before that                                      | it does not run: nothing runs, and it says so                                          |
| a stage the cycle has passed                             | that stage is not walked again                                                         |
| the ADR's entry stage                                    | walked here: the agent settles each entry by the checks `When a step cannot run` gives |

## Procedure

Note: The cycle's four stages run in their order. Each keeps its work. Each loses only its look at the owner.

### 1. adr

Steps:

1. Walk the adr skill's cycle stage and entry stage, in its order, from where the cycle stands: the pre-research, every entry's `Context`, its `Scope`, the opening proposal, the discussion, the decision, and its `Definition`. A `_Simple_` entry skips its `Scope` and the discussion. A stage the cycle has passed is not walked again.
2. Give each entry's affected to a `research` subagent, and go on without waiting for it.
3. Go on to the plan.

Notes:

- The agent takes the owner's place for the entry: it proposes, settles, and moves the entry to the decision.
- skips: the Japanese proofread, and the owner's look at every step of the entry stage.

### 2. plan

Steps:

1. Write every plan md: its goal, its files, its slices, the types, the steps, the policy, the verify and the record.
2. Run the research for the lines the plan cannot write, and write a `Stopped` line for what the four kinds do not cover.
3. Read the plans together, and review each plan on the five viewpoints: `Goal`, `Design`, `Files`, `Slice`, `Other`.
4. Confirm as the agent what the plan step 5 would ask the owner, and go on to the work.

Notes:

- skips: the Japanese proofread (the owner does not read the plan mds under `yolo`, so it does not run later either), and the owner's look at the plan mds.

### 3. work

Steps:

1. Commit the cycle's files, and run the plans in the order the cut gives.
2. A plan: its slices, the test cleanup, the review, the acceptance, the owner confirmation is passed, and the merge with the base's dependencies set again.
3. A `base` plan is not used: every plan is a worktree, and the `Added` owner look (front cmux-browser, base slice) is passed.
4. Go on to the close.

Notes:

- skips: the report to the owner, and the owner confirmation before the merge.

### 4. close

Steps:

1. Check the trigger, read the cycle, collect the leftovers, and exclude what the wording shows is already resolved.
2. Give every leftover a destination, in this order: the cycle's own concern → `_ex-change_`; a small change outside it → `_ex-change_`; a possible obvious bug or a large debt → `**proposed**`; a future consideration → `_roadmap_`; the rest → `dropped`, each with its `Fact:` / `Why:` / `Then:`.
3. Complete `close.md`: `## Collected` holds the inventory, `## Triage` holds the proposal, and `## Verified` stays empty at the completion (and that is normal).
4. Run the Japanese proofread here, so the `close.md` at the stop is what the owner can read.
5. It ends here: before the owner's judgement on the triage, with the proposal complete and proofread.

Notes:

- skips: the owner's judgement on the triage, the `_ex-change_` implementations, and the verification of what the cycle delivered.

Note: What comes after that judgement — the confirmed triage, the `_ex-change_` implementations, the verification, the commit that closes the cycle — is not this skill's work. The order from the completion of `close.md` to the verification is the same as the close skill's.

## When a step cannot run

Steps:

1. Replace the step or the check with a check the agent can run.
2. Write the replacement in the plan md.

View:

| cannot run as written                | what replaces it                   |
| ------------------------------------ | ---------------------------------- |
| a `base` plan's owner look           | a check the agent runs in the base |
| a step that closes by the owner's OK | a check the agent runs             |

Note: the stage and the stop point do not move.

## When it stops early

View:

| case                                                                         | what to do                                |
| ---------------------------------------------------------------------------- | ----------------------------------------- |
| a plan's premise turns out false, and what closes it sits outside the plan   | stop, and ask the owner                   |
| a merge leaves the base red, and the plan's fix does not bring it back green | stop, and ask the owner                   |
| a pair of plans would make the same thing                                    | stop, and ask the owner to decide the cut |
| no check the agent can run replaces the step                                 | stop, and ask the owner                   |

Note: a hole the run finds and fixes in the plan's own files is not one of these: the slice's `Unplanned` holds it, and the run goes on.

## How not to write this

- When you walk the cycle: do not decide a change the ADR did not accept.
- When you run a stage: do not call the other skills. Each stage keeps its own rules, and the flow above is the order it walks them.
- When you run the cycle: do not change a stage or the stop point.
- When you walk the entry stage: do not skip a step of it, except the steps a `_Simple_` entry skips by its `Type`. The steps are walked, and only their look at the owner is lost.
