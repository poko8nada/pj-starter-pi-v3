# Audit report (<YYYY-MM-DD>)

## Ground

- `pnpm audit --audit-level low`: <the exit code, and what it means>.
- The advisories at or above `low`: <n>.

## List

| #   | Advisory | Severity | Package | Vulnerable | Patched | Paths |
| --- | -------- | -------- | ------- | ---------- | ------- | ----- |

## Each advisory

### <n>. `<GHSA>` <title>

- Severity: <severity>
- Package: <name> <vulnerable versions>
- Patched: <patched versions, or none>
- Paths: <the paths>
- Fix: <the command or the override that closes it>
- Source: <URL>

## What to decide

- which advisories to close with `overrides`
- which to ignore with `audit.ignore`, and why

## Leftovers

- <the advisories that remain, and why>

## Rules

- Every fact carries its URL.
- Write a number only when it was measured.
- A file name is written from the project root.
