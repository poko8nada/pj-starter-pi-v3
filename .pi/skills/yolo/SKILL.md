---
name: yolo
description: Use when the owner says to run the cycle through without their confirmations, at any time after the entries' scaffold is made.
disable-model-invocation: true
---

# yolo

One cycle, walked without the owner's confirmations. The owner starts it; the agent cannot choose it.

## Specific Skip

The cycle's four stages run in their order. **Each keeps its work. Each loses only its look at the owner.**

### 1. adr

Notes:

- The agent takes the owner's place for the each entry: it proposes, settles, and moves the entry to the decision.
- skips: the Japanese proofread, and the owner's look at every step of the entry stage.

### 2. plan

Notes:

- skips: the Japanese proofread (the owner does not read the plan mds under `yolo`, so it does not run later either), and the owner's look at the plan mds.

### 3. work

Notes:

- skips: the report to the owner, and the owner confirmation before the merge.

### 4. close

Notes:

- STOP before explaining leftovers.
- What comes after that judgement — the confirmed triage, the `_ex-change_` implementations, the verification, the commit that closes the cycle — **They are NOT this yolo skill's work.**
- The order from the completion of `close.md` to the verification is the same as the close skill's.

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

## How not to do this

- When you run the cycle: do not change a stage or the stop point.
