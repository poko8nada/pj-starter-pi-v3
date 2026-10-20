# ADR 017

## 01: 型チェックにハーネスを含める

### Context

- `pnpm typecheck` が、`.pi` を含めたハーネスのタイプチェックをできていない
- プレコミットまたは、エージェントの実行後の `typecheck:staged` では、現状エージェントが触ったファイルのみタイプチェックされている
- `product:ready` によって、ハーネスのテスト、タイプチェック機能をリリースし本番用に切り替えできるようにしたい

### Decision

- Status: **accepted**
- Adopted:
  - 設定用のjsonファイルをおき、`scripts/typecheck.mjs` と、`typecheck:staged` が同じ一覧を読む
- Options:
  - `package.json` にルートとハーネスの 2 つを直書きする（一覧が 2 か所になり、`typecheck:staged` が同じ物を読めない）
  - `pnpm typecheck:all` のような別コマンドを足す（`pnpm typecheck` の意味が揃わない。要望に反する）

### Research & Trial

- `tsc -p tsconfig.json --listFilesOnly` → 335 件中 `.pi` は 0 件。`tsconfig.json:17` の exclude
- `tsc -p .pi/tsconfig.json --noEmit` → 赤 3 件（`intent-router/hook/judge.ts:38` ×2、`intent-router/hook/route.ts:57`）。
  - 原因は `settings.ts` の `Thresholds` が `Optional` になり、consumer の型が実態から外れたこと。
  - 実行時は既定に重ねるので常に埋まる。直す向きは、書きかけの型と解決済みの型を分ける。
- `typecheck:staged` に `.pi` の道を渡すと 3 件赤（この経路は `.pi` を見る）
- lefthook の `glob` は入れ子のパスにも合う（一時リポジトリで実測）
- 時間: ルート 0.45 秒、`.pi` 2.1 秒

### Definition Change

- `Unit.type-check`(updated)
- `Unit.usage-readme`(updated)

## 02: product-ready を 1 本の一覧にする

### Context

- `product:ready` が外す物はテストだけではなく、`cycles/` と、01で更新するハーネスの型チェックの一覧も含む
- いまは `TEST_TARGETS`（テスト 4 か所）と `findCycles` に分かれ、入口は `prune-tests.mjs` と `prune-cycles.mjs` に分かれている
- ハーネスの型チェックを足す時、触る所が 2 か所になる形は避けたい

### Decision

- Status: **accepted**
- Adopted:
  - 一覧 `STARTER_ONLY` を 1 本にし、1 行を `{ label, at, pick }` にする
  - 入口は `product:ready` の 1 本にし、個別は `--only <label>` で指す
  - 芯は `plan(root, only)`（純関数）と `remove(root, plan)`（副作用）の 2 つにする
  - `prune-tests.mjs` と `prune-cycles.mjs` を消し、`index.test.ts` を主にする
- Options:
  - 区分（`HARNESS_TARGETS`）を足す（一覧が 2 本になり、ハーネスを足すのに 2 か所を触る）
  - 入口を分けたまま残す（個別実行の名前が 2 つになり、`--only` が無い）

### Research & Trial

- `TEST_TARGETS` は 4 行（`.pi` / `scripts/product-ready` / `test/env.test.ts` / `scripts/typecheck-staged.test.ts`）
- テストの判定は `isTestFile` で、vitest の既定 include に合わせてある（`**/*.{test,spec}.?(c|m)[jt]s?(x)`）
- `findCycles` は `cycles/` の下の全フォルダを返すので、`archive` も入る
- 消し方は、ディレクトリは recursive、名指しのファイルは force である

### Definition Change

- `Unit.product-ready`(updated): owner が、ハーネス自身のテスト、型チェック、サイクル記録を削除、プロダクト開発を始められる

## 03: quality-gate も全体の型を見る

### Context

- クオリティゲートは、そのターンで変えた分だけを `typecheck:staged` で見ている
- 触ったファイルだけの検査では、そのファイルを import していない consumer は program に入らず、赤を見逃す
- 手打ちの `pnpm typecheck` と、ゲートの「型チェック」で意味を揃えたい

### Decision

- Status: **rejected** （プレコミットとプレプッシュで全体を見ることができるため）
- Adopted:
- Options:
  - 変えた分に加えて、全体の型（ルートとハーネス）も見る（毎ターンの処理が重い）
  - 変えた分だけのまま（触っていない consumer の赤がすり抜ける）
  - 全体の型だけにする（毎ターン 2.5 秒かかり、変えた分への速い指摘が消える）

### Research & Trial

- `tsc` の program は「渡したファイル + それが import する物」なので、consumer は入らない
- 実測: `settings.ts` を触っても `judge.ts` は program に入らず、赤 3 件は全体の型チェックでないと見えない
- 時間: ルート 0.45 秒、`.pi` 2.1 秒

### Definition Change

- なし

## 04: いま出ている型エラーを直す

### Context

- `.pi` の型チェックは、いま赤 3 件のままである（`intent-router/hook/judge.ts:38` ×2、`route.ts:57`）
- `6b1a98c` で `settings.ts` の `Thresholds` が `Optional` になり、consumer の型が実態から外れた
- 赤を残したままハーネスの型チェックを足すと、`pnpm typecheck` は最初から赤になる

### Decision

- Status: **accepted**
- Adopted:
  - 書きかけの型（`Partial`、スキーマから出る物）と、解決済みの型（`required`、既定に重ねた後）を分ける
- Options:
  - `Thresholds` の 3 つを `required` に戻す（設定ファイルに一部だけ書いた物を書けなくなる）
  - consumer 側に `!` や既定値を書く（型と実行時の値が離れたままになる）

### Research & Trial

- `settings.ts:274` の `overlaid(defaults.thresholds, written.thresholds)` で、実行時の値は常に 3 つとも埋まる
- 既定は `settings.ts:192-196` に 3 つとも書いてある
- `Thresholds` の 3 つは `settings.ts:47-54` で `Type.Optional` になっている

### Definition Change

- `Unit.intent-router`(updated)
