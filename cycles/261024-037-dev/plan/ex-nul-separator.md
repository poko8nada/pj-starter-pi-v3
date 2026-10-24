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
  - `git diff --stat` が `units.ts` を `Bin 8275 -> 8280 bytes` と表示し、行差分の表示になりません。
    `left: 旧い HEAD の blob 自体に生の NUL が含まれているため、今回の移行差分は旧側を理由に二値扱いになります。歴史の書き換えなしには閉じられません。作業ツリーの両ファイルは NUL が 0 件であること、`git diff --text` で 1 行の正しい変更が見えることを確認しました。次回以降の差分は文章として出ます。`
- Unplanned: なし
- Commit: a3ed5f2 consult(ex-nul-separator): escape NUL separator in sampleOf
- Stopped:

### Cleanup: 見本の重複と定数前提の整理

- Findings:
  - `.pi/extensions/thinking-scrub/scrub/units.test.ts` の `2 単位の周期 → その 2 文` を削りました。`run.period <= 3` の同じ枝を `1 単位の周期 → その 1 文だけ` と確かめるため、1 文と 3 文の違いで分岐を運動させる後者を残しました。
  - `.pi/extensions/thinking-scrub/scrub/units.test.ts` の周期 6 と 12 の試験から `MAX_PERIOD_UNITS` の断定を削りました。`Types` の `64` が既に決める前提の再現のため、振る舞いの確認は周期と長さの断定に残ります。
  - 消えた振る舞いと止めた分岐の試験は見当たりませんでした。見本の実行時は同じ NUL で既存の見本試験が通り、1 行の文字置き換えで分岐は消えていません。
  - 誰も気づかない振る舞い全体の試験は削りませんでした。残りは誤削除や見逃しに直結する境界のため、全体は保ちました。
  - 削除後は `pnpm test:related` 103 件、`pnpm test:run` 882 件、`pnpm typecheck`、`pnpm lint`、`pnpm format:check` がすべて通過しました。
- Unplanned: なし

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
