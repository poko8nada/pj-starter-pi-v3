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

### Round 2

- Stale:
  - なし — Round 1 の `fixed:` 対象ではございませんため、今回の確認範囲として新たな判定は行っておりません。
- Unlisted:
  - なし — Round 1 の `fixed:` 対象ではございませんため、今回の確認範囲として新たな判定は行っておりません。
- Gaps:
  - `scripts/harness/config.test.ts:7` の結合の修正は有効であることを確認しました。
    - fixed: 初回ケースを `testConfig(false)` の呼び出しに戻し、`config.test.exclude` を読んで期待の尾と比べるよう直しました。
    - 根拠: `git diff 2488a9d..HEAD` に `const exclude = testConfig(false).test?.exclude ?? [];`（現行 23 行目）と `expect(exclude.slice(configDefaults.exclude.length)).toEqual(expectedTail);`（現行 32 行目）が現れており、`harnessExcludes` の直呼びとその import は残っておりません。製品 `vitest.config.ts:36` は `exclude: [...configDefaults.exclude, ...harnessExcludes(readList(root))]` であり、検査が製品の `testConfig(false)` を通して除外を読むため、実一覧を除外へ載せる結合が運動されます。検査内の `copy` 14 件は `scripts/harness/harness.json:3〜16` の `copy` と順序まで一致していることを確認しました。
- Unproven:
  - `scripts/harness/config.test.ts:10` の先頭一致の修正は有効であることを確認しました。
    - fixed: 自分自身との比較になっていた先頭一致の断言を落としました。
    - 根拠: `git diff 2488a9d..HEAD` に `expect(exclude.slice(0, configDefaults.exclude.length)).toEqual([...configDefaults.exclude]);` の削除が現れており、現行 `scripts/harness/config.test.ts` に `slice(0,` は残っておりません。残る尾の断言（現行 32 行目）の期待は検査内の `copy` から自前で組み立てており、製品の `harnessExcludes` を呼んでおりません。
- Noise:
  - `scripts/harness/config.test.ts:20〜21` の冗長の修正は有効であることを確認しました。
    - fixed: 全体一致で定まる `toContain` の 2 件を落としました。
    - 根拠: `git diff 2488a9d..HEAD` に `expect(exclude).toContain(first);` と `expect(exclude).toContain(`${first}/**`);` の削除が現れており、現行 `scripts/harness/config.test.ts` に `toContain` は残っておりません。残る尾の全体一致（現行 32 行目）の期待先頭は `copy[0]` と `copy[0]/**` であり、全体一致が成り立てば包含は定まります。
- Doubts:
  - 先頭一致を落としたことで既定値の保持の明示的な断言は無くなりましたが、製品が既定値を壊せば尾の切り出し位置がずれて尾の全体一致が赤になるため、所見に留めます。
  - 「壊せば赤になること」の再実行は、本レビューでは行っておりません。コードを変更しない制約のため、`git diff 2488a9d..HEAD` と製品コードの静的な照合による判断でございます。

## Acceptance

- Ran:
  - `pnpm test:run` → 54 ファイル / 766 ケース緑
  - `pnpm typecheck` → root: ok、`.pi`: ok
  - `pnpm lint` → 緑
  - `pnpm format:check` → 緑
  - 「振る舞いを壊す」を 1 件試した。
    - `vitest.config.ts` の `testConfig` から `harnessExcludes(readList(root))` を外す → 「false の一覧 → copy の各道から除外の glob を作る」が赤。戻して緑を確認。
- Findings: なし
- Doubts:
  - `testConfig` は内側で実リポジトリの `harness.json` を読む。結線を試すと `harness.json` を変えた時にこのテストが赤くなる。完全に切り離すには `testConfig` に一覧を渡す口が要り、それは製品の変更なので、この plan ではやらない。
