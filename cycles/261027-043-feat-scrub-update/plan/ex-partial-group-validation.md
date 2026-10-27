# PLAN `ex-partial-group-validation`

## Files

```text
.pi/
  extensions/
    thinking-scrub/
      settings/
        schema.ts
        schema.test.ts          update
```

## Slices

## 1.partial-group-cases

### Types

```ts
なし;
```

### Steps

1. `.pi/extensions/thinking-scrub/settings/schema.test.ts`:
   - (happy) `{ "live": { "scanEvery": 3000 } }` を渡した場合 → `ok` になり、`tail` は既定値の `20000` になる。
   - (error) `{ "live": { "scanEvery": 30000 } }` を渡した場合 → `broken` になり、理由は `live.scanEvery` と `live.tail` の関係を示す。
   - (error) `{ "live": { "tail": 1000 } }` を渡した場合 → `broken` になり、理由は `live.scanEvery` と `live.tail` の関係を示す。
   - (error) `{ "char": { "minPeriod": 200 } }` を渡した場合 → `broken` になり、理由は `char.minPeriod` と `char.maxPeriod` の関係を示す。
   - (error) `{ "char": { "maxPeriod": 2 } }` を渡した場合 → `broken` になり、理由は `char.minPeriod` と `char.maxPeriod` の関係を示す。

### Verify

- Always:
  - `pnpm test:related <このスライスで変えたファイル>`。関連が無ければ `pnpm test:run`。
  - `pnpm typecheck`
  - `pnpm lint`
  - `pnpm format:check`
  - `scanEvery` と `minPeriod` の検証の説明に古い表現がないことを、変えたファイルで大小無視して探し、残っていないこと。
- Added: なし

## Notes

### Slice 1: partial-group-cases

- Findings:
- Unplanned:
- Commit:
- Stopped:

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
