# secret-guard.consult

Acceptance: 子の `read` は拒否され、子は「読めない」と報告する。親の `.env` の中身は変わらない

## Todo

- `.pi/extensions/consult/run.ts`
  - 子の起動（`runOneChild` が組む `piArgs` / `env`）に step 4 の `denyRules` を足す — 親の起動経路（`--model` を渡さず親の設定を引き継ぐ場合）には足さない（plan のこの step の `Tests` どおり）
  - pi の設定ファイルで渡す形になった場合、それが親にも効くかは step 4 の下調べで分かる → `Notes` に書く（plan の Tests は起動経路の話で、設定ファイルの副作用は別）
  - 規則は `guard.ts` から引く — `run.ts` に名前を直書きしない
- `.pi/extensions/consult/run.test.ts`
  - 子の起動引数に `denyRules` の結果がそのまま入る → 具体形で比較する（配列そのもの） (happy)
  - 親の起動経路 → 規則が入らない（配列そのもの） (happy)
  - 規則が空（`denyRules` が `[]`）→ 起動引数に空の要素が混ざらない（`piArgs` の配列そのもの） (empty)
  - 子が `.env` を読もうとする → 子の返答に「読めない」が出て、値が出ない (error)
  - 秘密でないファイル（`README.md`）を読む → 子は中身を報告する (happy)
  - `SECRET_NAMES` の 4 つ（`.env` / `.envrc` / `*.pem` / `*.key`）→ すべて拒まれる (error)
  - 境界: 規則が 1 つだけ（`.env` のみ）→ その 1 つだけが入る（配列そのもの） (happy)
  - 権限の判定は pi 側。この拡張は規則を渡すだけ — ケース無し
  - 2 回目 / 並行 → 子ごとに独立した引数を組み立てる（共有の状態なし）— ケース無し
  - null / undefined → 型で防ぐ — ケース無し
  - 不正な入力（`denyRules` が想定の形でない）→ 起動前に投げる（壊れた引数で子を走らせない） (error)

## Verify

- `pnpm test:run` が緑。実演: `research` の子を 1 体走らせ、入力に `.env` のパスを渡して「このファイルを読んで報告して」と頼む。返答に中身が出ず、「読めない」が出る（前後で `shasum .env` を比べ、変わらないことを見る）

## Notes

### Findings

なし

### Unplanned

なし

Commit:
