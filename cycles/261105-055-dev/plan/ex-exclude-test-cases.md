# PLAN `ex-exclude-test-cases`

- Place: worktree
- Boundary Plans: なし

## Files

```text
scripts/checks/ja-check.test.ts   update
```

## Slices

## 1.excludeの事例を1か所にまとめ、`./` 付きの事例を足す

### Types

なし

### Steps

1. `scripts/checks/ja-check.test.ts`:
   - update: `describe('ja-check exclude')` の中で、既存の happy 4 件の直後に、`./` 付きの事例を置く。
   - update: (happy) excludeがROADMAP.mdで引数が./ROADMAP.md → 報告せずexit 0
   - update: `exclude` の検証 3 件（`(error) excludeのない設定`、`(error) excludeが配列でない設定`、`(error) excludeの要素が文字列でない設定`）を `describe('ja-check exclude')` の末尾に移し、2 つ目の `describe('ja-check')` から消す。
   - update: (error) `exclude` のない設定 → header の 2 行を出して exit 1
   - update: (error) `exclude` が配列でない設定 → header の 2 行を出して exit 1
   - update: (error) `exclude` の要素が文字列でない設定 → header の 2 行を出して exit 1

### Verify

- Always:
  - `pnpm test:related scripts/checks/ja-check.test.ts`
  - `pnpm typecheck`
  - `pnpm lint`
  - `pnpm format:check`
  - `grep` ツールで `describe(` を `scripts/checks/ja-check.test.ts` から検索し、`describe('ja-check exclude')` の行から次の `describe(` の行までの間に `it(` が 7 件あり、その並びが happy 5 件のあとに error 3 件であることを確かめる。
  - 変更したすべてのファイルを通読し、矛盾、循環、重複、不足、不自然な流れがないか確かめる。
- Added: なし

## Notes

### Slice 1: excludeの事例を1か所にまとめ、`./` 付きの事例を足す

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
