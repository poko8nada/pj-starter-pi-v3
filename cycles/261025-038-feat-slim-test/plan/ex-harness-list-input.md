# PLAN `ex-harness-list-input`

## Files

```text
scripts/
  harness/
    config.test.ts     update
```

## Slices

## 1.一覧の入力

### Types

なし

### Steps

1. `scripts/harness/config.test.ts`:
   - `readList(root)` で実リポジトリの `harness.json` を読むのをやめ、テストの中で一覧を組んで `harnessExcludes` に渡す。期待は渡した `copy` から組む。
   - (happy) `false` の一覧 → `copy` の各道から除外の glob を作る。
   - (happy) `true` の一覧 → 除外が無い。
   - (happy) 両方とも既定値を埋める。

### Verify

- Always:
  - 既定の 5 つ
- Added: なし

## Notes

### Slice 1: 一覧の入力

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
