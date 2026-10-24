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

- Findings: なし
- Unplanned: なし
- Commit: c6b929b

### Slice 2: ex-no

- Findings: なし
- Unplanned: なし
- Commit: 0f1a4d0

### Cleanup: collect.test.ts の重複整理

- Findings: なし
- Unplanned:
  - `.pi/skills/close/scripts/collect.test.ts` の `collectCycle` 見出し確認を削り、`noOf` 3 件と `writeClose` 見出し確認に寄せました（同じ `No` 解決を二重に見ていたためです）。
  - 消えた振る舞いを確かめる試験は残っておらず、削る対象はありませんでした（旧単引数 `noOf` の呼び出しは残っていません）。
  - 本計画が止めた分岐（`ex-` plan md の `- No:` 読み）を踏む試験はなく、削る対象はありませんでした。
  - 型やスキーマや DB が保障する前提の試験はなく、中間 `link` のみの確認は上記の重複として削りました。
  - 整理後の確認は緑でした（対象試験 4 件、`typecheck`、`lint`、`format:check`）。

## Review

### Round 1

- Stale: なし — 旧文言（`merge-base --is-ancestor`、`merged or landed`系、`or from the ADR entry whose Unit failed`系）の残存はなく（.pi/skills/close/SKILL.md:3,22、.pi/skills/close/references/format.md:42、.pi/skills/plan/SKILL.md:22-23、.pi/skills/plan/references/format.md:94-95）、新文言への置換を確認しました。
- Unlisted: なし — 差分の6件（.pi/skills/close/SKILL.md、.pi/skills/close/references/format.md、.pi/skills/close/scripts/collect.mjs、.pi/skills/close/scripts/collect.test.ts、.pi/skills/plan/SKILL.md、.pi/skills/plan/references/format.md）は計画のFiles（cycles/261024-036-dev/plan/close-records.md:7-20）の6件と一致します。
- Gaps: なし — Slice 1の文書条件はgrep群で、Slice 2のSteps 5〜6の振る舞い（通常はplan md、ex-はTriage、欠落は未特定、Collected見出し）は.pi/skills/close/scripts/collect.test.ts:71-93の4件で必要な分岐を満たしています。
- Unproven: なし — 各試験は対応する解決を壊すと赤になります（.pi/skills/close/scripts/collect.test.ts:73が通常の誤読を、:77がTriage未読を、:81が欠落の定数化を、:86-93が見出し未反映をいずれも検出します）。
- Noise: なし — `02`、`ADR 02`、`未特定`はVerifyのAdded（cycles/261024-036-dev/plan/close-records.md:100-101）が決めた値であり、型やスキーマやDBが保障する前提の試験や誰も気付かない試験はありません。
- Doubts:
  - 冒頭の仕組み注記（.pi/skills/close/scripts/collect.mjs:3）はplan mdのNoのみに読めますが、ex-の出所は詳細注記（.pi/skills/close/scripts/collect.mjs:241,353）で補われているためfindingとしませんでした。

## Acceptance

- Ran: `pnpm test:run` (53 files / 847 tests), `pnpm typecheck`, `pnpm lint`, `pnpm format:check`; the `Verify` greps; `collect.test.ts` 4 tests; the `Added` `other` fixture. Break-and-restore: the `ex-` Triage branch and the normal `- No:` branch both go red; restored.
- Findings: なし
- Doubts: なし
