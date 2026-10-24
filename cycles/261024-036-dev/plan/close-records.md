# PLAN `close-records`

- No: 02

## Files

```text
.pi/skills/
  close/
    SKILL.md              update
    references/
      format.md           update
    scripts/
      collect.mjs         update
      collect.test.ts     add
  plan/
    SKILL.md              update
    references/
      format.md           update
```

## Slices

## 1.close-start

### Types

なし

### Steps

1. `.pi/skills/close/SKILL.md`:
   - The description's "merged or landed in the base" becomes "done".
   - Step 1 becomes "every plan is done: its `Commit:` is filled and the work is done (`work` step 8 green), or the owner dropped it (`Stopped`, no merge)".
   - Remove the ancestor / merge log sub-bullets.

### Verify

- Always:
  - `pnpm test:related .pi/skills/close/SKILL.md`; `pnpm test:run` if nothing is related
  - `pnpm typecheck`
  - `pnpm lint`
  - `pnpm format:check`
  - `grep -R "merge-base --is-ancestor\\|git log --merges" .pi/skills/close` returns なし
  - `grep -R "merged or landed\\|work is in the base\\|record sits in the agent's plan md" .pi/skills/close/SKILL.md` returns なし
  - `grep -n "work is done\\|owner dropped" .pi/skills/close/SKILL.md` has the new condition
- Added: なし

## 2.ex-no

### Types

```ts
type TriageEntry = {
  readonly planId: string;
  readonly adrNo: string;
};

function noOf(plan: PlanRecord, closeText: string): string | null;
```

### Steps

1. `.pi/skills/plan/references/format.md`:
   - A normal plan keeps `- No: <NN>` at the top.
   - An `ex-` plan does not write `No`; the close reads the `ADR <NN>` of the Triage line.
   - Remove the "or from the ADR entry whose Unit failed" branch.
2. `.pi/skills/plan/SKILL.md`:
   - A normal plan writes the design's `No`.
   - An `ex-` plan does not write `No`; the Triage line is the only source.
   - Remove the "or from the ADR entry whose Unit failed" branch.
3. `.pi/skills/close/references/format.md`:
   - The Triage line is `- <N>: ex-plan <plan id> (ADR <NN>, <定義の部分>): <why>`.
   - The `## Collected` heading's `No` for an `ex-` plan comes from the Triage.
   - Remove the "or from the ADR entry whose Unit failed" branch.
4. `.pi/skills/close/SKILL.md`:
   - Step 3 / 4 / 5: an `ex-` plan's `No` is read from the Triage; the plan md has no `No`.
   - Remove the "or from the ADR entry whose Unit failed" branch.
5. `.pi/skills/close/scripts/collect.mjs`:
   - `noOf` reads the plan md's `- No:` for a normal plan.
   - For an `ex-` plan, read `close.md`'s `## Triage` line `- <N>: ex-plan <plan id> (ADR <NN>, ...)`; match by the plan id; use the `ADR <NN>`.
   - A missing Triage line → `未特定`.
   - `collectCycle` and `writeClose` pass the `close.md` text; `linkText` uses the resolved `No`.
6. `.pi/skills/close/scripts/collect.test.ts`:
   - A normal plan's `No` from the plan md.
   - An `ex-` plan without `- No:`: the Triage line's `ADR <NN>`.
   - A missing Triage line → `未特定`.
   - The `## Collected` heading.

### Verify

- Always:
  - `pnpm test:related .pi/skills/close/scripts/collect.mjs .pi/skills/close/scripts/collect.test.ts .pi/skills/close/references/format.md .pi/skills/plan/references/format.md`; `pnpm test:run` if nothing is related
  - `pnpm typecheck`
  - `pnpm lint`
  - `pnpm format:check`
  - `grep -n "Triage\\|triage" .pi/skills/close/scripts/collect.mjs` has the new branch
  - `grep -R "or from the ADR entry whose Unit failed" .pi/skills/close .pi/skills/plan` returns なし
  - `grep -n "ex-.*does not write.*No" .pi/skills/plan/references/format.md` has the line
- Added:
  - other — `collect.test.ts` fixture: a cycle with `close.md`'s `## Triage` and an `ex-` plan without `- No:`; the heading is `ADR <NN>`; a missing Triage is `未特定`.

## Notes

### Slice 1: close-start

- Findings:
- Unplanned:
- Commit:

### Slice 2: ex-no

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
