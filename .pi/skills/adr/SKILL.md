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

1. Split the cycle into entries. One entry is one question.
2. Show the owner the split and each entry's intent.
3. Rewrite a rejected split, and show it again.
4. Add every agreed entry at once, in the split's order, with the scaffold:
   - `node .pi/skills/adr/scripts/index.mjs --add <title>` appends an entry with the title to the end of `adr.md` and `affected.md`. When a file does not exist, it creates it first.
   - `node .pi/skills/adr/scripts/index.mjs --delete <NN>` deletes entry `NN` from both files and renumbers the rest.
   - `node .pi/skills/adr/scripts/index.mjs --set <NN> <title>` replaces the title of entry `NN` in both files.
5. Show the owner a new entry found while an entry runs, and add it after the answer.

Note: write what the chat settled at once. Do not keep an agreement only in the chat.

## One entry

The entry stage runs once per entry, in the order the split gave.

### 1. Scope

Steps:

1. Agree the scope with the owner in the chat. Every kind, one by one, `In` or `Out`.
2. Let the owner correct the list.
3. Write the result to the entry's `Scope` as `In:` and `Out:`.

View:

| kind                | what it is                                                                                        |
| ------------------- | ------------------------------------------------------------------------------------------------- |
| behaviour           | what the product does; the actions a user takes, and what the product returns                     |
| refactor            | the shape of the code or the document, without changing what the product does                     |
| dependency          | a package, a library, or an external contract the product relies on                               |
| naming              | the name of a section, field, file, or identifier in the product                                  |
| format              | the section order, headings, table shape, and fences of a product document                        |
| prose               | the wording, sentence structure, and voice of a product document                                  |
| speed               | the time or the resources the work takes                                                          |
| security            | secrets, permissions, or exposure in the product                                                  |
| compatibility       | an existing reference, a past record, or another part of the product that names the changed thing |
| errors              | a check, a test, a validation, or a failure the product must keep                                 |
| deploy              | the distribution or release of the product                                                        |
| migration           | an existing record or an installed version of the product that must be moved                      |
| logs and monitoring | the records or signals the product leaves                                                         |

Notes:

- An `Out` kind carries its reason. A revisit condition goes on the kind that needs one.
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

### 3. Pre-research

Steps:

1. Read the `Look it up` section of `references/tasks.md`.
2. Propose the type and the question together, and say what the answer would decide.
3. Run one `research` subagent after the owner approves. Look up what the owner approved, and nothing else.
4. Write the facts to `Research & Trial`.

View:

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

- The facts come back with their source. A question nobody could answer comes back as a fact too, with what it is holding up.
- A fact that is still missing stops the entry. It is looked up here, not in the decision.
- When the holding point is a fact nobody has, a `trial` subagent may try it in a worktree, with the owner's agreement. Read the `Try it` section of `references/tasks.md` before running.
- The facts here serve the approach presentation at the start of section 4.

### 4. Discussion Loop

Steps:

1. Present the approaches and how each would be practiced, briefly, as the draft.
2. Discuss, and investigate where a fact is missing.
3. Write an added `Context` item as `C<n>`, after the existing numbers, at the moment it is settled.
4. Write what is settled in a fence under `Context`, at the moment it is settled.
5. Repeat until the owner moves the entry to the decision.

View:

| where the finding goes | the rule                        |
| ---------------------- | ------------------------------- |
| `Context`              | a fact that limits the decision |
| `Research & Trial`     | a fact the decision weighs      |

Notes:

- When a finding shows a premise is wrong, correct the item, and keep the finding in `Research & Trial` with its source.
- When a finding serves no item, add the item.
- Any specific docs, code, or similar materials agreed upon by the owner go under `Context`, enclosed within a fenced block.
- When the research is short, add it. When a finding changes the scope, propose the change and agree it.
- When the loop needs a fact nobody has, a trial may run as in section 3, with the owner's agreement.
- Only the owner moves the entry to the decision. The agent has no right to do so. This step cannot be skipped.
- When the decision sends the entry back, discuss how to fill the missing part, or whether to remove it from `Context` or `Research & Trial`.

### 5. Decision

Steps:

1. Read the `Decision` section of `references/adr.format.md`.
2. Check that every `C` and every `F` is carried.
3. When one is missing, explain it to the owner, and return to section 4.
4. Wait for the owner's judgement: `accepted` or `rejected`.
5. Write `Status`.
6. Write `Adopted` as the one line of what the entry becomes as a whole, with `Add`, `Update` and `Drop` under it, and write `Policy` with `Allowed` and `Forbidden`.
7. Write a `Context` item or a fence the decision settles, at that moment.

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
2. Run one `research` subagent to write the entry's affected to `affected.md` in the shape `references/affected.format.md` gives.

Notes:

- Do not wait for its result. Do not fix it. There is no procedure for it here.
- It runs in parallel with the next entry.

### 8. Next entry

Steps:

1. Go to the next entry in the split's order.

Note: the affected research runs at the same time. Do not wait for it.

## Entries, together

Steps:

1. Read the decided entries together: the names they write, and the lines they move.
2. Settle a contradiction with the owner.
3. Read the `Definition` lines together with the owner, and let their answer close the entries' decisions.

Note: two entries that touch the same name must not contradict.

## Japanese Proofread

Steps:

1. After every entry is decided, run one `proofreader` subagent with the cycle's `adr.md` for the Japanese proofread of the whole file.
2. Have it read `references/adr.format.md`. The role's policy is in `.pi/extensions/consult/types.json`. It edits only `adr.md`.
3. Read its report and the `git diff` of the file.
4. Put the file back to the shape `references/adr.format.md` gives, in your own words, when a decision, a reason, a number, a name or a `Scope` line changed meaning, or a section or field name moved.

Notes:

- The wording of a quoted passage is not a change of meaning. Keep that correction.
- One round. The repaired file does not go through the subagent again.

## What comes after an entry

An entry decided here is not work done. The plan cuts it, the plan writes it, and the work carries it out.

This skill keeps its own business — the entry and the decision — and does not do theirs.

## How not to write this

- Do not decide. The ADR writes the adopted change after the discussion, and the owner's answer there is the decision.
- Do not write the work here. Files, steps and checks belong to the plan.
- Do not leave an entry undecided. A cycle decides every entry it raises.
- Do not write `DEFINITION.md` itself. The `Definition` carries the new lines, and a plan writes them into the file.
- Do not look up before the intent is settled. The target would be wrong, and the time and the money go with it.
- Do not leave the intent in the agent's words. An intent the owner did not correct is a guess.
- Do not skip the scope. An entry without a scope cannot be weighed.
- Do not write an adopted change as a line of `DEFINITION.md`. That is the plan's work.
- Do not leave `Keep`/`Denied` in the new shape. The adopted change uses `Adopted` with `Add`/`Update`/`Drop` and `Policy` with `Allowed`/`Forbidden`.
