# consult.check

Acceptance: 単位の `Then` を全部、1 回の実演で確かめる（type ごとの policy（モデル・ツール・環境・上限・役割。agent が選べるのは type だけ）/ 入力ごとの 1 体 / ref が返る / `input` の入り方 / README の表 / レビューが上限に当たらない）

## Todo

- 実演の手順を決める — `research` を 2 入力で 1 回走らせる。`code` を 1 回走らせ、ref が返ることを見る。`review` を `cycles/003-2026-09-24/definition.md` に当て、上限に当たらずに終わることを見る
- type ごとの policy を確かめる — `types.json` の tools / environment / limits / role と、子の起動引数（`--tools` / `--extension child-guard.ts` / `--no-approve`）を突き合わせる
- `Then` ごとの観測（`入力 → 結果` の形で書く）
  - `research` 1 体 → 返答の末尾に `[consult] <モデル名>` があり、その名前が `types.json` の候補 1 番目。同じ子の起動引数に type の tools、`-e child-guard.ts`、`--no-approve` が入っている (happy)
  - 道具の引数 → `PARAMETERS` に `type` / `task` / `input` 以外が無い（agent が選べるのは type だけ） (happy)
  - `research` 2 入力 → 結果が 2 件、**入力順に**並ぶ（完了順ではない） (happy)
  - `code` 1 体 → `{"kind":"committed","ref":...}` が返り、**agent がその ref を取り込むか捨てるかを言う**（`Notes` に書く） (happy)
  - `research`（payload `"PAYLOAD"` + task `"TASK"`）→ 子の返答がその 2 つを引用する (happy)
  - 読み合わせ → `types.json` の tools / environment / limits / role を、子の起動引数（`--tools` = tools / `-e child-guard.ts` = ガード / `--no-approve` = 隔離） と突き合わせる。**role は `--append-system-prompt`、limits は `types.json` の値そのもの**（子を起動せずとも設定の読み合わせで分かる） (happy)
  - `review`（定義 1 枚）→ 出力上限に当たらずに終わる（`out` を `Notes` に書く） (happy)
- 観点（null / 空 / 境界 / 不正 / 権限 / 2 回目 / 並行）→ この step は作るものが無く、実演そのものなので当たらない — ケース無し
- 空の入力（この実演には入れない。step 10 の `Verify` が持つ）— ケース無し
- `Todo` の観測は 7 行（policy を 2 行に分けた）。`Then` の 6 つに対応する

## Verify

- 実演: 上記の手順を実行し、`Then` の 6 つを観測する（結果を `Notes` に書く）

## Notes

### Findings

なし

### Unplanned

なし

Commit:
