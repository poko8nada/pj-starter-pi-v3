---
name: adr
description: Use when the owner names an unfinished ROADMAP.md item or asks for a change to DEFINITION.md. It settles the intent, the roadmap item and the entries, and writes cycles/<YYMMDD>-<NNN>-<slug>/adr.md, recording what the cycle changes in DEFINITION.md.
---

# adr

One cycle has one ADR: `cycles/<YYMMDD>-<NNN>-<slug>/adr.md`. It records the cycle's decisions about `DEFINITION.md`. `slug` is automatically determined from the branch.

The ADR records what the project will be. A plan writes the change from `DEFINITION.md`. The plan and the work are written from `DEFINITION.md`, and none of them argues.

The procedure has two stages. The cycle stage settles the intent, the roadmap item and the entries. The entry stage runs once per entry.

## Cycle

### 1. Intent

Steps:

1. Gather info from docs and codes to grab owner's context.
2. Write what you understood first.
3. Let the owner correct it.
4. Repeat until no point is left in dispute.

View:

- the intent is the only measure of what follows.
- Intents are broken down into entries, and entries are broken down into scopes.

### 2. Roadmap

Steps:

1. Read `rules/roadmap.md` and `ROADMAP.md`.
2. Ask which item of `ROADMAP.md` the cycle fits.
3. When one fits, set its `status` to `wip`, with the owner's agreement first.
4. When none fits, show the owner the item as you would write it, and add it to `ROADMAP.md` after agreement.

View:

| `status` | may the cycle take it |
| -------- | --------------------- |
| `_todo_` | yes                   |
| `wip`    | yes                   |
| `done`   | no                    |

### 3. Entries

Steps:

1. Split the cycle into entries.
   - An entry extracts concern from the intent and breaks it down.
   - The general rule is one entry per topic of main concern.
   - Group concerns that are subordinate to a main concern into a single entry.
   - An entry title should be a `topic` rather than necessarily a `question`.
2. Verify that the split entries cover the full scope of the intended meaning.
3. Think each entry's `Type` and its reason, in the split's order.
   - `Type` is `_Full_` or `_Simple_`.
   - A Simple proposal meets all of these:
     - the change is reversible with git.
     - it crosses no Unit, as merging functions would.
     - the owner's intent has a single reading.
     - the outline of the work is inferable, and there is one way to do it, with nothing to compare.
   - Basically, an entry whose decision influences a later entry comes first.
4. Show the owner the split, each entry's purpose, `Type`, and the order of the entries with its reason.
   - Rewrite a rejected split, and show it again.
5. Add every agreed entry at once, in the split's order, with the scaffold:
   - `node .pi/skills/adr/scripts/index.mjs --add <title> [Full|Simple]` appends an entry with the title and `Type` to the end of `adr.md` and creates `affected/<NN>.md`.
   - `node .pi/skills/adr/scripts/index.mjs --delete <NN>` deletes entry `NN` from `adr.md` and `affected/<NN>.md`, and renumbers the rest.
   - `node .pi/skills/adr/scripts/index.mjs --set <NN> <title> [Full|Simple]` replaces the title of entry `NN` in `adr.md` and `affected/<NN>.md`. When the `Type` is given, it also writes the `Type:` line, `Scope` and `#### Details` in `adr.md` in that `Type`'s shape; when it is omitted, the `Type` stays.

### 4. Pre-research

Steps:

1. Read the `Look it up` section of `references/tasks.md`.
2. Propose the pre-research of every entry together. Name the entry, the type, the question, and what the answer decides.
3. Run the approved ones in parallel. Group the entries whose question is the same, and run one `research` or `trial` subagent per group.
4. write each result in its entry's `Research & Trial` when report is received.
   - A fact is one line, `F<n>: <the fact>。出所: <the source>`.
   - The source follows `出所: `, one item per fact.

The types and the questions:

| type                        | the question it answers                       |
| --------------------------- | --------------------------------------------- |
| the official information    | can it be built here, and does it fit the use |
| the shape it is used in now | how it is held up where it is already done    |

| question              | asked when                                                 |
| --------------------- | ---------------------------------------------------------- |
| `compare`             | the ways are not visible yet                               |
| `mechanism`, `triage` | whether this candidate holds here, and what its limits are |

### 5. Context

Steps:

1. Once the pre-research is running, write the items of every entry, in the split's order.
2. Write what is settled at that point:
   - the cycle's intent that entry has
   - the roadmap item,
   - the split
   - what the owner said.
   - other info such as `memo-*`
3. Write one entry's own items only: its premise, its constraint, its intent, and its question.
4. Number them `C1`, `C2`, ... in each entry.

Note:

- do not leave out what is known. What is not known yet stays out, and the research or the discussion adds it.
- write what is settled. A guess stays in the chat.

## One entry

The entry stage runs once per entry, in the order the split gave. An entry is `_Full_` or `_Simple_`. A Simple entry keeps `Scope` and `#### Details` as `_omission_` and skips `### 1. Scope` and `### 3. Discussion Loop`. A Full entry walks the steps below.

### 1. Decide Scope

Steps:

1. Read the `## Scope` section of `references/adr.format.md`.
2. Write the `Scope` to adr.md, every kind, `In` or `Out`.
   - Ensure that you answer the questions in the table and categorize items appropriately.
   - Judge each kind on its own; several kinds may be `In` at the same time.
   - Every kind belongs to `In` or `Out`, and to only one of them; every Full entry writes every kind.
   - When the document directs a reader's behavior, a change only in `expression` puts `result` and `logic` in too, if it changes what the reader does.
   - When a change of `logic` changes the artifact, `result` is `In` too; both may be `In`.
3. Let the owner correct the list.
4. Write the result to the entry's `Scope` as `In:` and `Out:`.

View:

- A scope is a breakdown of an entry, and an entry is a breakdown of an intent.
- Scope table:
  | **question (yes → in)**                                                                                            | Kinds         |
  | ------------------------------------------------------------------------------------------------------------------ | ------------- |
  | Does it touch secrets, permissions, exposure, or personal data?                                                    | safety        |
  | Does the way things fail change, or is there a check, validation, constraint, or failure path that must be kept?   | failure       |
  | Is an ex-thing the product relies on added, updated, or removed? (package, library, contract, data, cited source)  | upstream      |
  | Does what can be observed **from outside** change? (what is returned, written, or emitted; side effects)           | result        |
  | Does how things are divided, ordered, nested, or placed change? (module, schema, section, layout, files and dirs)  | structure     |
  | Do the steps or rules that produce the result change? (conditions, order, algorithms, constraints, instructions)   | logic         |
  | Must an existing entity be moved or fixed? (stored data, installed versions, distributed docs, past records)       | existing      |
  | Does anything else name, reference, or assume the changed thing? (callers, queries, links, other docs)             | downstream    |
  | Do time, resources, or money change? (speed, memory, API calls, tokens, effort)                                    | cost          |
  | Does the surface notation change? (names, wording, tone, formatting, spelling)                                     | expression    |
  | Must **the means** of confirming correctness (tests, checks, review) be added or changed? **Not the test itself.** | verification  |
  | Do the records or signals the product leave change? (logs, metrics, audit records) For audit-related only.         | observability |
  | Does it affect how the change is published, distributed, or applied, or how it can be rolled back?                 | release       |
  | Is there a concern that none of the above covers?                                                                  | other         |

### 2. The opening proposal

Steps:

1. Read the entry's `Context` and its pre-research facts in `Research & Trial`, and what they decide.
2. Read the `Decision` section of `references/adr.format.md`.
3. Write the opening proposal in the entry's `Decision`, with `Status` empty:
4. Say what the facts decide and what the proposal is, and go on:
   - _Full_: go to the Discussion Loop.
   - _Simple_: go to the `Decision`.

Notes:

- The proposal is in adr.md, not only in the chat.
- The proposal must be based on the initially agreed-upon intent.
- An entry has one `Main` concern and sometimes have `Sub`s.
- A `Sub` is only when its change follows from the `Main`'s change or addition.

### 3. Discussion Loop

Steps:

1. Start from the opening proposal in `Decision`.
2. For each `In`, name the concrete points that must be decided as `In`, each with the agent's proposal. One `In` may have more than one point.
   - No need to overturn or call into question the initial intent.
   - From the `In` items select ONLY points that could serve as subjects for discussion.
     1. Limit these points to "matters that should be decided with the owner".
     2. Just confirming is not the issue point. These will be presented together at the end.
3. Show one point at a time, and discuss it until it is settled.
   - Begin by discussing elements that cannot be changed, move on to those that can be adjusted, and conclude by addressing the operational framework that encompasses everything.
   - Here is specific scope order:safety → failure → upstream → result → structure → logic → existing → downstream → cost → expression → verification → observability → release → other
4. Write what is settled where the View gives, at the moment it is settled.
   - If needed, write an added `Context` item as `C<n>`, after the existing numbers.
   - If needed, write a specific code or document in `Decision`'s `#### Details`, one fence per item. A bullet is the fence's title, and the fence follows it.
     - If `#### Details` is 0, write `なし`
5. Repeat until the owner moves the entry to the decision. **Agent does not have the right.**

View:

| where the settled item goes | the rule                                  |
| --------------------------- | ----------------------------------------- |
| `Context`                   | a fact that limits the decision           |
| `Research & Trial`          | a fact the decision weighs                |
| `Decision`                  | a change the decision settles             |
| `Decision`'s `#### Details` | a code or a document the decision settles |
| `Scope`                     | a change the scope settles                |

Notes:

- When a finding shows a premise is wrong, correct the item, and keep the finding in `Research & Trial` with its source.
- Do not include every detail in the `Details`
  - Instead, focus on key points, providing specific prose and code while omitting less essential parts as appropriate.
- When the holding point is a fact nobody has, a `trial` subagent may try it in a worktree, with the owner's agreement. Read the `Try it` section of `references/tasks.md` before running.

### 4. Confirm Decision

Steps:

1. Check that every `C` and every `F` is carried.
   - use `node .pi/skills/adr/scripts/index.mjs --check`
2. When a `C` is not carried:
   - _Full_: explain it to the owner. When they say it no longer limits the entry, remove its `C<n>:` label and keep the item in `Context` as a plain bullet.
   - _Simple_: add it to the proposal, and ask the owner again.
3. When an `F` is not carried, remove its `F<n>:` label and keep the fact in `Research & Trial` as a plain bullet. Do not delete the content.
4. Wait for the owner's judgement:
   - _Full_: `accepted` or `rejected`, after the discussion.
   - _Simple_: `accepted` or `rejected`, on the proposal directly.
5. Write `Status`.

Note: a rejected entry adopts nothing. Its `Status` carries `**rejected**` with the reason.

### 5. Related Definition

Steps:

1. Read `rules/definition.rules.md` and `rules/definition.format.md`, and the `Definition` section of `references/adr.format.md`.
2. Name the parts of `DEFINITION.md` the entry relates to: `Unit`, `Sub`, `Who`, `Stack`, `What`.
3. Write each part with one operation.
4. Explain reason why and get the owner's agreement.

View:

| operation   | the value                  |
| ----------- | -------------------------- |
| `(added)`   | the new line               |
| `(updated)` | the new line               |
| `(dropped)` | nothing                    |
| `(kept)`    | the reason the part stands |

Notes:

- `(kept)` carries the reason the part stands: its main function is the same, and what changed is the route or the check that holds it up.
- The parts are named, not summarised. A part left unnamed is a part the entry did not weigh.
- A Unit or a Sub that `rules/definition.rules.md` does not allow is not a part.

### 6. Research Affected

Steps:

1. Read the `Look at the affected` section of `references/tasks.md` and `references/affected.format.md`.
2. Run one `research` subagent to write the entry's affected to `affected/<NN>.md` in the shape `references/affected.format.md` gives, including the `Keywords` list.
3. Go to the next entry in the split's order.

Notes:

- Do not fix affected.md when report is received. You can check them after.
- It runs in parallel with the next entry.
- the affected research runs at the same time. Do not wait for it.

## Japanese Proofread

Steps:

1. Run one `proofreader` subagent with the cycle's `adr.md` for the Japanese proofread of the whole file. (you do not need to wait the final `affected` reporting.)
2. Have it read `references/adr.format.md`. It edits only `adr.md`.
3. Read its report and the `git diff` of the file.
4. Put the file back to the shape `references/adr.format.md` gives, in your own words, when a decision, a reason, a number, a name, a `Scope` line or a fence changed meaning, or a section or field name moved.

Notes:

- The wording of a quoted passage is not a change of meaning. Keep that correction.
- One round. The repaired file does not go through the subagent again.

## Entries, together

Steps:

1. Wait until every entry's affected research is done.
2. Read every entry and every affected file, and check both for what is missing and what is too much.
3. Report these to the owner, and propose what to do:
   - a path an affected file lacks
   - an item an entry lacks, entry by entry
   - what is too much
4. Changes are performed directly by the agent, even `affected.md`.
5. When the check leaves nothing to add, read the decided entries together, settle a contradiction, and read the `Definition` lines together. The owner's answer closes the entries' decisions.
6. When the owner agrees to add an item to an entry, go back to that entry's Discussion Loop. The next pass of this section starts again from step 1.

Notes: Two entries that touch the same name must not contradict.

## What comes after an entry

An entry decided here is not work done. The plan cuts it, the plan writes it, and the work carries it out.

This skill keeps its own business — the entry and the decision — and does not do theirs.

## How not to do this

- Before the owner's answer: do not decide. The ADR writes the adopted change after the discussion, and the owner's answer there is the decision.
- When the cycle ends: do not leave an entry undecided. A cycle decides every entry it raises.
- When you write the `Definition`: do not write `DEFINITION.md` itself. The `Definition` carries the new lines, and a plan writes them into the file.
