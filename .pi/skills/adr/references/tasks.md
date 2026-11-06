# Texts handed to subagents

A subagent does not read this skill. What it knows is the task, so the task carries the rules.

## Look it up (a `research` subagent)

```markdown
Answer the question the task carries, and nothing else.
Keep the source of each fact.
Report the facts. A question you could not answer is a fact too: say what it is holding up.
```

- The agent puts the question and the approved type in the task.
- What is looked up is not carried into the ADR. Only the fact the decision rests on goes, and the ADR writes it.

## Look at the affected (a `research` subagent)

```markdown
Answer the question the task carries for one entry, and nothing else.
The change is the entry's decision. The record is `affected.md`; its shape is the one `references/affected.format.md` gives.

1. Read the entry in full: `Context`, `Scope`, `Adopted`, `Definition`.
2. Take the objects (skip the `Denied` lines: they name what does not change): for each kind in the `Scope`'s `in`, for each sentence of the `Adopted`, take the verbs (remove, drop, replace, rewrite, add, align, move, merge, retire) and their objects. Split a sentence with two operations; a sentence that states a result is an operation. The object list goes to the report before the search.
3. Sort the nouns into paths, directories, headings, keys, identifiers, strings, sentences, commands and abstracts. Fix an abstract on the file the entry names; an abstract that cannot be fixed is returned as a fact.
4. Widen each to five spellings: the full path, the parent directory, the last element, the identifier, the URL fragment.
5. The range is the whole repository, always.
6. Search every name as a string first, with `git grep`; a path is no exception. `git ls-files` and `find` only answer whether it exists. A heading is `grep '^#\{1,6\} '`; a key is a `grep` of the config; a sentence is a `read`; a command is the `scripts` of `package.json`.
7. Exclude `cycles/` records, `node_modules` and generated files by kind, never by count.
8. A hit is a candidate: read it before deciding the item. A string match is not a dependency.
9. For each object, check the seven effects: breaks, loses its target, becomes a lie, stops checking, stays in the generated, needs a registration, changes the outside contract.
10. Fill the worksheet: per object, the five spellings' hits and the seven effects, no blank. A cell that found nothing says `なし`; a blank means the search is not done. Fill a cell with the `git grep` result, not with `ls` or `find`. Every path in the worksheet is a `Path`; a `Path` is not added beyond the worksheet. The worksheet goes to the report, not the record.
11. An edge: a file a search cell hit is an edge to the object. `needs` — the code needs the path. `names` — a config or a doc holds the path as a value or a description. `mentions` — a doc touches the path. `checks` — a test checks the path. `contains` — a dir holds the path. One `Edge` line may list several paths.
12. Repeat: add the names the hits give (the file, the parent directory, the identifier, the nearby heading) until no new name comes.
13. Stop when no new name comes and the worksheet has no blank.
14. Check that each kind in the `Scope`'s `in` has at least one operation; if not, the extraction is not done.
15. The reflection: the ranges seen, the ranges not seen and why, the names added. The questions that could not be answered, the nouns that could not be derived and the reason the work stopped go to the report as facts.
16. The constraints: the change is not applied, so the checks are not run. No indexer, AST or LLM. The cost follows the change's size; no full enumeration.

Do not read the cycle's earlier affected, its plan, or a memo: the answers are there, and the facts come from the entry and the repository.

Report the facts only.
Write the affected to `affected.md` in the shape `references/affected.format.md` gives: one `Path` block per path, with its `Kind` and its `Edge`, and `### External` with `Name`, `Kind` and `Used by`. Write only inside this entry's `## NN:` section. Other sections may hold unfinished scaffolds. Do not touch them, and do not delete them.
```

- The agent puts the entry and the change in the task.
- The affected is written to `affected.md`, not to the ADR.
- The agent checks the worksheet. A cell filled by `ls` or `find` alone is not accepted.

## Try it (a `trial` subagent)

```
Try <the candidate> in <the setting>, in a worktree.
Install it, set it up, and find the smallest shape that works.
Report three: what clashes, the versions, and the smallest working shape.
Ask before you touch the shared store.
Leave the worktree as it is. Nothing you write enters the product.
```

- The agent asks the owner before the subagent touches the shared store.
- The trial is the bench: what it leaves is the fact, and nothing else.
