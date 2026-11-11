---
name: adr
description: Use when the owner names an unfinished ROADMAP.md item or asks for a change to DEFINITION.md. It settles the intent, the roadmap item and the entries, and writes cycles/<YYMMDD>-<NNN>-<slug>/adr.md, recording what the cycle changes in DEFINITION.md.
---

# adr

One cycle has one ADR: `cycles/<YYMMDD>-<NNN>-<slug>/adr.md`. It records the cycle's decisions about `DEFINITION.md`.

The ADR records what the picture becomes. A plan writes the change from `DEFINITION.md`. The plan and the work are written from `DEFINITION.md`, and none of them argues.

The procedure has two stages. The cycle stage settles the intent, the roadmap item and the entries. The entry stage runs once per entry.

The entry's question, the intent and the split are the owner's. The procedure writes them down, and the owner's answer is the decision.

## Cycle

### 1. Intent

Steps:

1. Write what you understood first.
2. Let the owner correct it.
3. Repeat until no point is left in dispute.

View: the intent is the only measure of what follows.

Note: do not start the research before the intent is settled. The target would be wrong.

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

1. Split the cycle into entries. One entry has one `Main`.
2. Show the owner the split and each entry's intent.
3. Rewrite a rejected split, and show it again.
4. Add every agreed entry at once, in the split's order, with the scaffold:
   - `node .pi/skills/adr/scripts/index.mjs --add <title>` appends an entry with the title to the end of `adr.md` and creates `affected/<NN>.md`.
   - `node .pi/skills/adr/scripts/index.mjs --delete <NN>` deletes entry `NN` from `adr.md` and `affected/<NN>.md`, and renumbers the rest.
   - `node .pi/skills/adr/scripts/index.mjs --set <NN> <title>` replaces the title of entry `NN` in `adr.md` and `affected/<NN>.md`.

View:

| case                                                                               | the entry     |
| ---------------------------------------------------------------------------------- | ------------- |
| the main concern                                                                   | one `Main`    |
| a change that follows the `Main`'s change or addition uniquely, without discussion | one `Sub`     |
| a change that needs discussion, or does not follow uniquely                        | another entry |

Notes:

- Write what the chat settled at once. Do not keep an agreement only in the chat.
- An entry has one `Main` and may have `Sub`s.
- A `Sub` is allowed only when its change follows uniquely from the `Main`'s change or addition, without discussion.
- A change that needs discussion, or does not follow uniquely, is another entry.
- The owner's answer decides the split.

### 4. Pre-research

Steps:

1. Read the `Look it up` section of `references/tasks.md`.
2. Propose the pre-research of every entry together. Name the entry, the type, the question, and what the answer decides.
3. Run the approved ones in parallel. Group the entries whose question is the same, and run one `research` or `trial` subagent per group.
4. Wait for all of them, and write each result in its entry's `Research & Trial`.
5. Show the owner a new entry found while the pre-research runs, and add it after the answer.

For the pre-research:

| entry | type | question | what the answer decides |
| ----- | ---- | -------- | ----------------------- |

The types and the questions:

| type                        | the question it answers                       |
| --------------------------- | --------------------------------------------- |
| the official information    | can it be built here, and does it fit the use |
| the source                  | can it be built here, and does it fit the use |
| the shape it is used in now | how it is held up where it is already done    |

| question              | asked when                                                 |
| --------------------- | ---------------------------------------------------------- |
| `compare`             | the ways are not visible yet                               |
| `mechanism`, `triage` | whether this candidate holds here, and what its limits are |

Notes:

- The pre-research runs before the entry stage. Its facts are in `Research & Trial` before the first entry starts.

## One entry

The entry stage runs once per entry, in the order the split gave.

### 1. Scope

Steps:

1. Read the `## Scope` section of `references/adr.format.md`.
2. Write the `Scope` to adr.md, every kind, `In` or `Out`.
3. Let the owner correct the list.
4. Write the result to the entry's `Scope` as `In:` and `Out:`.

Notes:

- The scope is of this entry. The other entries keep their own scope.
- A constraint the owner adds here goes to `Context` as a new item.
- The first `Scope` is a guess. Rewrite it in `Discussion Loop` with the owner.

### 2. Context

Steps:

1. After the `Scope` is agreed, write what is known now, all of it, for this entry only.
2. Number the items `C1`, `C2`, ...

View:

| kind       | what it is                                      |
| ---------- | ----------------------------------------------- |
| premise    | how it behaves now                              |
| constraint | the `Who`'s want, a limit, what must not change |
| question   | the entry's question                            |

Note: do not leave out what is known. What is not known yet stays out, and the research or the discussion adds it.

### 3. The opening proposal

Steps:

1. Read the entry's pre-research facts in `Research & Trial`, and what they decide.
2. Read the `Decision` section of `references/adr.format.md`.
3. Write the opening proposal of the Discussion Loop in the entry's `Decision`, with `Status` empty and `#### Details` `なし`.
4. Say what the facts decide and what the proposal is, and go to the Discussion Loop.

Notes:

- The proposal is in adr.md, not only in the chat.
- The facts serve the opening proposal.
- A fact that is still missing stops the entry. It is looked up here, not in the decision.
- When the holding point is a fact nobody has, a `trial` subagent may try it in a worktree, with the owner's agreement. Read the `Try it` section of `references/tasks.md` before running.

### 4. Discussion Loop

Steps:

1. Start from the opening proposal in `Decision`.
2. Take the `In` items of `Scope`, in their order.
3. For each `In`, name the concrete points that must be decided as `In`, each with the agent's proposal. One `In` may have more than one point.
4. Show one point at a time, and discuss it until it is settled.
5. Write what is settled where the View gives, at the moment it is settled.
6. Repeat until the owner moves the entry to the decision.

View:

| where the settled item goes | the rule                                  |
| --------------------------- | ----------------------------------------- |
| `Context`                   | a fact that limits the decision           |
| `Research & Trial`          | a fact the decision weighs                |
| `Decision`                  | a change the decision settles             |
| `Decision`'s `#### Details` | a code or a document the decision settles |
| `Scope`                     | a change the scope settles                |

Notes:

- Write an added `Context` item as `C<n>`, after the existing numbers.
- Write a specific code or document in `Decision`'s `#### Details`, one fence per item. A bullet is the fence's title, and the fence follows it.
- The opening proposal is in `Decision`. A point and its proposal stay in the chat until the owner settles it.
- When a finding shows a premise is wrong, correct the item, and keep the finding in `Research & Trial` with its source.
- When a finding serves no item, add the item.
- When the research is short, add it. When a finding changes the scope, propose the change and agree it.
- When the loop needs a fact nobody has, a trial may run as in section 3, with the owner's agreement.
- Only the owner moves the entry to the decision. The agent has no right to do so. This step cannot be skipped.
- When the decision sends the entry back, discuss how to fill the missing part, or whether to remove it from `Context` or `Research & Trial`.

### 5. Decision

Steps:

1. Check that every `C` and every `F` is carried.
2. When a `C` is missing, explain it to the owner, and return to section 4.
3. When an `F` is not carried, remove its `F<n>:` label and keep the fact in `Research & Trial` as a plain bullet. Do not delete the content.
4. Wait for the owner's judgement: `accepted` or `rejected`.
5. Write `Status`.

Note: a rejected entry adopts nothing. Its `Status` carries `**rejected**` with the reason.

### 6. Definition

Steps:

1. Read `rules/definition.rules.md` and `rules/definition.format.md`, and the `Definition` section of `references/adr.format.md`.
2. Name the parts of `DEFINITION.md` the entry relates to: `Unit`, `Who`, `Stack`, `What`.
3. Write each part with one operation.

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
- A Unit that `rules/definition.rules.md` does not allow is not a Unit.
- A rejected entry adopts nothing. Its `Definition` carries only `(kept)` for the parts that stand, or `なし（採用しなかった）`.

### 7. Affected

Steps:

1. Read the `Look at the affected` section of `references/tasks.md` and `references/affected.format.md`.
2. Run one `research` subagent to write the entry's affected to `affected/<NN>.md` in the shape `references/affected.format.md` gives, including the `Keywords` list.

Notes:

- Do not wait for its result. Do not fix it. There is no procedure for it here.
- It runs in parallel with the next entry.

### 8. Next entry

Steps:

1. Go to the next entry in the split's order.

Note: the affected research runs at the same time. Do not wait for it.

## Japanese Proofread

Steps:

1. After every entry is decided, run one `proofreader` subagent with the cycle's `adr.md` for the Japanese proofread of the whole file.
2. Have it read `references/adr.format.md`. The role's policy is in `.pi/extensions/consult/types.json`. It edits only `adr.md`.
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
4. When the check leaves nothing to add, read the decided entries together, settle a contradiction, and read the `Definition` lines together. The owner's answer closes the entries' decisions.
5. When the owner agrees to add an item to an entry, go back to that entry's Discussion Loop. The next pass of this section starts again from step 1.

Notes:

- The affected is written by its research subagent. Do not fix it here; propose the addition.
- Two entries that touch the same name must not contradict.

## What comes after an entry

An entry decided here is not work done. The plan cuts it, the plan writes it, and the work carries it out.

This skill keeps its own business — the entry and the decision — and does not do theirs.

## How not to write this

- Before the owner's answer: do not decide. The ADR writes the adopted change after the discussion, and the owner's answer there is the decision.
- When you write an entry: do not write the work. Files, steps and checks belong to the plan.
- When the cycle ends: do not leave an entry undecided. A cycle decides every entry it raises.
- When you write the `Definition`: do not write `DEFINITION.md` itself. The `Definition` carries the new lines, and a plan writes them into the file.
- Before the intent is settled: do not look up. The target would be wrong, and the time and the money go with it.
- When you write the intent: do not leave it in the agent's words. An intent the owner did not correct is a guess.
- When you write an entry: do not skip the scope. An entry without a scope cannot be weighed.
