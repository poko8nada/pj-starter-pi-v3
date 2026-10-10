# consult.policy-source

Acceptance:

- `types.json` がコミットされ、clone した人にも、`HEAD` から作る子の worktree にも、同じものがそのまま渡る
- `consult` の README が、`types.json` はリポジトリにあるものとして説明してある（例を写す手順が消え、変え方が書いてある）

## Todo

- `.pi/extensions/consult/types.json`
  - git の管理に入れる（実物のまま。モデル名はこのリポジトリの設定になる）
- `.pi/extensions/consult/types.example.json`
  - 消す
- `.pi/extensions/consult/.gitignore`
  - 消す（`types.json` を無視する 1 行だけのファイル）
- `.pi/extensions/consult/policy/types.ts`
  - `loadTypes` — 読めないときの文面を、例を写せ ではなく「このファイルを直せ」に変える
  - `policy/types.test.ts`
    - `types.json` が無い → 読めなかったファイルの名前を含むエラー（新規 1 ケース）
- `.pi/extensions/consult/README.md`
  - `## Settings` — 「コミットしない個人の設定」「例を写す」を消し、リポジトリの `types.json` を自分のモデルに変える、と書く

## Verify

### form

- `git ls-files .pi/extensions/consult` に `types.json` があり、`types.example.json` が無い
- `.pi/extensions/consult/.gitignore` が無い
- `git check-ignore .pi/extensions/consult/types.json` が空（無視されない）

### read

- `review` の子に `.pi/extensions/consult/README.md` だけを渡す
  - `types.json` をどう扱うかを報告させる（写すのか、変えるのか）
- `review` の子に `.pi/extensions/consult/policy/types.ts` を渡す
  - `types.json` が無いときに、文面から次に何をすべきか分かるかを報告させる

### test

- `pnpm test:run .pi/extensions/consult/policy`
  - 正しい設定 → 4 つの type が引ける（happy、既存）
  - `types.json` が無い → 読めなかったファイルの名前を含むエラー（error、新規）
  - `types` が空 → 投げる（error、既存）
  - `models` が空 → 親のモデルで走る設定として通る（boundary、既存）
  - 空ファイル → JSON として壊れている → 投げる（error、既存の「JSON が壊れている」と同じ経路）
  - 権限で読めない / 2 回目 / 並行 → 見ない（設定を 1 回読むだけで、状態を持たない）

## Notes

### Findings

- `consult/README.md`（`## Settings`）: `types.json` の場所が「このファイルの隣」としか書かれていない（実パスは `Tests` の節から推定する）。閉じるには: パスを書くか、この書き方でよいと決める
- `consult/policy/types.ts`（`loadTypes`）: 読めない理由が権限やディレクトリでも「コミットしてある。復元するか自分のモデルを入れろ」と言い切る。閉じるには: 原因で文面を分けるか、言い切らない形にする

### Unplanned

- `policy/types.test.ts`: 同梱の例がそのまま読めることを確かめるテストがあった（`types.example.json` を読んでいた）。コミットした実物（`types.json`）を読む形に変えた（例を消したため）

Commit: 435e20f
