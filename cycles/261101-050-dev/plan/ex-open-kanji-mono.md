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

- Findings: なし
- Unplanned: なし
- Commit: 22e612c
- Stopped:

## Work Review

### Round 1

- Stale: なし — 差分は `.pi/skills/design/references/format.md:22,52` の2行のみで、他に `<外の物>` を写す現行文書・コメント・テストは無い（残存は `cycles/261101-050-dev/close.md:29` 等の履歴記録の引用のみ）。
- Unlisted: なし — `git diff 0b6a229..HEAD` の変更は `cycles/261101-050-dev/plan/ex-open-kanji-mono.md:5` の Files の `update` 1件と一致する。
- Gaps: なし — `cycles/261101-050-dev/plan/ex-open-kanji-mono.md:33-34` の grep（旧表記の残存確認）と Added の差分読み（形式名詞のみ・複合語不変・見出し構造不変）は2行差分で直接確かめられ、同サイクル文書の代表にも形式名詞の `物` の残存は無い。
- Unproven: なし — テストファイルの手順が無く、唯一の機械的検査である `cycles/261101-050-dev/plan/ex-open-kanji-mono.md:33` の grep は旧表記が残れば赤になる。
- Noise: なし — テスト手順が無いため `## Test cases` で裁く対象が無く、grep の文字列は plan が決めた値である。
- Doubts: なし

## Acceptance

- Ran: `pnpm test:run` (62 files, 787 tests), `pnpm typecheck`, `pnpm lint`, `pnpm format:check`; the diff read of the 2 changed lines
- Findings: なし
- Doubts: なし
