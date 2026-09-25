# secret-guard.consult

Acceptance:

- 子の `read` は拒否される
- 子は「読めない」と報告する
- 親の `.env` の中身は変わらない

## Todo

- `.pi/extensions/consult/spec.ts`
  - `buildPiArgs` に `-e <child-guard.ts の絶対パス>` を足す
    - 子にだけ guard を読ませる
    - パスは `EXTENSION_DIR` と同じ形で `import.meta.url` から組む
- `.pi/extensions/consult/spec.test.ts`
  - `buildPiArgs`: 引数に `-e` と guard の絶対パスが入る (happy)
    - 配列そのものを比較
  - `buildPiArgs`: `-e` が 1 回だけ入る (happy)
    - 重複しない
  - `buildPiArgs`: `--tools` の**後**に入る (happy)
    - pi の引数順で問題が出ない位置
  - `buildPiArgs`: guard のパスが空文字なら投げる (error)
    - 空の `-e` を渡さない
  - `buildPiArgs`: `--tools` が空配列でも `-e` の位置が崩れない (happy)
  - 観点
    - 引数を組む純関数なので、入ってくるのは文字列と配列だけ — ケース無し
  - 親の起動 — ケース無し
    - `buildPiArgs` は子の引数を組む関数で、親は通らない
    - 親の設定を変えないことが構造として成り立つ
  - 未知の type 名 — ケース無し
    - この関数は type を検証しない
    - `resolveType` の仕事
    - 002 の step 1 が持つ
  - 権限 — ケース無し
    - 引数に権限の情報は入らない
  - 2 回目 → 純関数（引数を組むだけ） — ケース無し
  - 並行 → 純関数（引数を組むだけ） — ケース無し
- `run.test.ts`
  - 子の起動引数（`piArgs`）に guard の `-e` が入っている (happy)
    - 配列そのもの
  - その子が `.env` を読もうとすると、返答に「読めない」が出る (error)
    - 値が出ない

## Verify

- `pnpm test:run` が緑
- 実演: 子に `.env` を読ませ、拒否と「読めない」の報告を観測する
  - 実演の入力と結果をこの `Notes` に書く
  - 単位全体の実演（3 型 × 経路 + `probe.pem`）は 06 が持つ

## Notes

### Findings

- 観察: 緑
- チケットの「配列そのものを比較」はテストでその形になっていない
  - 絶対パスは機械に依存する
  - テストは 3 つの形で確かめている
    - `--tools` の後ろ
    - `child-guard.ts` で終わる絶対パス
    - `-e` は 1 回だけ
- `-e` は `--tools` の直後、`--no-approve` の前に置いた
  - まとまりとして読める位置
- 子に読ませる実演はこの step では行わない
  - この step の一部はテストが覆う
    - 引数の組み立て
  - 単位全体の実演は 06 が持つ
    - 実際に起動する子に `.env` を読ませる
  - `plan` スキルの「その step の `Verify` は自分の分だけを覆う」に従った

### Unplanned

- なし

Commit: f7ff327
