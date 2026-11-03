# PLAN `ex-plan-outside`

- Place: worktree
- Boundary Plans: なし（サイクルの plan はすべて終わっている）

## Files

```text
.pi/skills/plan/references/
  format.md               update
```

## Slices

## 1. `Outside:` の項目の出どころを定める

### Types

```ts
なし;
```

### Steps

1. `.pi/skills/plan/references/format.md`:
   - update: `## Shape` と `## Slices` の「the `Boundary.External` item」を、`affected.md` の `### External` の項目に直す。

### Verify

- Always:
  - `pnpm test:run`
  - `pnpm typecheck`
  - `pnpm lint`
  - `pnpm format:check`
  - `! grep -n 'Boundary.External' .pi/skills/plan/references/format.md`
  - `grep -n '### External' .pi/skills/plan/references/format.md`
  - 変更した全ファイルを通読し、矛盾、循環、重複、不足、不自然な流れがないか確かめる。ダメなら直し、`Unplanned` に書く。
- Added: なし

## Notes

### Slice 1: `Outside:` の項目の出どころを定める

- Findings:
- Unplanned:
- Commit:
- Stopped:

## Work Review

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
