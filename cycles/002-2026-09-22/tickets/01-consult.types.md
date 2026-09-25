# consult.types

Acceptance:

- 子は type ごとに決まったモデル・ツール・環境・上限・役割で走る
- agent が選べるのは type だけ

## Todo

- `types.ts`
  - `loadTypes` を書く — 設定を呼び出しごとに読む
  - `resolveType` を書く — 名前から type を引く
  - 設定の検証を書く — 壊れていれば投げる
- `types.example.json`
  - 4 つの type の形を書く — モデル候補・ツール・環境・上限・役割
- `.gitignore`
  - `types.json` を足す — 実のモデル名は git に置かない
- `spec.ts`
  - `buildPiArgs` を直す — type の policy から組み立てる
  - `ConsultOptions` を直す — 上書き（`role`・`tools`・`worktree`）を消す
  - 隔離の判断を直す — ツールからではなく `environment` から決める
- `index.ts`
  - `PARAMETERS` を直す — 渡すのは `type`・`task`・`input` だけ
- `types.test.ts`
  - 正しい設定 → 4 つの type が引ける (happy)
  - 設定を読み直す → 次の呼び出しに効く (happy)
  - `models` が空 → 親のモデルで走る設定として通る (happy)
  - `role` が無い → 通る (happy)
  - 未知の type → 投げる (error)
  - JSON が壊れている → 投げる (error)
  - `types` が配列でない → 投げる (error)
  - 要素がオブジェクトでない → 投げる (error)
  - `name` が無い → 投げる (error)
  - `name` が空 → 投げる (error)
  - `name` が重複 → 投げる (error)
  - `models` が配列でない → 投げる (error)
  - `models` の要素が文字列でない → 投げる (error)
  - `tools` が配列でない → 投げる (error)
  - 未知のツール名 → 投げる (error)
  - `environment` が `tree` でも `worktree` でもない → 投げる (error)
  - `limits` が無い → 投げる (error)
  - `turns` が 0 以下 → 投げる (error)
  - `output` が 0 以下 → 投げる (error)
- `spec.test.ts`
  - `buildPiArgs` が `--model` に候補 1 番目を入れる (happy)
  - `buildPiArgs` が type のツールを入れる (happy)
  - `buildPiArgs` が役割を `--append-system-prompt` に入れる (happy)
  - `environment` が `worktree` → 隔離すると判断する (happy)
  - `environment` が `tree` → 隔離しないと判断する (happy)
  - `PARAMETERS` の項目が `type`・`task`・`input` だけ (happy)

## Verify

- 実演: `review` を 1 回走らせる
  - 診断のモデルが `types.json` の候補 1 番目
  - 子が `bash` を使えないと返す

## Notes

### Findings

- 実演の結果
  - 診断のモデルは候補 1 番目（`commandcode/deepseek/deepseek-v4.1-flash`）
  - 子は `bash` を使えないと報告した
- 道具 `consult` としての呼び出しは、この走っているセッションが古いスキーマを読み込んでいるため実行できなかった
  - 拡張は起動時に読まれる
- 子の pi は新しいスキーマを読む
- そちらからなら呼べる
- `README.md` は step 5（`consult.readme`）で書き直す
- それまで古いインターフェース（`role`・`tools`・`worktree`）の記述が残る

### Unplanned

- `run.ts` にも手を入れた
  - `Todo` のファイル一覧に無い
  - 上限を type から渡すのに要る
- `spec.ts` に `needsIsolation` を切り出した
  - 隔離の判断を `environment` から引く形にしたとき、テストできる場所が要った
- `Todo` に無い検証を 2 つ足した
  - `types` が空
  - `tools` が空
- `tools` が空だと「指定なし」として親のツールが通ってしまい、意図の逆になる

Commit: b82ef58
