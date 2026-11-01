# PLAN `ex-delete-meaningless-test`

## Files

```text
.pi/extensions/consult/policy/
  types.test.ts           update
```

## Slices

## 1.意味のないテストの削除

### Types

なし

### Steps

1. `.pi/extensions/consult/policy/types.test.ts`:
   - `describe('stored types.json')` の `it('保存した review の指示 → 根拠をつけてくださいを含む')` を削除する。残るテストと import は変えない。

### Verify

- Always:
  - `pnpm test:run`
  - `pnpm typecheck`
  - `pnpm lint`
  - `pnpm format:check`
  - `! grep -rn 'stored types.json' .pi/extensions/consult/policy/types.test.ts` (the command exits 0 when there is no match)
- Added: なし

## Notes

### Slice 1: 意味のないテストの削除

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
