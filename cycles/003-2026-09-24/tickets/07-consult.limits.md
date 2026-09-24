# consult.limits

Acceptance: 定義 1 枚のレビューが、出力上限に当たらずに終わる

## Todo

- `.pi/extensions/consult/types.example.json`
  - `review` の `output` を上げる — 20k → 60k。根拠: 003 の定義 1 枚のレビューが 3 周とも 20k に当たった（`out 20500` / `47607`）。3 倍で足りる見込み
- `.pi/extensions/consult/types.json`
  - `review` の `output` を同じ値に揃える — clone が受け取るのは `types.example.json` だけなので、実物とずれると次に同じ穴を踏む
- 観点（null / 空 / 不正）→ 数値の検証は `types.ts` が既に持つ（002 の step 1）。この step は値を変えるだけで、検証は増やさない — ケース無し
- 境界（値そのものが足りるか）→ 判定できず、実演が確かめる（当たらなければ足りた、当たれば足りなかった）— ケース無し
- `turns` は変えない — 定義の `Then` は出力についてだけ言っている。20 で足りていた（3 周のレビューは 2〜6 turns で終わった）
- 権限 / 2 回目 / 並行 → 値を読むだけ（呼び出しごとに読み直す既存の形）— ケース無し

## Verify

- 実演: `review` の子を 1 体、入力 `cycles/003-2026-09-24/definition.md` で走らせ、出力上限に当たらずに終わる（`in` / `out` のトークンを `Notes` に書く）。`types.example.json` と `types.json` の `review` の `output` が同じ値であることを読み合わせる

## Notes

### Findings

なし

### Unplanned

なし

Commit:
