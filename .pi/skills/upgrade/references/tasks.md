# Texts handed to subagents

A subagent does not read this skill. What it knows is the task, so the task carries the rules.

## Look one package up (a `research` subagent)

```
Repository: <root>

Target: `<name>`. Installed <A> → target <B>.

1. Read this repository first: <the files that hold this package's setting and its use>. Name them in the task.
2. Read the breaking changes between <A> and <B>, from the changelog, the releases, or the migration guide.
3. For each breaking change:
   - what changed, in one sentence
   - whether it hits this repository (hits / does not hit / unknown), and the ground: a file and a line
   - when it hits, what to change here, in one sentence
   - the source URL
   A change that does not hit is one line in a list.
4. Add what only a run settles: a type, a setting, a requirement. Write it as `unknown`, with the run that settles it.

Report facts and sources. Do not decide, and do not design the procedure.
A question you could not answer is a fact too: say what it is holding up.
```

- One subagent per package. Two packages are never bundled into one task.
- Hand it the paths to read. The notes are not always a `CHANGELOG.md`: a package may keep them in its releases, a migration guide or a product blog, and some have no notes at all. Let the subagent find where they live.
- The task carries the range (`<A>` to `<B>`) and the repository's own files, so the answer can say whether a change hits.
