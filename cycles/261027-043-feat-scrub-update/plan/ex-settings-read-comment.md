# PLAN `ex-settings-read-comment`

## Files

```text
.pi/
  extensions/
    thinking-scrub/
      settings/
        read.ts                update
        read.test.ts
      index.ts
```

## Slices

## 1.comment-clarify

### Types

```ts
なし;
```

### Steps

1. `.pi/extensions/thinking-scrub/settings/read.ts`:
   - 先頭のコメントを、`readSettings` は呼ばれたときにその都度ファイルを読むことと、配線がスキャン時と `message_end` に読むことを分けて書く形に直します。

### Verify

- Always:
  - `pnpm test:related <このスライスで変えたファイル>`。関連が無ければ `pnpm test:run`。
  - `pnpm typecheck`
  - `pnpm lint`
  - `pnpm format:check`
  - `入口は毎回読み直す` を、変えたファイルで大小無視して探し、残っていないこと。
- Added: なし

## Notes

### Slice 1: comment-clarify

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
