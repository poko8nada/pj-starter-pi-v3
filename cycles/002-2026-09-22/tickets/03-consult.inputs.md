# consult.inputs

Acceptance: 入力ごとに 1 体走る（入力が 1 つなら 1 体）

## Todo

- `run.ts`
  - `readPayloads` を書く — 全部を先に読む。1 つでも読めなければ、子を 1 体も起動する前に投げる
  - `runForInputs` を書く — 入力ごとに 1 体。1 体の失敗はその 1 体の状態にして、残りは走る
- `index.ts`
  - `PARAMETERS` の `input` を配列にする（パスの一覧）
  - `readPayloads` と `runForInputs` を使い、結果を入力ごとに並べる
  - 見出しを付ける（入力のパスと、その子の診断）
- `run.test.ts`
  - 入力 1 つ → 1 体、結果も 1 つ (happy)
  - 入力 2 つ → 2 体、結果は入力の順に並ぶ (happy)
  - 読み込めないパスが混ざる → 子を 1 体も起動せずに投げる (error)
  - 1 体が例外を投げる → その 1 つだけ失敗として残り、残りは走る (error)

## Verify

- 実演: 入力 2 つ（実在するファイル 2 つ）で走らせ、子が 2 体立ち上がり、結果が入力ごとに並ぶ

## Notes

### Findings

なし

### Unplanned

なし

Commit:
