---
name: upgrade
description: Use when the owner asks to update the packages. It runs on its own, outside a cycle: the report and the audit are its stops, and its record is the commits.
---

# upgrade

A package is updated in two parts: inside the declared range, and past it. The first part is mechanical; the second is read, reported and chosen before it is applied.

The work has two stops, and the owner answers at both: the report, where they pick the packages; and the audit, where they say the leftovers are as expected.

## Not a cycle

- This skill is routine: it keeps the ground the product stands on, and it does not decide what the product becomes. It writes no ADR, no design and no plan.
- Its record is the commits: one package, one commit, with the checks that passed.
- When an update forces a decision the product owns — a behavior, a line of `DEFINITION.md`, a choice between two ways — stop the upgrade, and open a cycle for that part.

## Files

- `references/report.md` — the shape of the report the owner reads.
- `references/tasks.md` — the text handed to a `research` subagent that looks one package up.

## Procedure

### 1. Update inside the range

- `pnpm update`, every time, whether or not anything is out of date.
- It writes the range in `package.json` and moves `pnpm-lock.yaml`. Nothing may move; say so and go on.

### 2. Find what is out of range

- `pnpm outdated --json`. It exits 1 when it finds something, and that is not a failure.
- `wanted` is the newest version inside the declared range; `latest` is the newest one after `minimumReleaseAge` is applied. A package is out of range when `latest !== wanted`.
- `peerDependencies` are not checked: `pnpm outdated` does not see them. Say that in the report.
- The target is the newest stable version that is at least `minimumReleaseAge` minutes old. Read the number from `pnpm-workspace.yaml`; 1440 when it is not there. Prereleases are not counted.
- When every `latest` is old enough, the target is `latest`.
- Apply with `pnpm update --latest <package>`, never with an explicit version: the range keeps its shape, and the resolution goes through the age filter.

### 3. Look each package up, all at once

- One `research` subagent per package, all started together. The task is in `references/tasks.md`, and the range it carries is `<installed>` to `<target>`.
- Hand it the files that hold the package's setting and its use in this repository.
- Wait for all of them. A package whose answer is thin is still reported: what is unknown is written as unknown.

### 4. Report, and stop

- Write the report in the shape `references/report.md` gives, and put it in the chat. It is not written into a file.
- The owner picks which packages to take, and in what order. Nothing is applied before they answer.

### 5. Apply one package at a time

- `pnpm update --latest <package>`, one package at a time, in the owner's order.
- Read the resolved version. When it is not the target, stop and report: the resolution and the report disagree, and the owner decides.
- Take the breaking change the report named for that package, and change what the package forces. Nothing else is tidied in the same commit.
- Run the checks the project has: the test, the typecheck, the lint, the format check, and the build when `package.json` has one.
- One package, one commit. A package whose checks do not pass is not committed: the change is undone, the reason is written, and the owner is told.

### 6. Keep the configuration true

- `minimumReleaseAgeExclude` holds lines such as `package@1.2.3`. Keep a line only while it names a version that is installed; drop the rest.
- Never rewrite a version in that list: a rewritten line allows a younger version, which is the opposite of what the list is for.
- A line that `pnpm audit --fix=update` wrote stays while its version is installed.
- A package named in `package.json` only as a peer is not updated by this procedure; leave it, and do not add a line for it.

### 7. Audit, and stop

- `pnpm audit --audit-level low`. The level is not raised and not lowered.
- The exit code tells the two apart: 1 is an advisory at or above the level, an exception is a failed registry. Say which one it was.
- With leftovers, `pnpm audit --fix=update` once, then the checks again, then the audit again.
- `override` is the last step, and it is taken only with the owner's OK.
- `--ignore` and `--ignore-unfixable` are taken only with the owner's OK, and never in the same run as `--fix`.
- The work ends when the owner reads the leftovers and says they are as expected.

## Out of scope

- `peerDependencies`, and the peers that a package installs by itself: `pnpm outdated` does not see them.
- The CI's automatic updates (renovate, dependabot and the like): not this skill.
- A version younger than `minimumReleaseAge`: never taken.

## How not to do this

- Do not apply a package before the owner has picked it
- Do not put two packages in one commit
- Do not run `--fix` and `--ignore` in the same audit
- Do not call an advisory closed before the audit says it is gone
- Do not write a version or a number of minutes into this procedure: both are read from the project
