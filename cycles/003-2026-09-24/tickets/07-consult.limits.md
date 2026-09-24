# consult.limits

Acceptance: 定義 1 枚のレビューが、出力上限に当たらずに終わる

## Todo

- `.pi/extensions/consult/types.example.json`
  - `review` の `output` を上げる — 20k → 60k。根拠: 003 の定義 1 枚のレビューが 3 周とも 20k に当たった（`out 20500` / `47607`）。3 倍で足りる見込み
- `.pi/extensions/consult/types.json`
  - `review` の `output` を同じ値に揃える — clone が受け取るのは `types.example.json` だけなので、実物とずれると次に同じ穴を踏む
- ケース（`入力 → 結果`）
  - 実演: `review` の子を 1 体、入力 `cycles/003-2026-09-24/definition.md` で走らせる → 出力上限に当たらずに終わる。`in` / `out` を `Notes` に書く (happy)
- 観点のうち、値の検証（`types.ts`）→ 002 の step 1 が既に持つ（不正値なら投げる）。この step は値を変えるだけ — ケース無し
- 想定エラー経路 → `types.json` を読めない / 壊れている場合の扱いは 002 の step 1 — ケース無し
- null / 空 / 境界 / 権限 / 2 回目 / 並行 → 値を読むだけ（呼び出しごとに読み直す既存の形）— ケース無し

## Verify

- 実演: `review` の子を 1 体、入力 `cycles/003-2026-09-24/definition.md` で走らせ、出力上限に当たらずに終わる（`in` / `out` のトークンを `Notes` に書く）。`types.example.json` と `types.json` の `review` の `output` が同じ値であることを読み合わせる

## Notes

### Findings

- 実演の結果（`Verify`）: `review` の子を定義 1 枚（`cycles/003-2026-09-24/definition.md`）に当てた。**最後まで読み切り、出力 33,792 トークン、上限に当たらなかった**（上げる前は 3 周とも `stopped early: output token limit reached (20000)` で死んでいた）
- `types.example.json` と `types.json` の `review` の `output` が、ともに `60000` であることを読み合わせた
- `turns` は変えない（20 で足りていた。実演でも 3 turns）
- **副産物**: 子が、こちらが渡したチェックリストの「eight sections」を誤りとして指摘した（実物はまだ 7 節。8 になるのは step 12 の後）。シートではなくチェックの文の誤り

### Unplanned

- なし

Commit: 8141f72
