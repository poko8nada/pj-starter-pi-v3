---
name: upgrade
description: Use when the owner asks to update the packages. It runs on its own, outside a cycle. The report and the audit are its stops, and its record is the commits.
---

# upgrade

A package is updated in two parts: inside the declared range, and past it. The first part is mechanical; the second is read, reported and chosen before it is applied.

The work has two stops, and the owner answers at both: the report, where they pick the packages; and the audit, where they say the leftovers are as expected.

This skill is routine: it keeps the ground the product stands on, and it does not decide what the product becomes. It writes no ADR, no affected and no plan.

When an update forces a decision the product owns — a behavior, a line of `DEFINITION.md`, a choice between two ways — stops the upgrade, and opens a cycle for that part.

`references/report.md` holds the shape of the report the owner reads. `references/tasks.md` holds the text handed to a `research` subagent that looks one package up.

## Procedure

### 1. Update inside the range

Steps:

1. Run `pnpm update` every time, whether or not anything is out of date.

Notes:

- It writes the range in `package.json` and moves `pnpm-lock.yaml`.

### 2. Find what is out of range

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
- `peerDependencies` are not checked.
- `pnpm outdated` does not see them.
- The number is `minimumReleaseAge` minutes.
- It is 1440 when it is not there.
- Prereleases are not counted.
- The target is `latest` when every `latest` is old enough.
- The range keeps its shape.
- The resolution goes through the age filter.

### 3. Look each package up, all at once

Steps:

1. Start one `research` subagent per package, all together.
2. Hand it the files that hold the package's setting and its use in this repository.
3. Wait for all of them.

Notes:

- The task is in `references/tasks.md`.
- The range it carries is `<installed>` to `<target>`.
- A package whose answer is thin is still reported.
- What is unknown is written as unknown.

### 4. Report, and stop

Steps:

1. Write the report in the shape `references/report.md` gives, and put it in the chat.
2. Wait for the owner's answer.

Notes:

- It is not written into a file.
- The owner picks which packages to take, and in what order.

### 5. Apply one package at a time

Steps:

1. Run `pnpm update --latest <package>`, one package at a time, in the owner's order.
2. Read the resolved version.
3. Stop when it is not the target.
4. Report in that case.
5. Take the breaking change the report named for that package, and change what the package forces.
6. Run the checks the project has.
7. Commit it when the checks pass.
8. Undo the change when the checks do not pass.
9. Write the reason in that case.
10. Tell the owner in that case.

View:

- test
- typecheck
- lint
- format check
- build when `package.json` has one

Notes:

- The resolution and the report disagree when the resolved version is not the target.
- The owner decides in that case.
- Nothing else is tidied in the same commit.
- One package is one commit.

### 6. Keep the configuration true

Steps:

1. Drop the lines that do not name a version that is installed.
2. Leave a package named in `package.json` only as a peer, and add no line for it.

Notes:

- `minimumReleaseAgeExclude` holds lines such as `package@1.2.3`.
- Keeps a line only while it names a version that is installed.
- Never rewrites a version in that list.
- A rewritten line allows a younger version.
- That is the opposite of what the list is for.
- A line that `pnpm audit --fix=update` wrote stays while its version is installed.
- A package named in `package.json` only as a peer is not updated by this procedure.

### 7. Audit, and stop

Steps:

1. Run `pnpm audit --audit-level low`.
2. Say which one it was.
3. Run `pnpm audit --fix=update` once with leftovers.
4. Run the checks again.
5. Run the audit again.
6. Take `override` only with the owner's OK.
7. Take `--ignore` and `--ignore-unfixable` only with the owner's OK.

View:

| exit         | what it is                        |
| ------------ | --------------------------------- |
| 1            | an advisory at or above the level |
| an exception | a failed registry                 |

Notes:

- The level is not raised and not lowered.
- exit code tells the two apart.
- Agent runs `--fix` and `--ignore` in no same audit.
- Agent calls no advisory closed before the audit says it is gone.
- `override` is the last step.
- Work ends when the owner reads the leftovers and says they are as expected.

## How not to do this

- When the owner has not picked a package: do not apply it.
- When you write this procedure: do not put a version or a number of minutes in it. Both are read from the project.
- When you update packages: do not touch the CI's automatic updates (renovate, dependabot and the like).
- When you pick a version: do not take one younger than `minimumReleaseAge`.
