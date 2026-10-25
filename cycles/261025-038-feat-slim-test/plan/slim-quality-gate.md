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
   - (boundary) `git check-ignore` が非 0（1 と 128）で、無視されたパスの出力があっても → 除外なし（道は pnpm に届く）。
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

- Findings: なし
- Unplanned: なし
- Commit: 4aad691d43869298fc6e2074544235571e519718
- Stopped:

### Cleanup: 重複・不要テストの点検

- 落とすものなし。3 ファイルの各テストは plan の Steps と 1 対 1に対応し、重複・消えた振る舞い・止まった分岐・型が保証する前提のいずれにも当たらない。

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

- Stale: なし — checks.tsとreport.tsとtargets.tsおよびREADMEを確認し、今回の変更で古くなる文書や注釈は見つかりませんでした。
- Unlisted: なし — 差分が触れたのはFilesに挙げられた3件のテストとplanのNotes記入のみであることを確認しました。
- Gaps: なし — Stepsの全ての事例が各テストに対応し、VerifyのAddedがなしであることと合わせて、検査が覆わない振る舞いは見つかりませんでした。
- Unproven: なし — 偽のexecの分岐や見出しの1行目比較などを変異させても赤になることを読みで確かめ、緑のまま残る断言は見つかりませんでした。
- Noise: なし — 型や定数で定まる前提の再掲や、魔数と直書きの期待値で書かれた事例は残っていないことを確認しました。
- Doubts: なし — いずれも所見に当たらないため、残す覚書はありません。

## Acceptance

- Ran:
  - `pnpm test:run` → 55 ファイル / 871 ケース緑（acceptance の修正の後、やり直した）
  - `pnpm typecheck` → root: ok、`.pi`: ok
  - `pnpm lint` → 緑
  - `pnpm format:check` → 緑
  - 「振る舞いを壊す」を 3 件試した。
    - `prepareTargets` の非 0 の分岐を `checked: []` にする → 修正の前は「typecheck は拡張子で絞らない」と「format は md を渡し、lint は md を渡さない」の 2 件だけが赤で、狙った「非 0 でも除外なし」は緑のままだった。修正の後にもう一度同じ壊し方をして、3 件とも赤になることを確かめた。戻して緑を確認。
    - `runChecks` で fix 相の結果も `outcomes` に入れる → 「fix 相だけが失敗しても verify 相の結果はすべて成功」が赤。戻して緑を確認。
    - `filterByExtensions` の `toLowerCase()` を外す → 「大文字の拡張子も通す」が赤。戻して緑を確認。
- Findings:
  - `.pi/extensions/quality-gate/checks.test.ts:156` の「git check-ignore が非 0 でも無視されたパスの出力があれば除外なし」は、`checked` を空にしても緑のままです。`skipped` が空で、git に道を渡すことしか見ていないためです。道が pnpm に届くことまで見る必要があります。
    - fixed: 非 0 の境目の事例で、pnpm の呼び出しのどれかに道が渡ること（`fake.calls` の `pnpm` の引数にその道が含まれること）を足し、Steps の文も「非 0 でも除外なし（道は pnpm に届く）」に合わせた。
- Doubts:
