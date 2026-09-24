# secret-guard.rules

Acceptance: 対象は、名前が秘密を表すもの（`.env` / `.envrc` / `*.pem` / `*.key`）

## Todo

- 下調べ（コードを書く前。結果は `Notes` に書く）
  - pi が子に「このパスは読ませない」を渡す口を確かめる。候補は 3 つ — ① `pi --help` にある `--exclude-tools` / `--tools`（名前単位。パス単位ではない）② 子の env（`RunOptions.env` に足せる）③ 権限の拡張（`pi-permission-system`。`**/.git/**` のようなパス規則を持っているので、設定の置き場所を探す）
  - 使える口が決まったら、`denyRules` の返す形を決める（配列そのもの）
  - **この下の 2 行（`denyRules` の期待値）を、決まった形で書き直す。** どの口も使えないと分かったら、ここで止めて owner に相談する（`Then` が満たせないので、定義側の話になる）
- `.pi/extensions/consult/guard.ts`
  - `SECRET_NAMES` を書く — 確定: `.env` / `.envrc` / `*.pem` / `*.key`。git が無視する全部ではなく、名前で決める
  - `isSecretPath` を書く — パスがその名前に合うか（小文字のみ、深い場所でも名前で拾う）
  - `denyRules` を書く — 下調べで決めた形に落とす（子の起動か設定に渡せる形）
- `.pi/extensions/consult/guard.test.ts`
  - `isSecretPath`: `.env` → `true` (happy)
  - `isSecretPath`: `sub/dir/.env` → `true` (happy)
  - `isSecretPath`: `.envrc` → `true` (happy)
  - `isSecretPath`: `keys/server.pem` → `true` (happy)
  - `isSecretPath`: `id.key` → `true` (happy)
  - `isSecretPath`: `.ENV` → `false`（小文字だけ） (error)
  - `isSecretPath`: `foo.env` → `false`（前方一致しない。定義の名前は `.env` であって `*.env` ではない） (error)
  - `isSecretPath`: `id.key.bak` → `false`（接尾辞が違う） (error)
  - `isSecretPath`: `.env.example` → `false`（定義の名前 4 つに無い。止めすぎない側に倒す） (error)
  - `isSecretPath`: `node_modules/react/index.js` → `false`（広げない） (happy)
  - `isSecretPath`: `README.md` → `false` (happy)
  - `isSecretPath`: `""` → `false` (error)
  - `denyRules`: <下調べで決めた形> → 期待値は下調べで決める（合意後ではなく、この step の最初に決めて `Notes` に書く。決まらないまま書けないなら owner に相談する） (happy)
  - `denyRules`: 対象が無いパスを渡す → 空の配列（`[]`） (error)
  - `SECRET_NAMES`: 4 つ全部が入っている → `[".env", ".envrc", "*.pem", "*.key"]`（配列そのもの） (happy)
  - null / undefined → 型で防ぐ（パスは常に文字列）— ケース無し
  - 権限 → この関数は規則を作るだけ。適用は step 5 — ケース無し
  - 2 回目 / 並行 → 状態を持たない純関数 — ケース無し

## Verify

- `pnpm test:run` が緑。下調べの結果（pi に渡す形と、その根拠になったファイル・行）が `Notes` に書かれている。`denyRules` の期待値が、その形になっている

## Notes

### Findings

なし

### Unplanned

なし

Commit:
