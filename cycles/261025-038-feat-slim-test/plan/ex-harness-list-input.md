# PLAN `ex-harness-list-input`

## Files

```text
scripts/
  harness/
    config.test.ts     update
```

## Slices

## 1.一覧の入力

### Types

なし

### Steps

1. `scripts/harness/config.test.ts`:
   - `readList(root)` で実リポジトリの `harness.json` を読むのをやめ、テストの中で一覧を組んで `harnessExcludes` に渡す。期待は渡した `copy` から組む。
   - (happy) `false` の一覧 → `copy` の各道から除外の glob を作る。
   - (happy) `true` の一覧 → 除外が無い。
   - (happy) 両方とも既定値を埋める。

### Verify

- Always:
  - 既定の 5 つ
- Added: なし

## Notes

### Slice 1: 一覧の入力

- Findings: なし
- Unplanned: なし
- Commit: 39081f4
- Stopped: なし

## Review

### Round 1

- Stale:
  - なし — scripts/harness/config.test.ts:4 の import 切替と vitest.config.ts:22・scripts/harness/list.mjs:11 の注釈が実態とずれないことを確かめました。
- Unlisted:
  - なし — git diff 2488a9d..HEAD の 1 件が ## Files の scripts/harness/config.test.ts と一致することを確かめました。
- Gaps:
  - scripts/harness/config.test.ts:7 の初回ケースが testConfig を呼ばず scripts/harness/list.mjs:15 の harnessExcludes を直呼びするため vitest.config.ts:36 の testConfig(false) が実一覧を除外へ載せる結合がどの検査でも運動されません。
    - fixed: 初回ケースを testConfig(false) の呼び出しに戻し、config.test.exclude を読んで期待の尾と比べるよう直しました。
- Unproven:
  - scripts/harness/config.test.ts:10 の先頭一致の断言は scripts/harness/config.test.ts:9 で検査自らが組んだ exclude を確かめるだけのため製品の既定値の載せ方が壊れても緑のままです。
    - fixed: 自分自身との比較になっていた先頭一致の断言を落としました。
- Noise:
  - scripts/harness/config.test.ts:20〜21 の toContain は scripts/harness/config.test.ts:19 の全体一致で既に定まるため外しても誰も気づきません。
    - fixed: 全体一致で定まる toContain の 2 件を落としました。
- Doubts:
  - scripts/harness/config.test.ts:6 の describe が testConfig のままなのは初回ケースも false の振る舞いを表すため所見に留めます。
    - left: 初回ケースも testConfig(false) の振る舞いを表すため、describe は変えない。

## Acceptance

- Ran:
- Findings:
- Doubts:
