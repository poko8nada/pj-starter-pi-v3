# PLAN `ex-writepatch-custom-values`

## Files

```text
.pi/
  extensions/
    thinking-scrub/
      index.ts
      index.test.ts            update
```

## Slices

## 1.custom-keys-kept

### Types

```ts
なし;
```

### Steps

1. `.pi/extensions/thinking-scrub/index.test.ts`:
   - (happy) 独自のトップレベルキーと独自の `live` 内キーを持つ `settings.json` に `command off` を当てた場合 → 完全なファイルに独自キーが残り、`enabled` が `false` になる。
   - (happy) 独自キーを持つ `settings.json` に `command on` を当てた場合 → 完全なファイルに独自キーが残り、`enabled` が `true` になる。

### Verify

- Always:
  - `pnpm test:related <このスライスで変えたファイル>`。関連が無ければ `pnpm test:run`。
  - `pnpm typecheck`
  - `pnpm lint`
  - `pnpm format:check`
  - `writePatch` と `mergeGroup` と独自キーの説明に古い表現がないことを、変えたファイルで大小無視して探し、残っていないこと。
- Added: なし

## Notes

### Slice 1: custom-keys-kept

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
