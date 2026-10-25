# PLAN `ex-precompact-edge-tests`

## Files

```text
.pi/extensions/context-precompact/
  settings/
    schema.ts
    schema.test.ts         update
  gate/
    gate.ts
    gate.test.ts           update
  index.ts
  index.test.ts            update
  ui/
    status.ts
    status.test.ts         update
```

## Slices

## 1.edge-tests

### Types

`なし`

### Steps

1. `.pi/extensions/context-precompact/settings/schema.test.ts`:
   - (error) `thresholdRatio: MAX_THRESHOLD_RATIO + Number.EPSILON` → `broken`。`MAX_THRESHOLD_RATIO` は `../settings/constants.ts` から読む。
2. `.pi/extensions/context-precompact/gate/gate.test.ts`:
   - (error) `contextWindow: 0`、`tokens` は非 null → `skip: unknown`。
3. `.pi/extensions/context-precompact/index.test.ts`:
   - (error) `agent_before_settle` で prepared の stamp を現在の branch と変える → draft 無し、フォールバック通知。
4. `.pi/extensions/context-precompact/ui/status.test.ts`:
   - (happy) `discarded` → `statusText` は `undefined`、`notifyText` は `precompact: failed; default compaction will run`、`notifyType` は `warning`。

### Verify

- Always:
  - `pnpm test:related .pi/extensions/context-precompact/settings/schema.ts .pi/extensions/context-precompact/settings/schema.test.ts .pi/extensions/context-precompact/gate/gate.ts .pi/extensions/context-precompact/gate/gate.test.ts .pi/extensions/context-precompact/index.ts .pi/extensions/context-precompact/index.test.ts .pi/extensions/context-precompact/ui/status.ts .pi/extensions/context-precompact/ui/status.test.ts`; 関連が無いときは `pnpm test:run`
  - `pnpm typecheck`
  - `pnpm lint`
  - `pnpm format:check`
  - `grep -nE "MAX_THRESHOLD_RATIO|contextWindow: 0|discarded|stale" .pi/extensions/context-precompact/settings/schema.test.ts .pi/extensions/context-precompact/gate/gate.test.ts .pi/extensions/context-precompact/index.test.ts .pi/extensions/context-precompact/ui/status.test.ts` で新しい case がある
- Added: なし

## Notes

### Slice 1: edge-tests

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
