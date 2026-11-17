---
name: upgrade
description: Use when the owner asks to update the packages. It runs on its own, outside a cycle. The report and the audit are its stops, and its record is the commits.
---

# upgrade

A package is updated in two parts: inside the declared range, and past it. The first part is mechanical; the second is read, reported and chosen before it is applied.

This skill is routine: it keeps the ground the product stands on, and it does not decide what the product becomes. It writes no ADR, no affected and no plan.

When an update forces a decision the product owns — a behavior, a line of `DEFINITION.md`, a choice between two ways — stops the upgrade, and opens a cycle for that part.

## Procedure

### 1. Check the ground

1. Ask the owner whether to check the ground. When the owner skips, go on to the update.
2. Read `packageManager` and `engines.node` in `package.json`.
3. Read the running versions: `node --version` and `pnpm --version`.
4. Run one `research` subagent for the ground. It runs before the package research.
5. Write the results in the report's `Ground`, with the source URL of each.

### 2. Update inside the range

Steps:

1. Run `git status --porcelain` and check that it is empty. When it is not empty, stop.
2. Run `pnpm update` every time, whether or not anything is out of date.

Notes: It writes the range in `package.json` and moves `pnpm-lock.yaml`.

### 3. Find what is out of range

Steps:

1. Run `pnpm outdated --json`.
2. Read the number from `pnpm-workspace.yaml`.
3. Apply with `pnpm update --latest <package>`, never with an explicit version.

View:

| field    | what it is                                                 |
| -------- | ---------------------------------------------------------- |
| `wanted` | the newest version inside the declared range               |
| `latest` | the newest one after `minimumReleaseAge` is applied        |
| target   | the newest stable version at least `minimumReleaseAge` old |

Notes:

- It exits 1 when it finds something, and that is not a failure.
- A package is out of range when `latest !== wanted`.
- `peerDependencies` are not checked. `pnpm outdated` does not see them.
- The number is `minimumReleaseAge` minutes. It is 1440 when it is not there.
- The range keeps its shape.

### 4. Look each package up, all at once

Steps:

1. Start one `research` subagent per package, all together.
2. Hand it the files that hold the package's setting and its use in this repository.
3. Wait for all of them.

Notes:

- The task is in `references/tasks.md`.
- The range it carries is `<installed>` to `<target>`.

### 5. Report, and stop

Steps:

1. Write the report in the shape `references/report.md` gives, and put it as markdown (not a fence) in the chat.
2. The owner picks which packages to take, and in what order.
3. Wait for the owner's answer.

### 6. Try the update in a worktree

1. After the owner picks the packages, check whether any of them has a breaking change. When none has, skip the trial and go on to the apply. When at least one has, try all the picked packages in one worktree.
2. Make one worktree for the trial: `consult_worktree new upgrade-trial`.
3. The worktree's install runs before the subagent: `pnpm install --frozen-lockfile`.
4. Hand the trial subagent the packages and the trial task. The task text is in `tasks.md`.
5. When the trial reports, read it.
6. Remove the worktree: `consult_worktree remove upgrade-trial` with `force`.
7. Go on to the apply. When the trial failed, do not apply; report and let the owner decide.

- When the trial subagent stops at the turn limit:
  - IF its report says the trial is going well → continue the same subagent.
  - IF its report says something cannot be resolved → treat it as a failure.
- The owner decides: narrow the trial to a subset, or open a cycle.

### 7. Apply one package at a time

Steps:

1. Run `pnpm update --latest <package>`, one package at a time, in the owner's order.
2. Read the resolved version.
3. Stop when it is not the target. Report first in that case.
4. Take the breaking change the report named for that package, and change what the package forces.
5. Run the checks:
   1. `pnpm test:run` exits 0.
   2. `pnpm typecheck` exits 0.
   3. `pnpm lint` exits 0.
   4. `pnpm format:check` exits 0.
   5. The read-through finds no mismatch in a number, a path, a name or a shape.
6. When a check fails:
   1. Restore the files the package's update touched to HEAD (git restore --source=HEAD -- package.json pnpm-lock.yaml <the source it changed>).
   2. Run pnpm install to restore node_modules.
   3. Report the failed check's output and the restored files to the owner, and decide whether to go on to the next package or stop.
7. After the fix from the read-through:
   1. After the fix, run all four checks again (pnpm test:run, pnpm typecheck, pnpm lint, pnpm format:check).
   2. When the four pass, commit it. When they do not, follow the undo.
8. When the checks pass, commit it.

Notes: If the resolved version is not the target. the owner decides how to proceed.

### 8. Keep the configuration true

Steps:

1. Drop the lines that do not name a version that is installed.
2. Leave a package named in `package.json` only as a peer, and add no line for it.

Notes:

- `minimumReleaseAgeExclude` holds lines such as `package@1.2.3`.
  - Keeps a line only while it names a version that is installed.
  - Never rewrites a version in that list.
  - A rewritten line allows a younger version. That is the opposite of what the list is for.
- A line that `pnpm audit --fix=update` wrote stays while its version is installed.

### 9. Audit, and stop

Steps:

1. Run `pnpm audit --audit-level low`.
2. Write the report in the shape `references/audit.md` gives, from `pnpm audit --json`'s `advisories` and `metadata`, with the failure in `Ground` or `Leftovers`, and put it as markdown in the chat.
3. Run `pnpm audit --fix=update` once with leftovers.
4. Run the checks and audit again.
5. Take the `override` method (`--fix=override`), `--ignore` and `--ignore-unfixable` only with the owner's OK.
6. The work ends when the owner reads the leftovers and says they are as expected.

Notes:

- The level is not raised and not lowered.
- exit code tells the two apart.
- Agent runs `--fix` and `--ignore` in no same audit.
- Agent calls no advisory closed before the audit says it is gone.

## How not to do this

- When the owner has not picked a package: do not apply it.
- When you write this procedure: do not put a version or a number of minutes in it. Both are read from the project.
- When you update packages: do not touch the CI's automatic updates (renovate, dependabot and the like).
