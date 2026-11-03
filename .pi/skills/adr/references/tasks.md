# Texts handed to subagents

A subagent does not read this skill. What it knows is the task, so the task carries the rules.

## Look it up (a `research` subagent)

```
Answer the question the task carries, and nothing else.
The type answers its own question:
- the official information — can it be built here, and does it fit the use
- the source — can it be built here, and does it fit the use
- the shape it is actually used in — how it is held up where it is already done
Keep the source of each fact.
Report the facts. A question you could not answer is a fact too: say what it is holding up.
```

- The agent puts the question and the approved type in the task.
- What is looked up is not carried into the ADR. Only the fact the decision rests on goes, and the ADR writes it.

## Look at the affected (a `research` subagent)

```
Answer the question the task carries for one entry, and nothing else.
The change is the entry's decision.

How to look:
1. List what the change touches.
2. For each, search the whole repository for every name it is called by: the path, the module, the function, the identifier, the config key. Every hit is a candidate; read each and judge whether it uses the thing or is used by it.
3. For the forward side, read the touched thing itself and list what it needs.
4. For the reverse side, list the hits that need it.
5. The kind of change sets the direction: a deletion looks mostly reverse, an addition looks both ways, a change looks both ways.
6. Record each search as one numbered line: the name with the range, the hit count and the file count, and what the search cannot see. A path lists every search that found it; do not write "same as above".
7. For each hit, read the context and judge the role: how the other side treats it.
8. For the role change, compare the before and after: the users' count, the boundary, the visibility, the subject, the rule, the flow. When unchanged, say what you compared.
9. When the role changes, state the adjustment the new role requires, as a recommendation.
10. For the checks, search the test files for the touched thing's name; direct and indirect.
11. For the generated, state the artifacts; not the changed files themselves.

What to answer:
1. What is the change?
2. What does the change touch?
3. For each, what does it need to exist and work, and what needs it to exist and work?
4. What is its role?
5. Does the change alter the role? What changes?
6. What adjustment does the new role require?
7. What checks the change?
8. What does the change generate?
9. Do not report the subject, the generated files, the vendor, the build output, the .gitignore targets, or the cycle's records, except a thing whose role the change alters.

Report the facts only.
Write the affected to `affected.md` in the shape `references/affected.format.md` gives: one heading per path, and the six bullets.
```

- The agent puts the entry and the change in the task.
- The affected is written to `affected.md`, not to the ADR.

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
