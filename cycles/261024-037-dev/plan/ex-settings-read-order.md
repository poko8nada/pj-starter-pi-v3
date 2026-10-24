# PLAN `ex-settings-read-order`

## Files

```text
.pi/extensions/thinking-scrub/
  index.ts               update
  index.test.ts          update
```

## Slices

## 1.read-port

### Types

```ts
export interface WiringOptions {
  readonly settingsDir: string;
  readonly now: () => number;
  readonly followUp: (content: string) => void;
  readonly readSettings: () => SettingsRead;
}
```

### Steps

1. `.pi/extensions/thinking-scrub/index.ts`:
   - `WiringOptions` に `readSettings: () => SettingsRead` を足す。
   - `readEnabled` と `readShow` を、`options.readSettings()` の結果から読む形にする。
   - 既定の export で `readSettings: () => readSettings(options.settingsDir)` を渡す。
   - `settingsDir` は書き込み（`writeSettings`）のために残す。
   - `handleCommand` の設定読み込みも port に置き換える。
2. `.pi/extensions/thinking-scrub/index.test.ts`:
   - `createScrubWiring` の呼び出しすべてに `readSettings` を渡す。既存の設定ファイルを使う試験は、本物の `readSettings(dir)` を渡す。
   - (happy) `MIN_THINKING` 未満の `onMessageUpdate` → 偽の `readSettings` の呼び出しが 0 回。
   - (happy) `MIN_THINKING` 以上の `onMessageUpdate` → 1 回。
   - (happy) `enabled: false` の偽の `readSettings` → abort 無し。
   - (boundary) `onMessageEnd` は 1 回の `message_end` で 1 回読む。
   - (happy) 既存の設定・報告・コマンドの試験はそのまま通る。

### Verify

- Always:
  - `pnpm test:related .pi/extensions/thinking-scrub/index.ts .pi/extensions/thinking-scrub/index.test.ts`; 関連が無いときは `pnpm test:run`
  - `pnpm typecheck`
  - `pnpm lint`
  - `pnpm format:check`
  - `grep -n "readSettings" .pi/extensions/thinking-scrub/index.ts` でポートがある
- Added: なし

## Notes

### Slice 1: read-port

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
