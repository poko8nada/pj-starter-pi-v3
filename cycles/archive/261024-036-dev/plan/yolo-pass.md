# PLAN `yolo-pass`

- No: 03

## Files

```text
.pi/skills/
  yolo/
    SKILL.md              update
  work/
    SKILL.md              update
  design/
    SKILL.md              update
    references/
      format.md           update
```

## Slices

## 1.yolo

### Types

なし

### Steps

1. `.pi/skills/yolo/SKILL.md`:
   - The work stage passes the `Added` owner look (front cmux-browser, base slice).
   - The base plan is not used; every plan is a worktree.
   - Remove the stop condition "a plan's `Added` check needs the owner's look".
   - The description's "or earlier when a check needs the owner" becomes "and passes the `Added` owner check".

### Verify

- Always:
  - `pnpm test:related .pi/skills/yolo/SKILL.md`; `pnpm test:run` if nothing is related
  - `pnpm typecheck`
  - `pnpm lint`
  - `pnpm format:check`
  - `grep -n "Added. check needs the owner" .pi/skills/yolo/SKILL.md` returns なし
  - `grep -n "passes the .Added. owner look\\|every plan is a worktree\\|passes the .Added. owner check" .pi/skills/yolo/SKILL.md` has the new rule
- Added:
  - base — the owner reads the slice's change; their OK closes it.
  - other — the agent reads `yolo` / `work`; the pass is in the text and a front plan run has no owner stop.

## 2.work

### Types

なし

### Steps

1. `.pi/skills/work/SKILL.md`:
   - The `Added` owner check has a yolo exception: yolo passes it; the agent's check is in `Acceptance`.
   - The normal flow keeps the owner's OK.

### Verify

- Always:
  - `pnpm test:related .pi/skills/work/SKILL.md`; `pnpm test:run` if nothing is related
  - `pnpm typecheck`
  - `pnpm lint`
  - `pnpm format:check`
  - `grep -n "yolo.*Acceptance\\|yolo.*passes the .Added." .pi/skills/work/SKILL.md` has the exception
- Added:
  - base — the owner reads the slice's change.
  - other — the agent reads `work`; the exception is in the text.

## 3.design

### Types

なし

### Steps

1. `.pi/skills/design/SKILL.md`:
   - Step 6's `Where`: a yolo plan is worktree; the base condition does not apply.
   - The default worktree stays for the normal flow.

### Verify

- Always:
  - `pnpm test:related .pi/skills/design/SKILL.md`; `pnpm test:run` if nothing is related
  - `pnpm typecheck`
  - `pnpm lint`
  - `pnpm format:check`
  - `grep -in "a yolo plan is worktree; the base condition does not apply" .pi/skills/design/SKILL.md` has the line
- Added:
  - base — the owner reads the slice's change.
  - other — the agent reads `design`; the line is in the text.

## Notes

### Slice 1: yolo

- Findings: なし
- Unplanned: なし
- Commit: `3847f23103f2f452ff4f2047f9aa8aa838b3afb8`

### Slice 2: work

- Findings: なし
- Unplanned: なし
- Commit: `fc826787df013cd0b953fd1d6bb9091816253b23`

### Slice 3: design

- Findings: なし
- Unplanned: なし
- Commit: `17c648104252de704ea4ae3040b1c184dbd32ccc`

### Cleanup: なし

- Findings: なし
- Unplanned: なし

## Review

### Round 1

- Stale:
  - `.pi/skills/design/references/format.md:95` — design/SKILL.md の Where に yolo 例外が入ったため、base 条件のみを述べる同文が古くなりました。
    - fixed: added "A yolo plan is worktree; the base condition does not apply." to `## Where`; `design/references/format.md` is in `Files`.
- Unlisted: なし
- Gaps: なし
- Unproven: なし
- Noise: なし
- Doubts: なし

### Round 2

- Stale:
  - `.pi/skills/design/references/format.md:95` — fixed confirmed: `## Where` に yolo 例外の一文が `references/format.md:96` にあり、`design/SKILL.md:59` の同文と一致することを確認しました。`Files` には `design/references/format.md update` が含まれており、Stale は解消されています。
- Unlisted: なし（Round 1 に fixed 行なし。確認対象なし）
- Gaps: なし（Round 1 に fixed 行なし。確認対象なし）
- Unproven: なし（Round 1 に fixed 行なし。確認対象なし）
- Noise: なし（Round 1 に fixed 行なし。確認対象なし）
- Doubts: なし

## Acceptance

- Ran: `pnpm test:run` (52 files / 843 tests), `pnpm typecheck`, `pnpm lint`, `pnpm format:check`; the `Verify` greps; the owner read each slice; the agent read the changed `yolo` / `work` / `design` text.
- Findings: なし
- Doubts: なし
