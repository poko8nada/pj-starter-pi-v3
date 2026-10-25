# PLAN `slim-quality-gate`

- No: 01

## Files

```text
.pi/
  extensions/
    quality-gate/
      checks.test.ts       update
      report.test.ts       update
      targets.test.ts      update
```

## Slices

## 1.検査と報告の仕様

### Types

なし

### Steps

1. `.pi/extensions/quality-gate/checks.test.ts`:
   - 偽の `exec` はスクリプトごとに終了符号と stdout・stderr を返せるようにし、fix 相だけを赤にできるようにする。期待する出力は偽が返した値から取る。
   - `toRelative` の期待値は、cwd と `join(cwd, name)` から取る。
   - (happy) `toRelative` は cwd からの相対を返す。
   - (empty) `toRelative` は cwd 自身のとき、元のパスを返す。
   - (error) 削除済みのファイルは `skipped` に入り、pnpm に渡らない。
   - (empty) 全部が削除済み → git を打たず、全部が `skipped`。
   - (error) `.gitignore` の対象は `skipped` に入り、pnpm に渡らない。
   - (boundary) `git check-ignore` が非 0（1 と 128）で、無視されたパスの出力があっても → 除外なし。
   - (happy) typecheck は拡張子で絞らず、md も pnpm に渡る。
   - (happy) format は md を渡し、lint は md を渡さない。
   - (empty) 対象の拡張子が無いファイルだけ → 拡張子で絞るチェックは打たず、残る 1 件だけを返す。
   - (error) pnpm が失敗 → `failed` になり、`output` は偽が返した stdout と stderr を改行でつないだもの。
   - (happy) fix 相だけが失敗する → `outcomes` はすべて成功。
   - 落とす: 「CHECK_SPECS の順に打つ」（内部の表の写しで、変えても誰も気づかない）。
   - 落とす: 「`--no-error-on-unmatched-pattern` が付く」（内部の表の写し）。
   - 落とす: 「fix 相は outcomes に入れない」「fix 相が失敗しても verify だけを返す」の 2 本（上の「fix 相だけが失敗する」が 1 本で押さえる）。
   - 落とす: 「git check-ignore が 1」「同 128」の 2 本（上の非 0 のケースに畳む）。
   - 落とす: 「ディレクトリの中も対象にできる」（平坦なファイルと同じ道を通り、壊れ方に差が無い）。
2. `.pi/extensions/quality-gate/report.test.ts`:
   - 期待する値は、渡した `outcomes` の `label` と `output`、`relativePaths`、`skippedPaths`、`attempt` と `maxAttempts` から取る。
   - 見出しは 1 行目だけを取り出して比べる。
   - (happy) 失敗したチェックの `label` と試行回数が、1 行目に出る。
   - (happy) 失敗したチェックが複数 → 1 行目にその `label` が全部並ぶ。
   - (error) 成功したチェックの `label` は 1 行目に出ない。
   - (happy) 成功したチェックには空でない `output` を渡しても、その節に `output` は出ない。
   - (happy) 失敗したチェックの節に、その `output` が出る。
   - (happy) `skippedPaths` のパスが出る。
   - (empty) 出力が空の失敗 → 空である旨の印が出る。
   - (empty) `relativePaths` が空 → 触った物が無い旨の印が出る。
   - (happy) `relativePaths` があるときは、その印を出さない。
   - (boundary) 行数の上限を超える出力と、バイト数の上限を超える出力 → どちらも切り詰めた印が出る。上限以内なら印が出ない。
   - (happy) 見出し、触った物、本文、指示の順に並ぶ。
   - 落とす: 「最後は代替文面を出す」「最後でなければまた走ると出す」「弱めるな消すなの文面を入れる」の 3 本（製品の文面の写しで、変わっても誰も気づかない）。
   - 落とす: 「最後の試行は final と出す」（同上。試行回数は 1 行目のケースが押さえる）。
   - 移す: 「format は md と json を通す」「大文字の拡張子も通す」の 2 本は `targets.test.ts` へ。試しているのは `targets.ts` の `filterByExtensions`。
3. `.pi/extensions/quality-gate/targets.test.ts`:
   - porcelain の入力と期待するパスの一覧を表にし、断言は表の値から取る。
   - (happy) `parseStatus` は XY とパスを取り出し、未追跡も拾う。
   - (happy) `parseStatus` は空白を含むパスを壊さない。
   - (happy) `parseStatus` は rename の元のパスを読み飛ばす。
   - (empty) `parseStatus` は空の出力 → 空の配列。
   - (happy) `changedSince` は新しく現れたパスを返す。
   - (happy) `changedSince` は既に dirty なファイルの再編集を拾う。
   - (empty) `changedSince` は変わらなければ空。
   - (happy) `changedSince` は消えたパスを返さない。
   - (error) `fingerprint` は存在しないパスを入れない（`statSync` の例外で落ちない）。入力は `join(tempDir(), 名前)` で作る。
   - (happy) `fingerprint` は存在するファイルに `mtime:ctime:size` の指紋を付ける。
   - (happy) `filterByExtensions` は format で md と json を通し、lint で ts だけを通す。
   - (happy) `filterByExtensions` は拡張子の大文字も通す。
   - 落とす: 「存在するファイルは指紋を持つ」のうち、`/no-such-file-quality-gate` という文字列の道を使う側（`tempDir()` から作る側を残す）。
   - 落とす: 「未追跡も拾う」の独立したケース（上の表に畳む）。

### Verify

- Always:
  - 既定の 5 つ
- Added: なし

## Notes

### Slice 1: 検査と報告の仕様

- Findings:
- Unplanned:
- Commit:
- Stopped:

## Review

### Plan review

- `slim-quality-gate.md:37` 「対象の拡張子が無いファイルだけ → どの pnpm にも渡らない」は事実と違います。typecheck は拡張子で絞らず、md も png も渡ります。
  - fixed: 「拡張子で絞るチェックは打たず、残る 1 件だけを返す」に直した。
- `:34` 非 0 のケースは `ignoredStdout` が空なので、分岐を外しても緑のままでした。
  - fixed: 非 0 で無視されたパスの出力があるケースに直した。
- `:47` `:48` `:49` 見出しの断言が全文の `toContain` で、見出しから欠けても本文で緑になりました。
  - fixed: 見出しは 1 行目だけを取り出して比べると書き、複数の `label` が 1 行目に全部並ぶことも足した。
- `:50` 成功したチェックの `output` が空なので、省略を外しても差が出ませんでした。
  - fixed: 空でない `output` を渡すケースに直した。
- `:46` `skippedPaths` と試行回数が導出元に入っていませんでした。
  - fixed: `skippedPaths` と `attempt`・`maxAttempts` を導出元に足した。
- `:71` 直書きの道を使う側を残し、`tempDir()` から作る側を落としていました。
  - fixed: `tempDir()` から作る側を残し、文字列の側を落とすことにした。
- `:40` 入れ子のディレクトリは平坦なファイルと同じ道を通り、壊れ方に差がありません。
  - fixed: そのケースを落とすことにした。
- `report.test.ts:20-30` の 2 件は `targets.ts` の `filterByExtensions` を試しており、どの step にも現れていませんでした。
  - fixed: `targets.test.ts` の step に移し、2 ケースとして書いた。
- `report.test.ts:131` のバイト数の上限が、どの step にも現れていませんでした。
  - fixed: 境目のケースを、行数とバイト数の両方の上限に広げた。
- `:39` の「fix 相だけが失敗する」に、相ごとの制御がありませんでした。
  - fixed: 偽の `exec` がスクリプトごとに終了符号を返すと書き足した。

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
