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

なし

### Unplanned

なし

Commit:
