# PLAN `ex-readme-exclude-wording`

- Place: worktree
- Boundary Plans: なし

## Files

```text
README.md         update
README.ja.md      update
```

## Slices

## 1.設定ファイルのパスまで書く

### Types

なし

### Steps

1. `README.md`:
   - update: japanese-check の 1 行を、`exclude` の後ろに設定ファイルのパスが続く形に書き換える（行は増やさない）。文は「counts, and skips the paths listed in `exclude` in `scripts/checks/ja-check.json`.」で終わる。
2. `README.ja.md`:
   - update: japanese-check の 1 行を、`exclude` の前に設定ファイルのパスが来る形に書き換える（行は増やさない）。文は「`scripts/checks/ja-check.json` の `exclude` に書いたパスは検査しない。」で終わる。

### Verify

- Always:
  - `pnpm test:run`（このスライスに関連するテストはない）
  - `pnpm typecheck`
  - `pnpm lint`
  - `pnpm format:check`
  - `grep` ツールで `scripts/checks/ja-check.json` を `README.md` と `README.ja.md` から検索し、それぞれ 1 件であることを確かめる。
  - 変更したすべてのファイルを通読し、矛盾、循環、重複、不足、不自然な流れがないか確かめる。
- Added: なし

## Notes

### Slice 1: 設定ファイルのパスまで書く

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
