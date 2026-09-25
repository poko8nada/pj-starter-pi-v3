# consult.readme

Acceptance:

- 子は type ごとに決まった設定で走る
  - モデル
  - ツール
  - 環境
  - 上限
  - 役割
- agent が選べるのは type だけ

## Todo

- `README.md`
  - 「何のためか」
    - 会話を見せずに子を走らせ、本文だけ返す
    - 費用がかかる
  - 「type」
    - `research`
    - `review`
    - `trial`
    - `code`
    - policy を持つ
      - モデル候補
      - ツール
      - 環境
      - 上限
      - 役割
    - 呼び出し側は選べない
  - 「モデル候補の順」
    - 1 番目
    - 2 番目
    - 親と同じ
    - 乗り換える条件
      - 生成が 0 のまま終わった
  - 「環境」
    - `tree`
    - `worktree`
    - worktree は依存を入れてから子が走る
    - フックが通れば ref になる
  - 「ref の受け取り方」
    - 親が cherry-pick する
    - 親が一部を取る
    - 親が捨てる
    - `ref` がある = 検査を通ったコミットがある
  - 「信頼」
    - 子に読ませないもの
      - プロジェクトの設定
      - 拡張
      - スキル
    - 要る手順は次で渡す
      - task
      - input
  - 「設定」
    - `types.json` は git 管理外
    - `types.example.json` が形
    - 変えたら次の consult から効く
  - 「道具の形」
    - 項目
      - `type`
      - `task`
      - `input`
    - 入力ごとに 1 体
    - 並列に走る

## Verify

- 実演: README の「設定」と「道具の形」のとおりに `research` を 1 回走らせる
  - 診断のモデルが 1 番目の候補になる
  - 結果が入力ごとに並ぶ

## Notes

### Findings

- 実演の結果
  - 診断のモデルが 1 番目の候補 `commandcode/deepseek/deepseek-v4.1-flash` だった
  - 結果が入力ごとに並んだ
- 入力の 1 つ目に `README.md` を渡したら、子は「ファイルが指定されていない」と答えた
  - payload ではなく、リポジトリを自分で探し始めた
  - `README.md` は 0 バイトの追跡ファイル
  - 空の payload が渡っていた
- `readPayload` は読めない入力を例外にしている
  - 001 で「無言で空の子を走らせない」と決めた
- 空ファイルは素通りする
- 同じ「文脈なしの答えが返る」形なので、次に拾う

### Unplanned

- `README.md` の節は `Todo` の 8 つに加えて、既存の節を残した
  - `Cancelling`
  - `Sound`
  - `Tests`
- 内容は今の実装に合わせて直した

Commit: c05a471
