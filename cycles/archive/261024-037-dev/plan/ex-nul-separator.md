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
  - なし — `.pi/extensions/thinking-scrub/scrub/units.ts:1` の冒頭注記と `.pi/extensions/thinking-scrub/scrub/units.ts:232` の見本注記を確認し、区切りに触れる古い文言は見当たりませんでした。
- Unlisted:
  - なし — `git diff 534a021..HEAD` の変更は `.pi/extensions/thinking-scrub/scrub/units.ts:248` と `.pi/extensions/thinking-scrub/scrub/units.test.ts:1` の2件に計画書自身を加えたのみで、`cycles/261024-037-dev/plan/ex-nul-separator.md:5` のFilesが名指す2件と一致しました。
- Gaps:
  - なし — `.pi/extensions/thinking-scrub/scrub/units.test.ts:222` の境界試験が生NUL不在を確かめ、`.pi/extensions/thinking-scrub/scrub/units.test.ts:189` と `.pi/extensions/thinking-scrub/scrub/units.test.ts:212` の見本試験が見本選択の不変を確かめ、`.pi/extensions/thinking-scrub/scrub/units.test.ts:178` の上限試験が周期上限を確かめることを確認しました。
- Unproven:
  - なし — `.pi/extensions/thinking-scrub/scrub/units.test.ts:222` は生NULを戻すと赤になり、`.pi/extensions/thinking-scrub/scrub/units.test.ts:212` は周期1の分岐を外すと赤になるため、名指す振る舞いを外しても緑のままになる試験は見当たりませんでした。
- Noise:
  - なし — `.pi/extensions/thinking-scrub/scrub/units.test.ts:222` の `0` と `-1` はStepsが既に決めた値のため所見とせず、削られた断定は `.pi/extensions/thinking-scrub/scrub/units.ts:21` の `64` の再現のため残す必要がなく、`.pi/extensions/thinking-scrub/scrub/units.test.ts:137` の周期と長さの断定が振る舞いを保つことを確認しました。
- Doubts:
  - `cycles/261024-037-dev/plan/ex-nul-separator.md:44` に記されたとおり旧blob側の生NULにより範囲差分が `Bin` と表示される点は歴史の書き換えなしには解消できず、作業ツリーの `grep` と `git diff --text` での `.pi/extensions/thinking-scrub/scrub/units.ts:248` の1行確認をもって閉じるほかないため所見としません。

## Acceptance

- Ran:
  - `pnpm test:related .pi/extensions/thinking-scrub/scrub/units.ts .pi/extensions/thinking-scrub/scrub/units.test.ts` を実施し、5ファイル103件が緑でした。
  - `pnpm typecheck`、`pnpm lint`、`pnpm format:check` を実施し、すべて緑でした。
  - 全体の `pnpm typecheck` と `pnpm test:run`（55ファイル882件）を実施し、すべて緑でした。
  - バイト数で `.pi/extensions/thinking-scrub/scrub/units.ts` と `.pi/extensions/thinking-scrub/scrub/units.test.ts` のNULが0件であることと、`git diff --text` で `.pi/extensions/thinking-scrub/scrub/units.ts:248` の1行変更が見えることを確認しました。
  - 壊し戻し1件：`.pi/extensions/thinking-scrub/scrub/units.ts:248` の `\u0000` を生NULに戻すと境界試験1件が赤（7386と-1の不一致）になり、戻すと103件が緑に戻りました。
- Findings:
  - なし。
- Doubts:
  - `git diff --stat` の `Bin` 表示は旧blob側の生NULによるもので歴史の書き換えなしには解消できないため、`git diff --text` の1行確認をもって閉じます。
