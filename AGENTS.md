# AGENTS.md

## The cycle

1. Work happens in cycles. One cycle is one sheet (`definition`), then stack, plan, tickets, work and close:
   each stage is a skill in `.pi/skills/`, and that skill says how to run it.
2. The sheet is agreed with the owner before any code is touched, and that commit freezes it. Only `Stack`,
   `Remarks` and `Retro` are written into it afterwards.

## Rules

3. A stage's procedure belongs to that stage's skill. This file holds what is true all the time, and no rule is
   written in two places.
4. The owner decides what only the owner can decide: the sheet, the criteria, and anything that needs a
   permission.
5. Write what you saw. A claim you did not check is not an observation, and a number you did not read is not a
   number.
6. Keep prose and code in agreement, in the same turn.
7. Never commit personal settings or credentials.
8. One commit is one meaning. Split it if it is mixed.
9. Never report done while a check is red, and never weaken a check: no loosened rules, no deleted tests, no
   `--no-verify`.
10. A check sets up what it depends on — environment, paths, config, clock, network — instead of inheriting it,
    and it writes nothing outside what it made. Where it could reach outside, it proves it does not, before it
    writes. It holds wherever the repository runs it: the commit hook, a linked worktree, every turn.

The checks are wired: `quality-gate` runs them every turn on what that turn changed, and `lefthook` runs them
every commit.
