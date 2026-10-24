# PLAN `ex-nul-separator`

## Files

```text
.pi/extensions/thinking-scrub/
  scrub/
    units.ts             update
    units.test.ts        update
```

## Slices

## 1.escape-separator

### Types

なし

### Steps

1. `.pi/extensions/thinking-scrub/scrub/units.ts`:
   - `sampleOf` のキーの `join` の区切りを、生の NUL バイトから 6 文字のエスケープ `\u0000` に直す。実行時の文字列は同じ NUL。
   - 見本の選択は変えない。
2. `.pi/extensions/thinking-scrub/scrub/units.test.ts`:
   - 既存の見本の試験はそのまま通る。
   - (boundary) `units.ts` に生の NUL が無いことを、ソースを読む試験で確かめる。`fs.readFileSync` の `indexOf(0)` が -1。

### Verify

- Always:
  - `pnpm test:related .pi/extensions/thinking-scrub/scrub/units.ts .pi/extensions/thinking-scrub/scrub/units.test.ts`; 関連が無いときは `pnpm test:run`
  - `pnpm typecheck`
  - `pnpm lint`
  - `pnpm format:check`
  - `grep -P "\x00" .pi/extensions/thinking-scrub/scrub/units.ts` が何も返さない
  - `git diff` が `Bin` ではなく行を出す（worktree のディフで確認）
- Added: なし

## Notes

### Slice 1: escape-separator

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
