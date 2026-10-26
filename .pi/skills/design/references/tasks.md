# Texts handed to subagents

A subagent does not read this skill. What it knows is the task, so the task carries the rules.

## Walk the paths the change affects (a `research` subagent)

```
Answer for one entry, and nothing else. The task names the entry and the files the entry rewrites — the subject.
Report the paths that exist now, in three groups:
- what reads the result of this change
- what checks it
- what is generated from it
Give each with a short reason, under its group.
Do not report the subject back.
Do not report generated files, vendor files, build artifacts, what .gitignore covers, or anything under cycles/.
Follow the dependencies one step, not transitively.
Do not drop a repeat: the same path under two entries is a fact the cut reads.
Report facts, and nothing else. Do not decide, and do not say what should change.
If there is no path to report, answer なし.
```

- The agent hands one `accepted` entry and its subject files, in the task.
- What comes back is written into design.md's `## Affected`, as it is.

## Find what the change talks to outside (a `research` subagent)

```
Answer for one entry, and nothing else. The task names the entry and the files the entry rewrites — the subject.
Report what the change talks to outside the repository: a service, a contract, an environment, data, a limit.
For each: the name, and what the change does with it. Report the things that exist now; do not invent one.
Report facts, and nothing else. Do not decide, and do not say what should change.
If the change talks to nothing outside, answer なし.
```

- The agent hands one `accepted` entry and its subject files, in the task.
- What comes back is written into design.md's `## External`, as it is. The plans' `Boundary.External` is taken from it.
- It runs beside the paths' walk, one per entry.

## Review the design (a `review` subagent)

```
Read cycles/<YYMMDD>-<NNN>-<slug>/design.md, the cycle's adr.md, and the files they name.
Answer on six viewpoints, one section each. A viewpoint with no finding is なし. Give each finding with its file:line.

1. a decided line: every line of each accepted entry's Adopted appears in Affected, Summary or Paths, and nothing else does; each plan's `Goal` carries the entries' `Adopted`, its `Scope`'s `in` and its `Research & Trial`, and is checkable; its `Non-goal` carries the touching `out` and the mistaken `Options` with the reason, and the `Goal` does not go past it
2. the cut's reason: Why says the input it shares, the condition that applies, and what it waits for
3. the outside: every outside thing in External appears in some plan's Boundary.External, and no Boundary.External line is missing from External
4. the followers: every follower in Affected that changes is in some plan's Paths
5. the readers: whatever reads what the change rewrites is named in Affected
6. the checks: each entry's change can be told by a check — a test, a command, a read by the agent, or the owner's look. Name the entry whose change no check tells

Do not change the design or the files.
```

- One subagent, one round. The agent fixes the design from the findings, and says in its report to the owner what it did with each.
