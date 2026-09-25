# consult.models

Acceptance:

- 子は type ごとに決まった設定で走る
  - モデル
  - ツール
  - 環境
  - 上限
  - 役割
- agent が選べるのは type だけ

## Todo

- `run.ts`
  - `modelAttempts` を書く — 候補の後ろに「親と同じ」を足した並び
    - 「親と同じ」は `--model` なしで走ること
  - `runWithFallback` を書く — 候補を順に試す
    - 喋らずに死んだら次へ進む
- `spec.ts`
  - `spokeFrom` を書く — 乗り換えの判定に使う
    - assistant の `message_end` があるかを見る
- `index.ts`
  - `runPi` の代わりに `runWithFallback` を呼ぶ
    - 試行ごとに `models` を 1 つにした policy を渡す
- `run.test.ts`
  - 候補 2 つ → 試行は 3 つ（最後は親と同じ） (happy)
  - 候補 0 つ → 試行は 1 つ（親と同じ） (happy)
  - 1 番目で喋れば 1 回で終わる (happy)
  - 喋らずに死んだら次の候補でやり直す (error)
  - 候補を使い切ったら `--model` なしで走る (error)
  - 喋ってから失敗したら乗り換えない (happy)
  - 中断されたら乗り換えない (happy)
- `spec.test.ts`
  - assistant の `message_end` があれば true (happy)
  - 無ければ false (happy)

## Verify

- 実演: `types.json` の `review` の候補 1 番目を存在しない ID に変えて走らせる
  - 診断のモデルが候補 2 番目になる
  - 確かめたら設定を戻す

## Notes

### Findings

- 実演の結果: 候補 1 番目に存在しない ID を置いた
  - pi は `Warning: Model "…" not found for provider "…". Using custom model id.` を出す
  - **exit 0** で終わる
  - assistant の `message_end` は作られる
  - 生成は 0
  - `errorFrom` は `404 status code (no body)`
- 「assistant の有無」では乗り換えを判定できない
- 判定を「生成が 1 以上」に変えた
  - 生成は output トークンで見る
  - 乗り換えが起きた
  - 診断のモデルが候補 2 番目（`commandcode/meta/muse-spark-1.3-contributor`）になった
  - 答えも返った
- 生成 0 は、起動できずに死んだ場合（イベント無し）と同じ条件で拾える
- 失敗の形が 2 つあっても規則は 1 つで済む

### Unplanned

- `Todo` の判定を「assistant の `message_end` があるか」から「生成が 1 以上か」に変えた
  - 呼び名は `spokeFrom` から `ranFrom` へ変えた
  - テストの呼び名も「喋った」から「生成した」に合わせた

Commit: 67365ac
