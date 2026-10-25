# PLAN `ex-precompact-now-command`

## Files

```text
.pi/extensions/context-precompact/
  index.ts                 update
  index.test.ts            update
  ui/
    status.ts              update
    status.test.ts         update
```

## Slices

## 1.now-command

### Types

`なし`

### Steps

1. `.pi/extensions/context-precompact/index.ts`:
   - `onCommand` の `now` を `beginPass(deps, ctx)` にして即 return する。`runPass` の await、`precompact: ready ...` の info 通知、`precompact: nothing to prepare` の通知を消す。実行中なら何も出さずに return する。
   - `applyReady` から `notifyApplied` を外す。`refreshStatus` だけで footer に `applied` を出す。`notifyApplied` が他で使われていなければ関数ごと消す。
   - `readSettingsOrNotify` の壊れた settings の通知を `'warning'` にする。
   - `runPass` が他の呼び出しで使われていなければ関数ごと消す。
2. `.pi/extensions/context-precompact/index.test.ts`:
   - 既存の `/precompact now` の case を、deferred の `compactFn` で「`onCommand` が要約を待たずに返り、status が `preparing` になる」ように直す。deferred を解決して `flush` した後、status が `ready` になることも同じ case で確かめる。
   - 既存の apply の case を、`applied` の info 通知ではなく footer の `precompact: applied (X → Y)` を確かめるように直す。
3. `.pi/extensions/context-precompact/ui/status.ts`:
   - `statusText` の `applied` を `precompact: applied (X → Y)` にする。
   - `notifyText` と `notifyType` の `applied` を `undefined` にする。
4. `.pi/extensions/context-precompact/ui/status.test.ts`:
   - 既存の `applied` の case を、`statusText` が applied の文字列、`notifyText` と `notifyType` が `undefined` になるように直す。

### Verify

- Always:
  - `pnpm test:related .pi/extensions/context-precompact/index.ts .pi/extensions/context-precompact/index.test.ts .pi/extensions/context-precompact/ui/status.ts .pi/extensions/context-precompact/ui/status.test.ts`; 関連が無いときは `pnpm test:run`
  - `pnpm typecheck`
  - `pnpm lint`
  - `pnpm format:check`
  - `grep -nE "beginPass|notifyApplied|precompact: applied" .pi/extensions/context-precompact/index.ts .pi/extensions/context-precompact/ui/status.ts` で `beginPass` と `applied` の status があり、`notifyApplied` が無い
- Added: なし

## Notes

### Slice 1: now-command

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
