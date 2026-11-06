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

- Write what you understood first, and let the owner correct it.
- Repeat it until no point is left in dispute.
- The intent is the only measure of what follows.
- Do not start the research before the intent is settled.

### 2. Roadmap

- Before choosing, read `rules/roadmap.md` and `ROADMAP.md`.
- After the intent is settled, ask which item of `ROADMAP.md` the cycle fits.
- An item whose `status` is `_todo_` or `wip` is a candidate. A `done` item is not.
- When one fits, set its `status` to `wip`, with the owner's agreement first.
- When none fits, show the owner the item as you would write it, and add it to `ROADMAP.md` after agreement.

### 3. Entries

- Split the cycle into entries. One entry is one question.
- Show the owner the split and each entry's intent before any entry's scope is written.
- The owner's answer is the split. A rejected split is rewritten and shown again. A new entry found while an entry runs is shown to the owner first, and added after the answer.
- Run the scaffold to keep the record current:
  - `node .pi/skills/adr/scripts/index.mjs --add <title>` appends an entry with the title to the end of `adr.md` and `affected.md`. When a file does not exist, it creates it first.
  - `node .pi/skills/adr/scripts/index.mjs --delete <NN>` deletes entry `NN` from both files and renumbers the rest.
  - `node .pi/skills/adr/scripts/index.mjs --set <NN> <title>` replaces the title of entry `NN` in both files.
- Write what the chat settled promptly. Do not keep an agreement only in the chat.
- When every entry is decided, the entries are read together, and the change to the picture is settled.

## One entry

The entry stage runs once per entry, in the order the split gave.

### 1. Scope

The agent does the following in the chat:

1. Agree the scope. Every kind, one by one, `in` or `out`.
2. Let the owner correct the list, and write the result to the entry's `Scope`.
3. The scope is of this entry. The other entries keep their own scope.

The viewpoints are the following table. An `out` kind carries its reason. A revisit condition goes on the kind that needs one.

| Axis      | Kinds                                                  |
| --------- | ------------------------------------------------------ |
| Change    | behaviour, refactor, dependency, naming, format, prose |
| Quality   | speed, security, compatibility, errors                 |
| Operation | deploy, migration, logs and monitoring                 |

### 2. Pre-research

- Before running, read the `Look it up` section of `references/tasks.md`.
- Propose the type and the question together, and say what the answer would decide.
- The types answer their own questions: the official information and the source answer whether it can be built here and whether it fits the use, and the shape it is actually used in answers how it is held up where it is already done.
- The question is one of two: `compare` — what ways there are at all for this kind of problem, and what each buys and costs; `mechanism` and `triage` — whether this candidate holds here, and what its limits are.
- The `compare` question is asked when the ways are not visible yet, and not otherwise.
- A `research` subagent runs it, and the research runs once the owner approves. Look up what the owner approved, and nothing else.
- The facts come back with their source. A question nobody could answer comes back as a fact too, with what it is holding up.
- A fact that is still missing stops the entry. It is looked up here, not in the decision.
- Write the facts to `Research & Trial`. The facts here serve the approach presentation at the start of section 3.

### 3. Discussion Loop

- At the start, present the approaches and how each would be practiced, briefly, as the draft.
- Discuss before the decision. The discussion and the investigation run in a loop.
- Fill `Context` and `Research & Trial` here:
  - Write the entry's `Context` as numbered items: `C1`, `C2`, ...
  - An item is a premise (how it behaves now), a constraint (the `Who`'s want, a limit, what must not change), or the entry's question.
  - A fact that limits the decision is an item. A fact the decision weighs is not, and goes to `Research & Trial`.
  - When a finding shows a premise is wrong, correct the item, and keep the finding in `Research & Trial` with its source.
  - When a finding serves no item, add the item.
- Any specific docs, code, or similar materials agreed upon by the owner go under `Context`, enclosed within a fenced block.
- When the research is short, add it. When a finding changes the scope, propose the change and agree it.
- Do not move on unless the owner explicitly says to move to the decision. This step cannot be skipped.
- When the decision sends the entry back, discuss how to fill the missing part, or whether to remove it from `Context` or `Research & Trial`.
- Repeat until the owner moves the entry to the decision.

### 4. Decision

- Before writing, read the `Decision` section of `references/adr.format.md`.
- The agent checks that every `C` and every `F` is carried. When one is missing, explain the missing part to the owner first, and return to section 3 explicitly. When nothing is missing, the entry passes.
- The owner explicitly judges `accepted` or `rejected`. Then `Status` is filled.
- An accepted entry writes `Adopted` with `Add`, `Update`, `Drop` and `Keep`, and writes what is explicitly not done to `Denied`.
- A rejected entry adopts nothing. Its `Status` carries `**rejected**` with the reason.

### 5. Definition

- Before writing, read `rules/definition.rules.md` and `rules/definition.format.md`, and the `Definition` section of `references/adr.format.md`.
- Write the parts of `DEFINITION.md` the entry relates to: `Unit`, `Who`, `Stack`, `What`.
- Each part carries one of four operations: `(added)`, `(updated)`, `(dropped)`, `(kept)`.
- `(kept)` carries the reason the part stands: its main function is the same, and what changed is the route or the check that holds it up.
- The parts are named, not summarised. A part left unnamed is a part the entry did not weigh.
- A Unit that `rules/definition.rules.md` does not allow is not a Unit.
- A rejected entry adopts nothing. Its `Definition` carries only `(kept)` for the parts that stand, or `なし（採用しなかった）`.

### 6. Japanese proofread and affected

- After the decision and the definition, run the Japanese proofread and the affected research. There is no per-entry confirmation. The owner confirms all entries together after the last proofread.
- Japanese proofread: run one `proofreader` subagent with the cycle's `adr.md`, and have it read `references/adr.format.md`. The role's policy applies. It edits only `adr.md`, and only this entry's lines.
  - Read its report and the `git diff` of the file.
  - If a decision, a reason, a number, a name or a `Scope` line changed meaning, or a section or field name moved, put the file back to the shape `references/adr.format.md` gives, in your own words.
  - The wording of a quoted passage is not a change of meaning. Keep that correction.
  - One round. The repaired file does not go through the subagent again.
- Affected research: run one `research` subagent to write the entry's affected to `affected.md` in the shape `references/affected.format.md` gives.
  - Before running, read the `Look at the affected` section of `references/tasks.md` and `references/affected.format.md`.
  - The scaffold makes the `affected.md` bones with the entry's, and appends the next entry's bones to both.

### 7. Next entry

- While the proofread and the affected research run, the next entry goes ahead.
- The next entry's stage starts after the proofread report is read. The next entry is written to `adr.md` after the report is read.
- The affected research in section 6 runs at the same time.

## Entries, together

- When every entry is decided, read them together: the names they write, and the lines they move.
- Two entries that touch the same name must not contradict, and a contradiction is settled here with the owner.
- After all proofreads finish, the owner reads the `Definition` lines together, and the answer closes the entries' decisions.

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
