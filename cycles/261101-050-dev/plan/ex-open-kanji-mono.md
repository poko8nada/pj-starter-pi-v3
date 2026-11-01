# PLAN `ex-open-kanji-mono`

## Files

```text
.pi/skills/design/
  references/
    format.md             update
```

## Slices

## 1.物をものに開く

### Types

なし

### Steps

1. `.pi/skills/design/references/format.md`:
   - `<外の物>` を `<外のもの>` に直す。`本物`、`偽物`、`物差し` などの語は変えない。
2. the other documents this cycle changed:
   - `物` を `もの` に直すのは、形式名詞のときだけである。`本物`、`偽物`、`物差し` などの語は変えない。見つけたファイルは `## Notes` の `Unplanned` に書く。

### Verify

- Always:
  - `pnpm test:run`
  - `pnpm typecheck`
  - `pnpm lint`
  - `pnpm format:check`
  - `! grep -rn '<外の物>' .pi/skills/design/references/format.md` (the command exits 0 when there is no match)
- Added: the agent reads the diff for: the `物` → `もの` only where it is the formal noun; the `本物`、`偽物`、`物差し` and the other words unchanged; the headings and the structures unchanged

## Notes

### Slice 1: 物をものに開く

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
