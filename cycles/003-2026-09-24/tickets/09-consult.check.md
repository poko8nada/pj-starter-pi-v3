# consult.check

Acceptance:

- 単位の `Then` を全部、1 回の実演で確かめる
- 子は type ごとに決まったモデル・ツール・環境・上限・役割で走る（agent が選べるのは type だけ）
- 入力ごとに 1 体走る（入力が 1 つなら 1 体）
- `code` の子のコミットは ref で返り、agent が取り込むかを決める
- `input` の全文が、子のプロンプトの先頭に payload として入る（子が読む文書ではない）
- `consult` の `README` の表が、実際のツールと一致する
- 定義 1 枚のレビューが、出力上限に当たらずに終わる

## Todo

- 実演の手順を決める
  - `research` を 2 入力で 1 回走らせる
  - `code` を 1 回走らせ、ref が返ることを見る
  - `review` を `cycles/003-2026-09-24/definition.md` に当て、上限に当たらずに終わることを見る
- type ごとの policy を確かめる
  - `types.json` の tools / environment / limits / role と、子の起動引数を突き合わせる
  - 子の起動引数は `--tools` / `--extension child-guard.ts` / `--no-approve`
- `Then` ごとの観測
  - `入力 → 結果` の形で書く
  - `research` 1 体 → 返答の末尾に `[consult] <モデル名>` がある (happy)
    - その名前が `types.json` の候補 1 番目
    - 子の起動引数に type の tools が入っている
    - 子の起動引数に `-e child-guard.ts` が入っている
    - 子の起動引数に `--no-approve` が入っている
  - 道具の引数 → `PARAMETERS` に `type` / `task` / `input` 以外が無い (happy)
    - agent が選べるのは type だけ
  - `research` 2 入力 → 結果が 2 件 (happy)
    - **入力順に**並ぶ（完了順ではない）
  - `code` 1 体 → `{"kind":"committed","ref":...}` が返る (happy)
    - **agent がその ref を取り込むか捨てるかを言う**
    - `Notes` に書く
  - `research`（payload `"PAYLOAD"` + task `"TASK"`）→ 子の返答がその 2 つを引用する (happy)
  - 読み合わせ → `types.json` の tools / environment / limits / role と子の起動引数を突き合わせる (happy)
    - tools は `--tools`
    - limits は `types.json` の値そのもの
    - role は `--append-system-prompt`
    - `-e child-guard.ts` はガード
    - `--no-approve` は隔離
    - 子を起動せずとも設定の読み合わせで分かる
  - `review`（定義 1 枚）→ 出力上限に当たらずに終わる (happy)
    - `out` を `Notes` に書く
- 観点（null / 空 / 境界 / 不正 / 権限 / 2 回目 / 並行）
  - この step は作るものが無く、実演そのものなので当たらない — ケース無し
- 空の入力
  - この実演には入れない（step 10 の `Verify` が持つ）— ケース無し

## Verify

- 実演: 上記の手順を実行し、`Then` の 6 つを観測する
- 結果は `Notes` に書く

## Notes

### Findings

- **type ごとの policy と引数の読み合わせ**（`types.json` / `spec.ts` の `buildPiArgs`）
  - tools は `--tools`（カンマ区切りの一覧）
  - environment は実行場所（`tree` か一時 worktree）
  - limits は `types.json` の値そのもの（子の `output` 上限と turns）
  - **role は `--append-system-prompt`**（追記なので既定のツール説明を壊さない）
  - 他は次のとおり
    - `--mode json -p --no-session`
    - `--model <1 番目>`
    - `-e child-guard.ts`
    - `--no-approve`
    - 最後にプロンプト
- `PARAMETERS` は `type` / `task` / `input` の 3 つだけ
  - agent が選べるのは type だけ
- **`research` を 2 入力**（`definition.md` + `plan.md`）で 1 回走らせた
  - 結果は 2 件
  - **入力順**
  - 1 体目の返答は「先行文書は存在しません…文書は 1 つだけ」
  - 2 体目の返答は `# PLAN 003` を引用した
  - **入力ごとに 1 体**で、各子は自分の payload 1 枚とタスクを受け取っている
  - 両方とも payload の先頭行を正しく引用した（payload がプロンプトに入っている証拠）
- **`code` 1 体** → `PROBE.md` を作り、`ref: consult/code-20260924-174013-0` が返った
  - `92fa8a5`（1 file changed）
  - **取り込まない**と決めた
  - `ref_cleanup` の `list` と `delete` で消した
  - 親のツリーは 1 度も触られていない
    - `git status` は綺麗
    - `git branch` は `main` だけ
    - worktree も残っていない
- **`review` の上限**は 07 の実演で確認済み
  - 定義 1 枚 → 33,792 トークン
  - 上限に当たらず
- `README` の type 表と `types.json` の `tools` が一致していることを読み合わせた

### Unplanned

- なし

Commit: なし（コードを変えない。実演だけ）
