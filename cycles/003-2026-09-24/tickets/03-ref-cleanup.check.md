# ref-cleanup.check

Acceptance: 消す前に、消えるものが一覧で見える。`consult` の ref 以外は拒まれる。消したあと、`git branch` から消えている

## Todo

- 実演の手順を決める — `git branch consult/003-demo` で ref を 1 本作る。道具 `ref_cleanup` を `list` で呼び、次に `delete` で `consult/003-demo` を渡し、最後に `git branch` を読む
- `Then` ごとに何を見るかを決める（`入力 → 結果` の形で書く）
  - `list`（`consult/003-demo` が 1 本ある） → 本文にその名前とハッシュが出る (happy)
  - `delete`（`main`） → `{refused: "consult/ で始まらない"}` が返り、`git branch` は変わらない (error)
  - `delete`（`consult/003-demo`） → 消えた名前が返り、`git branch` に `consult/003-demo` が無い (happy)
- 観点（null / 空 / 境界 / 不正 / 権限 / 2 回目 / 並行）→ この step は作るものが無く、実演そのものなので当たらない — ケース無し
- `name` を渡さない（`delete` で `null`）→ step 1 の `parseAction` が投げる（道具の口で弾かれる。ここでは実演しない） (error)
- `""` を `delete` に渡す → `{refused: "consult/ で始まらない"}`（実演で 1 回見る） (error)

## Verify

- 実演: 上記の手順を実行し、`Then` の 3 つが全部観測できる（実演の入力と出力を `Notes` に書く）

## Notes

### Findings

なし

### Unplanned

なし

Commit:
