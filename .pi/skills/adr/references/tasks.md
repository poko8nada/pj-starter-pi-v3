# Texts handed to subagents

A subagent does not read this skill. What it knows is the task, so the task carries the rules.

## Look it up (a `research` subagent)

When the agent needs a fact the entry does not hold.

```text
Answer the question the task carries, and nothing else.

1. Keep the source of each fact.
2. Report the facts.
   - A question you could not answer is a fact too: report it, and say what it is holding up.
```

- The agent puts the question and the approved type in the task.
- What is looked up is not carried into the ADR. Only the fact the decision rests on goes, and the ADR writes it.

## Try it (a `trial` subagent)

When the entry's holding point is a fact nobody has, and the owner agreed to a run.

```text
Try <the candidate> in <the setting>, in a worktree.

1. Install it, set it up, and find the smallest shape that works.
2. Ask before you touch the shared store.
3. Leave the worktree as it is, and let nothing you write enter the product.
4. Report three: what clashes, the versions, and the smallest working shape.
```

- The agent asks the owner before the subagent touches the shared store.
- The trial is the bench: what it leaves is the fact, and nothing else.

## Look at the affected (a `research` subagent)

When the agent needs the impact of one entry's decision.

```text
Answer the question the task carries for one entry, and nothing else.

The change is the entry's decision. The record is `affected/<NN>.md`; its shape is the one `references/affected.format.md` gives.

Do not read another entry's affected, the cycle's plan, or a memo: the answers are there, and the facts come from the entry and the repository.

1. Read the entry in full: `Context`, `Research & Trial` (the fact, not the `出所:` part), and `Decision`'s `Add`, `Update`, `Drop`, `Policy`'s `Allowed` and `#### Details`.
2. Take every keyword there that is a name in this repository: a path, a directory, a heading, a key, an identifier, a string or a command. Do not take a free sentence, a common word that names no specific thing, the `Forbidden` lines or the `出所:` part. Write the list under `### Keywords` in `affected/<NN>.md`, before `### Code`.
3. The targets are what the `Add`, `Update`, `Drop`, `Allowed` and `Details` lines change.
4. Widen each keyword to five spellings: the full path, the parent directory, the last element, the identifier, the URL fragment.
5. The range is the whole repository, always. Search every spelling as a string first, with `git grep`; a path is no exception. `git ls-files` and `find` only answer whether it exists. A heading is `grep '^#\{1,6\} '`; a key is a `grep` of the config; a sentence is a `read`; a command is the `scripts` of `package.json`.
6. Exclude `cycles/` records, `node_modules` and generated files by kind, never by count.
7. A hit is a candidate: read it before deciding the item. A string match is not a dependency. For a non-target keyword, read a hit only when its path or line looks related; record the rest as a hit.
8. For each target, check the seven effects: breaks, loses its target, becomes a lie, stops checking, stays in the generated, needs a registration, changes the outside contract.
9. Fill the worksheet: the targets get the five spellings' hits and the seven effects, no blank. The other keywords get the five spellings' hits only. A cell that found nothing says `なし`; a blank means the search is not done. Fill a cell with the `git grep` result, not with `ls` or `find`. Every path in the worksheet is a `Path`; a `Path` is not added beyond the worksheet. The worksheet goes to the report, not the record. When a hit of a non-target keyword reads as related, promote it to a target and fill its seven effects.
10. An edge: a file a search cell hit is an edge to the keyword. `needs` — the code needs the path. `names` — a config or a doc holds the path as a value or a description. `mentions` — a doc touches the path. `checks` — a test checks the path. `contains` — a dir holds the path. `defines` — the path defines a value the other path uses. One `Edge` line may list several paths.
11. Repeat: add the keywords the hits give (the file, the parent directory, the identifier, the nearby heading) until no new keyword comes and the worksheet has no blank for the targets.
12. Report the facts only, with these:
    - the ranges seen, the ranges not seen and why, the keywords added
    - the questions that could not be answered, the keywords that could not be derived and the reason the work stopped
    - the constraint: the change is not applied, so the checks are not run; no indexer, AST or LLM; the cost follows the change's size, no full enumeration
13. Write the affected to `affected/<NN>.md` in the shape `references/affected.format.md` gives: the `Keywords` list, one `Path` block per path with its `Kind` and its `Edge`, and `### External` with `Name`, `Kind` and `Used by`. An external contract the change calls, an event it listens to, a value it reads, a store it uses, a path it opens, or a limit it must stay within goes in `### External`; a fact about its behavior stays in `Research & Trial`. Write only this file; do not touch another entry's file.
```

- The agent puts the entry and the change in the task.
- The affected is written to `affected/<NN>.md`, not to the ADR.
- The agent checks the worksheet. A cell filled by `ls` or `find` alone is not accepted.
