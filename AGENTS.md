# AGENTS.md

## Rules

1. Work happens in cycles. Write the cycle's definition, get it approved, then touch code.
2. Never report done while a check is red.
3. One commit = one meaning. Split it if it is mixed.
4. Never commit personal settings or credentials.
5. When prose and code disagree, fix it in the same turn.
6. Never weaken the checks: no loosened rules, no deleted tests, no `--no-verify`.

Checks are wired: `quality-gate` runs them every turn on what the turn changed; `lefthook` runs them
every commit. Both ship with the repository.
