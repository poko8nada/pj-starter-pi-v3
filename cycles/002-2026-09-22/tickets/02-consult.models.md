# consult.models

Acceptance: 子は type ごとに決まったモデル・ツール・環境・上限・役割で走る（agent が選べるのは type だけ）

## Todo

- `run.ts`
  - `modelAttempts` を書く — 候補の後ろに「親と同じ（`--model` なし）」を足した並び
  - `runWithFallback` を書く — 順に試し、喋らずに死んだら次へ
- `spec.ts`
  - `spokeFrom` を書く — assistant の `message_end` があるか（乗り換えの判定）
- `index.ts`
  - `runPi` の代わりに `runWithFallback` を呼ぶ — 試行ごとに `models` を 1 つにした policy を渡す
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

- 実演: `types.json` の `review` の候補 1 番目を存在しない ID に変えて走らせ、診断のモデルが候補 2 番目になる（確かめたら設定を戻す）

## Notes

### Findings

- 実演の結果: 候補 1 番目に存在しない ID を置くと、pi は `Warning: Model "…" not found for provider "…". Using custom model id.` を出して **exit 0** で終わり、assistant の `message_end` は作られる（生成は 0、`errorFrom` は `404 status code (no body)`）。「assistant の有無」では乗り換えを判定できない
- 判定を「生成（output トークン）が 1 以上」に変えたら乗り換えが起き、実演が通った。診断のモデルが候補 2 番目（`commandcode/meta/muse-spark-1.3-contributor`）になり、答えも返った
- 生成 0 は、起動できずに死んだ場合（イベント無し）と同じ条件で拾える。失敗の形が 2 つあっても規則は 1 つで済む

### Unplanned

- `Todo` は判定を「assistant の `message_end` があるか」（`spokeFrom`）と書いたが、「生成が 1 以上か」（`ranFrom`）に変えた。テストの呼び名も「喋った」から「生成した」に合わせた
- `runWithFallback` はループで書いたが、lint の `no-await-in-loop` に当たった。抑制コメントを足すのではなく再帰にして、順に試すことが形で分かるようにした

Commit: 67365ac
