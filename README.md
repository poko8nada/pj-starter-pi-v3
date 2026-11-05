# Harness-included starter

[![TypeScript](https://img.shields.io/badge/TypeScript-7.0.2-3178C6)](https://www.typescriptlang.org/) [![Node](https://img.shields.io/badge/Node-24-339933)](https://nodejs.org/) [![pnpm](https://img.shields.io/badge/pnpm-12.15.0-F69220)](https://pnpm.io/) [![pi](https://img.shields.io/badge/pi-1.4.0-7C3AED)](https://www.npmjs.com/package/@earendil-works/pi-coding-agent)

A starter where a project and its **agent harness** are in place from the start. This starter already has the checks, the commit gates, the agent rules and the cycle mechanism at the moment you clone it.

日本語: [README.ja.md](README.ja.md)

## What is in it

### Roadmap & Cycle

Product direction and cycle decisions stay traceable from intent to record.

- [DEFINITION.md](DEFINITION.md): Holds the product picture; cycle decisions record intent against its parts and keep the picture current.
- [ROADMAP.md](ROADMAP.md): Holds versioned items; cycles pick items with owner agreement and append cycle numbers on close.
- rules: `rules/*` - Holds shapes and wording rules for definition, roadmap, and readme.

### Agent

Daily work runs through a pi harness with settled roles and bounded duties.

- [AGENTS.md](AGENTS.md): Project rules read every session; issues live on the roadmap and work runs in cycles from adr to close.
- skills:
  - `adr`: Settles intent, roadmap item, and entries, recording decisions on the definition.
  - `plan`: Cuts agreed entries into ordered work units with files and checks.
  - `work`: Runs plan slices in order and leaves records in plan notes.
  - `close`: Collects plan outputs, triages with the owner, and updates the roadmap.
  - `yolo`: Walks cycle stages without owner confirmations and stops at triage.
  - `upgrade`: Upgrades dependencies on its own, apart from cycles.
- extensions:
  - `consult`: Runs one subagent pi with a role and a place, plus worktree and commit helpers.
  - `quality-gate`: Checks only changed parts on each turn, with fix and check stages.
  - `context-precompact`: Prepares context in the background before the threshold and applies it at the boundary.
  - `thinking-scrub`: Stops looped thinking during generation and keeps it out of the next turn.
  - `sound-notify`: Plays a sound and sends a cmux notice while pi waits for the user.

### Checks

Automated gates keep style, correctness, behavior, and wording consistent on every change.

- lint: `oxlint` - Fails on warnings for changed JavaScript and TypeScript.
- format: `oxfmt` - Formats and verifies JavaScript, TypeScript, Markdown, and JSON.
- typecheck:
  - `scripts/checks/typecheck.mjs` - Checks root and harness types on push.
  - `scripts/checks/typecheck-staged.mjs` - Checks only staged files on commit.
- test:
  - `vitest.config.ts` - Product config excluding harness paths.
  - `vitest.starter.config.ts` - Starter config covering all tests.
- japanese-check: `scripts/checks/ja-check.mjs` - Reports banned Japanese words with error and warn counts, and skips the paths listed in `exclude`.
- localhook: `lefthook`
  - pre-commit: Runs format, lint, staged typecheck, related tests, and japanese-check on changed parts.
  - pre-push: Runs full typecheck and tests.

### Handover

Moving work between starter and product stays explicit and repeatable.

- harness-sync: `scripts/harness/*` - Brings starter parts in and returns project parts back without deleting files.
- product-ready: `scripts/product-ready/*` - Replaces roadmap, definition, and readmes with templates and drops starter-only test wiring on first run.

### CI

_Under construction_

## Getting started

Requires Node 24 or later and pnpm.

1. Run `pnpm install` to fetch dependencies.
2. Run `pnpm product:ready` once to make the clone yours.
3. Start `pi` from the repository root.

## License

UNLICENSED
