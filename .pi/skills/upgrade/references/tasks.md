# Texts handed to subagents

A subagent does not read this skill. What it knows is the task, so the task carries the rules.

## Check the ground

Report the ground the update stands on, and nothing else.

1. pnpm: the version in `packageManager`. Is there a newer patch in the same minor? Is the version deprecated?
2. Node: the running version and the range in `engines.node`. Is there a newer patch in the same major? Is the major EOL?
3. Read the sources:
   - pnpm: `https://registry.npmjs.org/pnpm/<version>`, `https://data.jsdelivr.com/v1/package/npm/pnpm`, `https://api.github.com/repos/pnpm/pnpm/releases`
   - Node: `https://nodejs.org/dist/index.json`, `https://endoflife.date/api/nodejs.json`
4. Report one line per item, with the value and the source URL.
   - IF a source cannot be read → write `unknown`, and write what stopped it.

## Look one package up (a `research` subagent)

When the agent has a package's installed and target versions.

```text
Report what a package's move from <A> to <B> changes in this repository, and nothing else.

Repository: <root>

Target: `<name>`. Installed <A> → target <B>.

1. Read this repository first: <the files that hold this package's setting and its use>. Name them in the task.
2. Read the breaking changes between <A> and <B>, from the changelog, the releases, or the migration guide.
3. For each breaking change, write what changed in one sentence, whether it hits this repository (hits / does not hit / unknown) with the ground: a file and a line, what to change here in one sentence when it hits, and the source URL.
   - IF the change does not hit → write it as one line in a list.
4. Add what only a run settles: a type, a setting, a requirement. Write it as `unknown`, with the run that settles it.
5. Report facts and sources. Do not decide, and do not design the procedure.
   - A question you could not answer is a fact too: report it, and say what it is holding up.
```

- Hand it the paths to read.
- About Release info:
  - The notes are not always a `CHANGELOG.md`.
  - A package may keep them in its releases, a migration guide or a product blog.
  - Some have no notes at all.
- The task carries the range (`<A>` to `<B>`) and the repository's own files.
- The answer says whether a change hits.
