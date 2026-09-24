# consult.check

Acceptance: 単位の `Then` を全部、1 回の実演で確かめる（type ごとの policy（モデル・ツール・環境・上限・役割。agent が選べるのは type だけ）/ 入力ごとの 1 体 / ref が返る / `input` の入り方 / README の表 / レビューが上限に当たらない）

## Todo

- 実演の手順を決める — `research` を 2 入力で 1 回走らせる。`code` を 1 回走らせ、ref が返ることを見る。`review` を `cycles/003-2026-09-24/definition.md` に当て、上限に当たらずに終わることを見る
- `Then` ごとの観測（`入力 → 結果` の形で書く）
  - `research` 1 体 → 返答の末尾に `[consult] <モデル名>` があり、その名前が `types.json` の候補 1 番目 (happy)
  - 道具の引数 → `PARAMETERS` に `type` / `task` / `input` 以外が無い（agent が選べるのは type だけ） (happy)
  - `research` 2 入力 → 結果が 2 件、入力ごとに並ぶ (happy)
  - `code` 1 体 → `{"kind":"committed","ref":...}` が返る (happy)
  - `research`（payload `"PAYLOAD"` + task `"TASK"`）→ 子の返答がその 2 つを引用する (happy)
  - 読み合わせ → `README` の表と `types.json` の `tools` が一致する (happy)
  - `review`（定義 1 枚）→ 出力上限に当たらずに終わる（`out` を `Notes` に書く） (happy)
- 観点（null / 空 / 境界 / 不正 / 権限 / 2 回目 / 並行）→ この step は作るものが無く、実演そのものなので当たらない — ケース無し
- 空の入力 → step 10 の `Verify` が持つ（この実演には入れない） (error)

## Verify

- 実演: 上記の手順を実行し、`Then` の 6 つを観測する（結果を `Notes` に書く）

## Notes

### Findings

なし

### Unplanned

なし

Commit:
