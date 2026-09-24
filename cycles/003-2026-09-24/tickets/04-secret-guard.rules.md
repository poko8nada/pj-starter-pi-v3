# secret-guard.rules

Acceptance: 対象は、名前が秘密を表すもの（`.env` / `.envrc` / `*.pem` / `*.key`）。子の `read` は拒否され、子は「読めない」と報告する。親の `.env` の中身は変わらない

## Todo

- なぜ自前で持つのかを `Notes` に書く — ホストのグローバル設定（`pi-permission-system`）は**この 1 台では**正しく働いている（3 型で実測）。だが **(a) clone には無い (b) 規則は字面ベースで、組み立てたパスはすり抜けうる**（2026-09-24 の実測: `cat .env` は止まるが、パスを変数で組めば文字列として一致しない）
- `.pi/extensions/consult/child-guard.ts`（**`-e` で子にだけ読ませる。pi の拡張探索はディレクトリの `index.ts` なので、この名前のファイルは自動では読まれない**）
  - `SECRET_NAMES` を書く — `.env` / `.envrc` / `*.pem` / `*.key`（名前で決める。git が無視する全部ではない）
  - `isSecretPath` を書く — **解決後の絶対パス**で判定する（argv の字面ではなく。symlink と `..` を畳んでから見る）
  - `judgeToolCall` を書く — 道具名と引数から、その呼び出しを通すか拒むかを決める（純関数。`read` / `grep` / `bash` のパスを解決して `isSecretPath` に渡す）
  - 拡張本体を書く — `tool_call` で `judgeToolCall` を呼び、拒むなら**拒否の文に「読めない」を含めて**返す（子がそれを報告できるように）
- `.pi/extensions/consult/child-guard.test.ts`
  - `isSecretPath`: `/repo/.env` → `true` (happy)
  - `isSecretPath`: `/repo/sub/.envrc` → `true` (happy)
  - `isSecretPath`: `/repo/keys/server.pem` → `true` (happy)
  - `isSecretPath`: `/repo/id.key` → `true` (happy)
  - `isSecretPath`: 相対 `../../.env`（cwd 付きで解決）→ `true` (happy)
  - `isSecretPath`: symlink を解決した先が `.env` → `true`（**字面のすり抜けを塞ぐ**） (happy)
  - `isSecretPath`: `/repo/README.md` → `false` (happy)
  - `isSecretPath`: `.ENV`（大文字）→ `false`（規則は小文字だけ） (error)
  - `isSecretPath`: `foo.env` → `false`（前方一致しない） (error)
  - `isSecretPath`: `id.key.bak` → `false`（接尾辞が違う） (error)
  - `isSecretPath`: `""` → `false` (error)
  - `isSecretPath`: 解決できないパス（存在しない）→ `true`（**読めないものを通さない**側に倒す） (error)
  - `isSecretPath`: `/repo/.env.bak` → `false`（境界: 定義の名前は `.env` だけで、`.env.*` は定義に無い） (error)
  - `isSecretPath`: `node_modules/react/index.js` → `false`（広げない） (happy)
  - `judgeToolCall`: `read` + `/repo/.env` → `{deny: "読めない"}` (error)
  - `judgeToolCall`: `read` + `/repo/.envrc` → `{deny: "読めない"}` (error)
  - `judgeToolCall`: `grep` + `/repo/keys/x.pem` → `{deny: "読めない"}` (error)
  - `judgeToolCall`: `bash` + `cat /repo/.env` → `{deny: "読めない"}`（argv を分解してパスを見る） (error)
  - `judgeToolCall`: `bash` + `cat /repo/.e""nv`（**組み立てたパス**）→ `{deny: "読めない"}`（**字面のすり抜けを塞ぐ**） (error)
  - `judgeToolCall`: `read` + `/repo/README.md` → `{deny: undefined}`（通す） (happy)
  - `judgeToolCall`: `ls` + `/repo` → 通す（秘密を指していない） (happy)
  - `judgeToolCall`: 引数にパスが無い道具（`web_search` など）→ 通す (happy)
  - `judgeToolCall`: `read` + `""` → 通す（空は `isSecretPath` が false） (happy)
  - null / undefined → 型で防ぐ — ケース無し
  - 権限 → 判定だけを持つ — ケース無し
  - 2 回目 / 並行 → 状態を持たない純関数 — ケース無し

## Verify

- `pnpm test:run` が緑。`judgeToolCall` のテストが、拒む側（4 経路）と通す側、`deny` の文を全部覆う。拡張本体は `judgeToolCall` の結果を返すだけの 3 行で、**別にテストできる中身が無い**（pi の登録は実演で見る — 05 と 06）

## Notes

### Findings

- 実演の結果（`Verify`）: `pnpm test:run` = 146 件緑（`child-guard.test.ts` の 28 件を含む）。`pnpm lint` / `pnpm typecheck` も緑
- 止め方の形は、権限の拡張（`@gotgenes/pi-permission-system`）のコードから拾った: `pi.on("tool_call", handler)` が入口で、結果は `{ block: true, reason }`。**handler が例外を投げると pi は止めずに通す**（SDK が catch しない）ので、本体は自分で握って fail-closed で止める
- 判定は `realpathSync` を使う。**存在しないパスは `true`**（「読めないものを通さない」）。テストは一時ディレクトリに本物のファイルと symlink を作って確かめた
- 字面のすり抜け対策は「引用符と `\` を剥がす」形（`cat .e""nv` → `.env`）。**シェルの展開を完全に真似ているわけではない**ので、`$VAR` を使った組み立ては「存在しないパス」として fail-closed で止まるが、**これは偶然で、保証ではない**。次の 1 枚への持ち越し
- 道具によってパスのキー名が違う（`path` / `file_path` / `filePath` / `file`）。pi の `read` の実際のキー名は未確認で、4 つを候補として見ている

### Unplanned

- なし

Commit: 8b1f664
