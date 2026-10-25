# PLAN `ex-entry-config-input`

## Files

```text
.pi/
  extensions/
    sound-notify/
      index.test.ts        update
```

## Slices

## 1.入口の設定

### Types

なし

### Steps

1. `.pi/extensions/sound-notify/index.test.ts`:
   - 入口のケースで `extensionDefault` を呼ぶのをやめ、`registerSoundHandlers` に `defaultConfig` を渡す。実物の `config.json` を読まない。
   - (happy) 登録した `session_compact` のハンドラを呼ぶ → `sounds.compact` の音が 1 回。

### Verify

- Always:
  - 既定の 5 つ
- Added: なし

## Notes

### Slice 1: 入口の設定

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
