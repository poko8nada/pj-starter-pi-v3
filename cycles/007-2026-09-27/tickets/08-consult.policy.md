# consult.policy

Acceptance:

- `review` は 40 ターン / 出力 60k
- 型の定義が読めないときの文面は、原因で分かれている

## Todo

- `.pi/extensions/consult/types.json`
  - `review` の `limits.output` を 120000 → 60000 にする（`turns` は 40 のまま）
- `.pi/extensions/consult/policy/types.ts`
  - `loadTypes` — 文面を原因で分ける。`ENOENT` のときだけ「コミットしてある。復元するか自分のモデルを入れろ」、それ以外（権限・ディレクトリなど）は原因をそのまま見せる
  - `policy/types.test.ts`
    - `types.json` が無い → 読めなかったファイルの名前と復元の案内を含む（error、既存を直す）
    - 権限で読めない → 「コミットしてある」と言わない（error、新規 1 ケース）

## Verify

### test

- `pnpm test:run .pi/extensions/consult/policy`
  - 正しい設定 → 4 つの type が引ける（happy、既存）
  - `types.json` が無い → ファイル名と復元の案内を含む（error、既存）
  - 権限で読めない → 原因を見せる（error、新規）
  - `models` が空 → 親のモデルで走る設定として通る（happy、既存）
  - 空ファイル → 壊れた JSON として投げる（error、empty）
  - 権限 / 2 回目 / 並行 → 見ない（設定を 1 回読むだけ）

### form

- `grep -c "60000\|60,000" .pi/extensions/consult/types.json` が 1（`review` の上限）

## Notes

### Findings

- なし

### Unplanned

- なし

Commit:
