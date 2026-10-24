# PLAN `ex-collect-header`

## Files

```text
.pi/skills/
  close/
    scripts/
      collect.mjs         update
```

## Slices

## 1.header-note

### Types

なし

### Steps

1. `.pi/skills/close/scripts/collect.mjs`:
   - The header note (line 3) says the `No` is the plan md's; add that an `ex-` plan's `No` is read from the `close.md`'s `## Triage`.

### Verify

- Always:
  - `pnpm test:related .pi/skills/close/scripts/collect.mjs .pi/skills/close/scripts/collect.test.ts`; `pnpm test:run` if nothing is related
  - `pnpm typecheck`
  - `pnpm lint`
  - `pnpm format:check`
  - `grep -n "Triage" .pi/skills/close/scripts/collect.mjs` has the header note
- Added:
  - other — the agent reads the header note; the `ex-` source is the `Triage`.

## Notes

### Slice 1: header-note

- Findings:
- Unplanned:
- Commit:

## Review

### Round 1

- Stale:
- Unlisted:
- Gaps:
- Unproven:
- Noise:
- Doubts:

## Acceptance

- Ran:
- Findings:
- Doubts:
