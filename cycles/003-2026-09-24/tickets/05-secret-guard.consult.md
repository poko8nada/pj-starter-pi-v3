# secret-guard.consult

Acceptance: 子の `read` は拒否され、子は「読めない」と報告する。親の `.env` の中身は変わらない

## Todo

- `.pi/extensions/consult/spec.ts`
  - `buildPiArgs` に `-e <child-guard.ts の絶対パス>` を足す — 子にだけ guard を読ませる。パスは `EXTENSION_DIR` と同じ形で `import.meta.url` から組む
- `.pi/extensions/consult/spec.test.ts`
  - `buildPiArgs`: 引数に `-e` と guard の絶対パスが入る（配列そのものを比較） (happy)
  - `buildPiArgs`: `-e` が 1 回だけ入る（重複しない） (happy)
  - `buildPiArgs`: `--tools` の**後**に入る（pi の引数順で問題が出ない位置） (happy)
  - `buildPiArgs`: guard のパスが空文字なら投げる（空の `-e` を渡さない） (error)
  - `buildPiArgs`: `--tools` が空配列でも `-e` の位置が崩れない (happy)
  - 観点（null / 空 / 境界 / 不正 / 権限 / 2 回目 / 並行）→ 引数を組む純関数なので、入ってくるのは文字列と配列だけ — ケース無し
  - 親の起動 → `buildPiArgs` は子の引数を組む関数で、親は通らない（親の設定を変えない、が構造として成り立つ）— ケース無し
  - 未知の type 名 → この関数は type を検証しない（`resolveType` の仕事。002 の step 1 が持つ）— ケース無し
  - 権限 → 引数に権限の情報は入らない — ケース無し
  - 2 回目 / 並行 → 純関数（引数を組むだけ）— ケース無し
- `run.test.ts`
  - 子の起動引数（`piArgs`）に guard の `-e` が入っている（配列そのもの） (happy)
  - その子が `.env` を読もうとすると、返答に「読めない」が出て値が出ない (error)

## Verify

- `pnpm test:run` が緑 + 実演: 子に `.env` を読ませ、拒否と「読めない」の報告を観測する（実演の入力と結果をこの `Notes` に書く）。単位全体の実演（3 型 × 経路 + `probe.pem`）は 06 が持つ

## Notes

### Findings

なし

### Unplanned

なし

Commit:
