# PLAN `ex-ja-test-names`

## Files

```text
scripts/
  checks/
    ja-check.test.ts         update
```

## Slices

## 1.テスト名の日本語化

### Types

```ts
なし;
```

### Steps

1. `scripts/checks/ja-check.test.ts`:
   - 15 件の `it` の名称を日本語に直し、期待値と振る舞いは変えない。

### Verify

- Always:
  - `pnpm test:related scripts/checks/ja-check.test.ts`
  - `pnpm typecheck`
  - `pnpm lint`
  - `pnpm format:check`
- Added:
  - `pnpm test:related scripts/checks/ja-check.test.ts` が 15 件すべて通過する。
  - 15 件の `it` の名称に英語の文が残っていないことを確かめる。

## Notes

### Slice 1: テスト名の日本語化

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
