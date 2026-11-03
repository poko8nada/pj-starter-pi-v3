# PLAN `ex-consult-policy-check`

- Place: worktree
- Boundary Plans: なし（サイクルの plan はすべて終わっている）

## Files

```text
.pi/extensions/consult/
  policy/
    types.test.ts         update
  sub/
    guard.test.ts         update
```

## Slices

## 1. 実物の research と affected.md の許可を検査する

### Types

```ts
なし;
```

### Steps

1. `.pi/extensions/consult/policy/types.test.ts`:
   - update: 実物の `types.json` を読み、`research` の `tools` に `edit`・`quick_edit`・`target_edit`・`write` があり、`paths` が `["cycles/*/affected.md"]` であることを断言する検査を足す。
2. `.pi/extensions/consult/sub/guard.test.ts`:
   - update: `affected.md` のフィクスチャの存在と、`pathAllowed`・`judgeToolCall` の2件を断言する形に直す。

### Verify

- Always:
  - `pnpm test:run`
  - `pnpm typecheck`
  - `pnpm lint`
  - `pnpm format:check`
  - `grep -n 'affected.md' .pi/extensions/consult/policy/types.test.ts .pi/extensions/consult/sub/guard.test.ts`
  - 変更した全ファイルを通読し、矛盾、循環、重複、不足、不自然な流れがないか確かめる。ダメなら直し、`Unplanned` に書く。
- Added: なし

## Notes

### Slice 1: 実物の research と affected.md の許可を検査する

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
