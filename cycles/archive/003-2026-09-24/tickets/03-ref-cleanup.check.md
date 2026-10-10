# ref-cleanup.check

Acceptance:

- 消す前に、消えるものが一覧で見える
- `consult` の ref 以外は拒まれる
- 消したあと、`git branch` から消えている

## Todo

- 実演の手順を決める
  - いま残っている `consult/trial-20260924-161035-0` をそのまま使う
    - 新しく作らない
    - 無ければ `git branch consult/003-demo` で作る
  - 道具 `ref_cleanup` を `list` で呼ぶ
  - `delete` でその名前を渡す
  - `git branch` を読む
- `Then` ごとに何を見るかを決める（`入力 → 結果`）
  - `list`（`consult/trial-20260924-161035-0` が 1 本ある） → 本文にその名前とハッシュが出る (happy)
  - `delete`（`main`） → `{refused: "consult/ で始まらない"}` が返る (error)
    - `git branch` は変わらない
  - `delete`（`consult/trial-20260924-161035-0`） → 消えた名前が返る (happy)
    - `git branch` にその名前が無い
  - null → 当たらない — ケース無し
  - 空 → 当たらない — ケース無し
  - 境界 → 当たらない — ケース無し
  - 不正 → 当たらない — ケース無し
  - 権限 → 当たらない — ケース無し
  - 2 回目 → 当たらない — ケース無し
  - 並行 → 当たらない — ケース無し
    - この step は作るものが無く、実演そのものだから
  - `name` を渡さない（`delete` で `null`）→ step 2 の `parseAction` が投げる (error)
    - 道具の口で弾かれる
    - ここでは実演しない
  - `""` を `delete` に渡す → `{refused: "consult/ で始まらない"}` (error)
    - 実演で 1 回見る

## Verify

- 実演: 上記の手順を実行し、`Then` の 3 つが全部観測できる
- 実演の入力と出力は `Notes` に書く

## Notes

### Findings

- 実演の結果: 3 つとも観測できた
  - `list` → `consult/trial-20260924-161035-0 83a8bbe9587fb02fa468b50a7c5e8341509519c1`
  - `delete`（`main`）→ `消さない: consult/ で始まらない`
    - `git branch` は `consult/trial-…` と `main` のまま
    - `main` のハッシュは `7c18996` で変わらない
  - `delete`（`consult/trial-20260924-161035-0`）→ `消した: consult/trial-20260924-161035-0`
    - `git branch` は `main` だけになった
- 002 の 07 で残った ref は、これで道具で消せることが確かめられた
- **「残してよいのは自分で消せるものだけ」という規則が、道具として形になった**
- 拡張の登録は起動時に読まれるので、実演の前にセッションをリロードした
  - 002 の 06 と同じ

### Unplanned

- なし

Commit: ea45f97
